import Api from 'website-contacts-extractor';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = 'ok_1eec1cee5033fdcd1d8bfd4258a93c19';
const DOMAINS_FILE = path.join(__dirname, 'clinic-unique-domains.txt');
const OUTPUT_FILE = path.join(__dirname, 'scraped-emails-results.csv');
const PROGRESS_FILE = path.join(__dirname, 'scrape-progress.json');

// Monthly limit for $6 plan
const MONTHLY_LIMIT = 2000;

// Rate limit: 1 second between requests
const DELAY_MS = 1000;

interface Progress {
  lastIndex: number;
  totalProcessed: number;
  timestamp: string;
}

interface ContactResult {
  domain: string;
  emails: string[];
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  error?: string;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { lastIndex: -1, totalProcessed: 0, timestamp: new Date().toISOString() };
}

function saveProgress(progress: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function appendResult(result: ContactResult) {
  const csvLine = [
    result.domain,
    JSON.stringify(result.emails || []),
    result.facebook || '',
    result.twitter || '',
    result.instagram || '',
    result.youtube || '',
    result.linkedin || '',
    result.error || ''
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');

  fs.appendFileSync(OUTPUT_FILE, csvLine + '\n');
}

async function main() {
  // Read domains
  const domains = fs.readFileSync(DOMAINS_FILE, 'utf-8')
    .split('\n')
    .map(d => d.trim())
    .filter(d => d.length > 0);

  console.log(`Total domains: ${domains.length}`);

  // Load progress
  const progress = loadProgress();
  const startIndex = progress.lastIndex + 1;

  console.log(`Resuming from index: ${startIndex}`);
  console.log(`Previously processed: ${progress.totalProcessed}`);

  // Check monthly limit
  if (progress.totalProcessed >= MONTHLY_LIMIT) {
    console.log(`\n⚠️  Monthly limit reached (${MONTHLY_LIMIT}). Wait for next billing cycle.`);
    console.log(`   Delete ${PROGRESS_FILE} to reset, or wait for quota refresh.`);
    return;
  }

  const remaining = MONTHLY_LIMIT - progress.totalProcessed;
  console.log(`Remaining quota this month: ${remaining}`);

  // Initialize CSV if starting fresh
  if (startIndex === 0) {
    fs.writeFileSync(OUTPUT_FILE, 'domain,emails,facebook,twitter,instagram,youtube,linkedin,error\n');
  }

  // Create API instance
  const api = new Api({
    apiKey: API_KEY,
  });

  // Process domains up to limit
  const endIndex = Math.min(startIndex + remaining, domains.length);

  for (let i = startIndex; i < endIndex; i++) {
    const domain = domains[i];
    const quotaUsed = progress.totalProcessed + 1;
    console.log(`[${i + 1}/${domains.length}] (quota: ${quotaUsed}/${MONTHLY_LIMIT}) ${domain}`);

    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      const contacts = await api.getContacts(url);

      const result: ContactResult = {
        domain,
        emails: contacts.emails || [],
        facebook: contacts.facebook,
        twitter: contacts.twitter,
        instagram: contacts.instagram,
        youtube: contacts.youtube,
        linkedin: contacts.linkedin,
      };

      appendResult(result);

      if (result.emails.length > 0) {
        console.log(`  ✓ Found ${result.emails.length} emails: ${result.emails.slice(0, 2).join(', ')}${result.emails.length > 2 ? '...' : ''}`);
      } else {
        console.log(`  - No emails found`);
      }

    } catch (error) {
      const result: ContactResult = {
        domain,
        emails: [],
        error: error instanceof Error ? error.message : String(error),
      };
      appendResult(result);
      console.log(`  ✗ Error: ${result.error}`);
    }

    // Save progress
    progress.lastIndex = i;
    progress.totalProcessed++;
    progress.timestamp = new Date().toISOString();
    saveProgress(progress);

    // Check if we hit limit
    if (progress.totalProcessed >= MONTHLY_LIMIT) {
      console.log(`\n⚠️  Monthly limit reached (${MONTHLY_LIMIT}). Stopping.`);
      break;
    }

    // Rate limit
    if (i < endIndex - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n─────────────────────────────────');
  console.log(`Total processed: ${progress.totalProcessed}/${MONTHLY_LIMIT}`);
  console.log(`Domains remaining: ${domains.length - progress.lastIndex - 1}`);
  console.log(`Results saved to: ${OUTPUT_FILE}`);

  if (progress.lastIndex + 1 < domains.length) {
    console.log(`\nTo continue next month, just run this script again.`);
  } else {
    console.log(`\n✓ All domains processed!`);
  }
}

main().catch(console.error);

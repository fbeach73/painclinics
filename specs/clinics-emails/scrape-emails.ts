import Api from 'website-contacts-extractor';
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = 'ok_1eec1cee5033fdcd1d8bfd4258a93c19';
const DOMAINS_FILE = path.join(__dirname, 'clinic-unique-domains.txt');
const OUTPUT_FILE = path.join(__dirname, 'scraped-emails-results.csv');
const PROGRESS_FILE = path.join(__dirname, 'scrape-progress.json');

// Rate limit: be nice to the API
const DELAY_MS = 1000; // 1 second between requests

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

  // Initialize CSV if starting fresh
  if (startIndex === 0) {
    fs.writeFileSync(OUTPUT_FILE, 'domain,emails,facebook,twitter,instagram,youtube,linkedin,error\n');
  }

  // Create API instance
  const api = new Api({
    apiKey: API_KEY,
  });

  // Process domains
  for (let i = startIndex; i < domains.length; i++) {
    const domain = domains[i];
    console.log(`[${i + 1}/${domains.length}] Processing: ${domain}`);

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
      console.log(`  ✓ Found ${result.emails.length} emails`);

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

    // Rate limit
    if (i < domains.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n✓ Complete!');
  console.log(`Total processed: ${progress.totalProcessed}`);
  console.log(`Results saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);

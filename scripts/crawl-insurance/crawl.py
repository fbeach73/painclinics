"""
Crawl clinic websites and extract insurance/payment data using crawl4ai + LLM API.

Supports both Anthropic (Claude) and OpenAI (GPT) models.

Setup:
  pip install crawl4ai anthropic openai

Usage:
  python scripts/crawl-insurance/crawl.py [--input FILE] [--provider openai] [--model gpt-4o-mini]

Reads:  scripts/crawl-insurance/clinic-urls.json
Writes: scripts/crawl-insurance/extraction-results.json (with resume support)
"""

import asyncio
import json
import os
import sys
import time
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Load .env.local from project root
load_dotenv(Path(__file__).parent.parent.parent / ".env.local")
from typing import Any

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

# Insurance page URL patterns to try after homepage (keep short — each adds latency)
INSURANCE_PAGE_PATHS = [
    "/insurance",
    "/billing",
    "/patient-information",
    "/payment",
]

EXTRACTION_PROMPT = """You are extracting insurance and payment information from a pain management clinic's website.

Analyze the following webpage content and extract:

1. **Insurance Providers**: List all insurance providers/plans mentioned as accepted. Include the full name.
2. **Other Insurance**: Any insurance mentioned that doesn't match common major providers.
3. **Payment Methods**: Payment methods accepted (credit cards, cash, checks, payment plans, financing, HSA/FSA, sliding scale, etc.)
4. **Accepts New Patients**: Whether the clinic explicitly states they accept new patients (true/false/null if not mentioned).

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "insuranceProviders": ["Medicare", "Blue Cross Blue Shield", "Aetna"],
  "otherInsurance": ["Local Plan Name"],
  "paymentMethods": ["Credit Cards", "Cash", "Payment Plans"],
  "acceptsNewPatients": true,
  "confidence": "high"
}

Confidence levels:
- "high": Clear insurance/payment page with explicit listings
- "medium": Insurance/payment info found but possibly incomplete
- "low": Only vague mentions or inferred from context
- "none": No insurance or payment information found

If NO insurance or payment information is found at all, return:
{
  "insuranceProviders": [],
  "otherInsurance": [],
  "paymentMethods": [],
  "acceptsNewPatients": null,
  "confidence": "none"
}

WEBPAGE CONTENT:
"""

ANTHROPIC_MODEL_MAP = {
    "haiku": "claude-haiku-4-5-20251001",
    "sonnet": "claude-sonnet-4-5-20250929",
}


def load_existing_results(results_path: Path) -> dict[str, Any]:
    """Load existing results for resume support."""
    if results_path.exists():
        with open(results_path) as f:
            data = json.load(f)
        return {r["clinicId"]: r for r in data}
    return {}


def save_results(results_path: Path, results: dict[str, Any]) -> None:
    """Save results to JSON file."""
    with open(results_path, "w") as f:
        json.dump(list(results.values()), f, indent=2)


def get_site_root(url: str) -> str:
    """Extract the site root (scheme + domain) from a URL."""
    from urllib.parse import urlparse
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def is_useful_content(content: str) -> bool:
    """Check if crawled content is useful (not a 404, not too short)."""
    if not content or len(content) < 50:
        return False
    lower = content.lower()
    # Skip 404 pages
    if "page not found" in lower or "404" in lower[:200]:
        return False
    return True


async def crawl_clinic_website(
    crawler: AsyncWebCrawler,
    url: str,
    crawl_config: CrawlerRunConfig,
) -> str | None:
    """Crawl a clinic website and return combined markdown content."""
    collected_content: list[str] = []

    # Normalize URL
    if not url.startswith("http"):
        url = f"https://{url}"
    base_url = url.rstrip("/")
    site_root = get_site_root(base_url)

    # Crawl the given URL (could be homepage or a deep doctor page)
    try:
        result = await crawler.arun(url=base_url, config=crawl_config)
        if result.success and result.markdown:
            content = result.markdown.raw_markdown
            if is_useful_content(content):
                collected_content.append(f"=== MAIN PAGE ===\n{content[:3000]}")
    except Exception as e:
        print(f"    Error crawling {base_url}: {e}")

    # Try insurance-related pages on the SITE ROOT (not the deep URL)
    found_insurance_page = False
    for path in INSURANCE_PAGE_PATHS:
        page_url = f"{site_root}{path}"
        try:
            result = await crawler.arun(url=page_url, config=crawl_config)
            if result.success and result.markdown:
                content = result.markdown.raw_markdown
                if is_useful_content(content):
                    lower = content.lower()
                    has_keywords = any(
                        k in lower
                        for k in ["insurance", "medicare", "medicaid", "blue cross",
                                   "aetna", "cigna", "united", "humana", "payment",
                                   "billing", "accepted", "we accept"]
                    )
                    if has_keywords:
                        print(f"    Found insurance page: {path}")
                        collected_content.append(
                            f"=== PAGE: {path} ===\n{content[:5000]}"
                        )
                        found_insurance_page = True
                        break
        except Exception:
            continue

    # If no dedicated insurance page found, also try the site root homepage
    if not found_insurance_page and site_root.rstrip("/") != base_url.rstrip("/"):
        try:
            result = await crawler.arun(url=site_root, config=crawl_config)
            if result.success and result.markdown:
                content = result.markdown.raw_markdown
                if is_useful_content(content):
                    collected_content.append(f"=== SITE HOMEPAGE ===\n{content[:5000]}")
        except Exception:
            pass

    if not collected_content:
        return None

    combined = "\n\n".join(collected_content)
    return combined[:8000]


async def extract_with_anthropic(
    client: Any,
    content: str,
    model: str,
) -> dict[str, Any] | None:
    """Send content to Anthropic Claude API for structured extraction."""
    import anthropic
    try:
        response = client.messages.create(
            model=model,
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": EXTRACTION_PROMPT + content,
                }
            ],
        )
        text = response.content[0].text.strip()

        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"    JSON parse error: {e}")
        return None
    except anthropic.APIError as e:
        print(f"    Anthropic API error: {e}")
        return None


async def extract_with_openai(
    client: Any,
    content: str,
    model: str,
) -> dict[str, Any] | None:
    """Send content to OpenAI API for structured extraction."""
    from openai import OpenAIError
    try:
        response = client.chat.completions.create(
            model=model,
            max_tokens=1024,
            messages=[
                {
                    "role": "system",
                    "content": "You extract structured data from webpage content. Return ONLY valid JSON, no markdown or explanation.",
                },
                {
                    "role": "user",
                    "content": EXTRACTION_PROMPT + content,
                }
            ],
        )
        text = response.choices[0].message.content.strip()

        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"    JSON parse error: {e}")
        return None
    except OpenAIError as e:
        print(f"    OpenAI API error: {e}")
        return None


async def process_clinic(
    crawler: AsyncWebCrawler,
    llm_client: Any,
    clinic: dict,
    model: str,
    provider: str,
    crawl_config: CrawlerRunConfig,
    semaphore: asyncio.Semaphore,
) -> dict[str, Any] | None:
    """Process a single clinic: crawl + extract."""
    async with semaphore:
        clinic_id = clinic["id"]
        website = clinic["website"]
        title = clinic["title"]

        print(f"  Crawling: {title} ({website})")

        content = await crawl_clinic_website(crawler, website, crawl_config)
        if not content:
            print(f"    No content extracted for {title}")
            return {
                "clinicId": clinic_id,
                "title": title,
                "website": website,
                "state": clinic["state"],
                "extraction": None,
                "error": "no_content",
            }

        # Small delay before API call
        await asyncio.sleep(0.1)

        if provider == "openai":
            extraction = await extract_with_openai(llm_client, content, model)
        else:
            extraction = await extract_with_anthropic(llm_client, content, model)

        if not extraction:
            return {
                "clinicId": clinic_id,
                "title": title,
                "website": website,
                "state": clinic["state"],
                "extraction": None,
                "error": "extraction_failed",
            }

        print(
            f"    Extracted: {len(extraction.get('insuranceProviders', []))} insurance, "
            f"{len(extraction.get('paymentMethods', []))} payment methods "
            f"(confidence: {extraction.get('confidence', 'unknown')})"
        )

        return {
            "clinicId": clinic_id,
            "title": title,
            "website": website,
            "state": clinic["state"],
            "extraction": extraction,
            "error": None,
        }


async def main():
    parser = argparse.ArgumentParser(description="Crawl clinic websites for insurance data")
    parser.add_argument("--batch-size", type=int, default=500, help="Process in batches of N")
    parser.add_argument("--provider", choices=["anthropic", "openai", "openrouter"], default="openrouter", help="LLM provider")
    parser.add_argument("--model", type=str, default=None, help="Model name (default: gpt-4o-mini for openai, haiku for anthropic)")
    parser.add_argument("--max-concurrent", type=int, default=5, help="Max concurrent crawls")
    parser.add_argument("--offset", type=int, default=0, help="Start from clinic N (0-indexed)")
    parser.add_argument("--limit", type=int, default=0, help="Process only N clinics (0 = all)")
    parser.add_argument("--input", type=str, default="clinic-urls.json", help="Input JSON file name")
    args = parser.parse_args()

    # Resolve model name
    if args.model is None:
        if args.provider == "openai":
            model = "gpt-4o-mini"
        elif args.provider == "openrouter":
            model = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")
        else:
            model = ANTHROPIC_MODEL_MAP["haiku"]
    elif args.provider == "anthropic" and args.model in ANTHROPIC_MODEL_MAP:
        model = ANTHROPIC_MODEL_MAP[args.model]
    else:
        model = args.model

    script_dir = Path(__file__).parent
    urls_path = script_dir / args.input
    results_path = script_dir / "extraction-results.json"

    if not urls_path.exists():
        print(f"Error: {urls_path} not found. Run export-urls.ts first.")
        sys.exit(1)

    # Load clinic URLs
    with open(urls_path) as f:
        all_clinics = json.load(f)

    # Apply offset and limit
    clinics_to_process = all_clinics[args.offset:]
    if args.limit > 0:
        clinics_to_process = clinics_to_process[:args.limit]

    # Load existing results for resume
    existing_results = load_existing_results(results_path)
    remaining = [c for c in clinics_to_process if c["id"] not in existing_results]

    print(f"Total clinics: {len(all_clinics)}")
    print(f"Already processed: {len(existing_results)}")
    print(f"Remaining to process: {len(remaining)}")
    print(f"Provider: {args.provider}")
    print(f"Model: {model}")
    print(f"Max concurrent: {args.max_concurrent}")
    print(f"Batch size: {args.batch_size}")
    print()

    if not remaining:
        print("All clinics already processed!")
        return

    # Initialize LLM client
    if args.provider == "openrouter":
        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            print("Error: OPENROUTER_API_KEY environment variable required")
            print("Add OPENROUTER_API_KEY=sk-or-... to your .env.local file")
            sys.exit(1)
        from openai import OpenAI
        llm_client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )
        # OpenRouter uses the same OpenAI-compatible API
        args.provider = "openai"
    elif args.provider == "openai":
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            print("Error: OPENAI_API_KEY environment variable required")
            print("Add OPENAI_API_KEY=sk-... to your .env.local file")
            sys.exit(1)
        from openai import OpenAI
        llm_client = OpenAI(api_key=api_key)
    else:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            print("Error: ANTHROPIC_API_KEY environment variable required")
            sys.exit(1)
        import anthropic
        llm_client = anthropic.Anthropic(api_key=api_key)

    semaphore = asyncio.Semaphore(args.max_concurrent)

    browser_config = BrowserConfig(
        headless=True,
        verbose=False,
    )
    crawl_config = CrawlerRunConfig(
        word_count_threshold=50,
        page_timeout=10000,
        wait_until="domcontentloaded",
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        # Process in batches
        for batch_start in range(0, len(remaining), args.batch_size):
            batch = remaining[batch_start : batch_start + args.batch_size]
            batch_num = batch_start // args.batch_size + 1
            total_batches = (len(remaining) + args.batch_size - 1) // args.batch_size

            print(f"\n{'='*60}")
            print(f"Batch {batch_num}/{total_batches} ({len(batch)} clinics)")
            print(f"{'='*60}\n")

            start_time = time.time()

            tasks = [
                process_clinic(crawler, llm_client, clinic, model, args.provider, crawl_config, semaphore)
                for clinic in batch
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, Exception):
                    print(f"  Task exception: {result}")
                    continue
                if result is not None:
                    existing_results[result["clinicId"]] = result

            # Save after each batch
            save_results(results_path, existing_results)

            elapsed = time.time() - start_time
            print(f"\nBatch {batch_num} done in {elapsed:.1f}s")
            print(f"Total processed: {len(existing_results)}")

            # Stats
            with_insurance = sum(
                1
                for r in existing_results.values()
                if r.get("extraction") and r["extraction"].get("insuranceProviders")
            )
            with_payment = sum(
                1
                for r in existing_results.values()
                if r.get("extraction") and r["extraction"].get("paymentMethods")
            )
            print(f"With insurance data: {with_insurance}")
            print(f"With payment data: {with_payment}")

    print(f"\nDone! Results saved to {results_path}")


if __name__ == "__main__":
    asyncio.run(main())

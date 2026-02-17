"""
Download NPPES NPI bulk file and filter to pain-management-relevant records.

Usage:
  pip install -r scripts/cms-medicare/requirements.txt
  python scripts/cms-medicare/download-and-filter.py

Output: scripts/cms-medicare/nppes-filtered.csv
"""

import os
import re
import json
import zipfile
import glob
import requests
import pandas as pd
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# NPPES download page and file pattern
NPPES_DOWNLOAD_URL = "https://download.cms.gov/nppes/NPI_Files.html"
# Direct link pattern — CMS publishes monthly full replacement files
# We'll scrape the page to find the latest URL
NPPES_FULL_FILE_PATTERN = r'href="(https?://download\.cms\.gov/nppes/NPPES_Data_Dissemination_\w+_\d{4}\.zip)"'

# Pain-management-related taxonomy codes
PAIN_TAXONOMY_CODES = {
    "261QP3300X",  # Pain Clinic (facility)
    "208100000X",  # Pain Medicine
    "2081P2900X",  # Pain Medicine (PM&R)
    "2081P0010X",  # Interventional Pain Medicine
    "207L00000X",  # Anesthesiology
    "204D00000X",  # Neuromusculoskeletal Medicine
    "207RE0101X",  # Endocrinology (some pain clinics)
    "208VP0014X",  # Interventional Pain Medicine (PM&R)
    "2084P0800X",  # Psychiatry - Pain Medicine
    "2083P0011X",  # Preventive Medicine - Sports Medicine
    "364SP0808X",  # Pain Management Nurse Practitioner
    "1223P0106X",  # Orofacial Pain Dentist
    "225X00000X",  # Occupational Therapist
    "225100000X",  # Physical Therapist
    "2251P0200X",  # Physical Therapist - Orthopedic
    "332B00000X",  # Durable Medical Equipment (orthotics)
}

# Broader medical taxonomy codes — we'll keep any org at a matching zip code
MEDICAL_ORG_CODES = {
    "261QP3300X",  # Pain Clinic
    "261QM1300X",  # Multi-Specialty Clinic
    "261QM1200X",  # Magnetic Resonance Imaging (MRI) Clinic
    "261QR0200X",  # Radiology Clinic
    "261QR0400X",  # Rehabilitation Clinic
    "261QP2300X",  # Primary Care Clinic
    "261QX0203X",  # Ambulatory Surgical Center
}

# Columns we need from the NPPES file
COLUMNS_NEEDED = [
    "NPI",
    "Entity Type Code",
    "Provider Organization Name (Legal Business Name)",
    "Provider Last Name (Legal Name)",
    "Provider First Name",
    "Provider Business Practice Location Address First Line",
    "Provider Business Practice Location Address City Name",
    "Provider Business Practice Location Address State Name",
    "Provider Business Practice Location Address Postal Code",
    "Provider Business Practice Location Address Telephone Number",
    "Is Sole Proprietor",
    "Healthcare Provider Taxonomy Code_1",
    "Healthcare Provider Taxonomy Code_2",
    "Healthcare Provider Taxonomy Code_3",
]


def find_nppes_download_url() -> str:
    """Scrape the CMS download page to find the latest NPPES full file URL."""
    print("Fetching NPPES download page...")
    resp = requests.get(NPPES_DOWNLOAD_URL, timeout=30)
    resp.raise_for_status()

    matches = re.findall(NPPES_FULL_FILE_PATTERN, resp.text)
    if not matches:
        raise RuntimeError(
            "Could not find NPPES download link on CMS page. "
            "Check https://download.cms.gov/nppes/NPI_Files.html manually."
        )

    # Take the first (most recent) link
    url = matches[0]
    print(f"Found NPPES URL: {url}")
    return url


def download_nppes(url: str) -> Path:
    """Download the NPPES zip file if not already present."""
    filename = url.split("/")[-1]
    zip_path = DATA_DIR / filename

    if zip_path.exists():
        print(f"NPPES zip already downloaded: {zip_path}")
        return zip_path

    print(f"Downloading NPPES file ({filename})... This may take 10-20 minutes.")
    resp = requests.get(url, stream=True, timeout=600)
    resp.raise_for_status()

    total = int(resp.headers.get("content-length", 0))
    downloaded = 0
    with open(zip_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=1024 * 1024):  # 1MB chunks
            f.write(chunk)
            downloaded += len(chunk)
            if total:
                pct = downloaded * 100 // total
                print(f"\r  {downloaded // (1024*1024)}MB / {total // (1024*1024)}MB ({pct}%)", end="", flush=True)
    print()
    print(f"Downloaded to {zip_path}")
    return zip_path


def extract_csv(zip_path: Path) -> Path:
    """Extract the main npidata CSV from the zip."""
    # Check if already extracted
    existing = list(DATA_DIR.glob("npidata_pfile_*.csv"))
    if existing:
        print(f"CSV already extracted: {existing[0]}")
        return existing[0]

    print(f"Extracting CSV from {zip_path.name}...")
    with zipfile.ZipFile(zip_path, "r") as zf:
        # Find the main data file (not the header or other files)
        csv_names = [n for n in zf.namelist() if n.startswith("npidata_pfile_") and n.endswith(".csv")]
        if not csv_names:
            raise RuntimeError(f"No npidata_pfile_*.csv found in zip. Contents: {zf.namelist()[:10]}")

        csv_name = csv_names[0]
        print(f"  Extracting {csv_name}...")
        zf.extract(csv_name, DATA_DIR)
        return DATA_DIR / csv_name


def load_clinic_zip_codes() -> set[str]:
    """Load zip codes from our clinic export."""
    clinics_path = SCRIPT_DIR / "clinics-for-matching.json"
    if not clinics_path.exists():
        print("WARNING: clinics-for-matching.json not found. Run export-clinics.ts first.")
        print("  Proceeding with taxonomy-only filtering.")
        return set()

    with open(clinics_path) as f:
        clinics = json.load(f)

    zips = {c["postalCode"][:5] for c in clinics if c.get("postalCode")}
    print(f"Loaded {len(zips)} unique zip codes from {len(clinics)} clinics")
    return zips


def filter_nppes(csv_path: Path, clinic_zips: set[str]) -> pd.DataFrame:
    """
    Filter the NPPES CSV to relevant records using chunked reading.

    Strategy:
    1. Keep all records with pain-related taxonomy codes
    2. Keep all organization records (Entity Type 2) in our clinic zip codes
    """
    print(f"Filtering NPPES data from {csv_path.name}...")
    print(f"  Using {len(PAIN_TAXONOMY_CODES)} pain taxonomy codes")
    print(f"  Using {len(clinic_zips)} clinic zip codes")

    all_taxonomy_codes = PAIN_TAXONOMY_CODES | MEDICAL_ORG_CODES

    chunks = []
    total_rows = 0
    kept_rows = 0

    # Read in chunks to manage memory
    chunk_iter = pd.read_csv(
        csv_path,
        chunksize=100_000,
        dtype=str,
        usecols=lambda col: col in COLUMNS_NEEDED,
        low_memory=False,
        on_bad_lines="skip",
    )

    for i, chunk in enumerate(chunk_iter):
        total_rows += len(chunk)

        # Normalize zip codes to 5 digits
        zip_col = "Provider Business Practice Location Address Postal Code"
        if zip_col in chunk.columns:
            chunk[zip_col] = chunk[zip_col].fillna("").str[:5]

        # Check taxonomy codes (columns 1-3)
        tax_cols = [
            "Healthcare Provider Taxonomy Code_1",
            "Healthcare Provider Taxonomy Code_2",
            "Healthcare Provider Taxonomy Code_3",
        ]
        tax_match = pd.Series(False, index=chunk.index)
        for tc in tax_cols:
            if tc in chunk.columns:
                tax_match |= chunk[tc].isin(all_taxonomy_codes)

        # Check zip code match for organizations (Entity Type 2)
        zip_match = pd.Series(False, index=chunk.index)
        if clinic_zips and zip_col in chunk.columns:
            is_org = chunk["Entity Type Code"] == "2"
            in_zip = chunk[zip_col].isin(clinic_zips)
            zip_match = is_org & in_zip

        # Keep rows matching either criterion
        mask = tax_match | zip_match
        filtered = chunk[mask]

        if len(filtered) > 0:
            chunks.append(filtered)
            kept_rows += len(filtered)

        if (i + 1) % 10 == 0:
            print(f"  Processed {total_rows:,} rows, kept {kept_rows:,}...")

    print(f"  Total processed: {total_rows:,} rows")
    print(f"  Total kept: {kept_rows:,} rows")

    if not chunks:
        print("WARNING: No matching records found!")
        return pd.DataFrame()

    result = pd.concat(chunks, ignore_index=True)
    return result


def main():
    # Step 1: Load our clinic zip codes
    clinic_zips = load_clinic_zip_codes()

    # Step 2: Download NPPES
    nppes_url = find_nppes_download_url()
    zip_path = download_nppes(nppes_url)

    # Step 3: Extract CSV
    csv_path = extract_csv(zip_path)

    # Step 4: Filter
    filtered = filter_nppes(csv_path, clinic_zips)

    if filtered.empty:
        print("No records to save. Exiting.")
        return

    # Step 5: Save filtered data
    out_path = SCRIPT_DIR / "nppes-filtered.csv"
    filtered.to_csv(out_path, index=False)
    print(f"\nSaved {len(filtered):,} filtered records to {out_path}")

    # Stats
    entity_counts = filtered["Entity Type Code"].value_counts()
    print(f"\nEntity types:")
    for etype, count in entity_counts.items():
        label = "Organization" if etype == "2" else "Individual"
        print(f"  {label} (Type {etype}): {count:,}")

    tax_col = "Healthcare Provider Taxonomy Code_1"
    if tax_col in filtered.columns:
        top_tax = filtered[tax_col].value_counts().head(15)
        print(f"\nTop taxonomy codes:")
        for code, count in top_tax.items():
            print(f"  {code}: {count:,}")


if __name__ == "__main__":
    main()

"""
Match our clinic database records to NPPES NPI records.

Multi-tier matching:
  1. Phone match (highest confidence)
  2. Zip + name fuzzy match
  3. Address + zip match

Usage:
  python scripts/cms-medicare/match-clinics.py

Inputs:
  - scripts/cms-medicare/clinics-for-matching.json (from export-clinics.ts)
  - scripts/cms-medicare/nppes-filtered.csv (from download-and-filter.py)

Output:
  - scripts/cms-medicare/matched-clinics.json
"""

import json
import re
import pandas as pd
from pathlib import Path
from collections import defaultdict
from rapidfuzz import fuzz

SCRIPT_DIR = Path(__file__).parent
CLINICS_PATH = SCRIPT_DIR / "clinics-for-matching.json"
NPPES_PATH = SCRIPT_DIR / "nppes-filtered.csv"
OUTPUT_PATH = SCRIPT_DIR / "matched-clinics.json"

# Minimum fuzzy match score (0-100) for name matching
NAME_MATCH_THRESHOLD = 70

# Minimum score for address matching
ADDRESS_MATCH_THRESHOLD = 75


def normalize_phone(phone: str) -> str:
    """Strip to last 10 digits."""
    digits = re.sub(r"\D", "", phone)
    return digits[-10:] if len(digits) >= 10 else ""


def normalize_name(name: str) -> str:
    """Normalize clinic/org name for comparison."""
    name = name.lower().strip()
    # Remove common suffixes that vary between sources
    for suffix in [
        ", llc", " llc", ", inc", " inc", ", pc", " pc", ", md", " md",
        ", pa", " pa", ", pllc", " pllc", ", do", " do",
        " corp", " corporation", " associates", " group",
        " medical center", " medical", " center",
        " pain management", " pain clinic", " pain",
        " clinic", " clinics", " practice", " healthcare",
        " health", " wellness", " rehab", " rehabilitation",
    ]:
        if name.endswith(suffix):
            name = name[: -len(suffix)]
    # Remove punctuation
    name = re.sub(r"[^\w\s]", "", name)
    # Collapse whitespace
    name = re.sub(r"\s+", " ", name).strip()
    return name


def normalize_address(addr: str) -> str:
    """Normalize street address for comparison."""
    addr = addr.lower().strip()
    # Standard abbreviations
    replacements = {
        " street": " st",
        " avenue": " ave",
        " boulevard": " blvd",
        " drive": " dr",
        " road": " rd",
        " lane": " ln",
        " court": " ct",
        " place": " pl",
        " suite": " ste",
        " north": " n",
        " south": " s",
        " east": " e",
        " west": " w",
        " northwest": " nw",
        " northeast": " ne",
        " southwest": " sw",
        " southeast": " se",
    }
    for full, abbr in replacements.items():
        addr = addr.replace(full, abbr)
    # Remove unit/suite numbers for base address comparison
    addr = re.sub(r"\b(ste|suite|unit|apt|#)\s*\w+", "", addr)
    addr = re.sub(r"[^\w\s]", "", addr)
    addr = re.sub(r"\s+", " ", addr).strip()
    return addr


def load_clinics() -> list[dict]:
    """Load clinic data from JSON export."""
    with open(CLINICS_PATH) as f:
        return json.load(f)


def load_nppes() -> pd.DataFrame:
    """Load filtered NPPES data."""
    df = pd.read_csv(NPPES_PATH, dtype=str)
    df = df.fillna("")

    # Normalize phone
    phone_col = "Provider Business Practice Location Address Telephone Number"
    df["phone_normalized"] = df[phone_col].apply(normalize_phone)

    # Normalize zip to 5 digits
    zip_col = "Provider Business Practice Location Address Postal Code"
    df["zip5"] = df[zip_col].str[:5]

    # Normalize org name
    org_col = "Provider Organization Name (Legal Business Name)"
    df["name_normalized"] = df[org_col].apply(normalize_name)

    # For individuals, combine first + last name
    first_col = "Provider First Name"
    last_col = "Provider Last Name (Legal Name)"
    individual_mask = df["Entity Type Code"] == "1"
    df.loc[individual_mask, "name_normalized"] = (
        df.loc[individual_mask, first_col].str.lower() + " " + df.loc[individual_mask, last_col].str.lower()
    ).apply(lambda x: re.sub(r"\s+", " ", x).strip())

    # Normalize address (column may be missing if filtered CSV was built without it)
    addr_col = "Provider Business Practice Location Address First Line"
    if addr_col in df.columns:
        df["address_normalized"] = df[addr_col].apply(normalize_address)
    else:
        df["address_normalized"] = ""

    return df


def build_phone_index(nppes: pd.DataFrame) -> dict[str, list[int]]:
    """Build phone -> row indices lookup."""
    idx: dict[str, list[int]] = defaultdict(list)
    for i, phone in enumerate(nppes["phone_normalized"]):
        if phone and len(phone) == 10:
            idx[phone].append(i)
    return idx


def build_zip_index(nppes: pd.DataFrame) -> dict[str, list[int]]:
    """Build zip -> row indices lookup."""
    idx: dict[str, list[int]] = defaultdict(list)
    for i, z in enumerate(nppes["zip5"]):
        if z and len(z) == 5:
            idx[z].append(i)
    return idx


def match_clinics(clinics: list[dict], nppes: pd.DataFrame) -> list[dict]:
    """Run multi-tier matching."""
    print("Building indexes...")
    phone_index = build_phone_index(nppes)
    zip_index = build_zip_index(nppes)

    matches = []
    stats = {"phone": 0, "name": 0, "address": 0, "none": 0}

    for clinic in clinics:
        clinic_id = clinic["id"]
        clinic_phones = clinic.get("phones", [])
        clinic_zip = clinic.get("postalCode", "")[:5]
        clinic_name = normalize_name(clinic.get("title", ""))
        clinic_addr = normalize_address(clinic.get("streetAddress", ""))

        best_match = None
        best_tier = None
        best_score = 0

        # Tier 1: Phone match
        for phone in clinic_phones:
            if phone in phone_index:
                for row_idx in phone_index[phone]:
                    row = nppes.iloc[row_idx]
                    # Phone match is high confidence — take it
                    best_match = row
                    best_tier = "phone"
                    best_score = 100
                    break
            if best_match is not None:
                break

        # Tier 2: Zip + name fuzzy match (if no phone match)
        if best_match is None and clinic_zip and clinic_name:
            candidates = zip_index.get(clinic_zip, [])
            for row_idx in candidates:
                row = nppes.iloc[row_idx]
                nppes_name = row["name_normalized"]
                if not nppes_name:
                    continue
                score = fuzz.token_sort_ratio(clinic_name, nppes_name)
                if score >= NAME_MATCH_THRESHOLD and score > best_score:
                    best_match = row
                    best_tier = "name"
                    best_score = score

        # Tier 3: Zip + address match (if still no match)
        if best_match is None and clinic_zip and clinic_addr:
            candidates = zip_index.get(clinic_zip, [])
            for row_idx in candidates:
                row = nppes.iloc[row_idx]
                nppes_addr = row["address_normalized"]
                if not nppes_addr:
                    continue
                score = fuzz.token_sort_ratio(clinic_addr, nppes_addr)
                if score >= ADDRESS_MATCH_THRESHOLD and score > best_score:
                    best_match = row
                    best_tier = "address"
                    best_score = score

        if best_match is not None:
            stats[best_tier] += 1
            org_name = best_match.get(
                "Provider Organization Name (Legal Business Name)", ""
            )
            if not org_name:
                org_name = f"{best_match.get('Provider First Name', '')} {best_match.get('Provider Last Name (Legal Name)', '')}".strip()

            matches.append({
                "clinicId": clinic_id,
                "npi": best_match["NPI"],
                "matchTier": best_tier,
                "matchScore": best_score,
                "matchedOrgName": org_name,
                "entityType": best_match["Entity Type Code"],
                "taxonomyCode": best_match.get("Healthcare Provider Taxonomy Code_1", ""),
            })
        else:
            stats["none"] += 1

    return matches, stats


def main():
    if not CLINICS_PATH.exists():
        print(f"ERROR: {CLINICS_PATH} not found. Run export-clinics.ts first.")
        return
    if not NPPES_PATH.exists():
        print(f"ERROR: {NPPES_PATH} not found. Run download-and-filter.py first.")
        return

    print("Loading clinics...")
    clinics = load_clinics()
    print(f"  Loaded {len(clinics)} clinics")

    print("Loading NPPES filtered data...")
    nppes = load_nppes()
    print(f"  Loaded {len(nppes):,} NPPES records")

    print("\nMatching clinics to NPPES records...")
    matches, stats = match_clinics(clinics, nppes)

    # Save results
    with open(OUTPUT_PATH, "w") as f:
        json.dump(matches, f, indent=2)

    total = len(clinics)
    matched = len(matches)
    print(f"\n=== Match Results ===")
    print(f"Total clinics:    {total:,}")
    print(f"Total matched:    {matched:,} ({matched * 100 // total}%)")
    print(f"  Phone matches:  {stats['phone']:,}")
    print(f"  Name matches:   {stats['name']:,}")
    print(f"  Address matches:{stats['address']:,}")
    print(f"  No match:       {stats['none']:,}")
    print(f"\nResults saved to {OUTPUT_PATH}")

    # Show sample matches by tier
    for tier in ["phone", "name", "address"]:
        tier_matches = [m for m in matches if m["matchTier"] == tier]
        if tier_matches:
            print(f"\nSample {tier} matches (first 3):")
            for m in tier_matches[:3]:
                clinic = next((c for c in clinics if c["id"] == m["clinicId"]), None)
                print(f"  {clinic['title'] if clinic else '?'}")
                print(f"    -> NPI {m['npi']}: {m['matchedOrgName']} (score: {m['matchScore']})")


if __name__ == "__main__":
    main()

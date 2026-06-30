#!/usr/bin/env python3
"""
Extract the "Detailed Suggestions for Improvement" and "Remarks" sections from
every Teacher Observation Report PDF in a folder and save them as two JSON files.

Why this exists
---------------
All reports share the same layout. The sections always appear in this order:

    Teacher / Class / Subject / Topic / Observer / Date / School   (header)
    Strengths
    Scope for Improvement
    Detailed Suggestions for Improvement     <-- extracted
    Remarks                                  <-- extracted
    Overall Rating

So each section is the text between its own heading and the next heading:
  * Detailed Suggestions  = between "Detailed Suggestions for Improvement" and "Remarks"
  * Remarks               = between "Remarks" and "Overall Rating"
A "Remarks" section frequently spans a page break, so we work on the full
document text (all pages concatenated) rather than page-by-page.

The newline problem
--------------------
PDFs store visually-wrapped lines as real "\n" line breaks, so a single
sentence/paragraph is split across many lines, and bullet markers often sit on a
line of their own, separated from the text they introduce. This script reflows
that back into continuous text:
  * wrapped lines are re-joined with a single space;
  * a word split across a line break with a trailing hyphen (e.g. "student-\n
    focused") is re-joined WITHOUT a space, keeping the hyphen ("student-focused");
  * for Detailed Suggestions, bullet markers (•, ●, ◦, ...) are reattached to
    their text and each bullet becomes one clean item.

Requirements: PyMuPDF  ->  pip install PyMuPDF   (imported as `fitz`)

Usage:
    python extract_report_sections.py
    python extract_report_sections.py --input "path/to/pdf/folder" --output-dir "path/to/out"
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit(
        "PyMuPDF is required. Install it with:  pip install PyMuPDF\n"
        "(it is imported as `fitz`)."
    )

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

DEFAULT_INPUT = Path(__file__).resolve().parent / "Sample-reports-for-extraction"
DEFAULT_OUTPUT = Path(__file__).resolve().parent / "extracted-reports"

# Bullet glyphs observed in the reports (main "•"/"●" plus common fallbacks).
BULLET_CHARS = "•●◦▪‣○■□"
_BULLET_SPLIT_RE = re.compile(rf"[{re.escape(BULLET_CHARS)}]+\s*")

# Headings, matched on their own line (case-insensitive, optional trailing ":").
_HEAD = {
    "detailed": re.compile(
        r"(?im)^[ \t]*detailed\s+suggestions\s+for\s+improvement[ \t]*:?[ \t]*$"
    ),
    "remarks": re.compile(r"(?im)^[ \t]*remarks[ \t]*:?[ \t]*$"),
    "overall": re.compile(r"(?im)^[ \t]*overall\s+rating[ \t]*:?[ \t]*$"),
}

_TRAILING_HYPHEN_RE = re.compile(r"[A-Za-z]-$")


# --------------------------------------------------------------------------- #
# Text reflow helpers
# --------------------------------------------------------------------------- #

def reflow(segment: str) -> str:
    """Join PDF-wrapped lines back into one continuous string.

    Blank lines are dropped. A line ending in <letter>- is treated as a word
    split across the wrap and is glued to the next line with no space (the
    hyphen is kept, so compound words like "student-focused" survive).
    """
    parts: list[str] = []
    for raw in segment.splitlines():
        line = raw.strip()
        if not line:
            continue
        if parts and _TRAILING_HYPHEN_RE.search(parts[-1]):
            parts[-1] = parts[-1] + line  # word continuation: no space, keep hyphen
        else:
            parts.append(line)
    return re.sub(r"\s+", " ", " ".join(parts)).strip()


def parse_bulleted(segment: str) -> list[str]:
    """Reflow a bulleted section into a clean list of bullet-item strings.

    Works whether the bullet marker sat on its own line or inline with the text,
    because we first flatten the whole section to one line, then split on the
    bullet glyphs.
    """
    flowed = reflow(segment)
    items = [re.sub(r"\s+", " ", p).strip() for p in _BULLET_SPLIT_RE.split(flowed)]
    return [p for p in items if p]


# --------------------------------------------------------------------------- #
# Core extraction
# --------------------------------------------------------------------------- #

def read_pdf_text(pdf_path: Path) -> str:
    """Return the full text of a PDF (all pages concatenated)."""
    with fitz.open(pdf_path) as doc:
        return "".join(page.get_text() for page in doc)


def extract_sections(full_text: str) -> dict[str, object]:
    """Slice out the two target sections from one report's full text.

    Returns a dict with keys: suggestions (list), remarks (str). Raises
    ValueError if any of the three boundary headings is missing.
    """
    m_ds = _HEAD["detailed"].search(full_text)
    if not m_ds:
        raise ValueError('heading "Detailed Suggestions for Improvement" not found')
    m_rem = _HEAD["remarks"].search(full_text, m_ds.end())
    if not m_rem:
        raise ValueError('heading "Remarks" not found after Detailed Suggestions')
    m_or = _HEAD["overall"].search(full_text, m_rem.end())
    if not m_or:
        raise ValueError('heading "Overall Rating" not found after Remarks')

    ds_segment = full_text[m_ds.end() : m_rem.start()]
    rem_segment = full_text[m_rem.end() : m_or.start()]
    return {
        "suggestions": parse_bulleted(ds_segment),
        "remarks": reflow(rem_segment),
    }


def process_folder(input_dir: Path) -> tuple[list, list]:
    """Extract both sections from every PDF under input_dir.

    Returns (suggestion_records, remark_records). Each entry is only the
    extracted detail for one report, in sorted-filename order, with no source
    reference: suggestions -> list of bullet strings, remarks -> one string.
    """
    pdfs = sorted(input_dir.rglob("*.pdf"))
    suggestion_records: list = []
    remark_records: list = []
    failures: list[tuple[Path, str]] = []

    for pdf in pdfs:
        rel = pdf.relative_to(input_dir).as_posix()
        try:
            full_text = read_pdf_text(pdf)
            sections = extract_sections(full_text)
        except Exception as exc:  # noqa: BLE001 - report and continue
            failures.append((pdf, str(exc)))
            print(f"  [SKIP] {rel}  ->  {exc}")
            continue

        suggestion_records.append({"suggestions": sections["suggestions"]})
        remark_records.append({"remarks": [sections["remarks"]]})

    print(
        f"\nProcessed {len(pdfs)} PDF(s): "
        f"{len(suggestion_records)} extracted, {len(failures)} failed."
    )
    if failures:
        print("Failures:")
        for pdf, msg in failures:
            print(f"  - {pdf.name}: {msg}")
    return suggestion_records, remark_records


def write_json(path: Path, section_name: str, records: list) -> None:
    path.write_text(
        json.dumps(records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(records)} {section_name} record(s) -> {path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract 'Detailed Suggestions for Improvement' and 'Remarks' "
        "sections from Teacher Observation Report PDFs into two JSON files."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT,
        help=f"Folder of PDFs (searched recursively). Default: {DEFAULT_INPUT}",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Where to write the JSON files. Default: {DEFAULT_OUTPUT}",
    )
    parser.add_argument(
        "--sample",
        type=int,
        default=None,
        help="If set, keep only this many randomly-chosen records from EACH "
        "section (the two sections are sampled independently). "
        "Omit to keep every report.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for --sample, for reproducible selections. "
        "Omit for a fresh random pick each run.",
    )
    args = parser.parse_args()

    if not args.input.is_dir():
        sys.exit(f"Input folder not found: {args.input}")
    if args.sample is not None and args.sample < 0:
        sys.exit("--sample must be zero or a positive number.")
    args.output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Scanning: {args.input}")
    suggestions, remarks = process_folder(args.input)

    if args.sample is not None:
        rng = random.Random(args.seed)
        if args.sample < len(suggestions):
            suggestions = rng.sample(suggestions, args.sample)
        if args.sample < len(remarks):
            remarks = rng.sample(remarks, args.sample)
        print(
            f"Randomly sampled {len(suggestions)} suggestion record(s) and "
            f"{len(remarks)} remark record(s)"
            + (f" (seed={args.seed})." if args.seed is not None else ".")
        )

    write_json(
        args.output_dir / "detailed_suggestions.json",
        "Detailed Suggestions for Improvement",
        suggestions,
    )
    write_json(
        args.output_dir / "remarks.json",
        "Remarks",
        remarks,
    )


if __name__ == "__main__":
    main()

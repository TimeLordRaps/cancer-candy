"""
prior_art.py — Cryptographic prior art timestamping.

Generates SHA-256 hashes of all disclosure documents in the repository.
The hash + git commit timestamp = cryptographic proof of prior art date.

Run this after every significant disclosure update.
"""

from __future__ import annotations
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).parent.parent.parent
DISCLOSURE_FILES = [
    "README.md",
    "cancer_candy_catalogue.md",
    "pharma_restriction_clause.md",
    "REFERENCE.md",
]


def hash_file(filepath: Path) -> dict:
    """SHA-256 hash a file and return metadata."""
    content = filepath.read_bytes()
    sha256 = hashlib.sha256(content).hexdigest()
    stat = filepath.stat()
    return {
        "file": str(filepath.relative_to(REPO_ROOT)),
        "sha256": sha256,
        "size_bytes": len(content),
        "last_modified": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    }


def generate_prior_art_manifest() -> dict:
    """Generate a timestamped manifest of all disclosure document hashes."""
    manifest = {
        "generated": datetime.now(tz=timezone.utc).isoformat(),
        "purpose": "Cryptographic prior art proof under 35 U.S.C. § 102",
        "method": "SHA-256 hash of each disclosure file. Combined with git commit hash for timestamp proof.",
        "files": [],
    }

    for filename in DISCLOSURE_FILES:
        filepath = REPO_ROOT / filename
        if filepath.exists():
            manifest["files"].append(hash_file(filepath))
        else:
            manifest["files"].append({
                "file": filename,
                "sha256": None,
                "error": "File not found",
            })

    # Also hash the src/pwa directory tree
    pwa_dir = REPO_ROOT / "src" / "pwa"
    if pwa_dir.exists():
        for root, _, files in os.walk(pwa_dir):
            for f in sorted(files):
                filepath = Path(root) / f
                manifest["files"].append(hash_file(filepath))

    # Combined hash of all individual hashes
    combined = hashlib.sha256()
    for entry in manifest["files"]:
        if entry.get("sha256"):
            combined.update(entry["sha256"].encode())
    manifest["combined_sha256"] = combined.hexdigest()

    return manifest


def save_manifest(manifest: dict, output_path: Path | None = None) -> Path:
    """Save manifest to JSON file."""
    if output_path is None:
        output_path = REPO_ROOT / "prior_art_manifest.json"
    output_path.write_text(json.dumps(manifest, indent=2))
    return output_path


def verify_manifest(manifest_path: Path) -> bool:
    """Verify that current files match a saved manifest."""
    manifest = json.loads(manifest_path.read_text())
    all_match = True

    for entry in manifest["files"]:
        if not entry.get("sha256"):
            continue
        filepath = REPO_ROOT / entry["file"]
        if not filepath.exists():
            print(f"  MISSING: {entry['file']}")
            all_match = False
            continue
        current_hash = hashlib.sha256(filepath.read_bytes()).hexdigest()
        if current_hash != entry["sha256"]:
            print(f"  CHANGED: {entry['file']}")
            all_match = False
        else:
            print(f"  OK: {entry['file']}")

    return all_match


if __name__ == "__main__":
    print("Generating prior art manifest...")
    manifest = generate_prior_art_manifest()
    path = save_manifest(manifest)
    print(f"\nManifest saved to: {path}")
    print(f"Combined SHA-256: {manifest['combined_sha256']}")
    print(f"Files hashed: {len(manifest['files'])}")
    print(f"\nCommit this file alongside the disclosures.")
    print(f"The git commit timestamp + these hashes = cryptographic prior art proof.")

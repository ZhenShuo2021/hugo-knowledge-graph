# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "python-frontmatter",
# ]
# ///
"""
Remove all Hugo shortcodes from Markdown files and clean front matter.

- Single line: {{< shortcode param="val" >}}
- Multi-line (line breaks, multiple spaces, any combination)
- Self-closing: {{< br />}}
- Paired tags: {{< tab >}} ... {{< /tab >}}

1. First use regex to remove all shortcode tags themselves (including their content).
2. Then clean up extra blank lines caused by removing tags (keep at most one blank line).
3. Clean front matter: remove all aliases lists and all build settings
   (parsed and rewritten via python-frontmatter).

Optional flags:
  --strip-body    Remove all Markdown body content; keep front matter only.
"""

import re
import sys
import argparse
from pathlib import Path

import frontmatter  # python-frontmatter


# ---------------------------------------------------------------------------
# regex
# ---------------------------------------------------------------------------

SC_TOKEN = (
    r"\{\{<\s*/?\s*[\s\S]*?\s*>\}\}"  # {{< ... >}}
    r"|"
    r"\{\{%\s*/?\s*[\s\S]*?\s*%\}\}"  # {{% ... %}}
)

# Whole line: line start (including leading whitespace) + shortcode + line ending newline
WHOLE_LINE = re.compile(
    r"^[^\S\n]*(?:" + SC_TOKEN + r")[^\S\n]*\n",
    re.DOTALL | re.MULTILINE,
)

# Inline shortcode (not occupying the entire line, only remove the token itself)
INLINE = re.compile(SC_TOKEN, re.DOTALL)

# Three or more consecutive blank lines → compress into one blank line
MULTI_BLANK_PATTERN = re.compile(r"\n{3,}")

# Keys to strip entirely from front matter
FM_KEYS_TO_REMOVE = {"aliases", "build", "layouts", "outputs"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def clean_front_matter(text: str) -> str:
    """Parse front matter with python-frontmatter, drop unwanted keys, re-serialise."""
    post = frontmatter.loads(text)

    if not any(k in post.metadata for k in FM_KEYS_TO_REMOVE):
        return text

    for key in FM_KEYS_TO_REMOVE:
        post.metadata.pop(key, None)

    return frontmatter.dumps(post)


def strip_body(text: str) -> str:
    """Keep front matter only; replace body with empty string."""
    post = frontmatter.loads(text)
    post.content = ""
    return frontmatter.dumps(post)


def remove_shortcodes(text: str) -> str:
    """Remove all Hugo shortcodes from text and normalize extra blank lines.

    Processing order:
    1. Remove lines that consist entirely of shortcode (including newline).
    2. Remove remaining inline shortcode tokens.
    3. Compress extra blank lines.
    4. Trim trailing whitespace on each line.
    """
    cleaned = WHOLE_LINE.sub("", text)
    cleaned = INLINE.sub("", cleaned)
    cleaned = MULTI_BLANK_PATTERN.sub("\n\n", cleaned)
    lines = [line.rstrip() for line in cleaned.splitlines()]
    cleaned = "\n".join(lines)
    cleaned = cleaned.rstrip("\n") + "\n"
    return cleaned


# ---------------------------------------------------------------------------
# File / directory processing
# ---------------------------------------------------------------------------


def process_file(path: Path, *, do_strip_body: bool) -> bool:
    original = path.read_text(encoding="utf-8")
    cleaned = original

    cleaned = clean_front_matter(cleaned)
    cleaned = remove_shortcodes(cleaned)

    if do_strip_body:
        cleaned = strip_body(cleaned)

    if original == cleaned:
        return False

    path.write_text(cleaned, encoding="utf-8")
    print(f"[processed] {path}")
    return True


def process_directory(directory: Path, *, do_strip_body: bool) -> None:
    md_files = sorted(directory.rglob("*.md"))

    if not md_files:
        print(f"No .md files found: {directory}")
        return

    changed = 0
    for f in md_files:
        if process_file(f, do_strip_body=do_strip_body):
            changed += 1

    total = len(md_files)
    print(f"\nDone: {total} files, {changed} modified.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Clean Hugo Markdown files: remove shortcodes and tidy front matter."
    )
    parser.add_argument("target", type=Path, help="File or directory to process.")
    parser.add_argument(
        "--strip-body",
        action="store_true",
        default=False,
        help="Remove Markdown body; keep front matter only.",
    )
    args = parser.parse_args()
    target = args.target

    if not target.exists():
        print(f"Path does not exist: {target}", file=sys.stderr)
        sys.exit(1)

    kwargs = dict(do_strip_body=args.strip_body)

    if target.is_file():
        changed = process_file(target, **kwargs)
        if not changed:
            print("No changes needed.")
    else:
        process_directory(target, **kwargs)
        process_directory(target, **kwargs)
        process_directory(target, **kwargs)


if __name__ == "__main__":
    main()

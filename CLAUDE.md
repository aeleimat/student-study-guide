# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## State of the repository

This project builds an animated, narrated study guide with the vendored **Papermorph** skill in [.claude/skills/papermorph/](.claude/skills/papermorph/), pinned in [skills-lock.json](skills-lock.json) to `DozenTwelve/Papermorph` at a specific commit. It uses the **Lessons** tier, which turns textbook PDFs into short lesson films with checks inside the picture.

- Treat `.claude/skills/papermorph/` as third-party: don't edit it. Upgrade it by updating the skill and the lock file.
- For any book work, load the skill (`papermorph`) and follow [SKILL.md](.claude/skills/papermorph/SKILL.md). It routes each tier to its reference files. Read only the files the current step needs.
- When a new book starts and there is no `books/<book>/style.json`, the work begins with the tier's intake conversation with the user ([references/lessons/intake.md](.claude/skills/papermorph/references/lessons/intake.md) for lessons).

## The Biology book

There is one lesson book, **Biology** (`books/biology/`, `content/biology/`, `site/biology/`), at tier 2 (illustrated scenes). Each PDF the user brings is one textbook chapter, made from lecture slides after Campbell Biology 12e.

- Each chapter becomes a **unit** in `Contents.book` in `site/biology/index.html`, numbered by the textbook's chapter number.
- **Lessons are nested, `chapter-NN/lesson-NN/`, not `chNN/`** (the user's choice). This applies in `site/biology/`, `content/biology/`, `books/biology/chapters/` (as `chapter-NN/lesson-NN.md`), `books/biology/pages/`, `books/biology/review/` and `tools/biology/`. The engine assumes flat `chNN` folders, so the book works around it without editing the engine:
  - A lesson's `CHAPTER.number` is chapter × 100 + lesson (Chapter 3, lesson 2 = 302). Its `CHAPTER.label` reads like `'3, lesson 2'`, and `CHAPTER.next` is a relative path such as `'../lesson-03/'`.
  - The lesson page loads `../../lib/…`.
  - `site/biology/index.html` relinks the engine's `chNNN/` cards and the "Continue" button to `chapter-NN/lesson-NN/`. The progress key is pinned there and in `lib/book.css` (`animebook:progress:biology`).
  - `site/biology/chapter-NN/index.html` is a one-line redirect to `../` that keeps the hash, so the lesson's home button reaches the contents.
  - A new unit's third entry starts its numbering, for example `{ unit: 4, chapter: 401 }`.
- Chapter sources live in `books/biology/source/` as `chapter-NN-<title>.pdf` plus `chapter-NN-sections.json` (each `folder` is `chapter-NN/lesson-NN`, with a `unit`). Pass them to `split_pages.py` explicitly.
- Chapter 3 ("Water and Life") holds lessons 1–4, and lesson 2 is the approved pilot. Status is in `books/biology/chapters.md`.
- A new PDF never starts a new book. It reuses `books/biology/style.json` and adds its unit there.
- The scripts only find `chNN` folders on their own, so always name the lesson. Examples: `lint.py site/biology chapter-03/lesson-02 --content content/biology/chapter-03 --brief books/biology`; `check_blank.py site/biology chapter-03/lesson-02 --url http://localhost:8765/biology/`; `URL=http://localhost:8765/biology/chapter-03/lesson-02/ BROWSER=firefox uv run --with playwright python tools/biology/chapter-03/e2e_lesson-02.py`.

## Project layout once books exist

The layout the skill expects at this repo root:

```
books/<book>/        private: source PDF, style.json, storyboards, art, review/
content/<book>/chNN/ narration.<lang>.json and the voice cache
tools/<book>/        tests, audio scripts, evidence
site/<book>/         the static book, the only part that is delivered (HTML/JS/CSS/MP3, no build step)
  lib/               engine copy synced by engine.py; lib/book.css holds this book's settings
  chNN/index.html    a chapter; audio/<lang>/ holds beat MP3s and timings.js
```

- Keep source PDFs, page images and extracted text out of `site/` and out of version control (`.gitignore`: `*.pdf`, `books/*/pages/`).
- `site/<book>/lib/` holds copies of the engine. Never edit them. Fix the engine at its source and re-sync it with `engine.py`.
- `style.json` stays current and short. Chapter status and feedback go in `chapters.md` and `chapters/chNN.md`.

## Commands

`SKILL` = `.claude/skills/papermorph`. Run these from the repo root. This is Windows, so `python3` may need to be `python` or `py`. Each script prints its usage with `--help`. Scripts that need packages name the `uv run --with …` form in their docstring.

```sh
python3 SKILL/scripts/new_book.py lesson|picture|documentary|shorts <book> [--chapter N] [--lang xx]   # start a book
python3 SKILL/scripts/serve.py 8765 site            # preview at http://localhost:8765/<book>/ (no-cache; audio needs HTTP)
python3 SKILL/scripts/engine.py site [--check]      # sync engine copies into books / verify they match
python3 SKILL/scripts/lint.py site/<book> [ch03 ...] [--content content/<book> --brief books/<book>]   # static checks
uv run --with playwright python SKILL/scripts/check.py ch03 --url http://localhost:8765/<book>/        # browser checks (Chromium + Firefox)
```

Narration audio comes from `tts.py`. Run it again whenever narration text changes, or `lint.py` reports `stale`. Other per-step scripts (shots, strips, perf, export) are listed in SKILL.md's Scripts table.

Requirements: `uv`, `ffmpeg`/`ffprobe`, network access for Edge TTS, and Playwright browsers (`uv run --with playwright playwright install chromium firefox`). Paid steps (`paint.py`, `eleven.py`, `video.py`) need an OpenRouter key and run only when the user has chosen them.

# Chapter 5 team brief (common to every worker)

Book: **Biology** (`books/biology/`, `content/biology/`, `site/biology/`), Papermorph **Lessons** tier, tier 2 (illustrated scenes). Repo root: `d:\Apps\student-study-guide` (Windows; use `python` or `uv run`). Skill: `.claude/skills/papermorph/` (`SKILL` below), third-party, never edit it. Read `CLAUDE.md` at the repo root first: it explains the nested `chapter-NN/lesson-NN/` layout and the engine workarounds.

New unit: **Unit 5, "Chapter 5: Large Biological Molecules"**, from `books/biology/source/chapter-05-large-biological-molecules.pdf` (28 lecture slides after Campbell Biology 12e, chapter 5). It covers only concept 5.1 (polymers) and concept 5.5 (nucleic acids). Carbohydrates, lipids and proteins in detail are not in these slides.

| Lesson | Title | Slides | Pages folder |
|---|---|---|---|
| chapter-05/lesson-01 | Macromolecules, Monomers and Polymers | 1–6 | books/biology/pages/chapter-05/lesson-01/ |
| chapter-05/lesson-02 | Nucleic Acids: From Gene to Protein | 7–9 | books/biology/pages/chapter-05/lesson-02/ |
| chapter-05/lesson-03 | Nucleotides: Base, Sugar and Phosphate | 10–12 | books/biology/pages/chapter-05/lesson-03/ |
| chapter-05/lesson-04 | Polynucleotides and the Double Helix | 13–17 | books/biology/pages/chapter-05/lesson-04/ |
| (shared) | Summary (slide 18) and practice questions Q1–Q50 (slides 19–28) | 18–28 | books/biology/pages/chapter-05/review/ (image-only: open the PNGs) |

Each pages folder has `text.md` (text layer) and `page_NNNN.png`. Slides 15–28 have no text layer: open the PNGs. Handwritten marks on the slides (red/orange ink, circled answers) are a student's notes, not source; **the circled answer to Q11 (nucleoside = "base + phosphate") is wrong**, a nucleoside is base + sugar. Check every circled answer before using it.

Engine numbers: `CHAPTER.number` 501, 502, 503, 504; `label` `'5, lesson N'`; `next` `'../lesson-0(N+1)/'` (lesson 4 has none). The page loads `../../lib/…`. Audio in `site/biology/chapter-05/lesson-NN/audio/en/`. Narration in `content/biology/chapter-05/lesson-NN/narration.en.json`. Notes in `books/biology/chapters/chapter-05/lesson-NN.md`. Review evidence in `books/biology/review/chapter-05/lesson-NN/`. Tests in `tools/biology/chapter-05/e2e_lesson-NN.py`.

Style: `books/biology/style.json` (read it; the user's words, look, voice `en-US-AndrewNeural` at `-4%`, pacing 6–10 minutes ideal but these slides are short: 4–7 minutes per lesson, one or two quick checks inside, practice at the end). The approved model chapter is `chapter-03/lesson-02` (page `site/biology/chapter-03/lesson-02/index.html`, notes `books/biology/chapters/chapter-03/lesson-02.md`, narration `content/biology/chapter-03/lesson-02/narration.en.json`). Same look: dark navy board, cream ink, flat vector shapes drawn in code, the camera pushes from an everyday scene down to molecules, labels next to what they name, side-card quick checks, a full-stage practice screen with a picture per question. Molecules are the cast; no humans.

Chapter 5 colour meanings (add to what style.json already fixes; water stays red O / white H; H-bonds stay dashed cyan #5fd3e8):
- generic monomer beads (lesson 1): rounded shapes in the accent palette, one shape per monomer kind; the bond formed by dehydration flashes cream; water leaving is the existing `waterMolecule`.
- phosphate: lavender #bba8ee (circle with "P")
- sugar (pentose): warm yellow #f3c95c pentagon; deoxyribose vs ribose differ only by the 2′ OH (ribose has it)
- bases: A coral #f07a6a, G mint #8fd6b0, C blue #6c8cff, T gold #ffd27a, U orange #f39a2b. Purines (A, G) are a two-ring shape (6-ring fused to a 5-ring); pyrimidines (C, T, U) one 6-ring.
- DNA strand backbone ink cream; RNA (mRNA) drawn thinner with ribose and U; nucleus envelope dim blue; ribosome two-lobed grey-lavender.
- 5′ and 3′ ends written with the prime ′ (U+2032), never an apostrophe or ¢.

Shared library: `site/biology/lib/macro.js` (being built by the library worker; read-only for lesson workers). It will provide monomer beads and chains with dehydration/hydrolysis animation, the nucleotide (phosphate + sugar + base) with its pieces, bases A/G/C/T/U, a polynucleotide strand with 5′/3′ ends, a base-paired ladder/double helix, a cell with nucleus, nuclear pore and ribosome, and an mRNA strand. Its header comment documents the API. A lesson that needs more draws it inside its own page; if it should be shared, say so in your reply.

Preview server (already running, one for everyone): `http://localhost:8765/biology/`. Lesson URL: `http://localhost:8765/biology/chapter-05/lesson-NN/` (`?review` for the review player).

Scripts always name the lesson (their globs only find chNN): e.g. `python SKILL/scripts/lint.py site/biology chapter-05/lesson-01 --content content/biology/chapter-05 --brief books/biology`; `python SKILL/scripts/check_blank.py site/biology chapter-05/lesson-01 --url http://localhost:8765/biology/`; tts: see `SKILL/references/core/sound.md` and `tts.py --help` (lesson 2 of chapter 3 shows how it was voiced; its audio is in `site/biology/chapter-03/lesson-02/audio/en/`).

Rules: never edit `.claude/skills/`, `site/biology/lib/engine.*` or other engine copies, other lessons' folders, `index.html` (the contents), `style.json` or `chapters.md`; workers don't commit; don't create files outside your lesson's folders except in your own scratch folder `C:\Users\User\AppData\Local\Temp\claude\2d1f8602bf52e885\55f13abf-c9ec-461d-965a-61012d6e39e4\scratchpad\<your-worker-name>\`.

Tooling: `ffprobe`/`ffmpeg` are not on PATH. Prepend `C:\Users\User\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.1-full_build\bin` to PATH for any script that needs them (tts.py, check.py beat lengths, export). Wrong circled answers on the review slides: Q11 (nucleoside = base + sugar) and Q21 (DNA → mRNA → protein).

# Chapter 6 team brief (common to every worker)

Book: **Biology** (`books/biology/`, `content/biology/`, `site/biology/`), Papermorph **Lessons** tier, tier 2 (illustrated scenes). Repo root: `d:\Apps\student-study-guide` (Windows; use `python` or `uv run`). Skill: `.claude/skills/papermorph/` (`SKILL` below), third-party, never edit it. Read `CLAUDE.md` at the repo root first: it explains the nested `chapter-NN/lesson-NN/` layout and the engine workarounds.

New unit: **Unit 6, "Chapter 6: A Tour of the Cell"**, from `books/biology/source/chapter-06-a-tour-of-the-cell.pdf` (63 lecture slides after Campbell Biology 12e, chapter 6, concepts 6.1–6.7). **There are no practice-question slides in this chapter**: every lesson writes its own quick checks and practice set (6–8 questions) from what its slides teach.

| Lesson | Title | Slides | Pages folder |
|---|---|---|---|
| chapter-06/lesson-01 | Studying Cells: Prokaryotes and Eukaryotes | 1–7 | books/biology/pages/chapter-06/lesson-01/ |
| chapter-06/lesson-02 | The Nucleus and Ribosomes | 8–15 | books/biology/pages/chapter-06/lesson-02/ |
| chapter-06/lesson-03 | The ER and the Golgi Apparatus | 16–21 | books/biology/pages/chapter-06/lesson-03/ |
| chapter-06/lesson-04 | Lysosomes, Vacuoles and the Endomembrane System | 22–26 | books/biology/pages/chapter-06/lesson-04/ |
| chapter-06/lesson-05 | Mitochondria, Chloroplasts and Peroxisomes | 27–33 | books/biology/pages/chapter-06/lesson-05/ |
| chapter-06/lesson-06 | Microtubules, Cilia and Flagella | 34–46 | books/biology/pages/chapter-06/lesson-06/ |
| chapter-06/lesson-07 | Microfilaments and Intermediate Filaments | 47–52 | books/biology/pages/chapter-06/lesson-07/ |
| chapter-06/lesson-08 | Cell Walls, the ECM and Cell Junctions | 53–63 | books/biology/pages/chapter-06/lesson-08/ |

Each pages folder has `text.md` (text layer) and `page_NNNN.png`. Figure slides have only their labels in `text.md`: open the PNG for anything the labels don't settle. Slide 9 (animal cell) and slide 10 (plant cell) are whole-cell maps; slide 26 is the endomembrane traffic figure; slide 53 says concept 6.7 is "Self Study", teach it anyway.

**Handwritten marks** (red ink, circled numbers, highlighter, Arabic) are a student's notes, not source. Some are wrong. For example, slide 26 has "Smooth ER: makes protein from ribosomes", but rough ER (with its bound ribosomes) makes proteins for secretion, and smooth ER has no ribosomes. Check every handwritten claim against the printed text and standard Campbell biology before you use it. List each wrong one under `## Possible problems`. Printed slide text can be wrong or loose too (e.g. slide 32 "free radicles", slide 18/19 wording): flag it, then decide it in `## Errata`.

Engine numbers: `CHAPTER.number` 601 … 608; `label` `'6, lesson N'`; `next` `'../lesson-0(N+1)/'` (lesson 8 has none). The page loads `../../lib/…`. Audio in `site/biology/chapter-06/lesson-NN/audio/en/`. Narration in `content/biology/chapter-06/lesson-NN/narration.en.json`. Notes (extract, plan, beats) in `books/biology/chapters/chapter-06/lesson-NN.md`. Review evidence in `books/biology/review/chapter-06/lesson-NN/`. Tests in `tools/biology/chapter-06/e2e_lesson-NN.py`.

Style: `books/biology/style.json` (read it: the user's words, look, voice `en-US-AndrewNeural` at `-4%`). **Length: 6–8 minutes per lesson**: about 250–330 s of voice plus 6–8 questions (one or two quick checks inside the lesson, practice at the end). When the slides are thin, add worked examples, comparisons and practice rather than ship short. The approved model chapter is `chapter-03/lesson-02` (page `site/biology/chapter-03/lesson-02/index.html`, notes `books/biology/chapters/chapter-03/lesson-02.md`, narration `content/biology/chapter-03/lesson-02/narration.en.json`). Chapter 5 is the most recent finished unit and a good second model, for example `books/biology/chapters/chapter-05/lesson-02.md` for the notes and plan shape, and `site/biology/chapter-05/lesson-02/index.html` for a page using a shared kit. Same look throughout: dark navy board, cream ink, flat vector shapes drawn in code, labels next to what they name, side-card quick checks, a full-stage practice screen with a picture per question. The cast is molecules and organelles, with no humans. An everyday backdrop opens each lesson (a pond drop, a leaf, a cheek, a muscle, a gut lining, a plant stem…) and the camera pushes in from it to the cell and then to the organelle.

**The tour thread**: the chapter is a tour of the cell. Every lesson after lesson 1 opens on the same whole eukaryotic cell map (`cellMap` from the kit, animal or plant), with this lesson's organelles lit and the rest dimmed, then the camera pushes in. Lesson 1 ends by building that map. Analogies (a factory or city: nucleus = head office, ribosomes = workbenches, ER = production line, Golgi = shipping, lysosomes = recycling, mitochondria = power plant, cytoskeleton = scaffolding and rails) are welcome in the voice, but the picture stays organelles, not buildings.

Chapter 6 colour meanings (in addition to what style.json fixes; the kit exports them as `CC`):
- plasma membrane `#8fb0d6`, cytoplasm/cytosol `#183457`, nuclear envelope `#5b82b8`, nucleoplasm `#122844`, chromatin/DNA cream `#e9dcc0`, nucleolus `#2c4f7d` (a darker blob in the nucleus)
- ribosome grey-lavender `#aa9fc6` (macro.js `ribosome`); a bound ribosome is a small dot on the rough ER
- ER teal `#4fa3a5` (rough: studded with ribosome dots; smooth: tubes, no dots); Golgi mint `#7fd1b9` stacked cisternae, *cis* face toward the ER, *trans* face away
- vesicles: cyan-rimmed bubbles `#a8e0ea` carrying coral cargo dots `#f07a6a` (protein); lipid cargo yellow `#f3c95c`
- lysosome purple `#9a6cd0` holding olive enzyme pac-men (`#a8c66c`, macro.js `enzyme`); food vacuole a pale bubble
- vacuoles pale blue `#3a6ea5` fill; central vacuole large; contractile vacuole star-shaped
- mitochondrion orange `#f39a2b` outer membrane, inner cristae lighter orange, matrix dark amber; ATP a small yellow spark `#ffd27a`
- chloroplast green `#5bbf5b`, thylakoid stacks (grana) darker green `#2f8f46`, stroma pale green; light a warm yellow ray
- peroxisome yellow-green `#c9d45c`, H₂O₂ shown as text with water.js molecules for H₂O and O₂
- cytoskeleton: microtubules mint `#8fd6b0` (hollow tubes, tubulin dimers in two tones), microfilaments/actin pink `#ff7aa8` (twisted bead chain), intermediate filaments gold `#f3c95c` (rope); motor proteins olive (dynein, kinesin), myosin lavender `#bba8ee`
- cell wall tan `#c9b27a` (primary thin, secondary thick and darker, middle lamella a pale line); plasmodesmata gaps in it
- ECM: collagen amber `#f0b45a`, fibronectin mint, integrin blue `#6c8cff` spanning the membrane, proteoglycan lavender bottle-brush
- prokaryote: capsule pale ring, cell wall tan, plasma membrane blue, nucleoid a cream tangle without an envelope, ribosomes dots, flagellum ink whip, fimbriae short hairs
- sizes: µm and nm with a space (0.5 µm, 25 nm); never use the slide's broken "�m"

Shared kit: `site/biology/lib/cell.js` (organelles, cells, membranes, vesicles: lessons 1–5) and `site/biology/lib/cyto.js` (cytoskeleton, motors, cilia and flagella, walls, ECM, junctions: lessons 6–8), each documenting its API in its header comment. They load after `engine.js`, `water.js` and `macro.js`. Lesson workers treat them as read-only. A lesson that needs more draws it inside its own page; if it should be shared, say so in your reply.

Preview server (one for everyone, the coordinator keeps it running): `http://localhost:8765/biology/`. Lesson URL: `http://localhost:8765/biology/chapter-06/lesson-NN/` (`?review` for the review player).

Scripts always name the lesson, because their globs only find chNN. For example: `python SKILL/scripts/lint.py site/biology chapter-06/lesson-01 --content content/biology/chapter-06 --brief books/biology`; `python SKILL/scripts/check_blank.py site/biology chapter-06/lesson-01 --url http://localhost:8765/biology/`; `URL=http://localhost:8765/biology/chapter-06/lesson-01/ BROWSER=firefox uv run --with playwright python tools/biology/chapter-06/e2e_lesson-01.py`. For tts, see `SKILL/references/core/sound.md` and `tts.py --help` (Chapter 5's lessons show how it was voiced). Edge TTS returns no audio for short letter strings, so write abbreviations out in the voice ("E R", "endoplasmic reticulum" first, "A T P"), and test any short clip.

Rules:
- Never edit `.claude/skills/`, `site/biology/lib/engine.*` or other engine copies, other lessons' folders, `site/biology/index.html` (the contents), `style.json` or `chapters.md`.
- Workers don't commit.
- Don't create files outside your lesson's folders, except in your own scratch folder `C:\Users\User\AppData\Local\Temp\claude\2d1f8602bf52e885\9f930e01-b153-45f4-a3db-59b73c5b372e\scratchpad\<your-worker-name>\`.

Tooling: `ffprobe`/`ffmpeg` are not on PATH. Prepend `C:\Users\User\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.1-full_build\bin` to PATH for any script that needs them (tts.py, check.py beat lengths, export).

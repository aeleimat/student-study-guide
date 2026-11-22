# Chapter 5, lesson 2: Nucleic acids, from gene to protein

Status: ready (registered 2026-11-22); lint, check.py, check_blank, overlap and e2e pass in Chromium and Firefox

Source: pages/chapter-05/lesson-02/text.md and slides 7-9; summary slides 18-21 and practice questions (slides 19-28, images) in pages/chapter-05/review/. Handwritten Arabic and red ink on the slides are a student's notes, not source.

## Concepts

1. **Concept 5.5 opener** (p7). The amino acid sequence of a polypeptide is programmed by a gene, a unit of inheritance. Hardness: definition only.
2. **Genes are made of DNA, a nucleic acid** (p7). Hardness: definition only.
3. **Two nucleic acids, DNA and RNA** (p8). Hardness: definition only (names).
4. **DNA directs its own replication** (p8). No mechanism on these slides; the review summary adds "semiconservative" (lesson 4). Hardness: stated.
5. **DNA directs mRNA synthesis and, through mRNA, protein synthesis** (p8, p9). Hardness: explained by the figure.
6. **Protein synthesis occurs in ribosomes** (p8, p9). Hardness: explained by the figure.
7. **Three-step flow** (p9): (1) mRNA made in the nucleus; (2) mRNA moves into the cytoplasm via a nuclear pore; (3) a ribosome uses the mRNA to make a polypeptide from amino acids. Hardness: explained (figure).
8. **Transcription (DNA to mRNA) and translation (mRNA to polypeptide)** (review summary only, not on slides 7-9). Hardness: definition only.

## Vocabulary

- **Gene**: unit of inheritance; a stretch of DNA that programs a polypeptide's amino acid sequence.
- **Nucleic acid**: DNA or RNA.
- **DNA, RNA**: deoxyribonucleic acid, ribonucleic acid.
- **Replication**: DNA copying itself.
- **mRNA (messenger RNA)**: the RNA copy of a gene that carries the message to the ribosome.
- **Nucleus, nuclear pore, cytoplasm**: where DNA sits; the gate in its envelope; the region outside.
- **Ribosome**: the site of protein synthesis.
- **Amino acid, polypeptide**: the monomer, and the chain built from it.
- **Transcription, translation**: DNA to mRNA; mRNA to polypeptide.

## Figures

- **p9 (labelled figure)**. A cell: a large nucleus (blue-purple, double envelope, two nuclear pores) above, cytoplasm (peach) below. A DNA double helix at the top of the nucleus; arrow 1 down to an mRNA strand inside the nucleus ("Synthesis of mRNA in the nucleus"); arrow down to a pore where a ribbon of mRNA passes out ("2 Movement of mRNA into cytoplasm via nuclear pore"); the mRNA runs through a two-lobed brown ribosome, with loose amino acid beads beside it and a beaded polypeptide growing out ("3 Synthesis of protein"). Labels: DNA, mRNA (twice), NUCLEUS, CYTOPLASM, Ribosome, Amino acids, Polypeptide. Not to scale.
- p7 and p8: no figures.

## Numbers

None. The 1, 2, 3 on p9 are order only.

## Questions

None on slides 7-9. From the practice set (slides 19-28) these test this lesson, answers checked:
- Q7 Genes are made of: DNA (B; circled correct).
- Q8 Protein synthesis occurs at: ribosomes (B; correct).
- Q21 Flow of information: correct is B, DNA to mRNA to protein. **The circled answer C (RNA to DNA to lipid) is wrong.**
- Q22 mRNA from DNA is transcription (C; correct). Q23 polypeptide from mRNA is translation (B; correct).
- Q15 (double helix) and Q11 (nucleoside: circled B is wrong, it is base + sugar) belong to lessons 3 and 4.

## Possible problems

1. The circled answer to Q21 is wrong.
2. p8 "DNA provides directions for its own replication": DNA does not copy itself alone (enzymes do). The slide gives no mechanism.
3. p9 never shows the DNA being read to make the mRNA.
4. "Protein synthesis" on p8 and p9 means building a polypeptide; the figure ends there, folding is not shown.
5. p9 is schematic: the ribosome and pore are far too big against the nucleus.
6. Not every gene codes for a polypeptide (some make RNA only); the slide says every gene does.
7. p8 "mRNA controls protein synthesis" is loose; it carries the information that sets the sequence.
8. Transcription and translation are named only in the review summary.

## Errata

1. Replication: taught as "DNA is copied before a cell divides so each new cell has the recipes"; no mechanism, no semiconservative detail (lesson 4).
2. mRNA is a working copy that carries the message, not something that "controls".
3. The picture ends in a polypeptide; the voice says "protein synthesis" as the slides do.
4. Transcription and translation are not taught as steps here (the names may appear on step labels in the picture only); no codons, no base pairing.
5. "Not every gene codes for a polypeptide" is left out; the lesson says a gene programs a polypeptide as the slide does.
6. Tag "not to scale" on the cell.
7. The circled Q21 answer is not used.

## Plan

Taught: a gene as a recipe; the nucleus holds DNA; DNA and RNA; replication in one sentence; the three-step path DNA to mRNA to polypeptide at a ribosome. Dropped: transcription and translation mechanics, codons, base pairing (lessons 3-4), semiconservative replication.

Order: intro (recipe and cell), gene (push into the nucleus), roles (DNA, RNA, replication, mRNA), flow (three steps, one picture), q1, wrap, practice (3 questions), finish.

Pacing: about 450 words of voice, 8 beats, 4 questions (1 check, 3 practice). Audio length is in timings.js; holds and questions add roughly 1.5 minutes.

## Beats

Library: `site/biology/lib/macro.js` (cell, nucleus, nuclear pore, ribosome, DNA ladder or helix, mRNA strand, monomer beads and chains) plus whatever water.js gives. Colours from the BRIEF: DNA cream backbone, mRNA thinner with orange U, nucleus envelope dim blue, ribosome grey-lavender, amino acids in accent beads.

| Beat | What the picture shows and does | Marks and the action each triggers | Eye goes | New elements |
| --- | --- | --- | --- | --- |
| `intro` | Title card top right. Left: a flat kitchen backdrop (table, bowl, cake) with a recipe card. | `recipe`: pulse on the recipe card, label "recipe". `cell`: a cell outline fades in beside the cake. `dna`: in the cell a helix labelled "DNA: the recipes" and a bead chain labelled "proteins: the dishes". `ask`: a question mark over the arrow from helix to chain. | recipe, helix, arrow | small kitchen backdrop, recipe card |
| `gene` | Camera pushes from the cell into the nucleus, then onto the DNA. | `nucleus`: push, label NUCLEUS. `gene`: bracket on one stretch of helix, label "gene". `poly`: a row of amino acid beads appears, label "polypeptide". `prog`: the bead colours match coloured marks on the bracket, "order is programmed". `made`: label "gene = DNA, a nucleic acid". | nucleus, bracket, beads | gene bracket, coloured order |
| `roles` | Two cards: DNA (double, cream) left, RNA (single, thin, orange U) right. | `dna`, `rna`: name cards. `rep`: the DNA ladder unzips and is drawn twice, a cell splits with a copy in each half, "a copy for each new cell". `mrna`: a single strand peels off the DNA, label "mRNA". `why`: lock mark on the DNA, the mRNA leaves, "working copy". | DNA, split cell, peeling strand | replication sketch, lock mark |
| `flow` | The p9 picture redrawn: nucleus top, cytoplasm below, three numbered stations. | `one`: mRNA forms at the DNA, number 1. `pore`: mRNA slides through a nuclear pore, number 2, label "nuclear pore". `ribo`: ribosome appears, mRNA threads in, number 3. `aa`: amino acid beads drift in, label "amino acids". `chain`: beads join into a polypeptide leaving the ribosome. `name`: label "protein synthesis". `all`: bar "DNA, mRNA, protein" with drawn arrows. | strand, then ribosome | "not to scale" tag |
| `q1` | Flow picture faded in the top 60 %; card in BAND. | none | the card | pickEls or choice card |
| `wrap` | Four takeaways with mini-icons. | `w1` to `w4`, `end`. | new line | none |
| `final1` | Practice (SCREEN), 3 questions, a picture each. | none | the card | cards |
| `finish` | Score card. | none | score | none |

Camera: wide cell, push into nucleus, split in roles, wide flow view.

### Questions

- `q1` id `c-where`, pickEls (choice if picking is hard): "Click the place where the polypeptide is built." Stations: nucleus, nuclear pore, ribosome (right), DNA. Why: protein synthesis happens at ribosomes. Wrong: nucleus makes mRNA; the pore is only the gate; DNA stays in the nucleus.
- `final1` ('Chapter practice'):
  - `p-order` choice: "Which shows the flow of information in protein synthesis?" Right: DNA, mRNA, protein. Wrong: protein, RNA, DNA (reversed); RNA, DNA, lipid (not a flow the cell uses); DNA, protein, mRNA (skips the message).
  - `p-terms` grid, true/false: genes are made of DNA (T); mRNA is made at the ribosome (F, in the nucleus); a gene programs the amino acid sequence of a polypeptide (T); DNA itself passes through the nuclear pore to the ribosome (F, mRNA does); RNA is a nucleic acid (T).
  - `p-steps` blanks, number the steps 1 to 3: "mRNA moves into the cytoplasm" = 2; "mRNA is made in the nucleus" = 1; "a polypeptide is built at a ribosome" = 3.

## Storyboard (review/chapter-05/lesson-02/storyboard.jpg)

- intro 3.0: kitchen left (recipe card, cake), title top right. Eye: card, cake, title.
- intro ask+2.5: cell right, helix "DNA: the recipes" in the nucleus, arrow with "?" to a bead chain "proteins: the dishes". Eye: helix, ?, chain.
- gene nucleus+3: camera on the nucleus, NUCLEUS card right. Eye: chromatin.
- gene prog+3 / end: inside the nucleus, helix across; bracket "gene" with six coloured marks dropping to six matching beads "polypeptide"; "gene = DNA, a nucleic acid" box on top.
- roles rep+2 / rep+8 / end: DNA and RNA cards on top; bottom left a cell copies its helix and divides ("a copy for each new cell"); bottom right a nucleus where an mRNA strand peels off, a padlock on the DNA ("master copy stays"), the strand leaves through a pore ("working copy").
- flow one+4 / pore+4 / chain+3 / end: the slide-9 cell sideways: badge 1 mRNA forms under the DNA, badge 2 it slides out through the pore, badge 3 a ribosome sits on it, amino acids fly in one by one and a polypeptide grows from its top; "protein synthesis", bar "DNA → mRNA → protein"; "not to scale".
- q1: the same cell in the top 70 %, BAND card; three clicks (nucleus, nuclear pore, ribosome), one per step.
- wrap: four rows with mini icons. final1: card left, picture right per question (shuffled DNA/mRNA/protein; labelled cell; cell with "?" badges filled by the right answers).

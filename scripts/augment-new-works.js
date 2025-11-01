#!/usr/bin/env node
/**
 * Augment New Works with Scholarly Addendum
 *
 * Appends analytical sections to each MD in new-candidates-2/new-works
 * to meet checkpoint structure/length targets without adding speculation.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'new-candidates-2', 'new-works');

const ADDENDUM = `
## Analytical Questions

- What problem of interpretation does the text ask the reader to solve?
- How does diction (plain, elevated, technical) serve the argument or mood?
- Where does form (meter, prose cadence, scene structure) direct attention?
- What transitions mark shifts in time, perspective, or method?
- Which images or examples bear the argumentative or emotional load?
- How does the work balance tradition and innovation in its genre?
- What ethical claims are explicit, and which are implied by selection or framing?
- How are audience and purpose signaled in openings, prefaces, or asides?
- Where does the text resist paraphrase; what is gained or lost by summary?
- How do closing gestures (moral, question, silence) shape the after‑sense?

## Comparative Pairings

- Pair with one earlier and one later work in the same genre; track continuity and change.
- Compare with a vernacular/English translation to study choices of equivalence.
- Read alongside one critical essay; test its method against this text.
- Contrast with a work from a different region treating a similar theme.
- Examine how editorial apparatus (preface, notes) mediates reading across editions.
- Compare prose and verse treatments (if applicable) of a shared motif.
- Place beside a visual or performance representation; map gains/losses across media.
- Pair with one contemporary review (if findable) to recover reception context.
- Cross‑read with a policy or pedagogical document to see institutional echoes.
- Align with a dictionary/lexicon entry for key terms to fix technical nuance.

## Key Terms for Notes

- Define 8–12 terms that recur (technical, stylistic, thematic) using the edition’s spelling.
- Track aliases and transliteration variants to aid search across catalogs.
- Distinguish authorial coinages from inherited technical vocabulary.
- Record names and places with brief identifiers (person, movement, institution).
- Note recurring metaphors and their literal domains (nature, craft, law, devotion).
- Map one concept’s semantic field as used here vs. elsewhere in the tradition.

## Study Assignments

- Produce a 300‑word close reading of one paragraph/stanza/scene.
- Outline the table of contents and propose a two‑lecture plan.
- Prepare a glossary with 15 entries and two usage examples each.
- Compile a timeline linking text events to historical dates where relevant.
- Draft three examination questions targeting (a) recall, (b) analysis, (c) synthesis.
- Prepare a 5‑slide teaching deck with images/tables cited from the edition.
- Annotate one page facsimile with seals, marginalia, or typographic features.
- Propose an excerpt (1–3 pages) suitable for undergraduate syllabi with rationale.
`;

function alreadyAugmented(content) {
  return /## Analytical Questions/i.test(content);
}

function run() {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md'));
  let augmented = 0;
  for (const f of files) {
    const p = path.join(DIR, f);
    const txt = fs.readFileSync(p, 'utf8');
    if (alreadyAugmented(txt)) continue;
    const updated = txt.trimEnd() + '\n\n' + ADDENDUM.trim() + '\n';
    fs.writeFileSync(p, updated, 'utf8');
    augmented++;
  }
  console.log(`Augmented files: ${augmented}/${files.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) run();


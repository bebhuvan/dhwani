# Dhwani Multi‑Agent Playbooks (Batch 2)

These role playbooks define crisp duties, inputs/outputs, pass/fail criteria, and tools. Avoid speculation. Anchor claims to cited evidence only.

## Roles

- SourceScout
  - Objective: Discover candidate editions on Archive.org, Project Gutenberg, Wikisource, Open Library.
  - Inputs: Author name, PD year (India), research brief.
  - Output: 3–10 vetted candidate links with edition metadata (title, year, publisher, language, translator/editor if any).
  - Tools: Archive search, Gutenberg search, Open Library, Google Books. Use persistent links (Archive identifier, Gutenberg ebook ID).
  - Pass/Fail: Fails if year/publisher data is missing or links are dead/ambiguous.

- RightsVerifier
  - Objective: Determine PD status for India (and note US where relevant).
  - Inputs: Candidate items + author death year (2+ sources).
  - Rules: India PD = 60 years after author’s death (literary/dramatic/musical/artistic). Translations depend on translator death year. Government works may have special clauses. US PD generally pre‑1929 publication.
  - Output: PD decision + reason string + evidence links/screenshots.
  - Tools: `verification-tools/pd-verifier.js` (heuristic), authoritative bios (Wikidata, national libraries).
  - Pass/Fail: Must include explicit rule(s) used; “UNKNOWN” is acceptable only with stated gaps to resolve.

- DuplicateScreener
  - Objective: Prevent duplicate entries versus `src/content/works/`.
  - Inputs: Draft frontmatter (title, author[], sources).
  - Checks: Exact source URL collision; fuzzy title+author similarity ≥ 0.85; transliteration/alias normalization.
  - Tools: `verification-tools/duplicate-detector.js`.
  - Decision: Same edition = duplicate; different translation/edition = distinct.
  - Pass/Fail: Provide top N collisions with confidence and rationale.

- MetadataCrafter
  - Objective: Produce final Markdown with valid YAML frontmatter and 6 sections minimum.
  - Inputs: Approved source + edition metadata + evidence.
  - Output: Markdown ready for QA.
  - Sections: Overview; About the Author; Historical Context; The Work (structure/themes/edition‑specific notes); Significance; Editions & Sources.
  - Pass/Fail: Fails if generic boilerplate or unverifiable claims appear.

- QACloser
  - Objective: Enforce quality and readiness for promotion.
  - Tools: `verification-tools/content-checkpoint-validator.js`, `verification-tools/archive-org-validator.js` (network), `verification-tools/description-quality-validator.js`.
  - Criteria: 0 critical; ≤2 major; Archive URL resolves; PD acceptable (“CERTAIN”/“LIKELY”) or explicit manual override rationale.
  - Output: Ready‑for‑promotion confirmation; or fix‑list.

## Commands

- Seed research briefs from CSV:
  - `npm run intake:csv`

- Run duplicate screening for new candidates (vs. catalog):
  - `npm run dup:check:new`

- Run PD heuristics on new candidates:
  - `npm run pd:verify:new`

- Run structural/quality checkpoints on new candidates:
  - `npm run validate:new`

- Validate Archive.org sources (requires network):
  - `npm run archive:validate:new`

- Promote a validated candidate into the site:
  - `npm run promote -- new-candidates-2/<file>.md`

## Evidence Requirements

- Edition proof: title page + verso (year, publisher, translator/editor) where applicable.
- PD proof: author death year (two sources) and rule applied; for translations, translator death year.
- Source integrity: use permanent, direct links (Archive identifier; Gutenberg ebook URL); avoid link shorteners.

## Description Rules

- No filler or generic superlatives; anchor to concrete details (ToC, preface, stated themes, reception where verifiable).
- Include dates, places, people, publication data when stated in sources.
- Avoid policy/legal conclusions not directly supported by cited rules or evidence.


# Dhwani Works Enhancement - Multi-Agent Workflow

**Version:** 1.0.0
**Date:** 2025-10-25
**Works to Process:** 79 (after cleanup)
**Target Quality:** 75+/100 average

---

## Overview

This document contains the complete workflow for enhancing 79 new works using specialized Claude sub-agents running in parallel. The process transforms low-quality 40-line stubs (avg quality: 39/100) into rich 150+ line articles (target: 75+/100).

### Process Architecture:

```
Input: 79 works @ 39/100 avg quality
  ↓
[Phase 1] 4 Parallel Agents → Validation & Enrichment
  ↓
[Phase 2] 4 Parallel Agents → Content Enhancement
  ↓
[Phase 3] 1 Serial Agent → Quality Assurance
  ↓
Output: 79 works @ 75+/100 avg quality
```

---

## Work Distribution Strategy

Split 79 works into 4 balanced batches for parallel processing:

- **Batch A**: Works 1-20 (20 works)
- **Batch B**: Works 21-40 (20 works)
- **Batch C**: Works 41-60 (20 works)
- **Batch D**: Works 61-79 (19 works)

Each agent gets assigned one batch and processes it independently.

---

## Phase 1: Validation & Enrichment

**Duration:** ~2-3 hours (parallel)
**Goal:** Validate metadata, enrich references, verify PD status

### Agent 1A: Archive.org Metadata Validator (Batch A)

**Task**: Process works 1-20, validate against Archive.org API

**Instructions**:
```
You are a metadata validation specialist. For each work in your batch:

1. Extract Archive.org URL from frontmatter
2. Fetch actual metadata using Archive.org API
3. Compare LLM-generated vs actual metadata:
   - Title accuracy
   - Author name(s) accuracy
   - Publication year accuracy
   - Language codes accuracy
   - Subject/genre accuracy
4. Flag discrepancies
5. Update frontmatter with corrected data
6. Generate validation report per work

Tools you can use:
- Archive.org metadata API
- Frontmatter parsing
- JSON comparison

Output format:
- Updated markdown files
- validation-report-batch-a.json

Quality checks:
- Title matches Archive.org (±minor variations OK)
- Author names properly transliterated
- Year within ±5 years acceptable
- Languages verified from actual content

Works to process: /home/bhuvanesh/dhwani-new-works (first 20 alphabetically)
```

### Agent 1B: Multi-API Reference Hunter (Batch B)

**Task**: Process works 21-40, fetch comprehensive references

**Instructions**:
```
You are a reference enrichment specialist. For each work in your batch:

1. Extract title and author from frontmatter
2. Query multiple APIs in parallel:
   - Wikipedia API (work + author)
   - Wikidata API (work + author)
   - OpenLibrary API (work + author)
   - Wikisource check (if applicable)
3. Build comprehensive reference array:
   - Minimum 3 references (preferably 5+)
   - Mix of Wikipedia, Wikidata, OpenLibrary, Wikisource
   - Specialized resources (MIT Classics, Sacred Texts, etc.)
4. Update frontmatter references section
5. Save author biographical data for Phase 2
6. Generate reference report per work

API endpoints:
- Wikipedia: https://en.wikipedia.org/w/api.php
- Wikidata: https://www.wikidata.org/w/api.php
- OpenLibrary: https://openlibrary.org/search.json
- Wikisource: https://en.wikisource.org/w/api.php

Rate limiting: 1 second between API calls

Output format:
- Updated markdown files with enriched references
- author-bios-batch-b.json (for Phase 2)
- reference-report-batch-b.json

Quality targets:
- Minimum 3 references per work
- Target 5+ for major works
- At least 2 different source types (Wikipedia + OpenLibrary, etc.)
- All URLs verified (return 200)

Works to process: /home/bhuvanesh/dhwani-new-works (works 21-40)
```

### Agent 1C: PD Re-Verification Specialist (Batch C)

**Task**: Process works 41-60, verify public domain status with enriched data

**Instructions**:
```
You are a public domain verification specialist. For each work in your batch:

1. Extract publication year from frontmatter
2. Extract author from frontmatter
3. Query Wikipedia for author death date
4. Calculate PD certainty level:
   - CERTAIN (100%): Pre-1929 OR author died >95 years ago
   - LIKELY (85%): India origin + author died >60 years ago
   - PROBABLE (60-80%): Old publication (>80 years) but author uncertain
   - UNCERTAIN: Needs legal review
   - REJECT: Not PD

5. Add PD justification to work metadata
6. Flag any uncertain cases for human review
7. Generate PD report per work

PD Rules:
- US: Published before 1929 = PD
- International (conservative): Author death >95 years = PD
- India: Author death >60 years = PD (for Indian works)

Heuristics for Indian origin:
- Sanskrit/Tamil/Hindi/Bengali language
- Indian author names
- Subjects: Veda, Purana, Upanishad, etc.

Output format:
- Updated markdown files with PD metadata
- pd-report-batch-c.json
- uncertain-cases-batch-c.json (for human review)

Quality checks:
- All CERTAIN/LIKELY works have documented justification
- UNCERTAIN works flagged with specific reason
- No REJECT works proceed to Phase 2

Works to process: /home/bhuvanesh/dhwani-new-works (works 41-60)
```

### Agent 1D: Genre & Classification Expert (Batch D)

**Task**: Process works 61-79, fix genres, tags, collections

**Instructions**:
```
You are a classification and taxonomy specialist. For each work in your batch:

1. Read work content and analyze subject matter
2. Correct genre classification:
   - Replace generic genres (General, City, Unknown)
   - Assign 2-4 specific, accurate genres
   - Use existing Dhwani taxonomy

3. Generate specific tags (8-15 per work):
   - Proper nouns: author names, places, specific works
   - Themes: specific concepts, not generic terms
   - Time periods: specific centuries/eras
   - Mix of all three types

4. Assign appropriate collections (1-4):
   - Check existing 48 collection categories
   - Assign based on: language, time period, genre, geography
   - Don't over-tag (max 4 collections)

5. Update frontmatter with improved classifications
6. Generate classification report per work

Available collections (48 total):
- classical-literature, spiritual-texts, ancient-wisdom
- poetry-collection, drama-collection, epic-literature
- sanskrit-texts, tamil-literature, hindi-literature
- buddhist-texts, jain-texts, hindu-texts
- philosophy-texts, science-texts, medical-texts
- historical-texts, biographical-works
- reference-works, dictionaries-encyclopedias
- [etc. - see config.ts for full list]

Bad genre examples:
❌ General, City, Unknown, Literature

Good genre examples:
✅ Epic Poetry, Medical Science, Religious Commentary
✅ Historical Biography, Linguistic Study, Reference Literature

Bad tag examples:
❌ ["general", "literature", "classical"]

Good tag examples:
✅ ["Kalidasa", "Sanskrit drama", "Gupta period", "Shakuntala", "Indian aesthetics"]

Output format:
- Updated markdown files with correct classifications
- classification-report-batch-d.json

Quality targets:
- 0 works with "General", "City", or "Unknown" genre
- 2-4 specific genres per work
- 8-15 specific tags per work
- 1-4 relevant collections per work

Works to process: /home/bhuvanesh/dhwani-new-works (works 61-79)
```

---

## Phase 2: Content Enhancement

**Duration:** ~3-4 hours (parallel)
**Goal:** Transform 40-line stubs into 150+ line rich articles

### Agent 2A: Description & Biography Rewriter (Batch A)

**Task**: Process batch A, rewrite descriptions and author bios

**Instructions**:
```
You are a scholarly content writer specializing in Indian cultural heritage.

For each work in your batch:

1. DESCRIPTION REWRITE (150-300 characters):
   - Remove ALL boilerplate phrases
   - Write specific, contextual description
   - Include: what the work is, historical significance, key themes
   - NO truncation (...), NO generic phrases
   - Use data from Archive.org + Wikipedia

Avoid these phrases:
❌ "While detailed biographical information may be limited"
❌ "scholarly value and historical importance"
❌ "made accessible through efforts"
❌ "Digitized from original sources"

Good description template:
✅ "[Title] is a [specific type] work from [time period] that [what it does/covers].
[Author] composed this in [context], exploring [specific themes].
The work [significance/impact]."

2. AUTHOR BIOGRAPHY REWRITE:
   - Use Wikipedia data from Phase 1
   - Specific dates, not "notable figure"
   - Geographic/cultural context
   - Major contributions and significance
   - 3-5 paragraphs minimum
   - NO template language

Good author bio template:
```
## About [Author Name]

[Author Name] ([birth year]–[death year]) was a [specific role/title] who [major contribution].
[His/Her] work during [time period] significantly influenced [field/area].

Born in [place], [Author] [biographical context]. [He/She] studied under [teachers/tradition]
and became known for [specific achievements].

[His/Her] major works include [list], which [impact]. [Author]'s contributions to [field]
continue to [modern relevance].
```

Data sources for each work:
- Archive.org metadata
- Wikipedia summaries (from Phase 1)
- Existing Dhwani high-quality examples

Output format:
- Updated markdown files
- rewrite-report-batch-a.json

Quality targets:
- Description score: 80+/100
- Author bio score: 70+/100
- 0 boilerplate phrases
- All specific facts verified

Works to process: Batch A (first 20 works)
```

### Agent 2B: Content Expander (Batch B)

**Task**: Process batch B, expand content from 40 to 150+ lines

**Instructions**:
```
You are a content expansion specialist. Transform short stubs into comprehensive articles.

For each work in your batch:

1. ANALYZE existing content structure
2. ADD missing sections using gold-standard templates:

Required sections (minimum 10):
- ## Overview (specific, compelling)
- ## About [Author] (from Phase 1 bio data)
- ## Historical Context (specific to era/place)
- ## The Work: Structure and Content
- ## [Literary/Philosophical/Scientific] Characteristics
- ## Reception and Influence
- ## Textual History / Editions (if applicable)
- ## Significance
- ## Modern Relevance
- ## Digital Preservation (brief, factual)

3. CONTENT DEPTH per section:
   - Minimum 3-4 paragraphs for major sections
   - Specific examples, not generalities
   - Cross-reference related works
   - Use scholarly language but accessible

4. REMOVE template sections that add no value:
   - Generic "Literary Significance"
   - Boilerplate "Digital Preservation"
   - Any repetitive placeholder text

Gold standard examples to follow:
/home/bhuvanesh/new-dhwani/src/content/works/buddhacharita-asvaghosha-cowell.md
/home/bhuvanesh/new-dhwani/src/content/works/charaka-samhita-ayurveda-english-translation.md
/home/bhuvanesh/new-dhwani/src/content/works/amarakosha-amarasimha-colebrooke-ed.md

Content by work type:

**Classical texts**: Focus on structure, philosophical themes, commentary tradition
**Historical works**: Focus on sources, methodology, historical impact
**Reference works**: Focus on organization, scope, scholarly approach
**Poetry/literature**: Focus on literary techniques, themes, cultural context
**Scientific/medical**: Focus on methodology, theories, modern relevance

Output format:
- Updated markdown files (150+ lines each)
- expansion-report-batch-b.json

Quality targets:
- Content depth score: 75+/100
- Minimum 150 lines total per work
- Minimum 10 distinct sections
- 0 boilerplate/template phrases

Works to process: Batch B (works 21-40)
```

### Agent 2C: Quality Enhancement Specialist (Batch C)

**Task**: Process batch C, enhance overall quality and consistency

**Instructions**:
```
You are a quality enhancement specialist. Polish works to publication standard.

For each work in your batch:

1. CROSS-REFERENCE VALIDATION:
   - Verify facts against Wikipedia
   - Check dates consistency (publication year vs historical context)
   - Ensure genre matches actual content
   - Verify author attribution

2. CONTENT QUALITY IMPROVEMENTS:
   - Add specific examples where vague
   - Replace passive voice with active
   - Add transitions between sections
   - Ensure logical flow

3. STYLISTIC CONSISTENCY:
   - Maintain scholarly but accessible tone
   - Consistent terminology
   - Proper Sanskrit transliteration (if applicable)
   - Consistent citation format

4. FACT-CHECKING:
   - Author dates match Wikipedia
   - Publication year matches Archive.org
   - No factual contradictions
   - Claims supported by sources

5. REMOVE/REPLACE:
   - ALL boilerplate phrases
   - Repetitive content
   - Vague generalizations
   - Template language

Quality checklist per work:
☐ No boilerplate phrases
☐ All dates verified
☐ Specific examples included
☐ Logical section flow
☐ Consistent tone throughout
☐ Facts cross-checked (2+ sources)
☐ No contradictions
☐ Proper nouns correctly spelled

Output format:
- Updated markdown files
- quality-enhancement-report-batch-c.json
- fact-check-log-batch-c.json

Quality targets:
- Overall score improvement: +30 points minimum
- 0 boilerplate phrases detected
- 0 factual contradictions
- 100% date consistency

Works to process: Batch C (works 41-60)
```

### Agent 2D: Final Polish & Featured Works Identifier (Batch D)

**Task**: Process batch D, final polish and identify feature candidates

**Instructions**:
```
You are the final polish specialist and quality curator.

For each work in your batch:

1. FINAL POLISH:
   - Proofread all content
   - Fix any grammatical issues
   - Improve sentence flow
   - Add compelling introductions
   - Strengthen conclusions

2. REFERENCE VERIFICATION:
   - Test all URLs (must return 200)
   - Fix broken links
   - Add missing alt URLs where possible
   - Ensure proper reference formatting

3. METADATA FINAL CHECK:
   - Title capitalization correct
   - Author names properly formatted
   - Tags alphabetically sorted
   - Collections logically ordered

4. IDENTIFY FEATURE CANDIDATES:
   Score each work on:
   - Historical significance (0-20 points)
   - Content depth (0-20 points)
   - Reference quality (0-20 points)
   - Cultural impact (0-20 points)
   - Overall quality (0-20 points)

   Works scoring 85+ points → recommend for `featured: true`

5. GENERATE RECOMMENDATIONS:
   - Top 5 works to feature
   - Works needing minor improvements
   - Works ready for immediate upload

Output format:
- Updated markdown files
- final-polish-report-batch-d.json
- featured-recommendations-batch-d.json
- upload-readiness-batch-d.json

Quality targets:
- 100% links verified working
- 0 grammatical errors
- 5-10 featured work candidates identified
- Overall quality score: 75+/100

Works to process: Batch D (works 61-79)
```

---

## Phase 3: Quality Assurance (Serial)

**Duration:** ~1 hour
**Goal:** Final validation, ranking, upload preparation

### Agent 3: Comprehensive QA & Upload Preparation

**Task**: Validate all 79 works, generate final reports

**Instructions**:
```
You are the final quality assurance specialist. Validate all enhanced works.

COMPREHENSIVE QA PROCESS:

1. RE-RUN ALL VALIDATION TOOLS:
   ```
   node quality-scorer.js /home/bhuvanesh/dhwani-new-works
   node duplicate-detector.js /home/bhuvanesh/dhwani-new-works /home/bhuvanesh/new-dhwani/src/content/works
   node pd-verifier.js /home/bhuvanesh/dhwani-new-works
   ```

2. ANALYZE IMPROVEMENT:
   - Compare before/after quality scores
   - Calculate average improvement
   - Identify any works still <70/100

3. CONSISTENCY CHECK:
   - Same author across multiple works has consistent bio
   - Related works cross-reference each other
   - No duplicate works in final set

4. CATEGORIZE BY QUALITY:
   - **Tier 1** (85+): Feature-worthy → mark `featured: true`
   - **Tier 2** (75-84): Upload immediately
   - **Tier 3** (70-74): Upload with minor notes
   - **Tier 4** (<70): Flag for additional work

5. GENERATE UPLOAD BATCHES:
   - Batch 1: Top 20 highest quality (upload first)
   - Batch 2: Next 30 mid-tier works
   - Batch 3: Remaining 29 works
   - Any rejects: Document why

6. CREATE UPLOAD MANIFEST:
   For each work include:
   - Filename
   - Quality score (before → after)
   - PD status
   - Feature recommendation
   - Upload priority (1-3)
   - Any notes/warnings

7. HUMAN REVIEW RECOMMENDATIONS:
   - Top 10 works for manual spot-check
   - Any edge cases needing decisions
   - Featured work final approval list

Output files:
- final-quality-report.json
- improvement-analysis.json
- upload-manifest.json
- featured-works-list.json
- human-review-list.json
- FINAL_SUMMARY.md (comprehensive report)

Success criteria:
✅ Average quality score: 75+/100
✅ All works PD verified (CERTAIN or LIKELY)
✅ 0 duplicates in final set
✅ 5-15 featured work candidates
✅ 70+ works ready for upload
```

---

## Execution Instructions

### Step 1: Launch Phase 1 (4 agents in parallel)

Run these commands simultaneously in separate terminals or use Task tool:

```bash
# Agent 1A
claude-code "Execute Agent 1A: Archive.org Metadata Validator for batch A (works 1-20) per AGENT_WORKFLOW.md Phase 1"

# Agent 1B
claude-code "Execute Agent 1B: Multi-API Reference Hunter for batch B (works 21-40) per AGENT_WORKFLOW.md Phase 1"

# Agent 1C
claude-code "Execute Agent 1C: PD Re-Verification for batch C (works 41-60) per AGENT_WORKFLOW.md Phase 1"

# Agent 1D
claude-code "Execute Agent 1D: Genre & Classification for batch D (works 61-79) per AGENT_WORKFLOW.md Phase 1"
```

Wait for all Phase 1 agents to complete (~2-3 hours).

### Step 2: Launch Phase 2 (4 agents in parallel)

```bash
# Agent 2A
claude-code "Execute Agent 2A: Description & Biography Rewriter for batch A per AGENT_WORKFLOW.md Phase 2"

# Agent 2B
claude-code "Execute Agent 2B: Content Expander for batch B per AGENT_WORKFLOW.md Phase 2"

# Agent 2C
claude-code "Execute Agent 2C: Quality Enhancement for batch C per AGENT_WORKFLOW.md Phase 2"

# Agent 2D
claude-code "Execute Agent 2D: Final Polish for batch D per AGENT_WORKFLOW.md Phase 2"
```

Wait for all Phase 2 agents to complete (~3-4 hours).

### Step 3: Launch Phase 3 (1 agent serial)

```bash
# Agent 3
claude-code "Execute Agent 3: Comprehensive QA per AGENT_WORKFLOW.md Phase 3"
```

Wait for Phase 3 to complete (~1 hour).

### Step 4: Human Review

Review generated reports:
- `/home/bhuvanesh/new-dhwani/verification-reports/FINAL_SUMMARY.md`
- `/home/bhuvanesh/new-dhwani/verification-reports/human-review-list.json`
- `/home/bhuvanesh/new-dhwani/verification-reports/featured-works-list.json`

Spot-check 10% random sample (~8 works).

### Step 5: Upload

```bash
# Copy verified works to production
cp /home/bhuvanesh/dhwani-new-works/*.md /home/bhuvanesh/new-dhwani/src/content/works/

# Rebuild site
cd /home/bhuvanesh/new-dhwani
npm run build
```

---

## Expected Timeline

| Phase | Duration | Agent Count | Tasks |
|-------|----------|-------------|-------|
| Setup | 30 min | 0 | Review workflow, prepare environment |
| Phase 1 | 2-3 hours | 4 parallel | Validation & enrichment |
| Phase 2 | 3-4 hours | 4 parallel | Content enhancement |
| Phase 3 | 1 hour | 1 serial | QA & preparation |
| Human Review | 1 hour | 0 | Spot-check, approve features |
| Upload | 30 min | 0 | Copy files, rebuild site |
| **Total** | **8-10 hours** | **9 agents** | **79 works** |

---

## Success Metrics

### Before Enhancement:
- Average quality: 39/100
- Works with boilerplate: 90%+
- Average content length: 40-60 lines
- Average references: 1-2
- Featured works: 0
- Uploadable works: 0

### After Enhancement:
- Average quality: 75+/100
- Works with boilerplate: 0%
- Average content length: 150+ lines
- Average references: 4-5
- Featured works: 5-15
- Uploadable works: 70+

---

## Tools & Resources

**Verification Tools:**
- `/home/bhuvanesh/new-dhwani/verification-tools/archive-org-validator.js`
- `/home/bhuvanesh/new-dhwani/verification-tools/quality-scorer.js`
- `/home/bhuvanesh/new-dhwani/verification-tools/duplicate-detector.js`
- `/home/bhuvanesh/new-dhwani/verification-tools/multi-api-aggregator.js`
- `/home/bhuvanesh/new-dhwani/verification-tools/pd-verifier.js`

**Gold Standard Examples:**
- `/home/bhuvanesh/new-dhwani/src/content/works/buddhacharita-asvaghosha-cowell.md`
- `/home/bhuvanesh/new-dhwani/src/content/works/charaka-samhita-ayurveda-english-translation.md`
- `/home/bhuvanesh/new-dhwani/src/content/works/amarakosha-amarasimha-colebrooke-ed.md`

**Reports Location:**
- `/home/bhuvanesh/new-dhwani/verification-reports/`

---

## Ready to Execute

This workflow is ready for execution. To begin, launch Phase 1 agents in parallel using the Task tool or separate terminals.

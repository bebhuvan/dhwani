# Dhwani New Gutenberg Batch (2025-11-02)

## Location
`/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/new-candidates-2/new-gutenberg-2025-11-01`

## Overview
This directory currently holds **30** Dhwani-ready markdown dossiers. Eight were prepared earlier; twenty-two were added in the latest batch to broaden coverage of Rabindranath Tagore’s English works, nationalist economic texts, Vivekananda’s Vedanta lectures, Bal Gangadhar Tilak’s Vedic research, South Indian folklore, and early Indian-English fiction.

## Pipeline Summary
1. **Harvest** – `gutendex_india_pipeline/collect_gutendex.py` queries the Gutendex API with India-focused topics, keywords, and language filters and stores raw results in `gutendex_india_pipeline/raw/gutendex_india_raw.json`.
2. **Filter** – `gutendex_india_pipeline/filter_gutendex.py` removes duplicates (vs. existing Dhwani works), checks Indian keyword signals, confirms contributors’ public-domain status (death ≤ 1964 when known), and writes the shortlist to `gutendex_india_pipeline/processed/gutendex_india_candidates.json` (303 candidates).
3. **Selection & Verification** – For each chosen title:
   - Confirmed authorship, publication year, and death year.
   - Validated working sources (Project Gutenberg where available, Internet Archive item + direct PDF).
   - Ensured no duplicate slugs already exist in `src/content/works` or sibling candidate folders.
4. **Markdown Authoring** – Crafted Dhwani-format files with:
   - Clean YAML front matter (title, year, language, genres, tags, collections).
   - Source and reference links (Gutenberg, Archive item, direct PDF, Wikipedia/Open Library, etc.).
   - Narrative sections: Overview, thematic/context analysis, PD status, research directions.

## New Files Added in Latest Pass
- `englands-debt-to-india-lala-lajpat-rai.md`
- `freedom-through-disobedience-chitta-ranjan-das.md`
- `fruit-gathering-rabindranath-tagore.md`
- `glimpses-of-bengal-rabindranath-tagore.md`
- `karma-yoga-swami-vivekananda.md`
- `lectures-from-colombo-to-almora-swami-vivekananda.md`
- `my-reminiscences-rabindranath-tagore.md`
- `orion-researches-into-the-antiquity-of-the-vedas-bal-gangadhar-tilak.md`
- `raja-yoga-swami-vivekananda.md`
- `rajmohans-wife-bankim-chandra-chattopadhyay.md`
- `songs-of-kabir-tagore-translation.md`
- `stray-birds-rabindranath-tagore.md`
- `tales-of-the-sun-pandit-natesa-sastri.md`
- `the-arctic-home-in-the-vedas-bal-gangadhar-tilak.md`
- `the-fugitive-rabindranath-tagore.md`
- `the-gardener-rabindranath-tagore.md`
- `the-hindoos-as-they-are-shib-chunder-bose.md`
- `the-home-and-the-world-rabindranath-tagore.md`
- `the-king-of-the-dark-chamber-rabindranath-tagore.md`
- `the-spirit-of-japan-rabindranath-tagore.md`
- `tales-of-the-sun-pandit-natesa-sastri.md`
- `twenty-two-goblins-arthur-ryder-translator.md`

(Existing earlier entries remain: `freedoms-battle-…`, `india-for-indians-…`, `indian-tales-of-the-great-ones-…`, `sadhana-the-realisation-of-life-…`, `the-hungry-stones-…`, `the-jungle-book-…`, `the-post-office-…`, `the-problem-of-the-rupee-…`, `the-wheel-of-fortune-…`.)

## Verification & PD Notes
- PD confirmed via author death ≤ 1964 and publication ≤ 1922 (U.S. cut-off).
- Double-checked Archive direct PDF names via metadata endpoints.
- Ripgrep used to ensure titles do not duplicate existing Dhwani works.

## Suggested Follow-up
- Run Dhwani’s metadata validator/linter on the folder.
- Update `_tracker.csv` or batch logs to reflect this 30-work lot.
- Prioritise next harvest for under-represented languages (Marathi, Urdu, Tamil novels) once this batch is reviewed.

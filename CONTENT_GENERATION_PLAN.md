# Dhwani Content Generation Plan

**Date:** November 2, 2025
**Status:** Ready to Execute

---

## Summary

Out of **539 total works** in the Dhwani collection:
- ✅ **365 works (67.7%)** have substantial body content
- ❌ **170 works (32.3%)** need scholarly body content
- 🎯 **4 works** have fallback boilerplate text

---

## Priority Breakdown

| Priority | Category | Count | Description |
|----------|----------|-------|-------------|
| **HIGH** | Ancient/Classical | 29 | Vedic texts, Upanishads, philosophical sutras, classical Sanskrit |
| **HIGH** | Religious/Philosophical | 12 | Buddhist, Jain, devotional literature, musicology |
| **MEDIUM** | Colonial Scholarship | 23 | Histories, gazetteers, grammars, natural history |
| **MEDIUM** | Modern Literature | 9 | Gandhi, Tagore, Naidu, independence era |
| **LOW** | Dictionaries/Reference | 5 | Dictionaries, glossaries, reference works |
| **LOW** | Natural History | 1 | Flora/fauna catalogues |
| **LOW** | Other | 91 | Miscellaneous works needing categorization |

**Total:** 170 works

---

## Quality Standards

Each work should include:

### Minimum Requirements (60-120 lines)
- ✅ No fluff, filler, or generic praise
- ✅ Specific facts: dates, names, movements, editions
- ✅ Academic register without jargon overload
- ✅ Bullet points for clarity where appropriate
- ✅ Contextual depth situating works in intellectual/historical currents
- ✅ Cross-references to related works when relevant
- ✅ Claude attribution note at end

### Content Structure

**For Religious/Philosophical Texts:**
```markdown
# [Title]

## Overview
[Publication details, manuscript tradition, critical editions. Core theological/philosophical position]

## About the Author
[Life dates, affiliations, other works, intellectual context]

## The Work
**Textual Structure:** [Books/chapters/verses, manuscript traditions]
**Core Teachings/Philosophy:** [3-5 major doctrines]

## Historical Significance
[Influence on later traditions, commentarial tradition, modern assessment]

## Digital Access
[Archive.org links]

---
**Note**: This description was generated with assistance from Claude...
```

**For Colonial Scholarship:**
```markdown
# [Title]

## Overview
[Publication details, institutional context, research scope]

## About the Author
[Life dates, credentials, institutional affiliations, career in India]

## The Work
**Scope and Methodology:** [Coverage, sources, approach]
**Major Sections:** [Content overview]

## Significance
**Contemporary Reception:** [How it was received]
**Later Assessment:** [Postcolonial critiques, current value]

## Digital Access
[Archive.org links]

---
**Note**: This description was generated with assistance from Claude...
```

---

## Batch Processing Strategy

### BATCH 1: Ancient/Classical Texts (HIGH PRIORITY)
**Count:** 20 works
**Estimated Time:** 30-45 min per work

Top priority works:
1. taittiriya-upanishad.md
2. ashtadhyayi-panini-grammar.md
3. shvetashvatara-upanishad.md
4. vaisheshika-sutras-kanada.md
5. jaimini-sutras-purva-mimamsa.md
6. nyaya-sutras-gautama.md
7. patanjali-yoga-sutras.md
8. vishnu-purana-wilson.md
9. shiva-purana.md
10. ramacharitamanasa-tulsidas.md

### BATCH 2: Religious/Philosophical (HIGH PRIORITY)
**Count:** 12 works

Key works:
1. kalpa-sutra.md
2. milinda-panha.md
3. ashtavakra-gita.md
4. vivekachudamani-shankaracharya.md
5. gita-govinda-jayadeva.md

### BATCH 3: Colonial Scholarship (MEDIUM PRIORITY)
**Count:** 15 works

Important historical works:
1. history-of-the-rise-of-the-mahomedan-power-in-india-muammad-qsim-firishta-tr-john-briggs.md
2. annals-and-antiquities-of-rajasthan-james-tod.md
3. the-economic-history-of-india-romesh-chunder-dutt.md
4. the-history-of-india-as-told-by-its-own-historians-h-m-elliot-completed-by-john-dowson.md

### BATCH 4: Modern Literature (MEDIUM PRIORITY)
**Count:** 9 works

Independence era literature:
1. hind-swaraj-indian-home-rule-gandhi.md
2. nationalism-rabindranath-tagore.md
3. the-golden-threshold-sarojini-naidu.md
4. the-case-for-india-annie-besant.md

---

## Research Workflow (Per Work)

### Step 1: Gather Existing Data (5 minutes)
- Read frontmatter description thoroughly
- Extract key facts: author, year, genre, language
- Note source URLs and references

### Step 2: Primary Source Examination (10 minutes)
- Visit Archive.org link
- Read digitization metadata
- Examine table of contents/preface if available
- Note edition, publisher, translator

### Step 3: Secondary Research (10-15 minutes)
- **Wikipedia:** Author biography, work overview, historical context
- **Archive.org metadata:** OCR info, collection details
- **Web search:** "[Work title] [author] scholarly analysis"
- **Related works:** Check if Dhwani has related works for cross-reference

### Step 4: Content Writing (10-15 minutes)
- Follow template structure
- Write dense, factual paragraphs
- Use bullet points for lists
- Include specific details (dates, editions, movements)
- Avoid fluff and superlatives

### Step 5: Quality Review (5 minutes)
- Check against quality checklist
- Verify factual accuracy
- Ensure 60-120 lines
- Add Claude attribution note

**Total Time:** 30-45 minutes per work

---

## Execution Options

### Option 1: Manual Research & Writing
- Use the batch processing script to get templates
- Research each work individually
- Fill in templates with factual content
- Save updated files

### Option 2: AI-Assisted Parallel Processing (RECOMMENDED)
- Use Claude Code's Task tool to launch multiple agents
- Each agent researches and writes content for one work
- Process 10-15 works simultaneously
- Massive efficiency gains through parallelization

**Example:**
```
Launch 15 parallel agents for Batch 1 (Ancient/Classical):
- Agent 1: Research and write content for taittiriya-upanishad.md
- Agent 2: Research and write content for ashtadhyayi-panini-grammar.md
- ... (15 agents running simultaneously)
```

This approach can complete a 20-work batch in ~30-45 minutes total instead of 10+ hours sequential processing.

---

## Files Created

1. **scripts/identify-minimal-content.js** - Identifies all works needing content
2. **scripts/categorize-minimal-works.js** - Categorizes and prioritizes works
3. **scripts/generate-batch-content.js** - Generates templates for batch processing
4. **MINIMAL_CONTENT_REPORT.json** - List of all 170 works needing content
5. **CATEGORIZED_MINIMAL_WORKS.json** - Works organized by category and priority
6. **CONTENT_GENERATION_PLAN.md** - This file (execution plan)

---

## Next Steps

### Immediate Actions:
1. ✅ Review this plan
2. ⬜ Decide on execution approach (manual vs AI-assisted)
3. ⬜ Start with BATCH 1 (Ancient/Classical - 20 works)
4. ⬜ Validate quality of first 3-5 works
5. ⬜ Continue with remaining batches

### Commands Available:

```bash
# Identify works needing content
node scripts/identify-minimal-content.js

# Categorize works by priority
node scripts/categorize-minimal-works.js

# Generate templates for batch processing
node scripts/generate-batch-content.js --batch 1 --count 10

# Process single work
node scripts/generate-batch-content.js --file taittiriya-upanishad.md
```

---

## Success Metrics

- **Target:** 170 works completed
- **Quality:** 100% meet minimum standards (60 lines, factual, no fluff)
- **Timeline:** 8-10 batches at ~20 works per batch
- **Efficiency:** 30-45 min per work (or 30-45 min per batch with parallel processing)

---

**Ready to execute!** 🚀

Would you like to proceed with AI-assisted parallel processing for BATCH 1?

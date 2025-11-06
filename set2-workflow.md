# Set 2 Processing Workflow

Complete workflow for processing and publishing Set 2 (85 unique works).

## Status Overview

### ✅ Completed Steps

1. **Initial Processing** (process-set2.js)
   - Copied 85 works from source location
   - Added disclaimers
   - Output: `unique-works-set2/`

2. **Schema Transformation** (transform-set2.js)
   - ✅ All 85 works transformed successfully
   - Fixed YAML parsing issues (unescaped quotes)
   - Converted to Dhwani schema format
   - Output: `transformed-set2/`
   - Generated description prompts: `transformed-set2/*.prompt.txt`

3. **Enhancement** (enhance-set2.js) - **IN PROGRESS**
   - 🔄 Currently running (~38% complete)
   - Adding alternative Archive.org sources
   - Adding Wikipedia references
   - Adding Wikisource links
   - Output: `enhanced-set2/`

### 📋 Remaining Steps

4. **Description Generation** (generate-descriptions.js)
   - **Prerequisites:**
     - Enhancement must complete
     - Install Anthropic SDK: `npm install @anthropic-ai/sdk`
     - Set API key: `export ANTHROPIC_API_KEY=your-key-here`

   - **What it does:**
     - Uses Claude API to generate scholarly descriptions (150-300 words)
     - Matches style of existing works (Priyadarshika, Jadunath Sarkar, etc.)
     - Generates appropriate tags
     - Removes [NEEDS GENERATION] markers

   - **Run command:**
     ```bash
     cd "/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani"
     export ANTHROPIC_API_KEY=your-api-key
     node generate-descriptions.js
     ```

   - **Output:** `final-set2/` (85 works with complete descriptions)

5. **Quality Review**
   - Manually review a sample of descriptions
   - Check for accuracy and tone
   - Verify all metadata is correct

6. **Deployment**
   - Combine Set 1 (`unique-works/` - 10 works) + Set 2 (`final-set2/` - 85 works)
   - Move all 95 works to `src/content/works/`
   - Run build and deploy

## Directory Structure

```
new-dhwani/
├── unique-works/              # Set 1: 10 enhanced works (READY)
├── unique-works-set2/         # Set 2: Original format (deprecated)
├── transformed-set2/          # Set 2: Transformed schema
│   ├── *.md                   # 85 transformed works
│   └── *.prompt.txt           # AI prompts for descriptions
├── enhanced-set2/             # Set 2: With sources/references (IN PROGRESS)
│   └── *.md                   # Enhanced works
├── final-set2/                # Set 2: Complete with descriptions (TODO)
│   └── *.md                   # 85 publication-ready works
└── src/content/works/         # Production directory (698 existing works)
```

## Commands Reference

### Check Enhancement Progress
```bash
tail -f enhance-set2.log
```

### Install Prerequisites for Description Generation
```bash
npm install @anthropic-ai/sdk
```

### Set API Key (get from https://console.anthropic.com/)
```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Run Description Generation
```bash
node generate-descriptions.js
```

### Count Files at Each Stage
```bash
ls unique-works/*.md | wc -l              # Set 1: should be 10
ls transformed-set2/*.md | wc -l          # Should be 85
ls enhanced-set2/*.md | wc -l             # Should be 85 (when complete)
ls final-set2/*.md | wc -l                # Should be 85 (after descriptions)
```

### Review Sample Descriptions
```bash
# View a few generated descriptions
head -80 final-set2/arrian-*.md
head -80 final-set2/tagore-*.md
head -80 final-set2/vatsyayana-*.md
```

## Estimated Timing

- ✅ Transformation: ~30 seconds (DONE)
- 🔄 Enhancement: ~6-8 minutes (IN PROGRESS, ~4 minutes remaining)
- ⏳ Description Generation: ~15-20 minutes (85 works × ~12 seconds each)
- 👤 Manual Review: 30-60 minutes
- 🚀 Deployment: 5 minutes (build + deploy)

**Total:** ~1.5-2 hours from start to deployment

## Cost Estimate

Description generation using Claude 3.5 Haiku:
- 85 works × ~2000 tokens input × $0.25/MTok = ~$0.04
- 85 works × ~300 tokens output × $1.25/MTok = ~$0.03
- **Total: ~$0.05**

(Much cheaper than Sonnet while maintaining high quality!)

## Quality Checkpoints

1. **After Enhancement:** Verify sources and references were added
2. **After Description Generation:** Review 5-10 descriptions for quality
3. **Before Deployment:** Check build succeeds with all works
4. **After Deployment:** Spot-check 3-5 works on live site

## Rollback Plan

If issues are found after deployment:
1. Revert to previous commit
2. Fix issues in final-set2/
3. Re-deploy only the fixed works
4. All intermediate directories preserved for debugging

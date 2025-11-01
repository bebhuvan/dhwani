# Works Difference Report (CORRECTED)

**Generated**: October 30, 2024

## Summary

- **Live site (dhwani.ink)**: 346 works
- **Local directory (total)**: 449 works
- **Truly new works (not on live)**: 103 works
- **Now in src/content/works**: 346 works (matches live site ✓)
- **Now in works_to_process**: 103 works (ready for review)

## What Happened

### Initial Analysis
- Compared live site sitemap (346 works) with local works (449 works)
- Found 106 works that appeared to be "new" (not on live)
- Moved all 106 to `works_to_process/`
- This left 343 works in `src/content/works/` (expected 346)

### The Unicode Filename Issue
The discrepancy was caused by **3 works with Unicode characters in filenames**:

1. `अषटधयय-1897-पणन.md` (Devanagari script)
2. `laghu-siddhantakaumudi-varadarāja-varadarāja.md` (contains ā)
3. `yoga-sastra-the-yoga-sutras-of-patenjali-examined-with-a-notice-of-swami-vivekanandas-yoga-philosophy-patañjali-christian-literature-society-for-india-murdoch.md` (contains ñ)

These filenames get **URL-encoded** in the sitemap:
- `अषटधयय` → `%E0%A4%85%E0%A4%B7%E0%A4%9F%E0%A4%A7%E0%A4%AF%E0%A4%AF`
- `ā` → `%C4%81`
- `ñ` → `%C3%B1`

The comparison tool couldn't match them, so they were incorrectly flagged as "new."

### Correction Applied
✅ Moved the 3 Unicode-filename works back to `src/content/works/`
✅ This restored the count to 346 (matching live site)
✅ Leaving 103 truly new works in `works_to_process/`

## Final State

### `/home/bhuvanesh/new-dhwani/src/content/works/`
**346 works** - Matches live site exactly ✓

### `/home/bhuvanesh/new-dhwani/works_to_process/`
**103 works** - Truly new works not yet published

These are ready for review/validation before publishing.

## Verification

```
346 (src/content/works) + 103 (works_to_process) = 449 total ✓
```

## Next Steps

1. Review the 103 works in `works_to_process/` folder
2. Validate metadata, descriptions, and sources
3. Process any needed corrections
4. Move validated works back to `src/content/works/`
5. Build and deploy to update live site from 346 → 449 works

---

## List of 103 New Works in works_to_process/

a-dictionary-of-the-persian-and-arabic-languages
a-digest-of-hindu-law-of-inheritance-partition-and-adoption
ajanta-frescoes-reproductions-in-colour-and-monochrome
anamika
anandamath-the-abbey-of-bliss
ancient-ballads-and-legends-of-hindustan
annals-and-antiquities-of-rajasthan-or-the-central-and-western-rajput-states-of-india
archaeological-survey-of-india-vol-1
a-tamil-hand-book-or-full-introduction-to-the-common-dialect-of-that-language
bigyan-prabesh-prarambha
block-prints-from-india-for-textiles
bobbili-yuddha-natakamu
bobbili-yuddha-natakamu-3
buddha-charit-vol-1-bengali-translation
castes-and-tribes-of-southern-india
catalogue-of-marathi-and-gujarati-printed-books-in-the-library-of-the-british-museum
catalogue-of-the-coins-in-the-indian-museum-calcutta
catalogue-of-the-coins-of-ancient-india
catalogue-of-the-indian-coins-in-the-british-museum
catalogue-of-the-library-of-the-india-office
ceylon-buddhism-being-the-collected-writings-of-daniel-john-gogerly
chalantika-adhunik-bangabhashar-abhidhan
charcha-shatak
charcha-shatak-3
coins-medals-and-seals-ancient-and-modern
coins-of-ancient-india-catalogue-of-the-coins-in-the-indian-museum-calcutta
corpus-inscriptionum-indicarum-vol-1-inscriptions-of-asoka
corpus-inscriptionum-indicarum-vol-3-inscriptions-of-the-early-gupta-kings
early-records-of-british-india-a-history-of-the-english-settlements-in-india
epigraphia-indica-list-of-the-inscriptions-of-northern-india-in-brahmi
excavations-at-harappa-vol-1
from-akbar-to-aurangzeb-a-study-in-indian-economic-history
guide-to-ellora-cave-temples
ham-vishpaei-janam-ke
heroes-of-the-indian-empire-or-storie-of-valour-and-victory
hindi-gadhya-ki-pravatiya
hind-swaraj-or-indian-home-rule
hindu-widow-re-marriage-and-other-tracts
history-of-india
hymns-of-the-rigveda-english-translation-complete-2-volumes
india-its-history-climate-productions-and-field-sports
indian-railway-policy
jayanti-utsargo
kalidasas-sakuntala-an-ancient-hindu-drama
khirer-putul-the-doll-of-condensed-milk
le-rmyana-tome-premier-pome-sanscrit-de-valmiky-valmiki
le-rmyana-tome-second-pome-sanscrit-de-valmiky-valmiki
manava-dharma-sastra-the-code-of-manu-original-sanskrit-text-critically-edited
mandir-ki-nartaki
medieval-mysticism-of-india
modern-religious-movements-in-india
mohenjo-daro-and-the-indus-civilization-being-an-official-account-of-archaeological-excavations-at-mohenjo-daro-carried-out-by-the-government-of-india-between-the-years-1922-and-1927
monuments-of-sanchi-vol-1
morte-de-yaginadatta-episodio-do-poema-epico-o-ramayana-valmiki
myths-of-the-hindus-buddhists
neelakesi-english-translation
outlines-of-indian-philosophy
outlines-of-jainism
rajput-painting-being-an-account-of-the-hindu-paintings-of-rajasthan-and-the-panjab-himalayas-from-the-sixteenth-to-the-nineteenth-century-described-in-their-relation-to-contemporary-thought
ranjan
ranjan-3
report-of-the-indian-universities-commission-1902
rig-veda-sanhita-a-collection-of-ancient-hindu-hymns
sahitya-jigyasa
sahitya-ka-itihasdarshan
sansakriti-sangam
satyarth-prakash-the-light-of-truth
shah-jahan
studies-in-indian-social-polity
swami-vivekananda-o-sri-sri-ramkrishna-sangha
swami-vivekananda-patriot-prophet
tamil-studies-or-essays-on-the-history-of-the-tamil-people-language-religion-and-literature
tamil-virundhu
tatinir-bichar
tatinir-bichar-3
the-autobiography-of-maharshi-devendranath-tagore-english-translation
the-buddhist-stupas-of-amaravati-and-jaggayyapeta
the-case-for-india
the-cave-temples-of-india
the-golden-threshold
the-highlands-of-central-india-notes-on-their-forests-and-wild-tribes-natural-history-and-sports
the-history-of-india-from-the-earliest-period-to-the-close-of-lord-dalhousies-administration
the-history-of-the-indian-revolt-and-of-the-expeditions-to-persia-china-and-japan-1856-7-8
the-kalpa-sutra-and-nava-tatva-two-works-illustrative-of-the-jain-religion-and-philosophy
the-paintings-in-the-buddhist-cave-temples-of-ajanta-khandesh-india
the-rmyana-volume-1-blakndam-and-ayodhykndam-valmiki
the-rmyana-volume-2-ranya-kishkindh-and-sundara-kndam-valmiki
the-rmyana-volume-3-yuddhakndam-valmiki
the-rmyana-volume-4-uttara-knda-valmiki
the-students-practical-dictionary-containing-english-words-with-english-urdu-meanings
the-stupa-of-bharhut-a-buddhist-monument-ornamented-with-numerous-sculptures-illustrative-of-buddhist-legend-and-history-in-third-century-bc
the-textile-manufactures-and-the-costumes-of-the-people-of-india
the-thirteen-principal-upanishads-translated-from-the-sanskrit-with-an-outline-of-the-philosophy-of-the-upanishads-and-an-annotated-bibliography
the-tribes-and-castes-of-the-central-provinces-of-india
the-yoga-vasishtha-maharamayana-of-valmiki-vol-1-of-4-valmiki
the-yoga-vasishtha-maharamayana-of-valmiki-vol-2-of-4-part-1-of-2-valmiki
the-yoga-vasishtha-maharamayana-of-valmiki-vol-2-of-4-part-2-of-2-valmiki
the-yoga-vasishtha-maharamayana-of-valmiki-vol-3-of-4-part-1-of-2-valmiki
the-yoga-vasishtha-maharamayana-of-valmiki-vol-3-of-4-part-2-of-2-valmiki
the-yoga-vasishtha-maharamayana-of-valmiki-vol-4-of-4-part-1-of-2-valmiki
the-yoga-vasishtha-maharamayana-of-valmiki-vol-4-of-4-part-2-of-2-valmiki
vazhivazhi-valluvar
women-in-ancient-india-moral-and-literary-studies

#!/usr/bin/env node
import fs from 'fs';

// Process Wave 1 author searches - extract pre-1924 works
const wave1Results = {
  maxMuller: [
    {id: "dli.ernet.163314", title: "Ramakrishna: His Life and Sayings", creator: "Max Muller", year: 1898},
    {id: "in.ernet.dli.2015.217470", title: "The Sacred Book Of The East Vol Xli", creator: "F Max Muller", year: 1894},
    {id: "in.ernet.dli.2015.158361", title: "The Sacred Books Of The East Vol Xliii", creator: "F. Max Muller", year: 1897},
    {id: "in.ernet.dli.2015.175343", title: "The Sacred Books Of The East Vol-v", creator: "F. Max Muller", year: 1880},
    {id: "in.ernet.dli.2015.224730", title: "The Sacred Books Of The East Vol. Xlv", creator: "F Max Muller", year: 1895},
    {id: "in.ernet.dli.2015.88518", title: "The Sacred Books Of The East Vol Xliv", creator: "F. Max Muller", year: 1900},
    {id: "in.ernet.dli.2015.216354", title: "The Sacred Books Of The East Vol No 39", creator: "F Max Muller", year: 1891},
    {id: "in.ernet.dli.2015.188654", title: "The Sacred Book Of The East Vol-xxi", creator: "F Max Muller", year: 1884},
    {id: "in.ernet.dli.2015.234021", title: "The Sacred Books The East Vol-xxxiii", creator: "F Max Muller", year: 1889},
    {id: "in.ernet.dli.2015.30185", title: "A General Index To The Sacred Books Of The East", creator: "F. Max Muller", year: 1910},
    {id: "in.ernet.dli.2015.224727", title: "The Sacred Books Of The East Vol. Xii", creator: "F Max Muller", year: 1882},
    {id: "in.ernet.dli.2015.224722", title: "The Sacred Books Of The East Vol. Vii", creator: "F Max Muller", year: 1880},
    {id: "in.ernet.dli.2015.217599", title: "The Sacred Books Of The East Vol Xix", creator: "F. Max Muller", year: 1883},
    {id: "in.ernet.dli.2015.217506", title: "The Sacred Books Of The East Vol Xxxv", creator: "F. Max Muller", year: 1890},
    {id: "isbn_9781290142700", title: "India: What can it teach us?", creator: "F. Max Muller", year: 1892},
    {id: "in.ernet.dli.2015.224723", title: "The Sacred Books Of The East Vol. Viii", creator: "F Max Muller", year: 1880},
    {id: "in.ernet.dli.2015.201797", title: "The Science Of Language", creator: "F Max Muller", year: 1913},
    {id: "in.ernet.dli.2015.215923", title: "Sacred Books Of The East Vol. Iv", creator: "F. Max Muller", year: 1895},
    {id: "bub_gb_CQyVExNgTbkC", title: "The Hymns of the RigVeda in the Pada Text", creator: "F. Max Muller", year: 1873},
    {id: "biographicaless01mlgoog", title: "Biographical Essays", creator: "Friedrich Max Müller", year: 1884},
    {id: "indiawhatcanitt02mlgoog", title: "India: what Can it Teach Us?", creator: "Friedrich Max Müller", year: 1883},
    {id: "in.ernet.dli.2015.533450", title: "Buddhist Suttas", creator: "F. Max Muller, T.W. Rhys Davids", year: 1881},
  ],
  monierWilliams: [
    {id: "dli.csl.8918", title: "Modern India and the Indians", creator: "Monier, Williams", year: 1879},
    {id: "in.ernet.dli.2015.201979", title: "Brahmanism And Hinduism", creator: "Sir Monier Monier Williams", year: 1891},
    {id: "in.gov.ignca.23533", title: "Indian wisdom", creator: "Monier-Williams, Monier", year: 1893},
    {id: "akuntalorakunta00monigoog", title: "Sakuntala recognized by the ring", creator: "Kalidasa; Monier-Williams", year: 1853},
    {id: "a-sanskrit-english-dictionary_202307", title: "A Sanskrit English Dictionary", creator: "Monier Williams", year: 1872},
    {id: "modernindiaindia00moni_0", title: "Modern India and the Indians", creator: "Monier-Williams", year: 1878},
    {id: "indianwisdom00moni", title: "Indian wisdom", creator: "Monier-Williams", year: 1875},
    {id: "practicalgrammar00moniiala", title: "A practical grammar of the Sanskrit language", creator: "Monier-Williams", year: 1877},
    {id: "sakuntalasanskri00kaliuoft", title: "Sakuntala, a Sanskrit drama", creator: "Kalidasa; Monier-Williams", year: 1876},
    {id: "modernindiaindia00moni", title: "Modern India and the Indians", creator: "Monier-Williams", year: 1879},
    {id: "apracticalgramm00wilgoog", title: "A Practical Grammar of the Sanskrit Language", creator: "Monier Monier-Williams", year: 1864},
    {id: "religiousthough00wilgoog", title: "Religious thought and life in India", creator: "Monier-Williams", year: 1885},
    {id: "in.ernet.dli.2015.260541", title: "Hinduism", creator: "Monier Williams", year: 1911},
    {id: "cu31924023050648", title: "Papers on Roman alphabet for Indo-Aryan", creator: "Monier-Williams", year: 1859},
    {id: "elementarygramma00monirich", title: "An elementary grammar of the Sanscrit language", creator: "Monier-Williams", year: 1846},
    {id: "bub_gb_lC4pAAAAYAAJ", title: "Vikramorvasii: a drama", creator: "Kalidasa; Monier-Williams", year: 1849},
    {id: "in.ernet.dli.2015.55638", title: "Sakoontala Or The Lost Ring", creator: "Monier, Williams", year: 1853},
    {id: "indianwisdomwith00moniuoft", title: "Indian wisdom", creator: "Monier-Williams", year: 1876},
  ],
  macdonell: [
    {id: "historyofsanskri00macduoft", title: "A history of Sanskrit literature", creator: "Macdonell, Arthur Anthony", year: 1900},
    {id: "vedicmythology00macduoft", title: "Vedic mythology", creator: "Macdonell, Arthur Anthony", year: 1897},
    {id: "historyofsanskri00macdrich", title: "A history of Sanskrit literature", creator: "Macdonell", year: 1900},
    {id: "vedicgrammar00macduoft", title: "Vedic grammar", creator: "Macdonell, Arthur Anthony", year: 1910},
    {id: "vedicreaderforst00macd", title: "A Vedic reader for students", creator: "Macdonell, Arthur Anthony", year: 1917},
    {id: "macdonell-a-sanskrit-english-dictionary", title: "A Sanskrit-English dictionary", creator: "Macdonell, Arthur A", year: 1893},
    {id: "in.ernet.dli.2015.486865", title: "Vedarthadipika", creator: "Macdonell, A. A.", year: 1886},
    {id: "in.ernet.dli.2015.531262", title: "Vedic Grammar For Students", creator: "Macdonell, Arthur Anthony", year: 1916},
    {id: "in.ernet.dli.2015.105655", title: "Vedic Grammar For Students", creator: "Macdonell, Arthur Anthony", year: 1916},
    {id: "in.ernet.dli.2015.104089", title: "Vedic Reader For Students", creator: "Macdonell, Arthur Anthony", year: 1917},
  ],
  keithWorks: [
    {id: "in.ernet.dli.2015.284764", title: "Vedic Index Of Names And Subjects Vol I", creator: "Berriedale Keith", year: 1912},
    {id: "in.ernet.dli.2015.312172", title: "The Aitareya Aranyaka", creator: "Keith, arthur Berriedale", year: 1909},
    {id: "in.ernet.dli.2015.284765", title: "Vedic Index Of Names And Subjects Vol Ii", creator: "Berriedale Keith", year: 1912},
    {id: "in.gov.ignca.23763", title: "Veda of the black yajus school pt.1-3", creator: "Keith, Arthur Berriedaled", year: 1914},
    {id: "in.gov.ignca.23764", title: "Veda of the black yajus school pt.4-7", creator: "Keith, Arthur Berriedaled", year: 1914},
    {id: "in.ernet.dli.2015.107169", title: "Veda Of The Black Yajus School Pt.4-7", creator: "Keith, Arthur Berriedaled", year: 1914},
    {id: "in.gov.ignca.23677", title: "Aitareya Aranyaka", creator: "Keith, Berriedale", year: 1909},
    {id: "in.gov.ignca.23771", title: "Rigveda Brahmanas", creator: "Keith, Arthur Berriedaled", year: 1920},
    {id: "vedicindexofname02macduoft", title: "Vedic index of names and subjects", creator: "Macdonell & Keith", year: 1912},
    {id: "in.ernet.dli.2015.23671", title: "A History Of Sanskrit Literature", creator: "A. Berriedale Keith", year: 1920},
    {id: "vedicindexofname01macduoft", title: "Vedic index of names and subjects", creator: "Macdonell & Keith", year: 1912},
  ],
  winternitzhWorks: [
    {id: "in.ernet.dli.2015.552475", title: "Mantrapatha", creator: "Winternitz, M.", year: 1897},
    {id: "in.gov.ignca.23532", title: "Geschichte der indischen litteratur", creator: "Winternitz, M.", year: 1909},
    {id: "in.ernet.dli.2015.554003", title: "The Apastambiya Grihyasutra", creator: "Winternitz,m.", year: 1887},
    {id: "in.ernet.dli.2015.487251", title: "Sanskrit Text", creator: "Winternitz, M.", year: 1897},
    {id: "in.ernet.dli.2015.279303", title: "A General Index To The Names And Subject Matter", creator: "M. Winternitz", year: 1910},
    {id: "in.ernet.dli.2015.107160", title: "Geschichte Der Indischen Litteratur", creator: "Winternitz, M.", year: 1909},
    {id: "in.ernet.dli.2015.273856", title: "The Apastambiya Grihyasutra", creator: "M. Winternitz", year: 1887},
    {id: "in.ernet.dli.2015.142432", title: "Catalogue Of Sanskrit Manuscripts In The Bodleian Library", creator: "Winternitz,moriz", year: 1905},
    {id: "in.ernet.dli.2015.279634", title: "Catalogue Of South Indian Sanskrit Manuscripts", creator: "M. Winternitz", year: 1902},
    {id: "paper-doi-10_1038_058233b0", title: "Folk-Medicine in Ancient India", creator: "M. WINTERNITZ", year: 1898},
  ],
  griersonWorks: [
    {id: "in.ernet.dli.2015.61745", title: "Linguistic Survey Of India Vol.v", creator: "Grierson,g. A.", year: 1903},
    {id: "in.ernet.dli.2015.61845", title: "Linguistic Survey Of India Vol. Ix", creator: "Grierson,g. A.", year: 1907},
    {id: "bihrpeasantlife00griegoog", title: "Bihar peasant life", creator: "Grierson, George Abraham, Sir", year: 1885},
    {id: "dli.csl.6723", title: "Seven grammars of the dialects of the Bihari language", creator: "Grierson, George A.", year: 1883},
    {id: "in.ernet.dli.2015.279717", title: "Bihar Peasant Life", creator: "George A. Grierson", year: 1885},
    {id: "in.gov.ignca.12580", title: "Lalla -vakyani", creator: "Grierson, George", year: 1920},
    {id: "in.ernet.dli.2015.31113", title: "A History Of The Sikhs", creator: "Joseph Davey Cunningham", year: 1918},
    {id: "in.ernet.dli.2015.109528", title: "A History Of The Sikhs", creator: "Joseph Davey Cunningham", year: 1853},
  ],
  todWorks: [
    {id: "in.ernet.dli.2015.279562", title: "Annals And Antiquities Of Rajasthan Vol Ii", creator: "James Tod", year: 1920},
    {id: "AnnalsAndAntiquitiesOfRajasthanVolII", title: "Annals & Antiquities Of Rajasthan", creator: "James Tod", year: 1920},
    {id: "in.ernet.dli.2015.124301", title: "Annals And Antiquities Of Rajasthan Vol. Ii", creator: "James Tod", year: 1838},
    {id: "in.ernet.dli.2015.61056", title: "Annals And Antiquities Of Rajasthan Vol.i", creator: "James Tod", year: 1920},
    {id: "in.ernet.dli.2015.170619", title: "Annals Antiquities Of Rajasthan Vol.ii", creator: "James Tod", year: 1920},
    {id: "in.ernet.dli.2015.115225", title: "Annals And Antiquities Of Rajasthan Vol. Ii", creator: "James Tod", year: 1838},
    {id: "in.ernet.dli.2015.351547", title: "Annals And Antiouities Of Rajasthan Vol Iii", creator: "Lieut Col James Tod", year: 1920},
    {id: "in.ernet.dli.2015.35778", title: "Annals And Antiqqities Of Rajasthan", creator: "James Tod", year: 1880},
    {id: "TheAnnalsAndAntiquitiesOfRajasthanVol.II", title: "The Annals And Antiquities Of Rajasthan Vol. II", creator: "James TOD", year: 1873},
    {id: "dli.venugopal.658", title: "Annals And Antiquities of Rajasthan. Vol-001", creator: "James Tod", year: 1829},
  ],
  cunninghamWorks: [
    {id: "in.ernet.dli.2015.127431", title: "Ladak Physical Statistical And Historical", creator: "Alexander Cunningham", year: 1854},
    {id: "in.ernet.dli.2015.547220", title: "Archaeological Survey Of India Vol. 5", creator: "Cunningham, Alexander", year: 1875},
    {id: "in.ernet.dli.2015.68467", title: "Report Of A Tour In The Central Provinces 1873-75", creator: "Cunningham, Alexander", year: 1879},
    {id: "in.ernet.dli.2015.127719", title: "Later Indo Scythians", creator: "Cunningham,major General", year: 1895},
    {id: "in.ernet.dli.2015.59412", title: "Report Of A Tour In The Punjab Vol.xiv", creator: "Cunningham,alexander.", year: 1882},
    {id: "in.ernet.dli.2015.47299", title: "The Bhilsa Topes", creator: "Cunningham, Alexander", year: 1854},
    {id: "in.ernet.dli.2015.21812", title: "Report Of A Tour In Eastern Rajputana 1882-1883", creator: "Cunningham, A.", year: 1885},
    {id: "oncertaindisease0000ddcu", title: "On Certain Diseases of Fungal Origin", creator: "D.D. Cunningham", year: 1897},
    {id: "in.ernet.dli.2015.35442", title: "Report Of A Tour In Bundelkhand And Rewa, 1883-84", creator: "Cunningham, A.", year: 1885},
    {id: "noteonindianwhea00cunn", title: "A note on Indian wheat-rusts", creator: "Cunningham, D. D.", year: 1896},
    {id: "in.ernet.dli.2015.94077", title: "Archaeological Survey Of India Vol. 1", creator: "Cunningham, Alexander", year: 1871},
    {id: "in.ernet.dli.2015.35432", title: "Four Reports Made During The Years 1862-63-64-65", creator: "Cunningham, Alexander", year: 1871},
    {id: "in.ernet.dli.2015.35535", title: "Report Of A Tours In The Punjab And Rajputana 1883-84", creator: "Cunningham, A.", year: 1887},
    {id: "in.ernet.dli.2015.31719", title: "Modern Civilisation In Some Of Its Economic Aspects", creator: "Cunningham, W.", year: 1896},
    {id: "in.ernet.dli.2015.52197", title: "Rulers Of India Earl Canning", creator: "Cunningham H.s.", year: 1892},
    {id: "leprosyinindiaa00bgoog", title: "Leprosy in India, A Report", creator: "T. R. Lewis, D. D. Cunningham", year: 1877},
    {id: "pli.kerala.rare.12151", title: "Archaeological Survey of India Vol.11", creator: "Alexander Cunningham", year: 1880},
  ]
};

// Count and filter
const allResults = Object.values(wave1Results).flat();
const prePD = allResults.filter(w => w.year && w.year < 1924);

console.log(`\n🔥 WAVE 1 AUTHOR SEARCH RESULTS\n`);
console.log('═'.repeat(70));
console.log(`Total works extracted:     ${allResults.length}`);
console.log(`Pre-1924 (PD):             ${prePD.length}`);
console.log('═'.repeat(70));

Object.entries(wave1Results).forEach(([author, works]) => {
  const pd = works.filter(w => w.year && w.year < 1924).length;
  console.log(`${author.padEnd(25)} ${works.length} works (${pd} PD)`);
});

fs.writeFileSync('./wave1-author-results.json', JSON.stringify({allResults, prePD}, null, 2));
console.log(`\n✅ Saved to wave1-author-results.json`);
console.log(`\nReady to create ${prePD.length} candidates!\n`);

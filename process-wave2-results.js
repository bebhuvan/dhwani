#!/usr/bin/env node

// Wave 2 subject-specific search results (manually extracted from WebFetch outputs)

const sanskritDrama = [
  {"id": "indiantheatrebri00horrrich", "title": "The Indian theatre [microform] : a brief survey of the Sanskrit drama", "creator": "Horrwitz, E. P. (Ernest Philip), b. 1866", "year": 1912},
  {"id": "dli.ministry.27734", "title": "आर्यकविजय नाटक", "creator": "Tiṭhake, Dattātraya Rāmacaṇdra", "year": 1893},
  {"id": "dli.ministry.30243", "title": "शाकुंतल-सार व विचार", "creator": "Lele, Madhavarava Vyaṅkaṭeśa", "year": 1905},
  {"id": "selectspecimens02wilsgoog", "title": "Select specimens of the theatre of the Hindus", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860, tr", "year": 1835},
  {"id": "selectspecimenso01wils", "title": "Select specimens of the theatre of the Hindus", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860", "year": 1827},
  {"id": "in.gov.ignca.3107", "title": "Das Gopatha Brahmana", "creator": "Gaastra, Dieuke", "year": 1919},
  {"id": "lethtreindienvo00lvgoog", "title": "Le théâtre indien", "creator": "Lévi, Sylvain, 1863-1935", "year": 1890},
  {"id": "indischestheate00fritgoog", "title": "Indisches Theater", "creator": "Fritze, Ludwig, 1833- ed. and tr", "year": 1877},
  {"id": "dli.ministry.27640", "title": "Āndhra māṭhavikāgnimitramu", "creator": "Kālidāsu; Venkaṭarāya Śāstri, Vēdaṅ", "year": 1919},
  {"id": "dli.ministry.31009", "title": "विक्रमोर्वशी नाटक", "creator": "Rājavāḍe, Kbīṣṇāśāstrī", "year": 1874},
  {"id": "b30094379", "title": "Venīsaṃhāranāṭakam", "creator": "Nārāyaṇa Bhaṭṭa. n 81102644", "year": 1875},
  {"id": "in.gov.ignca.16245", "title": "Crautasutra of Katyayana vol.1", "creator": "Weber, Albrecht", "year": 1859},
  {"id": "dli.ministry.27645", "title": "Āndhrikruta abhigñānaśākuntalamu", "creator": "Kālidāsu; Venkaṭarāya Śāstri, Vēdaṅ", "year": 1919},
  {"id": "lethtreindien00lvgoog", "title": "Le théâtre indien", "creator": "Lévi, Sylvain, 1863-1935", "year": 1890},
  {"id": "priyadarsikasans00hars", "title": "Priyadaŕsikā : a Sanskrit drama", "creator": "Harśavardhana, King of Tha&#305;nesar and Kanauj, active 606-647", "year": 1923},
  {"id": "dli.ministry.05578", "title": "Ratnavali: a drama in four acts", "creator": "Dutt, Michael M. S.", "year": 1904},
  {"id": "dli.ministry.29095", "title": "Kāṭidāsa - Lambōdara Prahasanamu", "creator": "Hāsyakaṭānidhi", "year": 1922},
  {"id": "worksbylatehorac04wils", "title": "Works by the late Horace Hayman Wilson", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860", "year": 1862},
  {"id": "worksbylatehorac12wils", "title": "Works by the late Horace Hayman Wilson", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860", "year": 1862},
  {"id": "bub_gb_Hs5DAAAAYAAJ", "title": "Theater der Hindu's", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860", "year": 1828},
  {"id": "vasantasenaunddi00bolt", "title": "Vasantasena und die Hetären im indischen Drama", "creator": "Boltz, August, 1819-1907", "year": 1894},
  {"id": "dli.ministry.30136", "title": "रत्नावली नाटिका", "creator": "Harṣadeva; Ghamaskara, Balakrisna Vitthala", "year": 1903},
  {"id": "worksbylatehorac06wils", "title": "Works by the late Horace Hayman Wilson", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860", "year": 1862},
  {"id": "in.gov.ignca.16246", "title": "Crautasutra of Katyayana vol.2", "creator": "Weber, Albrecht", "year": 1859},
  {"id": "dli.ministry.29912", "title": "फ्रांकलिन चरित", "creator": "राय, प्रसन्नचन्द्र", "year": 1870},
  {"id": "selectspecimenso02wils_0", "title": "Select specimens of the theatre of the Hindus,", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860. tr", "year": 1835},
  {"id": "dli.csl.8281", "title": "Maha vira charita : the adventures of the great hero Rama", "creator": "Pickford, John", "year": 1871},
  {"id": "b30092863", "title": "The Mâlav̂ignimitra : a Sanskrit play", "creator": "Kâildâsa; Pandit, Shankar P. (Shankar Pandurang)", "year": 1869},
  {"id": "selectspecimenso01wils_0", "title": "Select specimens of the theatre of the Hindus,", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860. tr", "year": 1835},
  {"id": "selectspecimenso02wils", "title": "Select specimens of the theatre of the Hindus", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860", "year": 1827},
  {"id": "JanakiParinayamMalayalamDrama", "title": "Janaki Parinayam Malayalam Drama", "creator": "Chathukkutty Mannadiyar", "year": 1903},
  {"id": "dli.ministry.25703", "title": "The Eight principal Rasas of the Hindus with murtti and vrindaka", "creator": "Tagore, Sourindro Mohun", "year": 1880},
  {"id": "chefsdoeuvreduth01wilsuoft", "title": "Chefs-d'oeuvre du théâtre Indien", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860; Langlois, Simon Alexandre, 1788-1854", "year": 1828},
  {"id": "chefsdoeuvreduth02wilsuoft", "title": "Chefs-d'oeuvre du théâtre Indien", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860; Langlois, Simon Alexandre, 1788-1854", "year": 1828},
  {"id": "wilsonstheatreof00wilsuoft", "title": "Wilson's theatre of the Hindus", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860", "year": 1826},
  {"id": "selectspecimenso03wils", "title": "Select specimens of the theatre of the Hindus", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860", "year": 1827},
  {"id": "Mrichchhakatika", "title": "Mrichchhakatika", "creator": "Godbole, Parashuram Pant", "year": 1881},
  {"id": "worksbylatehorac09wils", "title": "Works by the late Horace Hayman Wilson", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860", "year": 1862},
  {"id": "dli.ministry.30822", "title": "Tapatīsamvaraṇamu", "creator": "Kondalarao, Kakarla", "year": 1923},
  {"id": "worksbylatehorac10wils", "title": "Works by the late Horace Hayman Wilson", "creator": "Wilson, H. H. (Horace Hayman), 1786-1860", "year": 1862},
  {"id": "rasarnavasudhaka00simhuoft", "title": "Rasarnavasudhakarah", "creator": "Simhabhupala; Ganapati Sastri, T", "year": 1916},
  {"id": "dasarupatreatise00dhan", "title": "The Dasārūpa; a treatise on Hindu dramaturgy", "creator": "Dhanañjaya; Haas, George Christian Otto", "year": 1912},
  {"id": "dasarupatreatise00dhanrich", "title": "The Dasarupa; a treatise on Hindu dramaturgy", "creator": "Dhanañjaya; Haas, George C. O. (George Christian Otto), b. 1883", "year": 1912},
  {"id": "b31362576", "title": "Mattavilāsaprahasanaṃ", "creator": "Mahendra Vikrama Varma, King of Kanchi, active 600-630", "year": 1917},
  {"id": "bibliographyofsa00schu_0", "title": "A bibliography of the Sanskrit drama", "creator": "Schuyler, Montgomery, 1877-", "year": 1906},
  {"id": "bibliographyofsa03schuuoft", "title": "A bibliography of the Sanskrit drama : with an introductory sketch", "creator": "Schuyler, Montgomery, 1877-", "year": 1906},
  {"id": "dasindischedrama00konouoft", "title": "Das indische Drama", "creator": "Konow, Sten, 1867-1948", "year": 1920},
  {"id": "bhratyantyacstr00munigoog", "title": "Bhāratīya-nātya-cāstram Traité de Bharata sur le théâtre", "creator": "Bharata Muni; Grosset, Joanny, 1862- ed", "year": 1898},
  {"id": "devidsakainhetin00huizuoft", "title": "De vidsaka in het Indisch tooneel", "creator": "Huizinga, Johan, 1872-1945", "year": 1897}
];

const brahmanas = [
  {"id": "satapathabrhmana0026unse", "title": "The satapatha-brâhmana, according to the text of the Mâdhyandina school", "creator": null, "year": 1882},
  {"id": "satapathabrhmana0044unse", "title": "The satapatha-brâhmana, according to the text of the Mâdhyandina school", "creator": null, "year": 1882},
  {"id": "satapathabrhmana0043unse", "title": "The satapatha-brâhmana, according to the text of the Mâdhyandina school", "creator": null, "year": 1882},
  {"id": "satapathabrhmana0012unse", "title": "The satapatha-brâhmana, according to the text of the Mâdhyandina school", "creator": null, "year": 1882},
  {"id": "satapathabrhmana0041unse", "title": "The satapatha-brâhmana, according to the text of the Mâdhyandina school", "creator": null, "year": 1882},
  {"id": "atharvaveda00bloo", "title": "The Atharvaveda", "creator": "Bloomfield, Maurice, 1855-1928", "year": 1899},
  {"id": "catapathabrahman01saya", "title": "The Catapatha brâhmana of the White Yajurveda", "creator": "Sayana; Sâmaramî, Pandit Satyavrata", "year": 1903},
  {"id": "catapathabrahman23saya", "title": "The Catapatha brâhmana of the White Yajurveda", "creator": "Sayana; Sâmaramî, Pandit Satyavrata", "year": 1903}
];

const upanishads = [
  {"id": "indianphilosophy02radh_0", "title": "Indian philosophy", "creator": "Radhakrishnan, S. (Sarvepalli), 1888-1975", "year": 1923},
  {"id": "beginningsofhind00lanmrich", "title": "The beginnings of Hindu pantheism [microform]", "creator": "Lanman, Charles Rockwell, 1850-1941", "year": 1890},
  {"id": "in.gov.ignca.13665", "title": "Die Lehre der Upanishaden und die Anfange des Buddhismus", "creator": "Oldenberg, Hermann", "year": 1915},
  {"id": "indianphilosophy01radh_0", "title": "Indian philosophy", "creator": "Radhakrishnan, S. (Sarvepalli), 1888-1975", "year": 1923},
  {"id": "dli.csl.7589", "title": "The Law of inheritance as in the Viramitrodaya of Mitra Misra", "creator": null, "year": 1879},
  {"id": "upanishadshistor00scot", "title": "The Upanishads: a historico-philosophical study", "creator": "Scott, J. E. Rev", "year": 1887},
  {"id": "adescriptivecat06librgoog", "title": "A descriptive catalogue of the Sanskrit manuscripts in the Adyar Library (Theosophical Society) Vol. I: Upanisads", "creator": "Adyar Library, Schrader, Friedrich Otto, 1876-1961", "year": 1908},
  {"id": "KathaUpanisad", "title": "Kathopanishad: With the Sanskrit Text, Anvayya, Vritti, Word Meaning, Translation, Notes and Index", "creator": "Vasu, Srisa Chandra, 1861-1918?", "year": 1905},
  {"id": "RoerSelectionsFromUpanisads", "title": "Roer Selections From Upanisads", "creator": "Edward Roer", "year": 1905},
  {"id": "dli.ministry.06976", "title": "Upanishadas or an account of their contents and nature", "creator": "Society for the Resuscitation of Indian Literature", "year": 1898},
  {"id": "beginningshindu00lanmgoog", "title": "The Beginnings of Hindu Pantheism: An Address Delivered at the Twenty-second Annual Meeting of ...", "creator": "Charles Rockwell Lanman", "year": 1890},
  {"id": "matriauxpourse02regn", "title": "Matériaux pour servir à l'histoire de la philosophie de l'Inde", "creator": "Regnaud, Paul, 1838-1910", "year": 1876},
  {"id": "songoflife0000john", "title": "The song of life", "creator": "Johnston, Charles, 1867-1931", "year": 1910},
  {"id": "dli.csl.8569", "title": "Philosophical currents of the present day", "creator": "Stein, Ludwig", "year": 1918},
  {"id": "in.gov.ignca.16305", "title": "Thirty minor upanishads", "creator": "Aiyar, K. Narayanasvami", "year": 1914},
  {"id": "dli.ministry.04426", "title": "The metaphysics of the Upanishads : vicharsagar", "creator": "Sreeram, Lala", "year": 1885},
  {"id": "dli.csl.7893", "title": "Bibliotheca indica a collection of oriental works Nos. 78 and 181", "creator": null, "year": 1862},
  {"id": "dli.csl.6452", "title": "Isha Upanishad text, translation and an original comment", "creator": "Mall, Suraj", "year": 1916},
  {"id": "ThePhilosophyOfTheUpanishads", "title": "The Philosophy Of The Upanishads", "creator": "Paul Deussen", "year": 1908},
  {"id": "mandukyaupanishe015008mbp", "title": "Mandukya Upanished", "creator": "V.G. Apte", "year": 1921},
  {"id": "b30094331", "title": "Ṡhândogjopanishad", "creator": "Böhtlingk, Otto von, 1815-1904", "year": 1889},
  {"id": "cu31924023202173", "title": "The human body in the Upanishads", "creator": "Brown, George William, 1870-", "year": 1921}
];

// Combine all results
const allResults = [
  ...sanskritDrama.map(w => ({...w, subject: 'Sanskrit Drama'})),
  ...brahmanas.map(w => ({...w, subject: 'Brahmanas'})),
  ...upanishads.map(w => ({...w, subject: 'Upanishads'}))
];

// Filter for pre-1924 and clean data
const pre1924 = allResults.filter(w => w.year && w.year < 1924);

// Remove duplicates by ID
const uniqueById = {};
pre1924.forEach(work => {
  if (!uniqueById[work.id]) {
    uniqueById[work.id] = work;
  }
});

const uniqueWorks = Object.values(uniqueById);

console.log('\n🔥 WAVE 2 SUBJECT SEARCH RESULTS (PART 1/3)\n');
console.log('═'.repeat(70));
console.log(`Total works extracted:     ${allResults.length}`);
console.log(`Pre-1924 (PD):             ${pre1924.length}`);
console.log(`Unique works:              ${uniqueWorks.length}`);
console.log('═'.repeat(70));

// Group by subject
const bySubject = {};
uniqueWorks.forEach(w => {
  if (!bySubject[w.subject]) bySubject[w.subject] = [];
  bySubject[w.subject].push(w);
});

Object.keys(bySubject).sort().forEach(subject => {
  console.log(`${subject.padEnd(25)} ${bySubject[subject].length} works`);
});

console.log('\n✅ Part 1 complete! Next: Processing remaining subjects (Puranas, Ayurveda, Tamil, Bengali, Music, Art)\n');

// Save results
import fs from 'fs';
fs.writeFileSync('./wave2-subject-results-part1.json', JSON.stringify({allResults: uniqueWorks}, null, 2));
console.log('Saved to wave2-subject-results-part1.json\n');

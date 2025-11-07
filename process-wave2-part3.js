#!/usr/bin/env node
import fs from 'fs';

const tamilLiterature = [
  {"id": "02kuruntokai-tsr-iyengar-1915-firstprinting", "title": "Kuruntokai", "creator": "m kamalakannan", "year": 1915},
  {"id": "catalogueoftamil00brituoft", "title": "A catalogue of the Tamil books in the library of the British Museum", "creator": "British Museum; Lionel D. Barnett; George Uglow Pope", "year": 1909},
  {"id": "31761121115547", "title": "Uvamāṇa cañkirakam", "creator": "Unknown", "year": 1914},
  {"id": "31761121115406", "title": "Cāṇakkiya nītiveṇpā", "creator": "Unknown", "year": 1914},
  {"id": "gc-sh10-0012", "title": "Tamil Expositor", "creator": "Tiruveṭkāḍu cuppayā mutaliyār", "year": 1811},
  {"id": "31761121115604", "title": "Tiruvalavāyuḍaiyārkōyil tiruppaṇi mālai", "creator": "Unknown", "year": 1923},
  {"id": "31761121115612", "title": "Tirukkuṟṟāla mālai", "creator": "Tirikūḍarācappāṇ Kavirāyar", "year": 1921},
  {"id": "31761121115562", "title": "Tirumālirūñcōlai aṇakari piḷḷaitamiḻ", "creator": "Unknown", "year": 1919},
  {"id": "book_tamil_agananuru_rajagopalan_1st_edn_1923", "title": "Agananuru", "creator": "m kamalakannan", "year": 1923},
  {"id": "APrimerOfTamilLiterature", "title": "A Primer of Tamil Literature", "creator": "Purnalingam Pillai, M. S.", "year": 1904},
  {"id": "tamiilakkiyamcak00nctu", "title": "Tamil ilakkiyam cañka kālam", "creator": "Nā.cā. Turaicāmi piḷḷai", "year": 1923},
  {"id": "31761121115620", "title": "Tiruppullāṇi mālai", "creator": "Unknown", "year": 1915},
  {"id": "derkuraldestiruv00grau", "title": "Der Kural des Tiruvalluver", "creator": "Karl Graul", "year": 1856},
  {"id": "gc-sh1-0318", "title": "Kācirakaciyam", "creator": "Mīnāḍcicuntaram Piḷḷai", "year": 1881},
  {"id": "dli.ministry.28328", "title": "Cirappup peyarakarāti", "creator": "Rathinavēlu Mudaliyār, Ikkādu", "year": 1908},
  {"id": "ancientindia0000unse", "title": "Ancient India", "creator": "Krishnaswami Aiyangar, Sakkottai", "year": 1911},
  {"id": "dli.ministry.02342", "title": "Gnanasambandam: a Tamil novel", "creator": "C.M. Ponnoosawmy Pillay", "year": 1913},
  {"id": "talespoemsofsout00robiiala", "title": "Tales and poems of South India", "creator": "Edward Jewitt Robinson", "year": 1885},
  {"id": "tamilianantiquar0000unse_t3x5", "title": "The Tamilian Antiquary: An Old Tradition Preserved and Ors.", "creator": "D. Savariroyan et. al.", "year": 1913},
  {"id": "agastyaintamilla00sivarich", "title": "Agastya in the Tamil land", "creator": "Sivaraja Pillai, K. Narayanan", "year": 1920},
  {"id": "31761121115539", "title": "Tiranāyāiyūr nampi mēkaviḍu tūtu", "creator": "Unknown", "year": 1921},
  {"id": "cu31924022968840", "title": "Ancient India", "creator": "Krishnaswami Aiyangar, Sakkottai", "year": 1911},
  {"id": "tamulischeschrif00grau", "title": "Tamulische Schriften zur Erläuterung des Vedanta-Systems", "creator": "Karl Graul", "year": 1854},
  {"id": "tvaiyul00pala", "title": "Tēvaiyulā", "creator": "Palapaḍḍaic Cokkanātaka kavirāyar", "year": 1907},
  {"id": "tirukkural-tiruvalluvar", "title": "Tirukkural", "creator": "George Uglow Pope", "year": 1886},
  {"id": "tiruvalluvanayan00tiruuoft", "title": "Tiruvalluvanayanar arulicceyta Tirrukkural", "creator": "Tiruvalluvar; Pope, G. U.; Beschi, Costantino Giuseppe; Ellis, F. W.", "year": 1886}
];

const bengaliLiterature = [
  {"id": "dli.ministry.06041", "title": "সীতা", "creator": "দাস, অবিনাশ চন্দ্র", "year": 1894},
  {"id": "historyofbengali00sendrich", "title": "History of Bengali language and literature. A series of lectures delivered as Reader to the Calcutta University", "creator": "Sen, Dinesh Chandra, rai bahadur", "year": 1911},
  {"id": "dli.ministry.03311", "title": "জজ দিগম্বর বিশ্বাস: জীবন-চরিত", "creator": "গুপ্ত, অম্বিকাচরণ", "year": 1923},
  {"id": "vaisnavaliterat00send", "title": "The Vaisnava literature of Mediaeval Bengal", "creator": "Sen, Dinesh Chandra", "year": 1917},
  {"id": "dli.ministry.26745", "title": "Rāmanidhi gupta o gītaratna grantha", "creator": "De, Sushila Kumara", "year": 1917},
  {"id": "dli.ministry.02457", "title": "हिन्दा-हाफेज : गीतिनाट्य", "creator": "मित्र, अतुल कृष्ण", "year": 1915},
  {"id": "dli.ministry.03626", "title": "लुलिया : गीतिनाट्य", "creator": "मित्र, अतुल कृष्ण", "year": 1914},
  {"id": "historyofbengali00susiuoft", "title": "History of Bengali literature in the nineteenth century, 1800-1825", "creator": "Susila-Kumara De", "year": 1919},
  {"id": "dli.ministry.27940", "title": "Bangla adab kī tārīkh", "creator": "Mohāmmad Shahīdullāh", "year": 1907},
  {"id": "dli.ministry.25324", "title": "Bāngālā Kavitāra Bhāṣā o Bhāva", "creator": "Sen, Suresh Chandra", "year": 1906},
  {"id": "TroilokyanathMukhopadhyayRachanasangraha", "title": "Troilokyanath Mukhopadhyay Rachanasangraha", "creator": "Troilokyanath Mukhopadhyay", "year": 1900},
  {"id": "dli.ministry.00452", "title": "आयेषा : गीतिनाट्य", "creator": "मित्र, अतुल कृष्ण", "year": 1916},
  {"id": "SahityaSara", "title": "Sahitya Sara", "creator": "Nrisingha Chandra Mukhopadhyay", "year": 1882},
  {"id": "dli.ministry.01581", "title": "दम-बाज", "creator": "मित्र, अतुल कृष्ण", "year": 1915},
  {"id": "dli.ministry.04613", "title": "नवजीवन: मातृपूजा ओ राज भक्तिर उच्छ्वास", "creator": "बसु, अमृतलाल", "year": 1902},
  {"id": "dli.ministry.26436", "title": "Musulamāna o Vañgasāhitya", "creator": "Āndula, Gaphura Siddikī", "year": 1916},
  {"id": "dli.ministry.26658", "title": "Prācīna bañga sāhitya haita bāngālīra dainandina jīvana o sāmājika acāra byabahārera paricaya", "creator": "Sen, Prabhāsa Chandra", "year": 1920},
  {"id": "dli.ministry.29201", "title": "खोकार बई", "creator": "बसु, मोहिनीमोहन", "year": 1911},
  {"id": "dli.ministry.26907", "title": "शाकुन्तला", "creator": "Vidyāsāgara, Īshwar Chandra", "year": 1907},
  {"id": "dli.ministry.03418", "title": "कादम्बरी", "creator": "तारशंकर", "year": 1887},
  {"id": "dli.ministry.01570", "title": "देवर्षि नारदे नबजीवन", "creator": "अघोरनाथ", "year": 1838},
  {"id": "dli.ministry.29860", "title": "प्रयास : मासिक पत्र ओ समालोचक", "creator": "मार्सडेन, विलियाम", "year": 1811},
  {"id": "dli.ministry.06632", "title": "तुफानी", "creator": "मित्र, अतुल कृष्ण", "year": 1915},
  {"id": "dli.ministry.01246", "title": "छेलेदेर कादम्बरी", "creator": "राय, हिमांशु प्रकाश", "year": 1912},
  {"id": "dli.ministry.25157", "title": "Anecdotes of virtue and Valour", "creator": null, "year": 1829},
  {"id": "dli.ministry.26659", "title": "Prācīna vañga sāhitye candīmañgala", "creator": "Bhattāchārya, Tāraprasanna", "year": 1919},
  {"id": "dli.ministry.03438", "title": "कबितागुच्छ", "creator": "चक्रवर्ती, अजितकुमार", "year": 1919},
  {"id": "typesofearlybeng00mitruoft", "title": "Types of early Bengali prose", "creator": "Mitra, Siva Ratan", "year": 1922},
  {"id": "historyofbengali00desurich", "title": "History of Bengali literature in the nineteenth century, 1800-1825 [microform]", "creator": "De, Sushil Kumar", "year": 1919}
];

const indianMusic = [
  {"id": "in.gov.ignca.21415", "title": "Music of India", "creator": "Popley, Herbert A.", "year": 1921},
  {"id": "raga-nirupanam", "title": "Cattvarim-Shata-Shata- Raga Nirupanam by Narada", "creator": "Dr Keshavchaitanya J Kunte", "year": 1914},
  {"id": "americanprimiti01burtgoog", "title": "American Primitive Music: With Especial Attention to the Songs of the Ojibways", "creator": "Frederick Russell Burton", "year": 1909},
  {"id": "EtudeDecember1913", "title": "Volume 31, Number 12 (December 1913)", "creator": "Theodore Presser Company", "year": 1913},
  {"id": "raga-chandrika-of-appa-tulasi-1911", "title": "Raga Chandrika Of Appa Tulasi 1911", "creator": "Dr Keshavchaitanya J Kunte", "year": 1911},
  {"id": "americanprimiti03burtgoog", "title": "American Primitive Music: With Especial Attention to the Songs of the Ojibways", "creator": "Frederick Russell Burton", "year": 1909},
  {"id": "epigraphiacarnat04mysouoft", "title": "Epigraphia carnatica. By B. Lewis Rice, Director of Archaeological Researches in Mysore", "creator": "Mysore. Dept. of Archaeology; Rice, B. Lewis; Narasimhacharya, Ramanujapuram Anandan-pillai", "year": 1894},
  {"id": "hamsadwani020002mbp", "title": "Hamsa Dwani", "creator": "L.Mala Kondayya", "year": 1881},
  {"id": "NativeLifeArchive01", "title": "NATIVE LIFE IN TRAVANCORE by The REV. SAMUEL MATEER, F.L.S. along with Commentary by VED from VICTORIA INSTITUTIONS", "creator": "The REV. SAMUEL MATEER, F.L.S.", "year": 1883},
  {"id": "raga-chandrika-sara-vishnusharma-i.e.-v-n-bhatkhande-1919", "title": "Raga Chandrika Sara by Kashinath Appa Tulasi (1919)", "creator": "Dr Keshavchaitanya Kunte", "year": 1919},
  {"id": "EtudeOctober1922", "title": "Volume 40, Number 10 (October 1922)", "creator": "Theodore Presser Company", "year": 1922},
  {"id": "ghunchah-e-raag-reprint-in-1897-munshi-nawal-kishore-press-lucknow-by-nawab-mard", "title": "Ghunchah E Raag( Reprint In 1897 Munshi Nawal Kishore Press, Lucknow) By Nawab Mardan Ali Khan ' Rana' Moradabadi", "creator": "Nawab Mardan Ali Khan Rana Moradabadi", "year": 1863},
  {"id": "EtudeOctober1920", "title": "Volume 38, Number 10 (October 1920)", "creator": "Theodore Presser Company", "year": 1920},
  {"id": "EtudeAugust1922", "title": "Volume 40, Number 08 (August 1922)", "creator": "Theodore Presser Company", "year": 1922},
  {"id": "SufiMessageOfSpiritualLiberty1914russian", "title": "Sufi Message of Spiritual Liberty (1914) (Russian)", "creator": "Pir-o-Murshid, Inayat Khan", "year": 1914},
  {"id": "SwathiThirunalSangeethaKruthikal", "title": "Swathi Thirunal Sangeetha Kruthikal", "creator": "Maharaja Swathi Thirunal", "year": 1916},
  {"id": "americanprimiti02burtgoog", "title": "American Primitive Music: With Especial Attention to the Songs of the Ojibways", "creator": "Frederick Russell Burton", "year": 1909},
  {"id": "bhatkhande-abhinava-raga-manjari-1921", "title": "Abhinava Raga Manjari by Pandit Vishnu Narayan Bhatkhande (1921)", "creator": "Dr K J Kunte, with assistance by Kartik Bhalerao", "year": 1921}
];

const indianArt = [
  {"id": "in.gov.ignca.5460", "title": "Indian religions", "creator": "Jennings, Hargrave", "year": 1890},
  {"id": "in.gov.ignca.22961", "title": "L'Architecture Hindoue en extreme-orient", "creator": "De Beylie, L.", "year": 1907},
  {"id": "in.gov.ignca.37184", "title": "Technical art series of illustrations of eastern metal work and carving for the use of art schools and craftsmen", "creator": null, "year": 1902},
  {"id": "in.gov.ignca.24281", "title": "Antiquities of Indian Tibet pt. 1", "creator": "Francke, A.H.", "year": 1914},
  {"id": "in.gov.ignca.1126", "title": "Ideals of Indian art", "creator": "Havell, E.B.", "year": 1920},
  {"id": "relig-ie-indo-the-dance-of-siva-coomaraswamy-livro", "title": "The dance of Siva; fourteen Indian essays", "creator": "Coomaraswamy, Ananda Kentish", "year": 1918},
  {"id": "relig-ie-indo-arq-art-craft-of-india-ceylon-coomaraswamy-livro", "title": "The arts and crafts of India and Ceylon", "creator": "Coomaraswamy, Ananda Kentish", "year": 1913},
  {"id": "in.gov.ignca.39893", "title": "Plates coloured from journal of Indian art vol.2 to13 (London 1888-1910)", "creator": null, "year": 1910},
  {"id": "in.gov.ignca.23022", "title": "Handbook of Indian art", "creator": "Havell, E.B.", "year": 1920},
  {"id": "in.gov.ignca.20097", "title": "History of Indian and eastern Architecture vol.2", "creator": "Fergusson, James", "year": 1910},
  {"id": "in.gov.ignca.37183", "title": "Technical art series of illustrations of eastern metal work for the use of art schools and craftsmen", "creator": null, "year": 1901},
  {"id": "in.gov.ignca.23036", "title": "L'art Indien", "creator": "Maindron, Maurich", "year": 1898},
  {"id": "l-art-indien", "title": "L' Art Indien", "creator": null, "year": 1898},
  {"id": "in.gov.ignca.37177", "title": "Technical art series of illustrations of Indian architectural decorative work for the use of art schools and craftsmen", "creator": null, "year": 1890},
  {"id": "in.gov.ignca.37178", "title": "Technical art series of illustrations of Indian architectural decorative work for the use of art schools and craftsmen", "creator": null, "year": 1895},
  {"id": "dli.ministry.03084", "title": "Indian and eastern architecture", "creator": "Fergusson, James", "year": 1876},
  {"id": "dli.csl.8562", "title": "The Journal of Indian Art, Vol. VI", "creator": null, "year": 1896},
  {"id": "in.gov.ignca.44653", "title": "Indian images (pt.I)", "creator": "Bhattacharya, B.C.", "year": 1921},
  {"id": "in.gov.ignca.22291", "title": "Handbook to the Sculptures in the Museum of the Bangiya Sahitya Parishad", "creator": "Ganguly, Manomohan", "year": 1922},
  {"id": "in.gov.ignca.37180", "title": "Technical art series of illustrations of Indian architectural decorative work", "creator": null, "year": 1892}
];

const allResults = [
  ...tamilLiterature.map(w => ({...w, subject: 'Tamil Literature'})),
  ...bengaliLiterature.map(w => ({...w, subject: 'Bengali Literature'})),
  ...indianMusic.map(w => ({...w, subject: 'Indian Music'})),
  ...indianArt.map(w => ({...w, subject: 'Indian Art & Architecture'}))
];

const pre1924 = allResults.filter(w => w.year && w.year < 1924);
const uniqueById = {};
pre1924.forEach(work => {
  if (!uniqueById[work.id]) uniqueById[work.id] = work;
});
const uniqueWorks = Object.values(uniqueById);

console.log('\n🔥 WAVE 2 SUBJECT SEARCH RESULTS (PART 3/3)\n');
console.log('═'.repeat(70));
console.log(`Total works extracted:     ${allResults.length}`);
console.log(`Pre-1924 (PD):             ${pre1924.length}`);
console.log(`Unique works:              ${uniqueWorks.length}`);
console.log('═'.repeat(70));

const bySubject = {};
uniqueWorks.forEach(w => {
  if (!bySubject[w.subject]) bySubject[w.subject] = [];
  bySubject[w.subject].push(w);
});

Object.keys(bySubject).sort().forEach(subject => {
  console.log(`${subject.padEnd(30)} ${bySubject[subject].length} works`);
});

console.log('\n✅ Part 3 complete! All Wave 2 subjects processed!\n');

fs.writeFileSync('./wave2-subject-results-part3.json', JSON.stringify({allResults: uniqueWorks}, null, 2));
console.log('Saved to wave2-subject-results-part3.json\n');

// Combine all three parts
const part1 = JSON.parse(fs.readFileSync('./wave2-subject-results-part1.json', 'utf-8'));
const part2 = JSON.parse(fs.readFileSync('./wave2-subject-results-part2.json', 'utf-8'));
const part3 = uniqueWorks;

const allWave2 = [...part1.allResults, ...part2.allResults, ...part3];
fs.writeFileSync('./wave2-all-subject-results.json', JSON.stringify({allResults: allWave2}, null, 2));

console.log('═'.repeat(70));
console.log('🎯 WAVE 2 FINAL TOTALS\n');
console.log(`Part 1: ${part1.allResults.length} works`);
console.log(`Part 2: ${part2.allResults.length} works`);
console.log(`Part 3: ${uniqueWorks.length} works`);
console.log(`\n✨ WAVE 2 TOTAL: ${allWave2.length} unique pre-1924 works!\n`);
console.log('═'.repeat(70));

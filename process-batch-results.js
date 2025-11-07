#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// All results from WebFetch searches
const allResults = {
  cornellSanskrit: [
    {id: "cu31924022986115", title: "The enchanted parrot: being a selection from the \"Suka Saptati\"", creator: "Wortham, B. Hale", year: 1911, subjects: ["Sanskrit literature"], language: "eng"},
    {id: "cu31924023185584", title: "Manuscript remains of Buddhist literature found in Eastern Turkestan", creator: "Hoernle, A. F. Rudolf", year: 1916, subjects: ["Buddhist literature", "Buddhist literature, Sanskrit"], language: "eng"},
    {id: "cu31924023329877", title: "The history of Indian literature", creator: "Weber, Albrecht", year: 1892, subjects: ["Indic literature", "Vedic literature", "Sanskrit literature"], language: "eng"},
    {id: "cu31924022960821", title: "The history of Indian literature", creator: "Weber, Albrecht", year: 1878, subjects: ["Sanskrit literature"], language: "eng"},
    {id: "cu31924021023613", title: "A view of the history, literature, and religion of the Hindoos", creator: "Ward, William", year: 1863, subjects: ["Hindus", "Sanskrit literature", "Mythology, Hindu"], language: "eng"},
    {id: "cu31924023200235", title: "Panini: his place in Sanskrit literature", creator: "Goldstucker, Theodor", year: 1861, subjects: ["Panini"], language: "eng"},
    {id: "cu31924022944619", title: "Studies about the Sanskrit Buddhist literature", creator: "Gawronski, Andrzej", year: 1919, subjects: ["Sanskrit literature"], language: "eng"},
    {id: "cu31924022960698", title: "Hindu literature, or, The ancient books of India", creator: "Reed, Elizabeth Armstrong", year: 1907, subjects: ["Sanskrit literature"], language: "eng"},
    {id: "cu31924023177045", title: "Papers relating to the collection and preservation of the records of ancient Sanskrit literature in India", creator: "Gough, Archibald Edward", year: 1878, subjects: ["Manuscripts, Sanskrit"], language: "eng"},
    {id: "cu31924022888196", title: "India, old and new", creator: "Hopkins, Edward Washburn", year: 1902, subjects: ["Vedas", "Sanskrit literature"], language: "eng"},
    {id: "cu31924022960433", title: "A short history of Indian literature", creator: "Horrwitz, E. P.", year: 1907, subjects: ["Indic literature", "Sanskrit literature"], language: "eng"},
    {id: "cu31924029111314", title: "Sanskrit and its kindred literatures. Studies in comparative mythology", creator: "Poor, Laura Elizabeth", year: 1880, subjects: ["Mythology", "Literature, Ancient"], language: "eng"},
    {id: "cu31924022996809", title: "Studies in early Indian thought", creator: "Stephen, Dorothea Jane", year: 1918, subjects: ["Philosophy, Hindu", "Sanskrit literature"], language: "eng"},
  ],
  torontoPhilosophy: [
    {id: "upanishadssrisan00sita", title: "Upanishads and Sri Sankara's commentary", creator: "Sitarama Sastri, S", year: 1905, subjects: ["Upanishads", "Philosophy, Hindu"], language: ["eng", "san"]},
    {id: "alberunisindiaac02biruuoft", title: "Alberuni's India", creator: "Biruni, Muhammad ibn Ahmad; Sachau, Eduard", year: 1888, subjects: ["India -- History", "India -- Religion"], language: "eng"},
    {id: "indianphilosophy02dasguoft", title: "A history of Indian philosophy (Vol. 2)", creator: "Dasgupta, Surendranath", year: 1922, subjects: ["Philosophy, Hindu"], language: "eng"},
    {id: "thesarvadarsanas00madhuoft", title: "The Sarva-Darsana-Samgraha", creator: "Madhava Acharya", year: 1882, subjects: ["Hinduism"], language: "eng"},
    {id: "indianphilosophy04dasguoft", title: "A history of Indian philosophy (Vol. 4)", creator: "Dasgupta, Surendranath", year: 1922, subjects: ["Philosophy, Hindu"], language: "eng"},
    {id: "commemorativeess00bhanuoft", title: "Commemorative essays presented to Sir Ramkrishna Gopal Bhandarkar", creator: "Bhandarkar, Ramkrishna Gopal, Sir", year: 1917, subjects: ["Philosophy, Hindu", "India -- History"], language: "eng"},
    {id: "indianwisdomwith00moniuoft", title: "Indian wisdom", creator: "Monier-Williams, Monier, Sir", year: 1876, subjects: ["Philosophy, Hindu"], language: "eng"},
    {id: "thescienceofbrea00raamuoft", title: "The science of breath and the philosophy of the tattvas", creator: "Rama Prasada", year: 1897, subjects: ["Philosophy, Hindu"], language: "eng"},
    {id: "indianphilosophy03dasguoft", title: "A history of Indian philosophy (Vol. 3)", creator: "Dasgupta, Surendranath", year: 1922, subjects: ["Philosophy, Hindu"], language: "eng"},
    {id: "indianphilosophy05dasguoft", title: "A history of Indian philosophy (Vol. 5)", creator: "Dasgupta, Surendranath", year: 1922, subjects: ["Philosophy, Hindu"], language: "eng"},
    {id: "indianphilosophy01dasguoft", title: "A history of Indian philosophy (Vol. 1)", creator: "Dasgupta, Surendranath", year: 1922, subjects: ["Philosophy, Hindu"], language: "eng"},
    {id: "hinduphilosophys00davi", title: "Hindu philosophy, the Sankhya Karika of Iswara Krishna", creator: "Davies, John", year: 1881, subjects: ["Kapila", "Hinduism"], language: "eng"},
    {id: "tamilwisdomtradi00robiuoft", title: "Tamil wisdom", creator: "Robinson, Edward Jewitt", year: 1873, subjects: ["Philosophy, Hindu"], language: "eng"},
    {id: "historyofindianp01dasguoft", title: "A history of Indian philosophy (Vol. 1 variant)", creator: "Dasgupta, Surendranath", year: 1922, subjects: ["Philosophy, Hindu"], language: "eng"},
    {id: "panchadasiofsree00maaduoft", title: "A hand-book of Hindu pantheism: The Panchadasi", creator: "Madhava", year: 1899, subjects: ["Hinduism", "Philosophy, Hindu"], language: "eng"},
    {id: "hinduphilosophy00boseuoft", title: "Hindu philosophy popularly explained", creator: "Bose, Ram Chandra", year: 1887, subjects: ["Hinduism", "Philosophy, Hindu"], language: "eng"},
    {id: "thebhagavadgitah00xxxxuoft", title: "Hindu philosophy. The Bhagavad gita", creator: "Davies, John", year: 1882, subjects: ["Bhagavad Gita"], language: "eng"},
    {id: "vedantaphilos00abheuoft", title: "Vedanta philosophy, divine heritage of man", creator: "Abhedananda, Swami", year: 1903, subjects: ["Philosophy, Hindu", "Vedanta"], language: "eng"},
    {id: "hindurealism00chatuoft", title: "The Hindu realism", creator: "Jagadisa-Chandra Chattopadhyaya", year: 1912, subjects: ["Philosophy, Hindu", "Nyaya"], language: "eng"},
    {id: "indianthoughtpas00frazuoft", title: "Indian thought past and present", creator: "Frazer, R. W.", year: 1915, subjects: ["Philosophy, Hindu"], language: "eng"},
    {id: "ancientindiaphil00garbuoft", title: "The philosophy of ancient India", creator: "Garbe, Richard", year: 1897, subjects: ["Philosophy, Hindu"], language: "eng"},
    {id: "theupanishadsand00urquuoft", title: "The Upanishads and life", creator: "Urquhart, William Spence", year: 1916, subjects: ["Upanishads", "Philosophy, Hindu"], language: "eng"},
    {id: "amanualofhindu00jacouoft", title: "A manual of Hindu pantheism, the Vedantasara", creator: "Jacob, George Adolphus", year: 1888, subjects: ["Vedanta philosophy"], language: "eng"},
    {id: "hinduphilosophyb00daviuoft", title: "Hindu philosophy: The Bhagavad Gita (variant)", creator: "Davies, John", year: 1889, subjects: ["Bhagavad Gita"], language: "eng"},
    {id: "hindulogic00sugiuoft", title: "Hindu logic as preserved in China and Japan", creator: "Sugiura, Sadajiro", year: 1900, subjects: ["Logic -- History", "Philosophy, Hindu"], language: "eng"},
  ],
  torontoBuddhist: [
    {id: "siyukibuddhistre01hsuoft", title: "Si-yu-ki, Buddhist records of the Western world", creator: "Hsüan-tsang; Beal, Samuel", year: 1884, subjects: ["Buddhism"], language: "eng"},
    {id: "siyukibuddhistre02hsuoft", title: "Si-yu-ki, Buddhist records of the Western world (Vol 2)", creator: "Hsüan-tsang; Beal, Samuel", year: 1884, subjects: ["Buddhism"], language: "eng"},
    {id: "recordofbuddhist00fahsuoft", title: "A record of Buddhistic kingdoms", creator: "Fa-hsien; Legge, James", year: 1886, subjects: ["Buddha and Buddhism"], language: "eng"},
    {id: "buddhistmahy01asvauoft", title: "Buddhist Mahâyâna texts", creator: "Asvaghosa; Cowell, Edward B.", year: 1894, subjects: ["Buddhism"], language: "eng"},
    {id: "handbookofchines00eite", title: "Hand-book of Chinese Buddhism", creator: "Eitel, Ernest John", year: 1904, subjects: ["Buddhism"], language: "eng"},
    {id: "sanskritbuddhist00asiauoft", title: "The Sanskrit Buddhist literature of Nepal", creator: "Asiatic Library; Mitra, Rajendralala", year: 1882, subjects: ["Buddhism -- Nepal"], language: "eng"},
    {id: "buddhistartinind00gruoft", title: "Buddhist art in India", creator: "Grünwedel, Albert", year: 1901, subjects: ["Art, Buddhist"], language: "eng"},
    {id: "beginningsofbudd00foucuoft", title: "The beginnings of Buddhist art and other essays", creator: "Foucher, A.", year: 1917, subjects: ["Art, Buddhist"], language: "eng"},
    {id: "catalogueofbuddh00camb", title: "Catalogue of the Buddhist Sanskrit manuscripts", creator: "Cambridge University Library; Bendall, Cecil", year: 1883, subjects: ["Manuscripts, Sanskrit", "Buddhism"], language: "eng"},
    {id: "historyofnepl00sing", title: "History of Nepl", creator: "Singh, Shew Shunker", year: 1877, subjects: ["Nepal -- History"], language: "eng"},
    {id: "asokabuddhistemp00smituoft", title: "Asoka, the Buddhist emperor of India", creator: "Smith, Vincent Arthur", year: 1901, subjects: ["Asoka"], language: "eng"},
    {id: "lightofasiaorgre00arnouoft", title: "The light of Asia", creator: "Arnold, Edwin, Sir", year: 1879, subjects: ["Buddhism -- Poetry"], language: "eng"},
    {id: "buddhistindia00daviuoft", title: "Buddhist India", creator: "Davids, Thomas William Rhys", year: 1911, subjects: ["Buddha and Buddhism"], language: "eng"},
    {id: "asokabuddhistem00smit", title: "Asoka, the Buddhist emperor of India", creator: "Smith, Vincent Arthur", year: 1909, subjects: ["Asoka"], language: "eng"},
    {id: "studiesinhistory00lyonuoft", title: "Studies in the history of religions", creator: "Lyon, David Gordon; Moore, George Foot", year: 1912, subjects: ["Religion -- History"], language: "eng"},
    {id: "sragdharastotram00sarvuoft", title: "Sragdhara-stotram; or, A hymn to Tara", creator: "Sarvajña Mitra", year: 1908, subjects: ["Buddhist hymns"], language: "san"},
    {id: "buddhistindiaytw00davi", title: "Buddhist India", creator: "Davids, T. W. Rhys", year: 1903, subjects: ["Buddha"], language: "eng"},
    {id: "lightofasiaor00arnouoft", title: "The light of Asia", creator: "Arnold, Edwin, Sir", year: 1884, subjects: ["Buddhism -- Poetry"], language: "eng"},
    {id: "catalogueofprint00asiauoft", title: "Catalogue of printed books and manuscripts in Sanskrit", creator: "Asiatic Society", year: 1903, subjects: ["Buddhism", "Sanskrit literature"], language: "san"},
    {id: "heartofbuddhismb00saunuoft", title: "The heart of Buddhism, being an anthology of Buddhist verse", creator: "Saunders, Kenneth J.", year: 1915, subjects: ["Sanskrit literature"], language: "eng"},
  ],
  torontoHistory: [
    {id: "baburnamainengli01babuuoft", title: "The Babur-nama in English (Memoirs of Babur)", creator: "Babur; Beveridge, Annette Susannah", year: 1922, subjects: ["India -- History"], language: "eng"},
    {id: "travelsinmogulem00bernuoft", title: "Travels in the Mogul Empire, A.D. 1656-1668", creator: "Bernier, François", year: 1916, subjects: ["Mogul Empire", "India -- History"], language: "eng"},
    {id: "tuzukijahangirio00jahauoft", title: "The Tuzuk-i-Jahangiri; or, Memoirs of Jahangir", creator: "Jahangir; Rogers, Alexander", year: 1909, subjects: ["India -- History"], language: "eng"},
    {id: "storiadomogororm01manuuoft", title: "Storia do Mogor; or, Mogul India 1653-1708", creator: "Manucci, Niccolo", year: 1907, subjects: ["India -- History"], language: "eng"},
    {id: "bengalassambehar00playuoft", title: "Bengal and Assam, Behar and Orissa", creator: "Playne, Somerset", year: 1917, subjects: ["India -- Description"], language: "eng"},
    {id: "politicalhistory00raycuoft", title: "Political history of ancient India", creator: "Raychaudhuri, Hem Channdra", year: 1923, subjects: ["India -- History"], language: "eng"},
    {id: "baburnamainengli02babuuoft", title: "The Babur-nama in English Vol 2", creator: "Babur", year: 1922, subjects: ["India -- History"], language: "eng"},
    {id: "oxfordhistoryofi00smituoft", title: "The Oxford history of India", creator: "Smith, Vincent Arthur", year: 1919, subjects: ["India -- History"], language: "eng"},
    {id: "literaryhistoryo00chakuoft", title: "Literary history of ancient India", creator: "Chakraberty, Chandra", year: 1900, subjects: ["India -- Civilization"], language: "eng"},
    {id: "cambridgehistory01rapsuoft", title: "The Cambridge history of India", creator: "Rapson, Edward James", year: 1922, subjects: ["India -- History"], language: "eng"},
    {id: "dictionaryofindi00buckuoft", title: "Dictionary of Indian biography", creator: "Buckland, Charles Edward", year: 1906, subjects: ["India -- Biography"], language: "eng"},
    {id: "historyofmaratha03kincuoft", title: "A history of the Maratha people (Vol. 3)", creator: "Kincaid, Charles Augustus", year: 1918, subjects: ["Marathas", "India -- History"], language: "eng"},
    {id: "latermughals01irviuoft", title: "Later Mughals (Vols. 1-2)", creator: "Irvine, William", year: 1922, subjects: ["India -- History"], language: "eng"},
    {id: "sacredbooksearly01hornuoft", title: "The sacred books and early literature of the East", creator: "Horne, Charles Francis", year: 1917, subjects: ["Oriental literature"], language: "eng"},
    {id: "historyofmaratha02kincuoft", title: "A history of the Maratha people (Vol. 2)", creator: "Kincaid, Charles Augustus", year: 1918, subjects: ["Marathas"], language: "eng"},
    {id: "cunninghamshisto00cunnuoft", title: "Cunningham's history of the Sikhs", creator: "Cunningham, Joseph Davey", year: 1853, subjects: ["Sikhs"], language: "eng"},
    {id: "historyofmaratha01kincuoft", title: "A history of the Maratha people (Vol. 1)", creator: "Kincaid, Charles Augustus", year: 1918, subjects: ["Marathas"], language: "eng"},
  ]
};

// Load existing works
function loadExistingIds() {
  const existing = new Set();
  if (!fs.existsSync('./src/content/works')) return existing;

  const files = fs.readdirSync('./src/content/works');
  files.forEach(file => {
    if (!file.endsWith('.md')) return;
    try {
      const content = fs.readFileSync(path.join('./src/content/works', file), 'utf-8');
      const ids = content.match(/archive\.org\/details\/([a-zA-Z0-9_\-\.]+)/g) || [];
      ids.forEach(url => existing.add(url.replace('archive.org/details/', '')));
      const titleMatch = content.match(/^title:\s*"(.+)"$/m);
      if (titleMatch) existing.add(titleMatch[1].toLowerCase());
    } catch(e) {}
  });
  return existing;
}

// Process all results
const existing = loadExistingIds();
const candidates = [];
const stats = {total: 0, pd: 0, duplicates: 0, recent: 0, unique: 0};

Object.entries(allResults).forEach(([collection, items]) => {
  items.forEach(item => {
    stats.total++;

    // Check if pre-1924 (public domain)
    if (item.year >= 1924) {
      stats.recent++;
      return;
    }
    stats.pd++;

    // Check duplicates
    if (existing.has(item.id) || existing.has(item.title.toLowerCase())) {
      stats.duplicates++;
      return;
    }

    stats.unique++;
    candidates.push({...item, collection});
  });
});

console.log('\\n📊 BATCH PROCESSING RESULTS\\n');
console.log('═'.repeat(60));
console.log(`Total items processed:     ${stats.total}`);
console.log(`Public domain (pre-1924):  ${stats.pd}`);
console.log(`Duplicates found:          ${stats.duplicates}`);
console.log(`Too recent (>= 1924):      ${stats.recent}`);
console.log(`✓ Unique candidates:       ${stats.unique}`);
console.log('═'.repeat(60));
console.log(`\\n📁 Creating ${stats.unique} candidate files...\\n`);

// Write summary
fs.writeFileSync('./batch-processing-summary.json', JSON.stringify({stats, candidates}, null, 2));

console.log(`✅ Summary saved to: batch-processing-summary.json`);
console.log(`\\nReady to create ${candidates.length} candidate files!`);

export { candidates, stats };

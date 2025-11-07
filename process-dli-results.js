#!/usr/bin/env node
import fs from 'fs';

// Filter DLI results for pre-1924 public domain works
const dliResults = [
  // From Sanskrit search
  {id: "in.ernet.dli.2015.31959", title: "A Sanskrit English Dictionary", creator: "Monier-williams, Monier, Sir", year: 1899},
  {id: "dli.bengal.10689.753", title: "Kashidasi Mahabharat", creator: "Chattopadhyaya, Sudeb Chandra", year: 1925}, // Too recent
  {id: "in.ernet.dli.2015.509111", title: "Raghuvansh Mahakavya", creator: "Mahakavi Kalidas", year: 1907},
  {id: "in.ernet.dli.2015.322486", title: "Ashtadhyayi", creator: "Panini", year: 1897},
  {id: "in.ernet.dli.2015.22750", title: "Tantraraja Tantra", creator: "Shastri, Lakshmana", year: 1926}, // Too recent

  // From Vedic search
  {id: "in.gov.ignca.4463", title: "Critical Word Index of the Bhagavadgita", creator: "Divanji, Prahlad C.", year: 1946}, // Too recent
  {id: "in.ernet.dli.2015.263911", title: "Vairagya Shatak", creator: "Haridas Vaidha", year: 1925}, // Too recent
  {id: "in.ernet.dli.2015.31797", title: "Parasara Samhita", creator: "Dutt, Manmatha Nath", year: 1908},
  {id: "in.ernet.dli.2015.96968", title: "History Of Ancient India", creator: "Tripathi, Rama Shankar", year: 1942}, // Too recent
  {id: "in.ernet.dli.2015.104262", title: "Aitareya Brahmana Of The Rigveda", creator: "Martin Haug", year: 1922},
  {id: "in.ernet.dli.2015.39319", title: "A History Of Hindu Chemistry Vol. 1", creator: "Praphulla Chandra Ray", year: 1903},
  {id: "in.ernet.dli.2015.353684", title: "Brihadarnyak Upanishad", creator: "Tattwabhusan, Sitanath", year: 1928}, // Too recent
  {id: "in.ernet.dli.2015.211118", title: "Vedic Index Of Names And Subjects Vol-ii", creator: "Macdonell Arthur Anthony", year: 1925}, // Too recent
  {id: "in.ernet.dli.2015.546644", title: "Anubhoota Chikitsa Sagara", creator: "Prasad, pt.ganga", year: 1908},
  {id: "in.ernet.dli.2015.104263", title: "Aitareya Brahmana Of The Rigveda Vol.1", creator: "Haug, Martin", year: 1922},

  // From Tamil/Bengali/Hindi search
  {id: "in.ernet.dli.2015.342236", title: "Ramcharitmanas", creator: "Goswami Tulsidas", year: 1926}, // Too recent
  {id: "in.ernet.dli.2015.343716", title: "Ramcharit Manas (sundar Kand)", creator: "Shukla, Ramchandra", year: 1932}, // Too recent
  {id: "in.ernet.dli.2015.341179", title: "Samudrik Shastra Ya Bhagya Nirny", creator: "Jain, Chhotelal", year: 1927}, // Too recent
  {id: "in.ernet.dli.2015.540884", title: "Marwadi Bhajan Sagar", creator: "Singhaniya Raghunath Prasad", year: 1930}, // Too recent
  {id: "in.ernet.dli.2015.404532", title: "Babarnama", creator: "Kayasth, Deviprasad", year: 1910},
  {id: "in.ernet.dli.2015.400888", title: "Karmyog", creator: "Swami Vivekanand", year: 1912},
  {id: "in.ernet.dli.2015.446885", title: "Kabir-granthawali", creator: "Shyamsundar Das", year: 1874},
  {id: "in.ernet.dli.2015.280152", title: "Bhojpuri Lokgeet", creator: "Durga Prasad Singh", year: 1944}, // Too recent
  {id: "in.ernet.dli.2015.287125", title: "Schitra Ayurved", creator: "Saahitya Bhavan Limited", year: 1936}, // Too recent
  {id: "in.ernet.dli.2015.338822", title: "Brihat Tantrasar", creator: "Tarkalankar, Chandrakumar", year: 1932}, // Too recent
];

const pd = dliResults.filter(w => w.year && w.year < 1924);
const existing = new Set([
  "in.ernet.dli.2015.31959" // Monier Williams dictionary already exists
]);

const unique = pd.filter(w => !existing.has(w.id));

console.log(`\n📊 DLI RESULTS PROCESSING\n`);
console.log('═'.repeat(60));
console.log(`Total DLI items examined:      ${dliResults.length}`);
console.log(`Pre-1924 (public domain):      ${pd.length}`);
console.log(`Already in collection:         ${existing.size}`);
console.log(`✓ New DLI candidates:          ${unique.length}`);
console.log('═'.repeat(60));

unique.forEach(w => {
  console.log(`\n✓ ${w.title}`);
  console.log(`  Author: ${w.creator}`);
  console.log(`  Year: ${w.year} ✓ PD`);
  console.log(`  ID: ${w.id}`);
});

fs.writeFileSync('./dli-candidates.json', JSON.stringify(unique, null, 2));
console.log(`\n✅ Saved ${unique.length} DLI candidates to dli-candidates.json\n`);

#!/usr/bin/env node
import fs from 'fs';

const puranas = [
  {"id": "3BhagavatamTritiyaSkandam", "title": "3 Tamil Bhagavatam Tritiya Skandam", "creator": "A V Narasimhacharya", "year": 1915},
  {"id": "9BhagavatamNavamaSkandam", "title": "9 Tamil Bhagavatam Navama Skandam", "creator": "A V Narasimhacharya", "year": 1902},
  {"id": "in.gov.ignca.28173", "title": "Der Pretakalpa des Garuda-Purana", "creator": "Garuda; Emil Abegg", "year": 1921},
  {"id": "dli.csl.7901", "title": "Vishnu Purana: A System of Hindu Mythology and Tradition vol-1", "creator": "Wilson, H.H.", "year": 1864},
  {"id": "78BhagavatamSaptamaAshtamaSkandams", "title": "7 & 8 Tamil Bhagavatam Saptama & Ashtama Skandams", "creator": "A V Narasimhacharya", "year": 1917},
  {"id": "dli.ministry.29890", "title": "पुराब्रृत्तशार", "creator": "मुखोपाध्याय, भीदेब", "year": 1888},
  {"id": "lebhgavatapurna00unkngoog", "title": "Le Bhâgavata purâna: ou, Histoire poétique de Krichna", "creator": "Eugène Burnouf, A. Roussel, E. L. Hauvette-Besnault", "year": 1840},
  {"id": "dli.csl.5620", "title": "The vishnu puran: a system of Hindu mythology and tradition vol.2", "creator": "Wilson, H.H.", "year": 1864},
  {"id": "pts_puranatextofdyna_3720-1089", "title": "The Purana text of the dynasties of the Kali age", "creator": "Pargiter, F. E.", "year": 1913},
  {"id": "dli.ministry.28112", "title": "Bibliotheca India: collection of the oriental works", "creator": "Banddopādhyāya, K. M.", "year": 1862},
  {"id": "puranasoraccount00wils", "title": "Puranas, or an account of their contents and nature", "creator": "Wilson, H. H.", "year": 1897},
  {"id": "dassaurapurnamei00jahn", "title": "Das Saurapurnam; ein Kompedium spätindischer Kulturgeschichte", "creator": "Jahn, Wilhelm", "year": 1908},
  {"id": "gleaningsfromin00unkngoog", "title": "Gleanings from Indian classics", "creator": "Dutt, Manmatha Nath", "year": 1893},
  {"id": "dasgupta-s.-ho-ip-vol.-1", "title": "History of Indian Philosophy in 5 Volumes", "creator": "Surendranath Dasgupta", "year": 1922},
  {"id": "10Part2BhagavatamDashamaSkandamUttaraartam", "title": "10 Part 2 Tamil Bhagavatam Dashama Skandam Uttaraartam", "creator": "A V Narasimhacharya", "year": 1920},
  {"id": "dli.csl.8168", "title": "A prose english translation of vishnupuranam", "creator": null, "year": 1912},
  {"id": "56BhagavatamPanchamaShashtaSkandams", "title": "5 & 6 Tamil Bhagavatam Panchama & Shashta Skandams", "creator": "A V Narasimhacharya", "year": 1916},
  {"id": "4BhagavatamChadurtaSkandam", "title": "4 Tamil Bhagavatam Chadurta Skandam", "creator": "A V Narasimhacharya", "year": 1916},
  {"id": "dli.csl.6409", "title": "The Vishnu purana a system of Hindu mythology and tradition", "creator": "Wilson, H.H.", "year": 1864},
  {"id": "10Part1BhagavatamDashamaSkandamPoorvaBa", "title": "10 Part 1 Bhagavatam Dashama Skandam Poorva Ba", "creator": "A V Narasimhacharya", "year": 1919},
  {"id": "1112BhagavatamEkaadashaDwadashaSkandams", "title": "11 & 12 Tamil Bhagavatam Ekadasha & Dwadasha Skandams", "creator": "A V Narasimhacharya", "year": 1921},
  {"id": "ThePuranasInTheLightOfModernSciecne", "title": "The Puranas In The Light Of Modern Sciecne", "creator": "Narayanaswami Aiyyar, K", "year": 1914},
  {"id": "dli.csl.6201", "title": "The Vishnu Purana: A System of hindu mythology and tradition", "creator": "Wilson, H.H.", "year": 1868},
  {"id": "dli.csl.5621", "title": "The vishnu puran: a system of Hindu mythology and tradition vol.5", "creator": "Wilson, H.H.", "year": 1864},
  {"id": "the-vishnu-purana-complete-6-books-set-horace-hayman-wilson", "title": "The Vishnu Purana (Complete 6 Books Set)", "creator": "H H Wilson", "year": 1887},
  {"id": "08ghrthadpik00dhan", "title": "Ghrthadpik", "creator": "Dhana-Pati Suri, Jagannathasudhi, Ratnagopala Bhatta", "year": 1908}
];

const ayurveda = [
  {"id": "susruta1889", "title": "Susrutasamhita (Calcutta 1889)", "creator": "", "year": 1889},
  {"id": "ACatalogueOfPalm-leafAndSelectedPaperMss.BelongingToTheDurbar_573", "title": "A Catalogue of Palm-Leaf and Selected Paper MSS. Belonging to the Durbar Library, Nepal", "creator": "Hara Prasad Shastri", "year": 1915},
  {"id": "VrndaMadhava1894", "title": "Siddhayoga or Vrnda Madhava (1894)", "creator": "Vrnda", "year": 1894},
  {"id": "BSG_8GSUP1082", "title": "Notes sur l'Inde : serpents, hygiène, médecine, aperçus économiques sur l'Inde française", "creator": "Charles-Louis Valentino", "year": 1906},
  {"id": "wg1219", "title": "1914 -Ayurvedaprakasha Of Madhava", "creator": "Vidya Jadavji Tricumji Acharya", "year": 1914},
  {"id": "AyurvedicSystemOfMedicineVol2", "title": "Ayurvedic System Of Medicine", "creator": "Kaviraj Nagendra Nath Sen Gupta", "year": 1901},
  {"id": "ArogyaChinthamani", "title": "Arogya Chinthamani", "creator": "Vallathol Narayana Menon", "year": 1904},
  {"id": "20220917_20220917_0723", "title": "Tib Rahimi", "creator": "", "year": 1888},
  {"id": "UsmanReport", "title": "Usman Report on the Indigenous Systems of Medicine (Madras 1923)", "creator": "Muhammad Usman", "year": 1923},
  {"id": "20220918_20220918_1808", "title": "Sahifah Mizan al-Tib", "creator": "", "year": 1880},
  {"id": "usman-vol-2_202201", "title": "Usman Vol 2 Written And Oral Evidence", "creator": "Muhammad Usman", "year": 1923},
  {"id": "wg174", "title": "1877 -Materia Medica Of The Hindus", "creator": "Udoy Chand Dutt", "year": 1877},
  {"id": "ACatalogueOfPalm-leafAndSelectedPaperMss.BelongingToTheDurbar", "title": "A Catalogue of Palm-Leaf and Selected Paper MSS. Belonging to the Durbar Library, Nepal", "creator": "Hara Prasad Shastri", "year": 1905},
  {"id": "20220917_20220917_0732", "title": "Ilm wa Amal Tib", "creator": "", "year": 1915},
  {"id": "usman-vol-2", "title": "Usman Vol 2 Written And Oral Evidence", "creator": "Muhammad Usman", "year": 1923},
  {"id": "20220917_20220917_0703", "title": "Rafiq Bimaaran", "creator": "", "year": 1910},
  {"id": "TricumjiAcharyaRasayanKhanda1913", "title": "Rasaratnakara Rasayanakhanda 1913", "creator": "Yadasharma T. Acharya", "year": 1913},
  {"id": "dli.ernet.199812", "title": "Dravya Guna", "creator": "Datta, Chakrandi Pandi; Jeebananda Vidyasagar Bhattacharya", "year": 1897},
  {"id": "Astangasangraha1913-1924", "title": "Astangasangraha", "creator": "T. Rudraparashava", "year": 1913},
  {"id": "Caraka-sahit", "title": "Caraka-samhita", "creator": "Caraka", "year": 1897},
  {"id": "wg163", "title": "1862 -Madhavnidan", "creator": "Krishnashashtri Bhatvadekar", "year": 1862},
  {"id": "hindumedicine020132mbp", "title": "HINDU MEDICINE", "creator": "M.K. Ganapathi Sen", "year": 1916},
  {"id": "hindumedicine020120mbp", "title": "Hindu Medicine", "creator": "M.K. Ganapathi Sen", "year": 1916},
  {"id": "Sindooramanjari", "title": "Sindooramanjari", "creator": "PTN Vasudevan Mooss", "year": 1915},
  {"id": "HinduMedicine", "title": "Hindu Medicine", "creator": "M.K. Ganapathi Sen", "year": 1916},
  {"id": "RasaPradeepika", "title": "Rasa Pradeepika", "creator": "D. Gopala Chartulu", "year": 1916},
  {"id": "SusrutaMuralidhara1895", "title": "Susrutasamhita", "creator": "Muralidhara Sharman", "year": 1895},
  {"id": "ayurvedaorhindus00unse", "title": "Ayurveda or The Hindu System Of Medical Science", "creator": "Society for the Resucitation of Indian Literature", "year": 1899},
  {"id": "dli.ernet.287229", "title": "Agad Tantra", "creator": "Sharmaa Thaakuradatt Vaidya", "year": 1923},
  {"id": "dli.ernet.287250", "title": "Bhaarat Kashtanivaarak Mahishadhi", "creator": "Sharmaa Raamarakshhapaal", "year": 1911},
  {"id": "dli.ernet.287111", "title": "Roga Parichay", "creator": "Hari Narayana Vaidya", "year": 1919},
  {"id": "chikitsa-chandrodaya-part-1-by-babu-haridas-vaidya", "title": "Chikitsa Chandrodaya Part 1", "creator": "Babu Haridas Vaidya Ji", "year": 1922},
  {"id": "dakshinabharatha019162mbp", "title": "Dakshina Bharathamu-Ayurveda Pracharamu", "creator": "D. Gopalacharyulu", "year": 1917}
];

const allResults = [
  ...puranas.map(w => ({...w, subject: 'Puranas'})),
  ...ayurveda.map(w => ({...w, subject: 'Ayurveda'}))
];

const pre1924 = allResults.filter(w => w.year && w.year < 1924);
const uniqueById = {};
pre1924.forEach(work => {
  if (!uniqueById[work.id]) uniqueById[work.id] = work;
});
const uniqueWorks = Object.values(uniqueById);

console.log('\n🔥 WAVE 2 SUBJECT SEARCH RESULTS (PART 2/3)\n');
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
  console.log(`${subject.padEnd(25)} ${bySubject[subject].length} works`);
});

console.log('\n✅ Part 2 complete!\n');

fs.writeFileSync('./wave2-subject-results-part2.json', JSON.stringify({allResults: uniqueWorks}, null, 2));
console.log('Saved to wave2-subject-results-part2.json\n');

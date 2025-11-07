#!/usr/bin/env node

// Wave 7: Comprehensive Literature & Regional Languages
// Manually extracted from WebFetch results

const allResults = [];

// 1. Sanskrit Literature (selecting 30 key works from 50)
const sanskritWorks = [
  { id: 'in.gov.ignca.27212', title: 'Manava-Dharma Sastra vol.1', creator: 'Mandlik, Vishvanath Narayan', year: '1807' },
  { id: 'in.gov.ignca.27213', title: 'Manava-Dharma Sastra vol.2', creator: 'Mandlik, Vishvanath Narayan', year: '1808' },
  { id: 'ueberdiespracheu01schl', title: 'Ueber die Sprache und Weisheit der Indier', creator: 'Schlegel, Friedrich von', year: '1808' },
  { id: 'dli.ministry.04241', title: 'Mega Duta or cloud messenger: a poem in Sanskrit', creator: 'Calidasa; Wilson, Horace Hayman', year: '1813' },
  { id: 'viewofhistorylit02ward', title: 'A view of the history, literature, and religion of the Hindoos', creator: 'Ward, William', year: '1815' },
  { id: 'dasarupakam00dhanuoft', title: 'Dasarupakam', creator: 'Dhananjaya; Dhanika; Paraba, Kasinatha Panduranga', year: '1819' },
  { id: 'wilsonstheatreof00wilsuoft', title: 'Wilson\'s theatre of the Hindus', creator: 'Wilson, H. H.', year: '1826' },
  { id: 'selectspecimenso01wils', title: 'Select specimens of the theatre of the Hindus Vol. 1', creator: 'Wilson, H. H.', year: '1827' },
  { id: 'selectspecimenso02wils', title: 'Select specimens of the theatre of the Hindus Vol. 2', creator: 'Wilson, H. H.', year: '1827' },
  { id: 'selectspecimenso03wils', title: 'Select specimens of the theatre of the Hindus Vol. 3', creator: 'Wilson, H. H.', year: '1827' },
  { id: 'monumenslitterai00lang', title: 'Monumens littéraires de l\'Inde', creator: 'Langlois, Simon Alexandre', year: '1827' },
  { id: 'chefsdoeuvreduth01wilsuoft', title: 'Chefs-d\'oeuvre du théâtre Indien Vol. 1', creator: 'Wilson, H. H.; Langlois, Simon Alexandre', year: '1828' },
  { id: 'chefsdoeuvreduth02wilsuoft', title: 'Chefs-d\'oeuvre du théâtre Indien Vol. 2', creator: 'Wilson, H. H.; Langlois, Simon Alexandre', year: '1828' },
  { id: 'researchesinton00kenngoog', title: 'Researches into the nature and affinity of ancient and Hindu mythology', creator: 'Kennedy, Vans', year: '1831' },
  { id: 'historicalsketch00adeliala', title: 'An historical sketch of Sanscrit literature', creator: 'Adelung, Friedrich von; Talboys, D. A.', year: '1832' },
  { id: 'b29339972', title: 'Bibliotheca sanscrita', creator: 'Adelung, Friedrich von', year: '1837' },
  { id: 'anthologiasanscr00lass_0', title: 'Anthologia sanscritica', creator: 'Lassen, Christian', year: '1838' },
  { id: 'catalogueofsansk01brituoft', title: 'Catalogue of Sanskrit and Pali books in the British museum', creator: 'British Museum; Haas, Ernst Anton Max; Bendall, Cecil; Barnett, Lionel D.', year: '1839' },
  { id: 'dli.ministry.00007', title: 'अभिज्ञानशाकुन्तलम्', creator: 'Kālidāsa', year: '1846' },
  { id: 'bibliothecaesans00gild', title: 'Bibliothecae Sanskritae', creator: 'Gildemeister, Johann', year: '1847' },
  { id: 'bibliothecaindi01benggoog', title: 'Bibliotheca Indica Vol. 1', creator: 'Royal Asiatic Society of Bengal', year: '1848' },
  { id: 'bibliothecaindi00indigoog', title: 'Bibliotheca Indica Vol. 2', creator: 'Royal Asiatic Society of Bengal', year: '1848' },
  { id: 'aestheticandmis00schlgoog', title: 'The aesthetic and miscellaneous works of Frederick von Schlegel', creator: 'Schlegel, Friedrich von', year: '1849' },
  { id: 'dli.ministry.29346', title: 'मेघदूतम्', creator: 'Kālidāsa; Sūrī, Mallinatha', year: '1850' }
];

// 2. Tamil Literature (selecting 25 key works from 50)
const tamilWorks = [
  { id: 'malabarenglishdi00fabr', title: 'A Malabar and English dictionary', creator: 'Fabricius, Johann Philipp', year: '1809' },
  { id: 'dli.ministry.05814', title: 'Rudiments of Tamul grammar', creator: 'Anderson, Robert', year: '1821' },
  { id: 'rudimentsoftamul00ande', title: 'Rudiments of Tamūl grammar', creator: 'Anderson, Robert', year: '1821' },
  { id: 'grammarofhighdia00besc', title: 'A grammar of the high dialect of the Tamil language', creator: 'Beschi, Costantino Giuseppe', year: '1822' },
  { id: 'b28747677', title: 'The adventures of the Gooroo Paramartan', creator: 'Beschi, Costantino; Babington, B. G.', year: '1822' },
  { id: 'dli.csl.7794', title: 'The life of Major-General Sir Thomas Munro', creator: 'Gleig, G.R.', year: '1830' },
  { id: 'rottler-a-dictionary-of-the-tamil-and-english-languages-1834-41-volumes-1-4', title: 'A dictionary of the Tamil and English languages', creator: 'Rottler, J. P.', year: '1834' },
  { id: 'grammaroftamilla00rhen', title: 'A grammar of the Tamil language', creator: 'Rhenius, C. T. E.', year: '1836' },
  { id: 'agrammartamilla02rhengoog', title: 'A grammar of the Tamil language Vol. 2', creator: 'Rhenius, Charles Theophilus Ewald', year: '1836' },
  { id: 'letterstofromgov00brow', title: 'Letters to and from the Government of Madras', creator: 'Brown, Francis Carnac', year: '1838' },
  { id: 'dli.ministry.29121', title: 'Kantar purān̄a vācakam', creator: 'Kacciyappa Kurukkalan̄', year: '1841' }
];

// 3. Bengali Literature (selecting 25 key works from 50)
const bengaliWorks = [
  { id: 'DialoguesIntendedToFacilitateTheAcq', title: 'Dialogues, Intended to Facilitate the Acquiring of the Bengali Language', creator: 'William Carey', year: '1801' },
  { id: 'newtestamentinbe00care', title: 'New Testament in Bengali', creator: 'Carey, William', year: '1801' },
  { id: 'dli.ministry.26680', title: 'Pustaka', creator: 'Basū, Rāṣa Rāya', year: '1802' },
  { id: 'dli.ministry.25735', title: 'Fables of Hitopadeśa', creator: 'Śarmāṇā, Goloka Nāth', year: '1807' },
  { id: 'dli.ministry.27989', title: 'A Bengali grammar', creator: 'Yates, R.W.; Wenger, J', year: '1819' },
  { id: 'haughton-rudiments-of-bengali-grammar', title: 'Rudiments of Bengali Grammar', creator: 'Haughton, Graves Champney', year: '1821' },
  { id: 'dli.ministry.25372', title: 'Bengali selections with translations and a vocabulary', creator: 'Haughton, Graves Chamney', year: '1822' },
  { id: 'dli.ministry.28673', title: 'A Glossary, bengali and english', creator: 'Haughton, Graves Chamney; Mrityunjaya', year: '1825' },
  { id: 'dli.ministry.25293', title: 'The Bahoodurson or various spectacles', creator: 'Hāladāra, Nīlaratna', year: '1826' },
  { id: 'in.ernet.dli.2015.31090', title: 'A Dictionary Of The Bengali Language', creator: 'Carey, W.', year: '1826' },
  { id: 'adictionarybeng00mortgoog', title: 'A DICTIONARY OF THE BENGALI LANGUAGE', creator: 'Rev. William Morton', year: '1828' },
  { id: 'dli.ministry.25591', title: 'A dictionary of the Bengali language with Bengali synonyms and an English interpretation', creator: 'Morton, William', year: '1828' },
  { id: 'hitopadeshacolle00unse', title: 'Hitopadesha : a collection of fables and tales in Sanscrit', creator: 'Various', year: '1830' },
  { id: 'in.ernet.dli.2015.83672', title: 'Dictionary Bengali And Sanskrit Explained In English', creator: 'Sir Graves C Haughton', year: '1833' },
  { id: 'haughton-a-dictionary-bengali-and-sanskrit-1833', title: 'A Dictionary, Bengali and Sanskrit: explained in English', creator: 'Graves Champney Haughton', year: '1833' },
  { id: 'dli.ministry.26993', title: 'A selection of morals from the best English and Bengali', creator: 'Mitter, Gopal Lol', year: '1838' },
  { id: 'dharmapustakeran00yate', title: 'Dharmapustaker antabhág', creator: 'Yates, William', year: '1839' },
  { id: 'oldtestamentinbe00yate', title: 'The Old Testament in the Bengali language', creator: 'Yates, William', year: '1845' }
];

// 4. Hinduism & Hindu Philosophy (selecting 30 key works from 50)
const hinduismWorks = [
  { id: 'dli.ministry.12006', title: 'Dissertation on the oriental trinities : Indian antiquities', creator: 'Various', year: '1801' },
  { id: 'in.gov.ignca.35409', title: 'Hindu pantheon', creator: 'Moor, Edward', year: '1810' },
  { id: 'wardshidoos00sethuoft', title: 'A view of the history, literature, and religion of the Hindoos', creator: 'Ward, William', year: '1815' },
  { id: 'dli.ministry.24070', title: 'Translation of an abridgment of the Vedant', creator: 'Vaid, Uter', year: '1816' },
  { id: 'dli.csl.7212', title: 'Description of the character, manner, and customs of the people of India', creator: 'Dubois, J.A.', year: '1817' },
  { id: 'defenceofhindoot00ramm', title: 'A defence of Hindoo theism', creator: 'Rammohun Roy, Raja; Sankara Sastri', year: '1817' },
  { id: 'StateOfChristianityInIndia', title: 'Letters on the state of Christianity in India', creator: 'Dubois, J. A.', year: '1823' },
  { id: 'viewofallreligio00robb', title: 'A view of all religions and the religious ceremonies of all nations', creator: 'Robbins, Thomas; Ward, William', year: '1824' },
  { id: 'moeursinstituti00dubogoog', title: 'Moeurs, institutions et cérémonies des peuples de l\'Inde Vol. 1', creator: 'Dubois, J. A.', year: '1825' },
  { id: 'moeursinstituti01dubogoog', title: 'Moeurs, institutions et cérémonies des peuples de l\'Inde Vol. 2', creator: 'Dubois, J. A.', year: '1825' },
  { id: 'history-of-kashmir-by-horace-hayman-wilson-1826', title: 'Hindu History of Kashmir', creator: 'Asiatic Society (Calcutta, India)', year: '1825' },
  { id: 'dli.csl.6868', title: 'Hindu Law : principle with reference to such portion of it', creator: 'Strange, Thomas', year: '1830' },
  { id: 'anexposurehindu00dandgoog', title: 'An exposure of the Hindu religion', creator: 'Wilson, John; Mora Bhatta Dandekara', year: '1832' },
  { id: 'b22011699', title: 'The mythology of the Hindus', creator: 'Coleman, Charles', year: '1832' },
  { id: 'dli.ministry.17655', title: 'The mythology of the Hindus : notice of various mountain and Island tribes', creator: 'Coleman, Charles', year: '1832' },
  { id: 'secondexposureof00wils', title: 'A second exposure of the Hindu religion', creator: 'Wilson, John', year: '1834' },
  { id: 'orientalillustr01robegoog', title: 'Oriental illustrations of the sacred scriptures', creator: 'Roberts, Joseph', year: '1835' },
  { id: 'dli.ministry.22344', title: 'The Sankya Karika : memorial verses on the sankhya philosophy', creator: 'Krishna, Iswara; Colebrooke, Henry Thomas; Wilson, Horace Hayman', year: '1837' },
  { id: 'britishindiaini01campgoog', title: 'British India in its relation to the decline of Hindooism', creator: 'Campbell, William', year: '1839' },
  { id: 'indiaandindiami02duffgoog', title: 'India, and India missions, including sketches of the gigantic system of Hinduism', creator: 'Duff, Alexander', year: '1839' }
];

// 5. India History & Antiquities (selecting 30 key works from 50)
const historyWorks = [
  { id: 'dli.csl.8447', title: 'An Account of Assam', creator: 'Wade, John Peter', year: '1800' },
  { id: 'in.gov.ignca.21439', title: 'Indian antiquities vol.V', creator: 'Maurice, Thomas', year: '1800' },
  { id: 'in.gov.ignca.21437', title: 'Indian antiquities vol.III', creator: 'Maurice, Thomas', year: '1800' },
  { id: 'in.gov.ignca.14111', title: 'Ayeen Akbery vol.1', creator: 'Gladwin, Francis', year: '1800' },
  { id: 'in.gov.ignca.21441', title: 'Indian antiquities vol.VI', creator: 'Maurice, Thomas', year: '1800' },
  { id: 'in.gov.ignca.21440', title: 'Indian antiquities vol.IV', creator: 'Maurice, Thomas', year: '1800' },
  { id: 'historyofindiafr00pear', title: 'History of India from the earliest times to 1880', creator: 'Pearce, William C.', year: '1800' },
  { id: 'in.gov.ignca.21435', title: 'Indian antiquities vol.I', creator: 'Maurice, Thomas', year: '1800' },
  { id: 'in.gov.ignca.17084', title: 'View of the origin and conduct of the war with Tipoo Sultan', creator: 'Beatson, Alexander', year: '1800' },
  { id: 'in.gov.ignca.21436', title: 'Indian antiquities vol.II', creator: 'Maurice, Thomas', year: '1800' },
  { id: 'in.gov.ignca.14112', title: 'Ayeen Akbery vol.2', creator: 'Gladwin, Francis', year: '1800' },
  { id: 'in.gov.ignca.21438', title: 'Indian antiquities vol.IV', creator: 'Maurice, Thomas', year: '1800' },
  { id: 'historicaldisqui00robeuoft', title: 'An historical disquisition concerning the knowledge which the ancients had of India', creator: 'Robertson, William', year: '1802' },
  { id: 'paperspresentedt03east', title: 'Papers presented to the House of Commons regarding the affairs of the Carnatic Vol. 3', creator: 'East India Company, Great Britain Parliament', year: '1802' },
  { id: 'modernhistoryofh00maur', title: 'The modern history of Hindostan', creator: 'Maurice, Thomas', year: '1802' },
  { id: 'dli.csl.8483', title: 'A history of the military transactions of the British nation in Indostan', creator: 'Orme, Robert', year: '1803' },
  { id: 'historyofmilitar21orme', title: 'A history of the military transactions of the British nation in Indostan from the year 1745 Vol. 1', creator: 'Orme, Robert', year: '1803' },
  { id: 'dli.ministry.25976', title: 'Indian recreations: consisting chiefly of strictures on the domestic and Rural Economy', creator: 'Tennant, William', year: '1803' },
  { id: 'historyhindosta04dowgoog', title: 'The history of Hindostan', creator: 'Firishtah, Muhammad Kāsim ibn Hindu Shāh', year: '1803' },
  { id: 'thoughtsoneffect00tennuoft', title: 'Thoughts on the effects of the British government on the state of India', creator: 'Tennant, William', year: '1807' },
  { id: 'in.gov.ignca.14167', title: 'History of the life and reign of Alexander the great vol.1', creator: 'Rufus, Quintus Curtius', year: '1809' },
  { id: 'supplementtomod00maurgoog', title: 'Supplement to The modern history of India', creator: 'Maurice, Thomas', year: '1810' },
  { id: 'historicalsketch02wilk', title: 'Historical sketches of the south of India Vol. 2', creator: 'Wilks, Mark', year: '1810' },
  { id: 'annalshonorable02brucgoog', title: 'Annals of the Honorable East-India Company Vol. 2', creator: 'Bruce, John', year: '1810' },
  { id: 'historicalsketch01wilk', title: 'Historical sketches of the south of India Vol. 1', creator: 'Wilks, Mark', year: '1810' },
  { id: 'historicalsketch03wilk', title: 'Historical sketches of the south of India Vol. 3', creator: 'Wilks, Mark', year: '1810' },
  { id: 'dli.csl.6907', title: 'A sketch of the State of British India', creator: 'Bryce, James', year: '1810' },
  { id: 'annalshonorable00brucgoog', title: 'Annals of the Honorable East-India Company Vol. 1', creator: 'Bruce, John', year: '1810' }
];

// 6. Mahabharata, Ramayana, Purana (selecting key works)
const epicWorks = [
  { id: 'dli.csl.3791', title: 'The Mahabharata of Krishna-Dwaipayana Vyasa', creator: 'Pratap Chandra Roy', year: '1802' },
  { id: 'in.ernet.dli.2015.545973', title: 'Bhavishya Purana Bhasa Bhag-4', creator: 'Munsi Naval Kishor', year: '1806' },
  { id: 'mahabharata-book-three-2', title: 'Mahabharata Book Three Part 2', creator: 'Kisari Mohan Ganguli', year: '1833' },
  { id: 'dli.ministry.24500', title: 'The Vishnu Purana: a system of Hindu mythology', creator: 'Wilson, H.H.', year: '1840' }
];

// 7. Travel Narratives (selecting 15 key works)
const travelWorks = [
  { id: 'voyagestravelsin01moun', title: 'Voyages and travels in India, Ceylon, the Red Sea, Abyssinia, and Egypt Vol. 1', creator: 'Mountnorris, George Annesley, Earl of', year: '1809' },
  { id: 'voyagestravelsin02moun', title: 'Voyages and travels in India, Ceylon, the Red Sea, Abyssinia, and Egypt Vol. 2', creator: 'Mountnorris, George Annesley, Earl of', year: '1809' },
  { id: 'voyagestravelsin03moun', title: 'Voyages and travels in India, Ceylon, the Red Sea, Abyssinia, and Egypt Vol. 3', creator: 'Mountnorris, George Annesley, Earl of', year: '1809' },
  { id: 'in.ernet.dli.2015.97448', title: 'Travels In India Himalayan Provinces Vol. 2', creator: 'Trebeck, George', year: '1841' },
  { id: 'travelsinindiai00orligoog', title: 'Travels in India: Including Sinde and the Punhab', creator: 'Leopold von Orlich', year: '1845' }
];

// 8. Vedanta, Yoga, Bhagavad Gita (selecting 25 key works from 35)
const vedantaWorks = [
  { id: 'sarbabedntasiddh00akar', title: 'Sarbabednta-siddhntasra-sangraha', creator: 'Akarcrya, Pramathantha Tarkabhaa', year: '1811' },
  { id: 'seconddefenceofm00ramm', title: 'A second defence of the monotheistic system of the Veda', creator: 'Rammohun Roy', year: '1817' },
  { id: 'expositionofveda00haugrich', title: 'The exposition of the Vedanta philosophy', creator: 'Graves Champney Haughton', year: '1835' },
  { id: 'vedantaundbuddhi00schu', title: 'Vedanta und Buddhismus als Fermente für eine künftige Regeneration', creator: 'Theodor Schultze', year: '1844' },
  { id: 'atreatiseonyoga01paulgoog', title: 'A Treatise on the Yoga Philosophy', creator: 'N. C. Paul', year: '1851' },
  { id: 'vedantimsbrahmis00mull', title: 'Vedantims, Brahmism, and Christianity, examined and compared', creator: 'Joseph Mullens', year: '1852' },
  { id: 'kaivaljanavanita00tant', title: 'Kaivaljanavanita: a Vedanta poem', creator: 'Tantavaraya Cuvamikal, Karl Graul', year: '1855' },
  { id: 'atmabodh_202311', title: 'Atmabodh', creator: 'Narayan Chattaraj Gunanidhi', year: '1858' },
  { id: 'elementsofvedant00cesa', title: 'Elements of the Vedantic philosophy', creator: 'Cesattiri Civanadar, Thomas Foulkes', year: '1860' },
  { id: 'chhndogyaupanish00akar', title: 'The Chhandogya-Upanishad of the Sama Veda', creator: 'Shankaracharya, R. Rajendralala Mitra', year: '1862' },
  { id: 'b3009544x_0001', title: 'The aphorisms of the Vedanta', creator: 'Badarayana, Shankaracharya, Govinda Ananda', year: '1863' },
  { id: 'brahmasutramnama01bdar', title: 'Brahmasutram nama Vedantadaranam', creator: 'Badarayana, Shankaracharya, Govindananda', year: '1863' },
  { id: 'Vedanta.Panchadasi.with.Kalyana.Piyusa.Vyakhya', title: 'Vedanta Panchadasi', creator: 'Vidyaranya Swami', year: '1864' },
  { id: 'hahayogapradpik00svtm', title: 'Hahayogapradpik', creator: 'Svatmarma, Brahmananda, Shridhara', year: '1867' },
  { id: 'maha-bak.-das-grosse-wort-der-geheimlehre-der-brahmanen', title: 'Maha-Bak: Das grosse Wort der Geheimlehre der Brahmanen', creator: 'Max Carl von Krempelhuber', year: '1869' },
  { id: 'bijdragetotdeken00brui', title: 'Bijdrage tot de kennis van den Vedanta', creator: 'Albert Bruining', year: '1871' },
  { id: 'b30094422', title: 'Prabodhacandrodayanadakam', creator: 'Krishnamishta, Maheshchandra', year: '1874' },
  { id: 'b21782477', title: 'Oriental religions and their relation to universal religion: India', creator: 'Samuel Johnson', year: '1879' },
  { id: 'amanualhindupan01yoggoog', title: 'A manual of Hindu pantheism: The Vedantasara', creator: 'Sadananda Yogindra, George Adolphus Jacob', year: '1881' },
  { id: 'atreatiseonyoga00paulgoog', title: 'A Treatise on the Yoga Philosophy (2nd ed)', creator: 'N. C. Paul', year: '1882' },
  { id: 'dassystemdesved01agoog', title: 'Das system des Vedanta nach den Brahma-sutras', creator: 'Paul Deussen, Badarayana, Shankaracharya', year: '1883' },
  { id: 'mahabharata-ganguli-audiobook', title: 'The Mahabharata, Unabridged ebook- Audiobook', creator: 'Krishna-Dwaipayana Vyasa, Kisari Mohan Ganguli', year: '1883' },
  { id: 'patanjal-darshan-kalibar-vedantabagish', title: 'Patanjal Darshan', creator: 'Kalibar Vedantabagish', year: '1884' },
  { id: 'dli.csl.5569', title: 'Raja yoga or the practical metaphysics of the Vedanta', creator: 'Manilal Nabhubhai Dvivedi', year: '1885' },
  { id: 'the-yoga-philosophy', title: 'The Yoga Philosophy', creator: 'Tookaram Tatya', year: '1885' }
];

// Combine all works
allResults.push(...sanskritWorks);
allResults.push(...tamilWorks);
allResults.push(...bengaliWorks);
allResults.push(...hinduismWorks);
allResults.push(...historyWorks);
allResults.push(...epicWorks);
allResults.push(...travelWorks);
allResults.push(...vedantaWorks);

// Filter for pre-1924 and parse years
const filtered = allResults
  .map(work => ({
    ...work,
    year: parseInt(work.year) || 0
  }))
  .filter(work => work.year > 0 && work.year <= 1923);

console.log(`\n📊 Wave 7 Processing Summary:`);
console.log(`Total works extracted: ${allResults.length}`);
console.log(`Pre-1924 works: ${filtered.length}\n`);

console.log(`Breakdown by category:`);
console.log(`  Sanskrit literature:       ${sanskritWorks.length}`);
console.log(`  Tamil literature:          ${tamilWorks.length}`);
console.log(`  Bengali literature:        ${bengaliWorks.length}`);
console.log(`  Hinduism & philosophy:     ${hinduismWorks.length}`);
console.log(`  India history:             ${historyWorks.length}`);
console.log(`  Epics (Mahabharata etc):   ${epicWorks.length}`);
console.log(`  Travel narratives:         ${travelWorks.length}`);
console.log(`  Vedanta/Yoga/Gita:         ${vedantaWorks.length}`);

// Save results
import fs from 'fs';
const output = {
  wave: 7,
  description: 'Comprehensive Literature & Regional Languages - Sanskrit, Tamil, Bengali, Philosophy, History, Epics, Travel',
  totalWorks: filtered.length,
  allResults: filtered
};

fs.writeFileSync('./wave7-literature-results.json', JSON.stringify(output, null, 2));
console.log(`\n✅ Saved ${filtered.length} works to wave7-literature-results.json\n`);

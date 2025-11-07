#!/usr/bin/env node

// Wave 11: Final Comprehensive Coverage - Regional Languages, Fiction, Reform, Architecture
// Curated selection of ~200 works from ~284 fetched

const allResults = [];

// 1. Regional Languages: Assamese, Kashmiri, Sindhi (30 key works from 47)
const regionalLanguages = [
  { id: 'lal_ded_by_anand_koul', title: 'Life Sketch and Sayings of Lal Ded', creator: 'Pandit Anand Koul', year: '1921' },
  { id: 'Akhlaq-e-muhammadisindhiByHakimFatehMuhammadSewhani', title: 'Akhlaq-e-Muhammadi (Sindhi)', creator: 'Hakim Fateh Muhammad Sewhani', year: '1916' },
  { id: 'someassamesepro01gurdgoog', title: 'Some Assamese proverbs', creator: 'P. R. T. Gurdon', year: '1896' },
  { id: 'adictionaryinas00brongoog', title: 'A dictionary in Assamese and English', creator: 'Miles Bronson', year: '1867' },
  { id: 'aglimpseassam01wardgoog', title: 'A Glimpse of Assam', creator: 'Susan R. Ward', year: '1884' },
  { id: 'shirt-a-sindhi-english-dictionary', title: 'A Sindhi-English Dictionary', creator: 'George Shirt', year: '1879' },
  { id: 'talesofoldsindby00kinc', title: 'Tales of old Sind', creator: 'C. A. Kincaid', year: '1922' },
  { id: 'trumpp-grammar-of-the-sindhi-language-1872', title: 'Grammar of the Sindhi Language', creator: 'Ernst Trumpp', year: '1872' },
  { id: 'kashmiri-1821-new-testament', title: 'Kashmiri (1821) New Testament', creator: 'The Mission Press', year: '1821' },
  { id: 'kamiraabdamr00isvauoft', title: 'The Kaçmiraçabdamrta; a Kaçmiri grammar', creator: 'Isvara Kaula, George Abraham Grierson', year: '1898' },
  { id: 'proverbsassam00gurdrich', title: 'Some Assamese proverbs', creator: 'P. R. T. Gurdon', year: '1903' },
  { id: 'kashmiri_riddles_knowles', title: 'Kashmiri Riddles', creator: 'J. Hinton Knowles', year: '1887' },
  { id: 'dictionaryofkash00knowrich', title: 'A dictionary of Kashmiri proverbs & sayings', creator: 'James Hinton Knowles', year: '1885' },
  { id: 'dli.csl.7664', title: 'Sindh, and the races that inhabit the valley of the Indus', creator: 'Richard F. Burton', year: '1851' },
  { id: 'saswi-punhu-english-translation', title: 'Saswi and Punhu: A Poem in the Original Sindi', creator: 'F.J.G', year: '1863' },
  { id: 'dictionaryinassa00bronrich', title: 'A dictionary in Assamese and English', creator: 'Miles Bronson', year: '1867' },
  { id: 'briefvocabularyi00ward', title: 'Brief vocabulary in English and Assamese', creator: 'Mrs. S. R. Ward', year: '1864' },
  { id: 'cataloguesofhind00brituoft', title: 'Catalogues of the Hindi, Panjabi, Sindhi, and Pushtu printed books', creator: 'British Museum, James Fuller Blumhardt', year: '1893' },
  { id: 'dli.csl.5156', title: "Hati m'cs tales Kashmiri stories and songs", creator: 'Aurel Stein', year: '1923' },
  { id: 'gulzrikashmr00rainuoft', title: 'Gulzr-i Kashmr', creator: 'Bishan Naryan Raina', year: '1873' },
  { id: 'TarikhEKashmirUrdu', title: 'Tarikh E Kashmir Urdu', creator: 'Pindat Gopal Khasta', year: '1877' },
  { id: 'rosettaproject_kas_gen-1', title: 'The Old Testament in the Kashmiri Language, Vol. 1', creator: 'James Hinton Knowles', year: '1899' },
  { id: 'clauson-and-macdonell-catalogue-of-the-stein-collection-of-sanskrit-mss.-from-ka', title: 'Catalogue of the Stein Collection of Sanskrit Mss. from Kashmir', creator: 'Gerard L. M. Clauson, A. A. Macdonell', year: '1912' },
  { id: 'buehler-detailed-report-sanskrit-mss', title: 'Detailed Report of a Tour in Search of Sanskrit Mss.', creator: 'G. Bühler', year: '1877' },
  { id: 'stein-1923-in-memoriam-govind-kaul', title: 'In Memoriam Pandit Govind Kaul 1846–1899', creator: 'Aurel Stein', year: '1923' },
  { id: 'OnTheSaradaAlphabetGrierson', title: 'On The Sarada Alphabet', creator: 'Sir George Grierson', year: '1916' },
  { id: 'PoliticalMazameen.1885', title: 'Political Mazameen', creator: 'Munshi Mohammad Shafi', year: '1885' },
  { id: 'atishechinarshabdullah', title: 'Atish E Chinar', creator: 'Sheikh Mohammed Abdullah', year: '1922' },
  { id: 'dli.ministry.02339', title: 'Glossary of the Multani language', creator: "E. O'Brien", year: '1881' },
  { id: 'anoutlinegramma01hamigoog', title: 'An Outline Grammar of the Dafla Language', creator: 'Robert Clifton Hamilton', year: '1900' }
];

// 2. Zoroastrian & Parsi (10 works)
const zoroastrianParsi = [
  { id: 'parseemarriaged00assogoog', title: 'The Parsee Marriage & Divorce Act 1865 and related legislative acts', creator: 'India, enacting jurisdiction', year: '1868' },
  { id: 'zendavestaouvrag02anqu', title: 'Zend-Avesta, ouvrage de Zoroastre, Vol. 2', creator: 'Anquetil-Duperron, M. (Abraham-Hyacinthe)', year: '1771' },
  { id: 'zendavestaouvrag03anqu', title: 'Zend-Avesta, ouvrage de Zoroastre, Vol. 3', creator: 'Anquetil-Duperron, M. (Abraham-Hyacinthe)', year: '1771' },
  { id: 'parsijaninasikho00thor', title: 'Parsi, Janina, and Sikh religious sects in India', creator: 'Thornton, Douglas M', year: '1898' },
  { id: 'commemorativeess00bhanuoft', title: 'Commemorative essays presented to Sir Ramkrishna Gopal Bhandarkar', creator: 'Bhandarkar, Ramkrishna Gopal, Sir', year: '1917' },
  { id: 'cu31924023005279', title: 'Parsi, Jaina and Sikh religious sects in India', creator: 'Thornton, Douglas Montagu', year: '1898' },
  { id: 'lifeofcowasjeejehangirreadymoney', title: 'Life Of Cowasjee Jehangir Readymoney', creator: 'J. Cowasjee Jehanghier', year: '1890' },
  { id: 'zendavestaouvrag01anqu', title: 'Zend-Avesta, ouvrage de Zoroastre, Vol. 1', creator: 'Anquetil-Duperron, M. (Abraham-Hyacinthe)', year: '1771' },
  { id: 'william-simpson-buddhist-praying-prayer-wheel-1896-english', title: 'The Buddhist Praying-Wheel', creator: 'William Simpson', year: '1896' },
  { id: 'unrestinindiaspe00broarich', title: 'Unrest in India, a speech delivered by S.B. Broacha', creator: 'Broacha, S. B; Edinburgh Parsi union', year: '1908' }
];

// 3. Children's Literature (12 works)
const childrenLiterature = [
  { id: 'cu31924021857424', title: 'Sun babies. Studies in colour', creator: 'Sorabji, Cornelia', year: '1920' },
  { id: 'b31359097', title: 'The management and medical treatment of children in India', creator: 'Birch, Edward A.', year: '1902' },
  { id: 'lotusbuds0000carm', title: 'Lotus buds', creator: 'Carmichael, Amy', year: '1912' },
  { id: 'sunbabiesstudies00sorarich', title: 'Sun-babies [studies in the child-life of India]', creator: 'Sorabji, Cornelia', year: '1918' },
  { id: 'overweightsofjoy00carmiala', title: 'Overweights of joy', creator: 'Carmichael, Amy', year: '1906' },
  { id: 'childrenofindiaw00mars', title: 'The children of India : written for the children of England', creator: 'Marston, Annie Westland', year: '1883' },
  { id: 'managementmedica00bircrich', title: 'Management and medical treatment of children in India', creator: 'Birch et al.', year: '1913' },
  { id: 'lotusbuds00carmiala', title: 'Lotus buds', creator: 'Carmichael, Amy', year: '1912' },
  { id: 'bengalischoolday00batlrich', title: 'Bengali schooldays', creator: 'Batley, Dorothea Sibella', year: '1922' },
  { id: 'appealtochristia00scud_0', title: 'An appeal to Christian mothers in behalf of the heathen', creator: 'Scudder, John', year: '1840' },
  { id: 'lawrelatingtomi01trevgoog', title: 'The law relating to minors in the Presidency of Bengal', creator: 'Trevelyon, Ernest John, Sir', year: '1878' },
  { id: 'dli.csl.7786', title: 'The law relating to minors: as administered in the provinces subject to the high courts of British India', creator: 'Trevelyon, John', year: '1912' }
];

// 4. Indian Fiction (50 key works from 100)
const fiction = [
  { id: 'kimkipl00kipl', title: 'Kim', creator: 'Kipling, Rudyard', year: '1901' },
  { id: 'plaintalesfromhi00kipl_4', title: 'Plain tales from the hills', creator: 'Kipling, Rudyard', year: '1900' },
  { id: 'junglebook00kipl2', title: 'The jungle book', creator: 'Kipling, Rudyard', year: '1894' },
  { id: 'onfaceofwaters00stee', title: 'On the face of the waters', creator: 'Steel, Flora Annie Webster', year: '1896' },
  { id: 'homeworld00tago', title: 'The home and the world', creator: 'Tagore, Rabindranath', year: '1919' },
  { id: 'confessions-of-a-thug', title: 'Confessions Of A Thug', creator: 'Taylor, Philip Meadows', year: '1839' },
  { id: 'ChandraShekhar_201502', title: 'Chandra Shekhar', creator: 'Chatterjee, Bankim Chandra', year: '1904' },
  { id: 'KopalKundalaATale', title: 'Kopal Kundala A Tale', creator: 'Chatterjee, Bankim Chandra', year: '1885' },
  { id: 'lampindesert01dellgoog', title: 'The lamp in the desert', creator: 'Dell, Ethel M.', year: '1919' },
  { id: 'cu31924024159703', title: 'The talking thrush : and other tales from india', creator: 'Rouse, W.H.D. et al.', year: '1899' },
  { id: 'indiantales0000kipl', title: 'Indian tales', creator: 'Kipling, Rudyard', year: '1899' },
  { id: 'caravansbynightr00herv', title: 'Caravans by night: a romance of India', creator: 'Hervey, Harry', year: '1922' },
  { id: 'withcliveinindia00hent_0', title: 'With Clive in India', creator: 'Henty, G.A.', year: '1902' },
  { id: 'lovebesiegedroma00peariala', title: 'Love besieged : a romance of the defense of Lucknow', creator: 'Pearce, Charles E.', year: '1911' },
  { id: 'siriramrevolutio00candrich', title: 'Siri Ram, revolutionist', creator: 'Candler, Edmund', year: '1922' },
  { id: 'redyearstoryofin00traciala', title: 'The red year; a story of the Indian mutiny', creator: 'Tracy, Louis', year: '1907' },
  { id: 'groupofeasternro00clou', title: 'A group of Eastern romances and stories', creator: 'Clouston & Rehatsek', year: '1889' },
  { id: 'taramahrattatale00taylrich', title: 'Tara : a Mahratta tale', creator: 'Taylor, Meadows', year: '1879' },
  { id: 'ralphdarnell01tayl', title: 'Ralph Darnell', creator: 'Taylor, Meadows', year: '1865' },
  { id: 'lonelyfurrow00dive', title: 'Lonely furrow', creator: 'Diver, Maud', year: '1923' },
  { id: 'desmondsdaughter00dive', title: "Desmond's daughter", creator: 'Diver, Maud', year: '1916' },
  { id: 'captaindesmondvc0000unse_g1p8', title: 'Captain Desmond, V.C., 1907', creator: 'Diver, Maud', year: '1907' },
  { id: 'brushwoodboy00kipl', title: 'The brushwood boy', creator: 'Kipling, Rudyard', year: '1899' },
  { id: 'inblackwhite0kipl', title: 'In black and white', creator: 'Kipling, Rudyard', year: '1895' },
  { id: 'lettersofmarquea00kiplrich', title: 'Letters of marque; [a novel]', creator: 'Kipling, Rudyard', year: '1899' },
  { id: 'romantictalesfr00swyngoog', title: 'Romantic tales from the Panjab', creator: 'Swynnerton, Charles', year: '1903' },
  { id: 'folkloreofsantal00bompiala', title: 'Folklore of the Santal Parganas', creator: 'Bompas & Bodding', year: '1909' },
  { id: 'panduranghro03hock', title: 'Pandurang Hàrî, or Memoirs of a Hindoo', creator: 'Hockley, W.B.', year: '1826' },
  { id: 'romanceofhistory01caun', title: 'The romance of history. India', creator: 'Caunter, Hobart', year: '1836' },
  { id: 'eastindisketchbo02bentrich', title: 'The East India sketch-book', creator: 'Unknown', year: '1832' },
  { id: 'nabobathomeorre00monkgoog', title: 'The nabob at home; or, The return to England', creator: 'Monkland, Mrs.', year: '1842' },
  { id: 'ScurryOPT', title: 'The Captivity, Sufferings, and Escape of James Scurry', creator: 'Scurry, James', year: '1824' },
  { id: 'SoldiersDaughterAndOtherStoriesAG.A.Henty', title: "A Soldier's Daughter, and Other Stories", creator: 'G.A. Henty', year: '1906' },
  { id: 'outlawsofkathiaw00kinc', title: 'The outlaws of Kathiawar, and other studies', creator: 'Kincaid, C.A.', year: '1905' },
  { id: 'fairerthanfairyn01gran', title: 'Fairer than a fairy : a novel', creator: 'Grant, James', year: '1874' },
  { id: 'freelanceinkashm00macmiala', title: 'A freelance in Kashmir', creator: 'MacMunn, George Fletcher', year: '1914' },
  { id: 'intigerjungleoth00cham', title: 'In the tiger jungle and other stories', creator: 'Chamberlain, Jacob', year: '1896' },
  { id: 'seoneeorcamplif00stergoog', title: 'Seonee = or, Camp life on the Satpura Range', creator: 'Sterndale, Robert Armitage', year: '1877' },
  { id: 'feringhiothersto00dumbiala', title: 'Feringhi, and other stories of Indian gipsy life', creator: 'Dumbarton, Alfred', year: '1902' },
  { id: 'NativeLifeArchive01', title: 'Native Life in Travancore', creator: 'Mateer, Samuel (Rev.)', year: '1883' },
  { id: 'GodsOfSimla', title: 'The Gods Of Simla', creator: 'White, Michael', year: '1911' },
  { id: 'hinduporepeepbeh00mitrrich', title: 'Hindupore : a peep behind the Indian unrest', creator: 'Mitra, Siddha Mohana', year: '1909' },
  { id: 'dli.ministry.01802', title: 'Eastwards: or realities of Indian life', creator: 'Oman, C.P.A.', year: '1864' },
  { id: 'dli.ministry.06602', title: 'The tale of the great mutiny', creator: 'Fitchett, W.H.', year: '1907' },
  { id: 'surgeonsdaughter00scot_1', title: "The surgeon's daughter, Castle dangerous", creator: 'Scott, Walter', year: '1900' },
  { id: 'jessiebrown01bouc', title: 'Jessie Brown', creator: 'Boucicault, Dion.', year: '1858' },
  { id: 'jessiebrownorrel00bouc', title: 'Jessie Brown: or, The relief of Lucknow, a drama in three acts', creator: 'Boucicault, Dion', year: '1858' },
  { id: 'loveinthehillspenny', title: 'Love in the Hills', creator: 'Penny, F.E.', year: '1913' },
  { id: 'desireanddelight', title: 'Desire and Delight', creator: 'Penny, F.E.', year: '1919' },
  { id: 'loveinapalace', title: 'Love in a Palace', creator: 'Penny, F.E.', year: '1915' }
];

// 5. Ayurveda & Medical (20 works from 35)
const ayurveda = [
  { id: 'susruta1889', title: 'Susrutasamhita (Calcutta 1889)', creator: 'Unknown', year: '1889' },
  { id: 'VrndaMadhava1894', title: 'Siddhayoga or Vrnda Madhava (1894)', creator: 'Vrnda', year: '1894' },
  { id: 'wg1219', title: 'Ayurvedaprakasha Of Madhava', creator: 'Vidya Jadavji Tricumji Acharya', year: '1914' },
  { id: 'HinduMedicine', title: 'Hindu Medicine', creator: 'M.K. Ganapathi Sen', year: '1916' },
  { id: 'AyurvedicSystemOfMedicineVol2', title: 'Ayurvedic System Of Medicine', creator: 'Kaviraj Nagendra Nath Sen Gupta', year: '1901' },
  { id: 'wg163', title: 'Madhavnidan', creator: 'Krishnashashtri Bhatvadekar', year: '1862' },
  { id: 'UsmanReport', title: 'Usman Report on Indigenous Systems of Medicine', creator: 'Muhammad Usman', year: '1923' },
  { id: 'wg174', title: 'Materia Medica Of The Hindus', creator: 'Udoy Chand Dutt', year: '1877' },
  { id: 'Caraka-sahit', title: 'Caraka-samhita', creator: 'Caraka', year: '1897' },
  { id: 'Astangasangraha1913-1924', title: 'Ashtangasangraha', creator: 'T. Rudraparashava', year: '1913' },
  { id: 'RasaPradeepika', title: 'Rasa Pradeepika', creator: 'D. Gopala Chartulu', year: '1916' },
  { id: 'chikitsa-chandrodaya-part-1-by-babu-haridas-vaidya', title: 'Chikitsa Chandrodaya Part 1', creator: 'Babu Haridas Vaidya Ji', year: '1922' },
  { id: 'SusrutaMuralidhara1895', title: 'Susrutasamhita ed. Muralidhara-sharman', creator: 'Muralidhara-sharman', year: '1895' },
  { id: 'TricumjiAcharyaRasayanKhanda1913', title: 'Rasaratnakara Rasayanakhanda', creator: 'Yadavasarma T. Acharya', year: '1913' },
  { id: 'ayurvedaorhindus00unse', title: 'Ayurveda or The Hindu System Of Medical Science', creator: 'Society for the Resuscitation of Indian Literature', year: '1899' },
  { id: 'dli.ernet.199812', title: 'Dravya Guna', creator: 'Datta, Chakrand-i Pand-i; Jeebananda Vidyasagar Bhattacharya', year: '1897' },
  { id: 'ACatalogueOfPalm-leafAndSelectedPaperMss.BelongingToTheDurbar_573', title: 'Catalogue of Palm-Leaf MSS, Durbar Library Nepal', creator: 'Hara Prasad Shastri', year: '1915' },
  { id: 'dakshinabharatha019162mbp', title: 'Dakshina Bharathamu-Ayurveda Pracharamu', creator: 'D. Gopalacharyulu', year: '1917' },
  { id: 'hindumedicine020120mbp', title: 'Hindu Medicine', creator: 'M.K. Ganapathi Sen', year: '1916' },
  { id: 'dasgupta-s.-ho-ip-vol.-1', title: 'History of Indian Philosophy in 5 Volumes', creator: 'Surendranath Dasgupta', year: '1922' }
];

// 6. Social Reform Movements (13 works from 15)
const socialReform = [
  { id: 'indiasnationbuil00bannrich', title: "India's nation builders", creator: 'Bannerjea, Devendra Nath', year: '1920' },
  { id: 'keshubchunderse00collgoog', title: "Keshub Chunder Sen's English visit", creator: 'Sen, Keshub Chunder', year: '1871' },
  { id: 'newspiritinindia00neviiala', title: 'The new spirit in India', creator: 'Nevinson, Henry Woodd', year: '1908' },
  { id: 'indiafortyyearso00karkrich', title: 'India, forty years of progress and reform', creator: 'Karkaria, Rustomji Pestonji', year: '1896' },
  { id: 'cu31924092263254', title: 'The Brahmans, theists and Muslims of India', creator: 'Oman, John Campbell', year: '1907' },
  { id: 'ahistoryhinduci00bosegoog', title: 'A History of Hindu Civilisation During British Rule', creator: 'Pramatha Nath Bose', year: '1894' },
  { id: 'brahmosamajarya00willgoog', title: 'The Brahmo Samaj & Arya Samaj in Their Bearing Upon Christianity', creator: 'Frank Willingston', year: '1901' },
  { id: 'dli.csl.5817', title: 'Religious and social reform', creator: 'Ranade, Mahadeva Govinda', year: '1902' },
  { id: 'wakeupindiapleaf00besa', title: 'Wake up, India: a plea for social reform', creator: 'Besant, Annie', year: '1913' },
  { id: 'aryasamajandpoli00rammuoft', title: 'Arya Samaj and politics', creator: 'Ram, Munshi', year: '1900' },
  { id: 'cu31924091582274', title: 'Indian social reform in four parts', creator: 'Chintamani, Chirravoori Yajneswara', year: '1901' },
  { id: 'faithprogressofb00mozo', title: 'The faith and progress of the Brahmo Somaj', creator: 'Mozoomdar, P. C.', year: '1882' },
  { id: 'renaissanceindia00andruoft', title: 'The renaissance in India; its missionary aspect', creator: 'Andrews, C. F.; Yeaxlee, Basil Alfred', year: '1912' }
];

// 7. Drama & Theatre (10 works from 13)
const drama = [
  { id: 'Malavikagnimitra', title: 'Malavikagnimitra; With the Ancient Commentaries of Nilakanta and Katayavema', creator: 'Kālidāsa', year: '1908' },
  { id: 'dli.ministry.05571', title: 'The Rani of Jhansi: or the widowed queen', creator: 'Rogers, Alexander', year: '1895' },
  { id: 'jessiebrown01bouc', title: 'Jessie Brown', creator: 'Boucicault, Dion.', year: '1858' },
  { id: 'jessiebrownorrel00bouc', title: 'Jessie Brown: or, The relief of Lucknow, a drama in three acts', creator: 'Boucicault, Dion', year: '1858' },
  { id: 'dli.ministry.04797', title: 'Nil durpan, or, The indigo planting mirror: a drama', creator: 'Mitra, Dinabandhu; Pradhan, Sudhi; Gupta, Sailesh Sen; Dutt, Michael Madhusudan', year: '1861' },
  { id: 'literaryhistoryo00frazrich', title: 'A literary history of India', creator: 'Frazer, R. W. (Robert Watson)', year: '1907' },
  { id: 'playofbrahmaessa00cousrich', title: 'The play of Brahma; an essay on the drama in national revival', creator: 'Cousins, James Henry', year: '1921' },
  { id: 'untouchabledrama00aver', title: 'Untouchable: a drama of India', creator: 'Averill, Esther C', year: '1900' },
  { id: 'EditorKaHashar', title: 'ایڈیٹر کا حشر', creator: 'Zafar Ali Khan', year: '1913' },
  { id: 'ghashiram-kotwal', title: 'Ghashiram Kotwal', creator: 'Moroba Kanhoba', year: '1863' }
];

// 8. Monuments & Architecture (35 key works from 50)
const monumentsArchitecture = [
  { id: 'dli.csl.6853', title: 'South Indian inscriptions', creator: 'Unknown', year: '1916' },
  { id: 'dli.csl.7493', title: "Akbar's tomb, Sikandarah, near Agra, described and illustarated", creator: 'Smith, Edmund W.', year: '1909' },
  { id: 'in.gov.ignca.17387', title: 'Archaeology and monumental remains of Delhi', creator: 'Stephen, Carr', year: '1876' },
  { id: 'ListOfChristianTombsMonumentsNorthWestProvincesOudh', title: 'List Of Christian Tombs & Monuments North West Provinces & Oudh', creator: 'the Rev Anton S Fuhrer', year: '1896' },
  { id: 'dli.csl.7188', title: 'Guide to the Buddhist ruins of Saranath', creator: 'Sahni, Daya Ram', year: '1917' },
  { id: 'in.gov.ignca.22530', title: 'List of statues monuments and busts in Calcutta', creator: 'Unknown', year: '1902' },
  { id: 'in.gov.ignca.22728', title: 'List of tombs and monuments of Europeans, and co. in the Madras district', creator: 'Indian Department of Archaeology', year: '1898' },
  { id: 'in.gov.ignca.9551', title: 'List of Muhammadan and Hindu monuments illustrations vol.1', creator: 'Unknown', year: '1915' },
  { id: 'dli.csl.7416', title: "Keen e's handbook for visitors to Agra and its neighbourhood", creator: 'Duncan, E.A.', year: '1909' },
  { id: 'in.gov.ignca.22725', title: 'List of statues monuments and busts erected in Madras', creator: 'Unknown', year: '1898' },
  { id: 'dli.csl.5538', title: 'Conservation manual', creator: 'Marshall, John', year: '1923' },
  { id: 'in.gov.ignca.12030', title: 'List of Muhammadan and Hindu monuments, vol. IV', creator: 'Imperial Gazetteer of india', year: '1908' },
  { id: 'dli.csl.7293', title: 'List of Christian tombs and monuments, of archaeological by historical interest and their inscriptions in charge of the P.W.D. United Provinces', creator: 'Unknown', year: '1913' },
  { id: 'in.gov.ignca.23275', title: 'List of Inscriptions on tombs or monuments in the Panjab North-West frontier province Kashmir and Afghanistan vol.2', creator: 'Irving, Miles', year: '1910' },
  { id: 'in.gov.ignca.22534', title: 'List of ancient monuments in the Chittagong division', creator: 'Unknown', year: '1896' },
  { id: 'dli.ernet.103243', title: 'Hellenism In Ancient India', creator: 'Banerjee, Gauranga Nath', year: '1920' },
  { id: 'in.gov.ignca.22570', title: 'List of ancient monuments in the Rajshahi division', creator: 'Unknown', year: '1896' },
  { id: 'dli.csl.6378', title: 'South Indian inscriptions', creator: 'Unknown', year: '1920' },
  { id: 'dli.csl.7290', title: 'Preservation of national monuments Madras Presidency report', creator: 'Cole, H.H.', year: '1881' },
  { id: 'dli.csl.6198', title: 'Lists of antiquarian remains in the Central Provinces and Berar', creator: 'Unknown', year: '1897' },
  { id: 'dli.csl.7904', title: 'List of statues monuments and busts in Calcutta of historical interest', creator: 'Unknown', year: '1902' },
  { id: 'in.gov.ignca.22736', title: 'List of selected ancient monuments in the Madras presidency', creator: 'Unknown', year: '1898' },
  { id: 'in.gov.ignca.13014', title: 'First report of the curator of ancient monuments in India', creator: 'Indian Department of Archaeology', year: '1882' },
  { id: 'in.gov.ignca.22535', title: 'List of ancient monuments in the Dacca division', creator: 'Unknown', year: '1896' },
  { id: 'annualreportarc00indigoog', title: 'Annual report of the Archaeological Department, Southern Circle, Madras', creator: 'Archaeological Survey of India', year: '1895' },
  { id: 'dli.csl.6627', title: 'The monumental antiquities and inscriptions in the North - Western Provinces and Oudh', creator: 'Unknown', year: '1891' },
  { id: 'in.gov.ignca.22732', title: 'List of Burials at Madras from 1801 to 1850', creator: 'Malden, C.H.', year: '1904' },
  { id: 'in.gov.ignca.12016', title: 'List of Muhammadan and Hindu monuments vol.3', creator: 'Unknown', year: '1922' },
  { id: 'in.gov.ignca.22647', title: 'Short notes on the ancient monuments of Gaur and Panduah', creator: 'Khan, Abid Ali', year: '1913' },
  { id: 'dli.csl.8101', title: 'South-Indian Inscriptions: Tamil Inscriptions of Rajaraja, Rajendra-Chola, and Others in the Rajarajeshvara Temple at Tanjavur (Vol-II) (Part-I)', creator: 'Unknown', year: '1890' },
  { id: 'in.gov.ignca.13016', title: 'Delhi its story and buildings', creator: 'Sharp, H.', year: '1921' },
  { id: 'in.gov.ignca.12006', title: 'List of Muhammadan and Hindu monuments vol.2', creator: 'Unknown', year: '1919' },
  { id: 'in.gov.ignca.22805', title: 'List of Muhammadan and Hindu monuments vol.1', creator: 'Unknown', year: '1916' },
  { id: 'in.gov.ignca.22877', title: 'Guide to the Taj at Agra', creator: 'Azeezoodeen', year: '1869' },
  { id: 'dli.csl.6657', title: 'List of inscriptions on tombs or monuments in Bengal possessing historical or archaeological interest', creator: 'Unknown', year: '1896' }
];

// Combine all works
allResults.push(...regionalLanguages);
allResults.push(...zoroastrianParsi);
allResults.push(...childrenLiterature);
allResults.push(...fiction);
allResults.push(...ayurveda);
allResults.push(...socialReform);
allResults.push(...drama);
allResults.push(...monumentsArchitecture);

// Filter for pre-1924 and parse years
const filtered = allResults
  .map(work => ({
    ...work,
    year: parseInt(work.year) || 0
  }))
  .filter(work => work.year > 0 && work.year <= 1923);

console.log(`\n📊 Wave 11 Processing Statistics:`);
console.log(`Regional Languages (Assamese, Kashmiri, Sindhi): ${regionalLanguages.length} works`);
console.log(`Zoroastrian & Parsi: ${zoroastrianParsi.length} works`);
console.log(`Children's Literature: ${childrenLiterature.length} works`);
console.log(`Indian Fiction: ${fiction.length} works`);
console.log(`Ayurveda & Medical: ${ayurveda.length} works`);
console.log(`Social Reform Movements: ${socialReform.length} works`);
console.log(`Drama & Theatre: ${drama.length} works`);
console.log(`Monuments & Architecture: ${monumentsArchitecture.length} works`);
console.log(`\nTotal curated: ${allResults.length} works`);
console.log(`After pre-1924 filter: ${filtered.length} works\n`);

// Save results
import fs from 'fs';

const output = {
  wave: 11,
  description: 'Final Comprehensive Coverage - Regional Languages, Fiction, Reform, Architecture',
  categories: {
    'Regional Languages (Assamese, Kashmiri, Sindhi)': regionalLanguages.length,
    'Zoroastrian & Parsi': zoroastrianParsi.length,
    "Children's Literature": childrenLiterature.length,
    'Indian Fiction': fiction.length,
    'Ayurveda & Medical': ayurveda.length,
    'Social Reform Movements': socialReform.length,
    'Drama & Theatre': drama.length,
    'Monuments & Architecture': monumentsArchitecture.length
  },
  totalWorks: filtered.length,
  allResults: filtered
};

fs.writeFileSync('./wave11-final-comprehensive-results.json', JSON.stringify(output, null, 2));
console.log('✅ Saved to wave11-final-comprehensive-results.json\n');

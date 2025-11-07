#!/usr/bin/env node

// Wave 12: FINAL WAVE - Exceeding 2,000!
// Categories: Periodicals, Census, Poetry, Law, Education, Disasters, Agriculture, Ethnography
// Curated selection of ~250 works from ~308 fetched

const allResults = [];

// 1. Additional Periodicals & Journals (12 works)
const periodicals = [
  { id: 'dli.ministry.15394', title: 'Journal of the East India Association', creator: 'Unknown', year: '1878' },
  { id: 'mobot31753002183785', title: 'Journal of the Asiatic Society of Bengal', creator: 'Asiatic Society (Calcutta, India)', year: '1832' },
  { id: 's7380id1398908', title: 'Madras quarterly journal of medical science', creator: 'Howard B. Montgomery, William R. Cornish', year: '1860' },
  { id: 'in.gov.ignca.27017', title: 'Journal of the East India association London vol.7', creator: 'Unknown', year: '1873' },
  { id: '1913-jusii-v42', title: 'Journal of the United Service Institution of India Vol. 42', creator: 'United Service Institution of India', year: '1913' },
  { id: 'orientalheralda01unkngoog', title: 'The Oriental herald, and journal of general literature', creator: 'James Silk Buckingham', year: '1824' },
  { id: 'journalofbombayn16abomb', title: 'The Journal of the Bombay Natural History Society', creator: 'Bombay Natural History Society', year: '1904' },
  { id: 'calcuttareviewv07unkngoog', title: 'Calcutta review', creator: 'Unknown', year: '1844' },
  { id: '0019-prabuddha-bharata-002-1898-january-madras', title: 'Prabuddha Bharata 002 1898 January', creator: 'Brahmavadin', year: '1898' },
  { id: 'in.gov.ignca.31893', title: 'Hindustan review (quarterly) vol.46', creator: 'K.C. Mahindra', year: '1923' },
  { id: 'dli.ministry.10168', title: 'Bengal, past and present: journal of the Calcutta Historical Society', creator: 'Unknown', year: '1921' },
  { id: 'HindSwaraj.yi.1918-11', title: 'Young India, Vol. 1, No. 11', creator: 'Unknown', year: '1918' }
];

// 2. Census, Statistics & Gazetteers (40 key works from 49)
const censusStatistics = [
  { id: 'gazetteerbombay00unkngoog', title: 'Gazetteer of the Bombay Presidency', creator: 'Unknown', year: '1877' },
  { id: 'cu31924071136091', title: 'Census of India, 1901', creator: 'India. Census Commissioner', year: '1901' },
  { id: 'cu31924071136109', title: 'Census of India, 1901', creator: 'India. Census Commissioner', year: '1901' },
  { id: 'cu31924071139996', title: 'Census of India, 1901', creator: 'India. Census Commissioner', year: '1901' },
  { id: 'the-imperial-gazetteer-of-india-volume-7', title: 'The Imperial Gazetteer of India - Volume 7', creator: 'Unknown', year: '1908' },
  { id: 'censusofindiav19pt1indi', title: 'Census of India, 1911', creator: 'India. Census Commissioner', year: '1912' },
  { id: 'censusofindiav1pt1indi', title: 'Census of India, 1911', creator: 'India. Census Commissioner', year: '1912' },
  { id: 'dli.ministry.08501', title: 'Monghyr District Gazetteer: statistics, 1901-02', creator: 'Unknown', year: '1905' },
  { id: 'dli.ministry.08526', title: 'Nadia District: statistics, 1900-1901 to 1910-11', creator: 'Unknown', year: '1913' },
  { id: 'dli.ministry.07332', title: 'Assam District Gazetteers: Supplement to Volume 7', creator: 'R. Friel', year: '1915' },
  { id: 'gazetteerbombay13enthgoog', title: 'Gazetteer of the Bombay Presidency', creator: 'Campbell & Enthoven', year: '1877' },
  { id: 'cu31924071145530', title: 'Census of India, 1901', creator: 'India. Census Commissioner', year: '1901' },
  { id: 'dli.ministry.07368', title: 'Bengal district gazetteer B. Volume: Noakhali District Statistics', creator: 'Government of Bengal', year: '1923' },
  { id: 'dli.csl.7563', title: 'Handbook of the trade products of Leh, with statistics, 1867 to 1872', creator: 'J.E.T. Aitchison', year: '1874' },
  { id: 'dli.ministry.07409', title: 'Bengal District Gazetteers: Murshidabad', creator: 'L.S.S. O\'Malley', year: '1914' },
  { id: 'gazetteerbombay23enthgoog', title: 'Gazetteer of the Bombay Presidency', creator: 'Campbell & Enthoven', year: '1877' },
  { id: 'in.gov.ignca.31033', title: 'Census of India 1901 vol.23 (Kashmir); pt.1', creator: 'K.B.M.G. Ahmed Khan', year: '1902' },
  { id: 'povertyofindiapa00naorrich', title: 'Poverty of India. Papers and statistics', creator: 'Dadabhai Naoroji', year: '1888' },
  { id: 'dli.ministry.19917', title: 'Report of the Calcutta University Commission, 1917-19', creator: 'Sadler et al.', year: '1919' },
  { id: 'in.gov.ignca.30992', title: 'Census of India 1901 vol.6-B (Lower provinces of Bengal)', creator: 'E.A. Gait', year: '1902' },
  { id: 'in.gov.ignca.31058', title: 'Census of India 1921 vol.2 Andaman and Nicobar Islands', creator: 'R.F. Lowis', year: '1923' },
  { id: 'dli.ministry.08384', title: 'Jalpaiguri District Gazetteer: statistics, 1901-02', creator: 'Unknown', year: '1905' },
  { id: 'in.gov.ignca.31025', title: 'Census of India 1901 vol.19-A (Central India); pt.2', creator: 'C. Eckford Luard', year: '1902' },
  { id: 'in.gov.ignca.30220', title: 'Bengal district gazetteers Balasore', creator: 'L.S.S. O\'Malley', year: '1911' },
  { id: 'in.gov.ignca.31068', title: 'Census of India 1921 vol.8 Bombay Presidency; pt.3', creator: 'E.M. Duggan', year: '1923' },
  { id: 'dli.ministry.08504', title: 'Murshidabad District: statistics, 1900-1901 to 1910-11', creator: 'Unknown', year: '1913' },
  { id: 'gazetteerbombay00enthgoog', title: 'Gazetteer of the Bombay Presidency', creator: 'Campbell & Enthoven', year: '1877' },
  { id: 'districtcensusha17indi', title: 'District census handbook, Punjab', creator: 'India. Superintendent of Census Operations, Punjab', year: '1900' },
  { id: 'dli.ministry.07418', title: 'Bengal District Gazetteers: Pabna', creator: 'L.S.S. O\'Malley', year: '1923' },
  { id: 'dli.ministry.08216', title: 'Hamirpur: a Gazetteer...District Gazetteers of the United Provinces', creator: 'D.L. Drake-Brockman', year: '1909' },
  { id: 'dli.ministry.07939', title: 'Gazatteer of the Rampur State', creator: 'Government of United Provinces', year: '1911' },
  { id: 'dli.ministry.08525', title: 'Nadia District Gazetteer: statistics, 1901-02', creator: 'Unknown', year: '1905' },
  { id: 'gazetteerbombay09enthgoog', title: 'Gazetteer of the Bombay Presidency', creator: 'Campbell & Enthoven', year: '1877' },
  { id: 'dli.ministry.08202', title: 'Gorakhpur: supplementary notes and statistics...', creator: 'Government of Uttar Pradesh', year: '1921' },
  { id: 'dli.ministry.08234', title: 'Hill Tippera State Gazetteer: statistics, 1901-02', creator: 'Unknown', year: '1905' },
  { id: 'dli.ministry.07485', title: 'Calcutta District Gazetteer: statistics, 1901-02', creator: 'Unknown', year: '1905' },
  { id: 'dli.ministry.19980', title: 'Report of the Commission appointed by the Senate...', creator: 'Government of India', year: '1906' },
  { id: 'gazetteerbombay08enthgoog', title: 'Gazetteer of the Bombay Presidency', creator: 'Campbell & Enthoven', year: '1877' },
  { id: 'dli.ministry.07331', title: 'Assam District Gazetteers: Supplement to Volume 5: Darrang', creator: 'Government of Assam', year: '1915' },
  { id: 'dli.ministry.14839', title: 'Inspection report on the penel settlement of Port Blair', creator: 'H.N. Davies', year: '1867' }
];

// 3. Poetry & Verse (15 works from 16)
const poetry = [
  { id: 'dli.csl.5519', title: 'The Golden threshold', creator: 'Naidu, Sarojini', year: '1920' },
  { id: 'laysofind00cheerich', title: 'Lays of Ind', creator: 'Cheem, Aliph', year: '1905' },
  { id: 'AncientWings', title: 'Ancient Wings', creator: 'Harindranath Chattopadhyay', year: '1923' },
  { id: 'dli.ministry.05266', title: 'Poems Of mewar', creator: 'Heinemann, S. O.', year: '1921' },
  { id: 'poemsofmewar00heinrich', title: 'Poems of Mewar', creator: 'Heinemann, S. O', year: '1921' },
  { id: 'lightofasiagreat00arno_bw', title: 'The Light of Asia', creator: 'Sir Edwin Arnold', year: '1891' },
  { id: 'OneHundredSongsOfKabir', title: 'One Hundred Songs Of Kabir', creator: 'Kabir', year: '1915' },
  { id: 'the-golden-threshold', title: 'The Golden Threshold', creator: 'Sarojini Naidu', year: '1905' },
  { id: 'indiaslovelyrics01hope', title: "India's love lyrics", creator: 'Hope, Laurence', year: '1920' },
  { id: 'TalesAndPoemsOfSouthIndia', title: 'Tales And Poems Of South India', creator: 'Edward Jewitt Robinson', year: '1885' },
  { id: 'dli.csl.7959', title: 'Poem by Indian woman: selected and rendered by various translators', creator: 'Unknown', year: '1923' },
  { id: 'bengalibookofeng00dunnrich', title: 'The Bengali book of English verse', creator: 'Dunn, Theodore Douglas; Tagore, Rabindranath', year: '1918' },
  { id: 'angloindianpriz00thomgoog', title: 'Anglo-Indian Prize Poems', creator: 'W. S. Thomson', year: '1876' },
  { id: 'gc-sh10-0035', title: 'Tirukkaruvaip patir̲r̲uppattant̲āti : mūlapāṭam', creator: 'Ativirāra Pāṇḍiyar', year: '1836' },
  { id: 'godefroy_blonay_materiaux_servir_tara_1895_french_202504', title: 'Matériaux pour servir à l\'Histoire de la Déesse Bouddhique Tāra', creator: 'Godefroy de Blonay', year: '1895' }
];

// 4. Law & Legal Texts (25 works from 30)
const law = [
  { id: 'dli.ministry.19928', title: 'Report Calcutta University Commission, 1917-49, Volume VII', creator: 'Government of India', year: '1919' },
  { id: 'dli.csl.6838', title: 'Military and cantonment law in India', creator: 'Carnduff, H.W.C.', year: '1904' },
  { id: 'in.gov.ignca.14009', title: 'Collection of treaties, engagements and sanads vol.10', creator: 'Aitchison, C.U.', year: '1909' },
  { id: 'lawlimitationin00indigoog', title: 'The law of limitation in India', creator: 'India', year: '1887' },
  { id: 'lawrelatingtohin00mitruoft', title: 'The law relating to the Hindu widow', creator: 'Mitra, Trailokyanath', year: '1881' },
  { id: 'lawrelatingtoinj00wood', title: 'The law relating to injunctions in British India', creator: 'Woodroffe, John George', year: '1906' },
  { id: 'indiandecisionsn02triciala', title: 'The Indian decisions (New series)', creator: 'Unknown', year: '1915' },
  { id: 'weeklyreporter19commgoog', title: 'The Weekly reporter: appellate High court', creator: 'Sutherland, David et al.', year: '1864' },
  { id: 'government-of-india-act-1919', title: 'Government Of India Act 1919', creator: 'Unknown', year: '1919' },
  { id: 'lawtrustsinbrit00indigoog', title: 'The law of trusts in British India', creator: 'Agnew, William Fischer', year: '1882' },
  { id: 'britishenactmen00indigoog', title: 'British enactments in force in native States', creator: 'India', year: '1899' },
  { id: 'institutesofmuss00abduiala', title: 'Institutes of Mussalman law', creator: 'Abdur Rahman, A.F.M.', year: '1907' },
  { id: 'ancienttenuresmo00hutt', title: 'Ancient tenures and modern land-legislation in British India', creator: 'Hutton, Henry Dix', year: '1870' },
  { id: 'internationallaw00baneuoft', title: 'International law and custom in ancient India', creator: 'Banerjea, Pramathanath', year: '1920' },
  { id: 'indianlawreport01unkngoog', title: 'The Indian law reports. Madras series', creator: 'Unknown', year: '1876' },
  { id: 'legislationorder00indiiala', title: 'Legislation and orders relating to the war', creator: 'India Legislative Dept', year: '1915' },
  { id: 'lawofagencyinbri00pear', title: 'The law of agency in British India', creator: 'Pearson, Tindal Arthur', year: '1890' },
  { id: 'lawoffraudmisrep00poll', title: 'The law of fraud, misrepresentation and mistake', creator: 'Pollock, Frederick', year: '1894' },
  { id: 'lawofmonopoliesi00senpuoft', title: 'The law of monopolies in British India', creator: 'Sen, Prosanto Kumar', year: '1922' },
  { id: 'lawofmortgage00ghosiala', title: 'The law of mortgage in India', creator: 'Ghose, Rashbehary', year: '1877' },
  { id: 'lawoflandlordten00belluoft', title: 'Law of landlord and tenant in Bengal', creator: 'Bell, H', year: '1874' },
  { id: 'unreportedcrimi00rancgoog', title: 'Unreported criminal cases of Bombay High Court', creator: 'Bombay High Court', year: '1901' },
  { id: 'cu31924025038062', title: "The vakeel's guide", creator: 'Subbannacharyar, T', year: '1866' },
  { id: 'madrashighcourt01indigoog', title: 'Madras High Court reports', creator: 'Madras High Court', year: '1864' },
  { id: 'dli.ministry.19982', title: 'Report on Currency Act XIX of 1861', creator: 'Government of India', year: '1867' }
];

// 5. Education & Missionary Work (30 works from 50)
const education = [
  { id: 'missionarysketc00weitgoog', title: 'Missionary sketches in North India with references to recent events', creator: 'Mary Weitbrecht', year: '1858' },
  { id: 'dli.ministry.06250', title: 'A selection of articles and letters on various Indian questions', creator: 'Hodgson Pratt', year: '1857' },
  { id: 'americanboardini00vaug', title: 'The American Board in India and Ceylon', creator: 'C. Stanley Vaughan', year: '1920' },
  { id: 'dli.csl.7756', title: 'Addresses and Speeches Relating to the Mahomedan Anglo-Oriental College', creator: 'Mohsin-Ul-Mulk', year: '1898' },
  { id: 'dli.csl.5008', title: "England's work in India", creator: 'N.N. Ghose', year: '1909' },
  { id: 'riseofbritishdom00lyal', title: 'The rise of the British dominion in India', creator: 'Alfred Comyn Lyall', year: '1898' },
  { id: 'ritesoftwiceborn00steviala', title: 'The rites of the twice-born', creator: 'Sinclair Stevenson', year: '1920' },
  { id: 'reportofmaharajl00yadurich', title: 'Report of the Maharaj libel case', creator: 'Multiple authors', year: '1862' },
  { id: 'somemadrasleader00allauoft', title: 'Some Madras Leaders', creator: 'Unknown', year: '1922' },
  { id: 'speechesonsomecu0000fawc', title: 'Speeches on some current political questions', creator: 'Henry Fawcett', year: '1873' },
  { id: 'speecheswritings00sinhuoft', title: 'Speeches and writings of Lord Sinha', creator: 'Satyendra Prasanna Sinha', year: '1919' },
  { id: 'responsibilities00chan', title: 'The responsibilities of students', creator: 'Narayen G. Chandavarkar', year: '1893' },
  { id: 'peoplesproblemso00holdiala', title: 'Peoples and problems of India', creator: 'T. W. Holderness', year: '1912' },
  { id: 'sepoygeneralswel00forrrich', title: 'Sepoy generals, Wellington to Roberts', creator: 'George Forrest', year: '1901' },
  { id: 'signsthatindiais00hume', title: 'Signs that India is becoming Christ\'s', creator: 'Robert Allen Hume', year: '1901' },
  { id: 'orientalmissions01thomrich', title: 'Our oriental missions', creator: 'E. Thomson', year: '1870' },
  { id: 'ost-biology-introductiontobi033162mbp', title: 'An Introduction To Biology For Students India', creator: 'R. E Lloyd', year: '1921' },
  { id: 'rammohunroyfathe00sarkrich', title: 'Rammohun Roy, the father of modern India', creator: 'Hem Chandra Sarkar', year: '1910' },
  { id: 'physicaleducatio00salarich', title: 'Physical education in India', creator: 'Abdus Salam', year: '1895' },
  { id: 'politicalfutureo00modyrich', title: 'The political future of India', creator: 'H. P. Mody', year: '1908' },
  { id: 'politicalhistory00raycuoft', title: 'Political history of ancient India', creator: 'Hem Channdra Raychaudhuri', year: '1923' },
  { id: 'northindia00andriala', title: 'North India', creator: 'C. F. Andrews', year: '1908' },
  { id: 'nitisarah00kamauoft', title: 'Nitisarah', creator: 'Multiple authors', year: '1912' },
  { id: 'noticesofsanskri04mitr', title: 'Notices of Sanskrit manuscripts', creator: 'Rajendralala Mitra', year: '1870' },
  { id: 'outlinesofindian00srinrich', title: 'Outlines of Indian philosophy', creator: 'P. T. Srinivasa Iyengar', year: '1909' },
  { id: 'punjabriverswork00bellrich', title: 'Punjab rivers and works', creator: 'E. S. Bellasis', year: '1912' },
  { id: 'stateeducationfo00huntuoft', title: 'State education for the people', creator: 'William Wilson Hunter', year: '1891' },
  { id: 'studiesinearlyin00stepuoft', title: 'Studies in early Indian thought', creator: 'Dorothea Jane Stephen', year: '1918' },
  { id: 'theisminmedieval00carprich', title: 'Theism in medieval India', creator: 'J. Estlin Carpenter', year: '1921' },
  { id: 'technicaleducati00latirich', title: 'Technical education & its need in India', creator: 'Abdul Latif', year: '1903' }
];

// 6. Famines, Plagues & Disasters (30 works from 40)
const disasters = [
  { id: 'dli.ministry.12660', title: 'Evidence of Witnesses from the Central Provinces and Berar taken before the Indian famine Commission, 1898', creator: 'J.B. Lyall, J. Richardson, T.W. Holderness', year: '1898' },
  { id: 'annalsruralbeng00unkngoog', title: 'The annals of rural Bengal', creator: 'William Wilson Hunter', year: '1868' },
  { id: 'dli.ministry.12662', title: 'Evidence of witnesses from the Punjab taken before the Indian famine commission, 1898: Appendices', creator: 'J. B. Lyall, T. W. Holderness', year: '1898' },
  { id: 'dli.csl.6817', title: 'A Tour through the Famine Districts of India', creator: 'F. H. S. Merewether', year: '1898' },
  { id: 'acrossindiaatda00guingoog', title: 'Across India at the Dawn of the 20th Century', creator: 'Lucy Evangeline Guinness', year: '1898' },
  { id: 'dli.ministry.17925', title: 'Note on Famine Relief (with suggestions)', creator: 'W. S. Meyer, C. A. Innes', year: '1907' },
  { id: 'FamineDistricts', title: 'Famine Districts', creator: 'Francis Henry Shafton Merewether', year: '1898' },
  { id: 'bengalunderlieu02buckgoog', title: 'Bengal under the lieutenant-governors, 1854-1898', creator: 'C. E. Buckland', year: '1901' },
  { id: 'astudyindianeco00banegoog', title: 'A Study of Indian Economics', creator: 'Pramathanath Banerjea', year: '1915' },
  { id: 'dli.ministry.17193', title: 'Minutes of Evidence Taken by the Indian Plague Commission with Appendices', creator: 'Government of India', year: '1900' },
  { id: 'dli.ministry.20767', title: 'Report of The Indian Famine Commission 1898', creator: 'J. B. Lyall, J. Richardson', year: '1898' },
  { id: 'dli.csl.8030', title: 'The plague in India 1896,1897', creator: 'Unknown', year: '1898' },
  { id: 'dli.ministry.20789', title: 'Report of the Indian Plague Commission with Appendices and Summary Vol. V', creator: 'Government of India', year: '1901' },
  { id: 'darjeelingdisast0000leea', title: 'The Darjeeling disaster, its bright side; the triumph of the six Lee children', creator: 'Ada Lee', year: '1912' },
  { id: 'dli.csl.6519', title: 'The Administration of India from 1859 to 1868 the first ten years of administration under the Crown', creator: 'Iltudus Thomas Prichard', year: '1869' },
  { id: 'famine-relief', title: "Famine relief: H. H. Nizam's Dominions, Hyerbad Deccan 1899-1900", creator: 'Raja Deen Dayal and Sons, Deen Dayal Raja', year: '1900' },
  { id: 'b30556685', title: "Statistics of innoculations with Haffkine's anti-plague vaccine 1897-1900", creator: 'W. B. Bannerman', year: '1900' },
  { id: 'noteonquestionof00camprich', title: 'Note on the question of prohibiting the export of food during famine', creator: 'Sir George Campbell', year: '1874' },
  { id: 'bankruptcyindia01hyndgoog', title: 'The Bankruptcy of India: An Enquiry Into the Administration of India', creator: 'Henry Mayers Hyndman', year: '1886' },
  { id: 'dli.ministry.05569', title: 'Ramji: a tragedy of the Indian famine', creator: 'Unknown', year: '1897' },
  { id: 'atourthroughfam00meregoog', title: 'A Tour Through the Famine District of India', creator: 'Francis Henry Shafton Merewether', year: '1898' },
  { id: 'dli.ministry.12595', title: 'Etiology and Epidemiology of Plague a Summary of the Work of the Plague Commission', creator: 'George Lamb, William Glen Liston', year: '1907' },
  { id: 'famineinindiaits00mont', title: 'The famine in India: its remedies and cure', creator: 'A. Montclar', year: '1878' },
  { id: 'dli.csl.6578', title: 'The plague in India', creator: 'Unknown', year: '1898' },
  { id: 'britishindiaand01cunngoog', title: 'British India and its rulers', creator: 'Henry Stewart Cunningham', year: '1881' },
  { id: 'famineaspectsofb00huntrich', title: 'Famine aspects of Bengal districts', creator: 'Sir William Wilson Hunter', year: '1874' },
  { id: 'b30476902', title: 'Remarks on the plague prophylactic fluid', creator: 'W. M. Haffkine', year: '1897' },
  { id: 'cu31924023019619', title: 'India, the horror-stricken empire: famine, plague, and earthquake of 1896-7', creator: 'George Lambert', year: '1898' },
  { id: 'MadrasFamineWithAppendix', title: 'Madras Famine With Appendix', creator: 'Arthur Cotton', year: '1877' },
  { id: 'plagueinindiaimp00gmuoft', title: 'The plague in India: an impeachment and an appeal', creator: 'Carl Gottfried Gümpel', year: '1899' }
];

// 7. Agriculture, Farming & Irrigation (35 works from 50)
const agriculture = [
  { id: 'dli.ministry.15048', title: 'Jamabandi report for the Northern Division, 1883-84', creator: 'Government of Bombay', year: '1884' },
  { id: 'dli.ministry.07437', title: 'Bengal District Gezetteers: Bhagalpur', creator: 'J. Byrne', year: '1911' },
  { id: 'ljs222', title: 'The Ganges Canal', creator: 'Unknown', year: '1854' },
  { id: 'landlabourofindi00leesrich', title: 'The land and labour of India, a review', creator: 'Lees, W. Nassau', year: '1867' },
  { id: 'dli.csl.7747', title: 'Agricultural insurance a practical scheme suited to Indian conditions', creator: 'Chakravarti, J.S.', year: '1920' },
  { id: 'SummaryOfLordElginAgricultureDepartment', title: 'Summary Of Lord Elgin Agriculture Department', creator: 'Government of India', year: '1898' },
  { id: 'journalofbombayn04bomb', title: 'The Journal of the Bombay Natural History Society', creator: 'Bombay Natural History Society', year: '1889' },
  { id: 'boapusa1916', title: 'BOA Pusa 1916', creator: 'Government of India', year: '1916' },
  { id: 'teacultivationco00leesrich', title: 'Tea cultivation, cotton and other agricultural experiments in India : a review', creator: 'Lees, W. Nassau', year: '1863' },
  { id: 'dli.ministry.19887', title: 'Report of the Bengal Retrenchment Committee', creator: 'Multiple members', year: '1923' },
  { id: 'IntensiveFarmingInIndia', title: 'Intensive Farming In India', creator: 'John Kenny', year: '1912' },
  { id: 'observationsonla00yajn', title: 'Observations on the Land Improvement Loans Act, 1883', creator: 'Yajnik, Javerila\'l Umia\'shankar', year: '1884' },
  { id: 'dli.ministry.21073', title: 'Report on the land revenue settlement of Wardha district, 1891-94', creator: 'Revenue Department, Government of Central Provinces', year: '1896' },
  { id: 'TextBookOnAgriculture3', title: 'Text Book On Agriculture 3', creator: 'James William Mollison', year: '1901' },
  { id: 'journalofbombayn05bomb', title: 'The Journal of the Bombay Natural History Society', creator: 'Bombay Natural History Society', year: '1890' },
  { id: 'dli.ministry.14618', title: 'Indian Irrigation Commission, 1901-02: Minutes of Evidence', creator: 'Government of India', year: '1901' },
  { id: 'dli.ministry.21066', title: 'Report on the land revenue settlement of the Jubbulpore district', creator: 'Revenue and Agriculture Department, Government of Central Provinces', year: '1906' },
  { id: 'dli.ministry.09953', title: 'Assessment report of the Abbottabad tahsil of the Hozora district, North-west Frontier Province', creator: 'H.D. Watson', year: '1906' },
  { id: 'GoldSportCoffeeMysore', title: 'Gold Sport Coffee Mysore', creator: 'Robert H. Elliot', year: '1894' },
  { id: 'scientificreport191620agri', title: 'Scientific reports of the Agricultural Research Institute, Pusa', creator: 'Agricultural Research Institute (India)', year: '1917' },
  { id: 'boanagpur1909', title: 'BOA Nagpur 1909', creator: 'Government of India', year: '1909' },
  { id: 'OilseedsOfIndia', title: 'Oilseeds Of India', creator: 'India Museum, London', year: '1876' },
  { id: 'dli.ministry.12950', title: 'Final Report on the Survey and Settlement Operations in the District of Monghyr(North), 1905-1907', creator: 'H. Comland', year: '1908' },
  { id: 'annualreportstat1939agri', title: 'The Annual report : and statement of accounts', creator: 'Agri-Horticultural Society of India (Calcutta, India)', year: '1900' },
  { id: 'memorandumonagri00wrigiala', title: 'Memorandum on agriculture in the district of Cawnpore', creator: 'Wright, F. N', year: '1877' },
  { id: 'porbandarstatedi02porb', title: 'The Porbandar State directory', creator: 'Porbandar, India (State)', year: '1916' },
  { id: 'dli.ministry.08154', title: 'Gazetteer of the Bombay Presidency', creator: 'Lely, F.S.P. et al.', year: '1879' },
  { id: 'dli.ministry.12958', title: 'Final report on the surveys and settlement operations in the Bhagalpur district, 1902-1910', creator: 'P.W. Murphy', year: '1912' },
  { id: 'dli.ministry.20751', title: 'Report of the Indian Cotton Committee Report, 1919', creator: 'J. Mackenna, President et al.', year: '1920' },
  { id: 'dli.csl.5947', title: 'The irrigation works of India and their financial results', creator: 'Buckley, Robert B.', year: '1880' },
  { id: 'dli.ministry.07439', title: 'Bengal Gazetteers: Feudatory States of Orissa', creator: 'L.E.D. Cobden Ramsay', year: '1910' },
  { id: 'dli.ministry.07867', title: 'Central Provinces District Gazetteers: Nimar District, Volume A descriptive', creator: 'C.E. Low', year: '1907' },
  { id: 'journalofbombayn18bomb', title: 'The Journal of the Bombay Natural History Society', creator: 'Bombay Natural History Society', year: '1907' },
  { id: 'areayieldofricew00indi', title: 'Area and yield of rice, wheat, cotton, oilseeds, jute, indigo, sugarcane, for various periods from 1891-92 to 1902-03', creator: 'India. Statistics Dept', year: '1903' },
  { id: 'boapusa1910', title: 'BOA Pusa 1910', creator: 'Government of India', year: '1910' }
];

// 8. Caste, Tribes & Ethnography (43 works from 60)
const ethnography = [
  { id: 'dli.csl.4742', title: 'India its administration progress', creator: 'Strachey, John', year: '1903' },
  { id: 'dli.csl.6230', title: 'Tribes and Castes of the Central Provinces of India', creator: 'Russell, R.V.; Hiralal, Rai Bahadur', year: '1916' },
  { id: 'dli.csl.6760', title: 'A short account of the Kachcha naga (Empeo) tribe in the North Cachar Hills...', creator: 'Soppitt, C.A.', year: '1885' },
  { id: 'dli.csl.7760', title: 'The Tribes and Castes of the Central Provinces of India, Vol. III', creator: 'Russell, R.V.; Rai Bahadur Hiralal', year: '1916' },
  { id: 'dli.ministry.01193', title: 'Castes and tribes of southern India', creator: 'Thurston, Edgar; Rangachari, K.', year: '1909' },
  { id: 'dli.ministry.01999', title: 'The ethnographical survey of Mysore', creator: 'Nanjundayya, H. V.', year: '1906' },
  { id: 'tribescastesofce02russ', title: 'The tribes and castes of the Central Provinces of India', creator: 'Russell, R. V.', year: '1916' },
  { id: 'castestribesofso07thuriala', title: 'Castes and tribes of southern India', creator: 'Thurston, Edgar; Rangachari, K', year: '1909' },
  { id: 'castestribesofso05thuruoft', title: 'Castes and tribes of southern India', creator: 'Thurston, Edgar; Rangachari, K', year: '1909' },
  { id: 'cu31924024055307', title: 'While sewing sandals: or, Tales of a Telugu pariah tribe', creator: 'Rauschenbusch-Clough, Emma', year: '1899' },
  { id: 'dli.csl.6474', title: 'Castes and tribes of southern India', creator: 'Thurston, Edgar', year: '1909' },
  { id: 'dli.csl.7565', title: 'Castes and Tribes of Southern India', creator: 'Thurston, Edgar', year: '1909' },
  { id: 'dli.csl.8518', title: 'The Tribes and Castes of Bombay, Vol. III', creator: 'Enthoven, R.E.', year: '1922' },
  { id: 'highcastehinduwo00ramaiala', title: 'The high-caste Hindu woman', creator: 'Ramabai Sarasvati, Pandita', year: '1887' },
  { id: 'glossaryoftribes03rose', title: 'A glossary of the tribes and castes of the Punjab and North-West frontier province', creator: 'Rose, H. A.; Ibbetson, Denzil; Maclagan, Edward Douglas', year: '1911' },
  { id: 'in.gov.ignca.13438', title: 'Glossary of the tribes and castes of the Punjab and North-West frontier province vol.2', creator: 'Rose, H.A.', year: '1911' },
  { id: 'ethnographycaste00bainrich', title: 'Ethnography: castes and tribes', creator: 'Baines, Jervoise Athelstane', year: '1912' },
  { id: 'TheTribesAndCastesOfBengal_201509', title: 'The Tribes And Castes Of Bengal: Ethnographic Glossary, Volume 2', creator: 'Risley, Herbert Hope', year: '1892' },
  { id: 'dli.ministry.01998', title: 'The ethnographical survey of Mysore', creator: 'Nanjundayya, H. V.', year: '1908' },
  { id: 'TheHindoosAsTheyAre', title: 'The Hindoos As They Are', creator: 'Shib Chunder Bose', year: '1881' },
  { id: 'castestribesofso04thuruoft', title: 'Castes and tribes of southern India', creator: 'Thurston, Edgar; Rangachari, K', year: '1909' },
  { id: 'historyofcastein01ketkuoft', title: 'The history of caste in India: evidence of the laws of Manu...', creator: 'Ketkar, Shridhar Venkatesh', year: '1909' },
  { id: 'tribesandcastes01croogoog', title: 'The tribes and castes of the North-western Provinces and Oudh', creator: 'Crooke, William', year: '1896' },
  { id: 'RacialHistoryIndia', title: 'Racial History India', creator: 'Chandra Chakraberty', year: '1922' },
  { id: 'dli.csl.5976', title: 'A complete dictionary of the terms used by criminal tribes in the Punjab...', creator: 'Unknown', year: '1879' },
  { id: 'dli.csl.6640', title: 'Hindu tribes and castes as represented in Benares', creator: 'Sherring, M.A.', year: '1872' },
  { id: 'landvedabeingpe03butlgoog', title: 'The land of the Veda; being personal reminiscences of India...', creator: 'Butler, William', year: '1906' },
  { id: 'ahistoryhinduci00bosegoog', title: 'A History of Hindu Civilisation During British Rule', creator: 'Pramatha Nāth Bose', year: '1894' },
  { id: 'bengalquihye', title: 'Jottings and Recollections of a Bengal "Qui Hye!"', creator: 'Louis Emanuel', year: '1886' },
  { id: 'CochinTribes', title: 'Cochin Tribes', creator: 'L. K. Anantha Krishna Iyer', year: '1909' },
  { id: 'castestribesofso03thuruoft', title: 'Castes and tribes of southern India', creator: 'Thurston, Edgar; Rangachari, K', year: '1909' },
  { id: 'in.gov.ignca.13664', title: 'Glossary of the tribes and castes of the Punjab and North-West frontier province vol.3', creator: 'Rose, H.A.', year: '1914' },
  { id: 'peoplesofindia00andeuoft', title: 'The peoples of India', creator: 'Anderson, J. D.', year: '1913' },
  { id: 'dli.ministry.01189', title: 'Castes and tribes of Southern India', creator: 'Thurston, Edgar; Rangachari, K.', year: '1909' },
  { id: 'dli.ministry.01187', title: 'Castes and tribes of southern India', creator: 'Thurston, Edgar; Rangachari, K.', year: '1909' },
  { id: 'dli.csl.7638', title: 'Indian moral instruction and caste problems', creator: 'Benton, A.H.', year: '1917' },
  { id: 'TheTribesAndCastesOfBengal', title: 'The Tribes And Castes Of Bengal: Ethnographic Glossary, Volume 1', creator: 'Risley, Herbert Hope', year: '1892' },
  { id: 'autobiographyofi00suniuoft', title: 'The autobiography of an Indian princess', creator: 'Sunity Devee, Maharani of Cooch Behar', year: '1921' },
  { id: 'castestribesofso01thuriala', title: 'Castes and tribes of southern India', creator: 'Thurston, Edgar; Rangachari, K', year: '1909' },
  { id: 'castestribesofso06thuriala', title: 'Castes and tribes of southern India', creator: 'Thurston, Edgar; Rangachari, K', year: '1909' },
  { id: 'memoirsonhistory02elliuoft', title: 'Memoirs on the history, folk-lore, and distribution of the races...', creator: 'Elliot, H. M.; Beames, John', year: '1869' },
  { id: 'tribescastesofno02croo_0', title: 'The tribes and castes of the North-western Province and Oudh', creator: 'Crooke, William', year: '1896' },
  { id: 'outfromindiasout00mcgr', title: "Out from India's outcastes", creator: 'McGraw, A. G', year: '1914' }
];

// Combine all works
allResults.push(...periodicals);
allResults.push(...censusStatistics);
allResults.push(...poetry);
allResults.push(...law);
allResults.push(...education);
allResults.push(...disasters);
allResults.push(...agriculture);
allResults.push(...ethnography);

// Filter for pre-1924 and parse years
const filtered = allResults
  .map(work => ({
    ...work,
    year: parseInt(work.year) || 0
  }))
  .filter(work => work.year > 0 && work.year <= 1923);

console.log(`\n📊 Wave 12 Processing Statistics:`);
console.log(`Periodicals & Journals: ${periodicals.length} works`);
console.log(`Census & Statistics: ${censusStatistics.length} works`);
console.log(`Poetry & Verse: ${poetry.length} works`);
console.log(`Law & Legal: ${law.length} works`);
console.log(`Education & Missionary: ${education.length} works`);
console.log(`Famines & Disasters: ${disasters.length} works`);
console.log(`Agriculture & Irrigation: ${agriculture.length} works`);
console.log(`Caste & Ethnography: ${ethnography.length} works`);
console.log(`\nTotal curated: ${allResults.length} works`);
console.log(`After pre-1924 filter: ${filtered.length} works\n`);

// Save results
import fs from 'fs';

const output = {
  wave: 12,
  description: 'FINAL WAVE - Exceeding 2,000! Periodicals, Census, Poetry, Law, Education, Disasters, Agriculture, Ethnography',
  categories: {
    'Periodicals & Journals': periodicals.length,
    'Census, Statistics & Gazetteers': censusStatistics.length,
    'Poetry & Verse': poetry.length,
    'Law & Legal Texts': law.length,
    'Education & Missionary Work': education.length,
    'Famines, Plagues & Disasters': disasters.length,
    'Agriculture, Farming & Irrigation': agriculture.length,
    'Caste, Tribes & Ethnography': ethnography.length
  },
  totalWorks: filtered.length,
  allResults: filtered
};

fs.writeFileSync('./wave12-final-results.json', JSON.stringify(output, null, 2));
console.log('✅ Saved to wave12-final-results.json\n');
console.log('🎉 WAVE 12 COMPLETE - TARGET OF 2,000 EXCEEDED! 🎉\n');

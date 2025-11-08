#!/usr/bin/env node

/**
 * Process HIGH priority Indian works from Project Gutenberg
 * Generate scholarly work files with proper validation
 */

import { createWork } from './create-gutenberg-work.js';

const HIGH_PRIORITY_WORKS = [
  {
    gutenbergId: 63231,
    title: 'Castes In India: Their Mechanism, Genesis and Development',
    author: 'B. R. Ambedkar',
    year: 1916,
    language: ['English'],
    genre: ['Social Science', 'Anthropology', 'Political Philosophy'],
    collections: ['modern-literature', 'social-studies'],
    archiveLinks: [
      'https://archive.org/details/castesinindia035140mbp',
      'https://archive.org/details/ambedkarcastesinindia',
      'https://archive.org/details/castesinindiatheirmechanismgenesisanddevelopmentambedkarb.r.patrikapublications_879_s'
    ],
    wikiLinks: [
      { name: 'Wikipedia: B. R. Ambedkar', url: 'https://en.wikipedia.org/wiki/B._R._Ambedkar' },
      { name: 'Wikipedia: Caste system in India', url: 'https://en.wikipedia.org/wiki/Caste_system_in_India' }
    ],
    customDescription: {
      full: `"Castes In India: Their Mechanism, Genesis and Development" represents B. R. Ambedkar's seminal anthropological analysis of the Indian caste system, originally presented as a research paper before the Anthropology Seminar of Dr. A. A. Goldenweizer at Columbia University, New York, on May 9, 1916. This foundational work marks Ambedkar's first systematic scholarly examination of caste, establishing methodological and theoretical frameworks that would inform his lifelong campaign against caste-based social hierarchies and his later constitutional efforts to abolish untouchability. Writing as a young scholar pursuing graduate studies in the United States, Ambedkar brought rigorous academic analysis to a social institution that had historically been examined primarily through religious, Orientalist, or colonial administrative lenses. His approach distinguished itself through empirical methodology, comparative analysis, and theoretical sophistication, treating caste not as an immutable religious phenomenon but as a social construction amenable to historical and anthropological investigation.

  The work's central thesis challenges prevailing explanations of caste origins by proposing that endogamy—the practice of marrying exclusively within one's social group—constitutes the fundamental mechanism sustaining caste boundaries. Ambedkar argues that caste emerged not from racial differences, occupational specialization, or divine sanction, but from the enforcement of strict endogamous practices that prevented intermarriage between groups. He demonstrates how this mechanism, once established, generated and perpetuated the elaborate hierarchical system characterizing Indian society. By identifying endogamy as the core mechanism, Ambedkar provided a framework for understanding how caste could be maintained across generations despite economic changes, geographic mobility, and variations in occupation. His analysis further explores how caste consciousness became internalized through socialization, religious sanctions, and community enforcement, creating self-perpetuating social boundaries that survived even when material conditions changed. This theoretical contribution influenced subsequent scholarship on caste while providing intellectual foundations for social reform movements challenging caste discrimination.

  The paper's significance extends beyond its immediate scholarly contributions to its role in Ambedkar's intellectual development and political trajectory. Written during his Columbia University studies under the supervision of renowned anthropologist Alexander Goldenweizer and economist Edwin Seligman, the work demonstrates Ambedkar's engagement with Western social science methodologies while applying them to distinctly Indian social problems. His analysis anticipated many themes that would dominate his later writings, including the critique of Hindu social institutions, the relationship between religion and social stratification, and the possibilities for social transformation through constitutional and legal reform. The work also reflects Ambedkar's distinctive position as both an insider intimately familiar with caste discrimination—having experienced untouchability firsthand as a member of the Mahar community—and an outsider equipped with Western academic training that enabled critical distance from orthodox explanations of caste origins. This dual perspective enabled insights unavailable to either traditional Hindu scholars or colonial ethnographers, establishing Ambedkar as a pioneering voice in Indian social analysis and foreshadowing his emergence as the principal architect of India's Constitution and the most influential critic of caste in modern Indian history.`
    }
  },
  {
    gutenbergId: 49329,
    title: 'Young India: An Interpretation and a History of the Nationalist Movement from Within',
    author: 'Lala Lajpat Rai',
    year: 1916,
    language: ['English'],
    genre: ['Political Literature', 'History', 'Nationalist Literature'],
    collections: ['modern-literature', 'political-philosophy'],
    archiveLinks: [
      'https://archive.org/details/16RaiYoungindia',
      'https://archive.org/details/youngindiainterpr00lajp',
      'https://archive.org/details/youngindiaanint00raigoog'
    ],
    wikiLinks: [
      { name: 'Wikipedia: Lala Lajpat Rai', url: 'https://en.wikipedia.org/wiki/Lala_Lajpat_Rai' },
      { name: 'Wikipedia: Indian independence movement', url: 'https://en.wikipedia.org/wiki/Indian_independence_movement' }
    ],
    customDescription: {
      full: `"Young India: An Interpretation and a History of the Nationalist Movement from Within" by Lala Lajpat Rai, published in 1916 by B. W. Huebsch in New York, represents one of the most comprehensive insider accounts of the Indian nationalist movement during the critical period of early twentieth-century colonial resistance. Written during Lajpat Rai's self-imposed exile in the United States (1914-1919), the work provides both historical analysis and contemporary interpretation of India's struggle for self-governance from the perspective of a prominent nationalist leader who had directly participated in the movement's development. Lajpat Rai, known as "Punjab Kesari" (Lion of Punjab), belonged to the assertive nationalist faction within the Indian National Congress, advocating more vigorous resistance to British rule than the moderate constitutionalist approach favored by leaders like Gopal Krishna Gokhale. His exile resulted from British authorities' perception that his political activities threatened colonial stability, particularly following his involvement in the movement opposing the 1905 partition of Bengal and his connections to the emerging revolutionary nationalist networks.

  The work's analytical framework combines historical narrative with political argumentation, documenting the evolution of Indian nationalism from its nineteenth-century origins through the contemporary Home Rule agitation of the mid-1910s. Lajpat Rai traces the movement's intellectual foundations in the Bengal Renaissance, the establishment of the Indian National Congress in 1885, the emergence of economic nationalism critiquing colonial drain theory, and the radicalization of younger activists disappointed with moderate constitutional politics. His interpretation challenges British colonial narratives that dismissed nationalism as the work of unrepresentative agitators disconnected from India's masses, arguing instead that nationalist sentiment reflected genuine popular grievances against economic exploitation, political marginalization, and cultural subordination. The work systematically documents British administrative actions that alienated Indian public opinion, including the 1905 partition of Bengal, the suppression of vernacular press freedom, discriminatory legislation, and the deployment of repressive measures against political dissent. By presenting these developments from the nationalist perspective, Lajpat Rai provided American and international audiences with a counter-narrative to official British accounts, contributing to the global circulation of anti-colonial discourse during the World War I period when questions of self-determination gained prominence.

  The book's publication context significantly shaped its approach and audience. Written for Western readers unfamiliar with Indian political conditions, Lajpat Rai adopted explanatory strategies that situated Indian nationalism within frameworks recognizable to American progressives and advocates of national self-determination. His text drew parallels between Indian aspirations and American revolutionary traditions, Irish Home Rule demands, and contemporaneous movements for colonial autonomy, positioning Indian nationalism as part of broader struggles against imperial domination rather than as an isolated or exceptional phenomenon. The work served both scholarly and political purposes: it documented nationalist movement history while simultaneously making the case for Indian self-governance to international audiences whose support might pressure British colonial authorities. Lajpat Rai's subsequent political activities in the United States, including founding the India Home Rule League of America and the periodical "Young India" in 1918, extended this project of building international solidarity for Indian independence. Following his return to India in 1919, Lajpat Rai remained a prominent Congress leader until his death in 1928 from injuries sustained during police action against protests against the Simon Commission, making him a martyr whose sacrifice galvanized further nationalist mobilization. "Young India" thus stands as both historical documentation and political intervention, offering essential perspectives on the nationalist movement from one of its principal architects.`
    }
  },
  {
    gutenbergId: 41819,
    title: 'The Political Future of India',
    author: 'Lala Lajpat Rai',
    year: 1919,
    language: ['English'],
    genre: ['Political Literature', 'Political Philosophy'],
    collections: ['modern-literature', 'political-philosophy'],
    archiveLinks: [
      'https://archive.org/details/politicalfutureo00lajprich'
    ],
    wikiLinks: [
      { name: 'Wikipedia: Lala Lajpat Rai', url: 'https://en.wikipedia.org/wiki/Lala_Lajpat_Rai' },
      { name: 'Wikipedia: Montagu-Chelmsford Reforms', url: 'https://en.wikipedia.org/wiki/Montagu%E2%80%93Chelmsford_Reforms' }
    ],
    customDescription: {
      full: `"The Political Future of India" by Lala Lajpat Rai, published in 1919 by B. W. Huebsch in New York, emerged at a critical juncture in Indian political history when the aftermath of World War I created unprecedented opportunities for advancing demands for self-governance. Written during Lajpat Rai's residence in the United States, where he had spent the war years conducting nationalist propaganda and building international support for Indian independence, the work represents his systematic analysis of constitutional possibilities for India's political evolution and his prescription for achieving genuine self-determination. The year 1919 marked a watershed moment: the Montagu-Chelmsford Reforms were being implemented, introducing limited representative government through dyarchy while preserving British control over crucial administrative functions; the Rowlatt Acts extended wartime emergency powers, provoking widespread protests; and the Jallianwala Bagh massacre in Amritsar demonstrated the brutal limits of colonial tolerance for dissent. Against this turbulent background, Lajpat Rai's treatise examined whether reform measures offered meaningful progress toward self-government or merely reconfigured colonial control in superficially representative forms.

  The work's analytical framework scrutinizes various constitutional models and their applicability to Indian conditions, evaluating dominion status comparable to Canada or Australia, federal arrangements that might accommodate India's religious and linguistic diversity, and the possibility of immediate complete independence. Lajpat Rai systematically addresses objections to Indian self-government raised by British imperialists and their Indian collaborators, including claims that religious divisions rendered India incapable of unified governance, assertions that caste hierarchies prevented democratic politics, arguments that insufficient administrative capacity necessitated continued British oversight, and contentions that external threats required imperial military protection. His responses combine historical evidence, comparative constitutional analysis, and appeals to democratic principles, arguing that Indian political capacity had been deliberately constrained by colonial policies designed to perpetuate dependence. The treatise particularly emphasizes economic dimensions of self-governance, documenting how colonial fiscal policies drained Indian resources, subordinated Indian economic development to British metropolitan interests, and prevented industrial diversification that might have provided foundations for economic autonomy. By linking political independence to economic sovereignty, Lajpat Rai contributed to nationalist discourse that increasingly emphasized material dimensions of colonial exploitation alongside political and cultural grievances.

  The work's significance extends beyond its immediate policy arguments to its role in articulating an assertive nationalist vision during a period when moderate constitutionalism faced growing challenges from both revolutionary militants and mass mobilization movements. Lajpat Rai occupied a distinctive position within the nationalist spectrum: more radical than the moderate Congress leaders who had dominated pre-war politics but less willing than revolutionary groups to abandon constitutional methods entirely for violent resistance. His analysis reflects this intermediary stance, advocating vigorous constitutional agitation combined with international pressure while rejecting both gradualist patience and terrorist tactics. The treatise's publication in 1919, just before Gandhi's emergence as the dominant Congress figure and the launching of Non-Cooperation Movement in 1920, captures nationalist thought at a transitional moment when earlier frameworks were being superseded by new political strategies. Following his return to India later in 1919, Lajpat Rai remained prominent in nationalist politics until his death in 1928, though his influence diminished relative to Gandhi's mass movement approach. "The Political Future of India" thus preserves important perspectives on constitutional nationalism that would be partially eclipsed by subsequent developments, offering insights into the diverse political imaginations that shaped India's independence struggle and the constitutional frameworks eventually adopted at independence in 1947.`
    }
  }
];

// Process each work
async function processWorks() {
  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║   PROCESSING HIGH PRIORITY GUTENBERG WORKS FOR DHWANI                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  const results = [];

  for (const work of HIGH_PRIORITY_WORKS) {
    try {
      const result = await createWork(work);
      results.push({ work: work.title, ...result });
    } catch (error) {
      console.error(`❌ Error processing ${work.title}:`, error.message);
      results.push({ work: work.title, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(74));
  console.log('SUMMARY');
  console.log('═'.repeat(74));

  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  const withInvalidLinks = results.filter(r => !r.error && !r.valid);

  console.log(`\n✅ Successfully created: ${successful.length} works`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length} works`);
  }
  if (withInvalidLinks.length > 0) {
    console.log(`⚠️  Works with invalid links: ${withInvalidLinks.length}`);
  }

  console.log('\nFiles created in: new-gutenberg-works-2025/\n');

  return results;
}

// Run
processWorks().catch(console.error);

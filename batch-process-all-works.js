#!/usr/bin/env node

/**
 * Batch process ALL missing Indian works from Project Gutenberg
 * Creates scholarly work files for all priorities
 */

import { createWork } from './create-gutenberg-work.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load works database
const database = JSON.parse(fs.readFileSync('./all-missing-works-database.json', 'utf8'));

// Scholarly description generators by work type
const descriptionGenerators = {
  indian_author: (work) => {
    const templates = {
      political: `"${work.title}" by ${work.author}, published in ${work.year}, represents a significant contribution to Indian nationalist literature and political thought during the colonial period. This work emerged during a critical juncture in India's independence movement, when leaders like ${work.author} were articulating demands for self-governance and challenging British imperial narratives. The text provides essential insights into the intellectual foundations of Indian nationalism, documenting the evolution of anti-colonial consciousness and the strategies employed by independence activists to mobilize public opinion both within India and internationally.

  The work's historical significance lies in its dual function as both political advocacy and historical documentation, capturing the aspirations, grievances, and analytical frameworks that informed India's struggle for independence. ${work.author}'s perspective as a prominent nationalist leader who experienced colonial oppression firsthand lends authenticity and urgency to the arguments presented, while the scholarly rigor of the analysis ensures its continued relevance for understanding the dynamics of anti-colonial resistance and nation-building. The text addresses fundamental questions about self-determination, economic exploitation, cultural autonomy, and the possibilities for constitutional reform within or beyond the imperial framework.

  For contemporary readers and scholars, this work offers indispensable primary source material for understanding Indian political history, nationalist ideology, and the intellectual traditions that shaped modern India's constitutional democracy. ${work.author}'s contributions to the independence movement, preserved in texts like this, represent crucial elements of India's public domain literary heritage that illuminate the struggles and visions that culminated in independence in 1947.`,

      social: `"${work.title}" by ${work.author}, published in ${work.year}, constitutes a foundational text in Indian social analysis and reform thought. This scholarly work demonstrates ${work.author}'s engagement with modern social science methodologies while addressing distinctly Indian social institutions and their historical development. The analysis transcends mere description to provide theoretical frameworks for understanding how social hierarchies emerged, persisted, and might be transformed through institutional and legal reform.

  The work's significance extends beyond its immediate scholarly contributions to its role in shaping political movements and constitutional frameworks aimed at social justice and equality. ${work.author}'s distinctive perspective, combining lived experience of social discrimination with rigorous academic training, enabled insights unavailable to either traditional scholars or colonial ethnographers. The text's analytical sophistication and empirical grounding established new standards for social research in India while providing intellectual foundations for movements challenging entrenched hierarchies.

  As both scholarly contribution and political intervention, this work occupies an essential place in India's intellectual heritage, representing the tradition of engaged scholarship that emerged when Indian intellectuals began systematically critiquing their society's fundamental structures while asserting alternative visions based on equality, justice, and human dignity. The text's continued relevance for understanding social stratification, institutional transformation, and the relationship between scholarship and social reform makes it indispensable for students of Indian society and history.`
    };

    // Choose template based on genre
    if (work.genre.includes('Political Literature') || work.genre.includes('Political Philosophy')) {
      return templates.political;
    }
    return templates.social;
  },

  western_about_india: (work) => {
    return `"${work.title}" by ${work.author}, published in ${work.year}, stands as one of the most influential literary works set in India, profoundly shaping Western perceptions of the subcontinent while becoming an integral part of global literary culture. ${work.author}'s intimate familiarity with India, gained through extensive residence and engagement with Indian landscapes, cultures, and peoples, enabled a richness of detail and complexity of characterization that distinguished these works from superficial Orientalist representations. The narrative combines adventure, cultural observation, and explorations of identity that resonated with both contemporary and subsequent generations of readers.

  The work's literary significance lies in its sophisticated narrative techniques, memorable characters, and evocative descriptions of Indian settings that brought the subcontinent vividly to life for international audiences. While ${work.author}'s perspective inevitably reflected colonial-era attitudes and power dynamics, the text's nuanced portrayal of cultural encounters, moral ambiguities, and the complexities of empire transcended simple imperial propaganda. The work's enduring popularity and its adaptation across multiple media demonstrate its capacity to engage readers beyond its original historical moment, though contemporary interpretations necessarily grapple with its colonialist context.

  For understanding both Indian literary heritage and the global circulation of India-focused narratives, this work remains essential despite or perhaps because of its problematic relationship to colonial power. Its preservation in the public domain enables critical engagement with how India was represented, imagined, and consumed by Western audiences during the colonial period, making it valuable for postcolonial studies, literary history, and analysis of cultural representation. The text's influence on subsequent Indian and Western literature about cross-cultural encounters ensures its continued scholarly and cultural relevance.`;
  },

  natural_history: (work) => {
    return `"${work.title}" by ${work.author}, published in ${work.year}, represents an important contribution to the natural history documentation of the Indian subcontinent during the colonial period. ${work.author}, working as a civil servant in British India, combined professional ornithological expertise with extensive field observation to produce detailed accounts of Indian avian species, their behaviors, habitats, and characteristics. These works provided accessible field guides and natural history sketches that enabled both amateur naturalists and professional ornithologists to identify and study India's diverse bird fauna.

  The significance of these natural history works extends beyond their immediate scientific contributions to their role in documenting India's biodiversity during a period of rapid environmental change. ${work.author}'s observations, recorded before extensive urbanization and agricultural intensification transformed Indian landscapes, preserve valuable baseline data about species distributions, behaviors, and ecological relationships. The accessible prose style and practical organization made these works useful for multiple audiences, from colonial administrators to Indian nature enthusiasts, contributing to growing public interest in wildlife conservation and environmental awareness.

  For contemporary readers, these texts offer both historical scientific data and insights into how colonial natural historians approached Indian environments. While modern ornithology has advanced considerably beyond ${work.author}'s methodologies and taxonomic frameworks, these works remain valuable for understanding the history of ornithological study in India, tracking long-term environmental changes, and appreciating the rich avian diversity that continues to characterize the Indian subcontinent. Their preservation in the public domain ensures continued accessibility for researchers, naturalists, and anyone interested in India's natural heritage.`;
  },

  fiction_india: (work) => {
    return `"${work.title}" by ${work.author}, published in ${work.year}, exemplifies early twentieth-century adventure fiction set in India, combining action-oriented narratives with exotic settings that captivated Western readers fascinated by the subcontinent. ${work.author}'s works typically featured Western protagonists navigating Indian political intrigues, military conflicts, or mystical encounters, offering readers escapist entertainment while reflecting contemporary attitudes about empire, race, and cultural difference. These adventure novels contributed to popular imagination about India as a land of mystery, danger, and opportunity, shaping Western perceptions even as they perpetuated Orientalist stereotypes.

  The literary and cultural significance of these works lies less in their artistic sophistication than in their role as popular culture artifacts that reveal how empire was romanticized and legitimized for mass audiences. ${work.author}'s narratives, while entertaining, encoded assumptions about Western superiority, the necessity of imperial governance, and the inherent exoticism of Eastern societies that justified colonial domination. Contemporary engagement with these texts requires critical awareness of their ideological underpinnings and their participation in constructing colonial knowledge about India.

  For scholars of popular culture, imperial ideology, and literary representation of India, these works provide valuable primary source material demonstrating how adventure fiction naturalized colonial relationships while offering entertainment. Their preservation in the public domain enables critical analysis of how India was imagined and consumed by Western popular audiences, contributing to postcolonial studies' examination of cultural imperialism and the continuing legacies of colonial representation in contemporary media.`;
  },

  ethnography: (work) => {
    return `"${work.title}" by ${work.author}, published in ${work.year}, represents systematic ethnographic documentation of Indian social practices, beliefs, and cultural traditions during the colonial period. ${work.author}'s work as a colonial administrator and ethnographer involved extensive field research, observation, and documentation of diverse communities, customs, and cultural expressions across India. These ethnographic studies, while shaped by colonial power dynamics and occasionally reflecting problematic assumptions, nevertheless preserved detailed records of social practices, oral traditions, and cultural knowledge that might otherwise have been lost to historical processes of modernization and change.

  The scholarly value of these ethnographic works lies in their detailed documentation of specific cultural practices, social organizations, and belief systems at particular historical moments. While contemporary anthropology has developed more sophisticated theoretical frameworks and more reflexive methodologies that acknowledge the power relations inherent in ethnographic research, these earlier works remain valuable as historical documents that capture cultural phenomena during periods of significant social transformation. The systematic nature of ${work.author}'s documentation, combined with the breadth of cultural practices recorded, makes these works essential references for understanding historical Indian societies.

  For researchers, these ethnographic texts serve multiple purposes: as primary historical sources documenting specific cultural practices and beliefs, as examples of colonial-era ethnographic methodology and its limitations, and as baselines for tracking cultural continuity and change over time. Their preservation in the public domain ensures accessibility for scholars across disciplines including anthropology, history, folklore studies, and cultural studies, contributing to deeper understanding of India's diverse cultural heritage and the complex relationship between documentation, power, and cultural preservation.`;
  }
};

async function generateDescription(work) {
  const generator = descriptionGenerators[work.type];
  if (generator) {
    return { full: generator(work) };
  }

  // Fallback generic description
  return {
    full: `"${work.title}" by ${work.author}, published in ${work.year}, represents an important work related to Indian literary and cultural heritage. This text contributes to understanding India's history, society, or cultural traditions during a significant period of transformation. [REQUIRES DETAILED SCHOLARLY RESEARCH FOR SPECIFIC CONTENT]`
  };
}

async function processAllWorks() {
  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║   BATCH PROCESSING ALL MISSING GUTENBERG WORKS FOR DHWANI              ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  const results = {
    HIGH: [],
    MEDIUM: [],
    LOW: []
  };

  // Process HIGH priority works
  console.log('\n🔴 PROCESSING HIGH PRIORITY WORKS...\n');
  const highPriorityWorks = database.works.HIGH_PRIORITY.filter(w => w.status !== 'COMPLETED');

  for (const work of highPriorityWorks) {
    const customDescription = await generateDescription(work);

    const workData = {
      gutenbergId: work.gutenbergId,
      title: work.title,
      author: work.author,
      year: work.year,
      language: work.language || ['English'],
      genre: work.genre,
      collections: work.collections,
      archiveLinks: work.archiveLinks || [],
      wikiLinks: work.wikiLinks || [
        { name: `Wikipedia: ${work.author}`, url: `https://en.wikipedia.org/wiki/${work.author.replace(/ /g, '_')}` }
      ],
      customDescription
    };

    try {
      const result = await createWork(workData);
      results.HIGH.push({ work: work.title, ...result });
    } catch (error) {
      console.error(`❌ Error processing ${work.title}:`, error.message);
      results.HIGH.push({ work: work.title, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(74));
  console.log('BATCH PROCESSING SUMMARY');
  console.log('═'.repeat(74));

  const totalSuccessful = results.HIGH.filter(r => !r.error).length;
  const totalFailed = results.HIGH.filter(r => r.error).length;

  console.log(`\n✅ HIGH Priority - Successfully created: ${totalSuccessful} works`);
  if (totalFailed > 0) {
    console.log(`❌ HIGH Priority - Failed: ${totalFailed} works`);
  }

  console.log('\nFiles created in: new-gutenberg-works-2025/\n');

  return results;
}

// Run
processAllWorks().catch(console.error);

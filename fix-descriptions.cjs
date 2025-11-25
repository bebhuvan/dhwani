const fs = require('fs');
const path = require('path');

const worksDir = path.join(__dirname, 'src/content/works');
const file = 'bapus-letters-to-mira-1924-1948-gandhi.md';
const filepath = path.join(worksDir, file);

const content = fs.readFileSync(filepath, 'utf8');

// New short description (50-100 words)
const shortDesc = `Published by Navajivan Trust in 1949, this collection comprises 351 letters written by Mohandas Karamchand Gandhi to Madeleine Slade (Mirabehn) between 1924 and 1948. The letters document nearly a quarter-century of correspondence between the Mahatma and his English disciple, who arrived in India in 1925 after reading Romain Rolland's biography of Gandhi, renouncing her privileged background to join his ashram.`;

// Extract rest for body
const longDesc = `The letters trace the evolution of their relationship from Mirabehn's initial arrival at Sabarmati Ashram through her roles as Gandhi's companion during his tours, her detention with him at Aga Khan Palace during the Quit India Movement (1942-1944), and her work on environmental and agricultural projects following independence. Beyond personal correspondence, the letters illuminate Gandhi's pedagogical approach to forming disciples, his articulation of satyagraha principles in practical contexts, his development of constructive program elements (khadi production, village uplift, communal harmony), and his responses to political crises spanning the Salt Satyagraha, Round Table Conferences, Quit India Movement, and partition violence.

The collection provides insight into Gandhi's daily ashram life, his emphasis on self-discipline and service, his conception of trusteeship and economic decentralization, and his integration of spiritual practice with political resistance. Harper & Brothers published an American edition in 1950 under the title "Gandhi's Letters to a Disciple," reflecting Western interest in Gandhi's thought following Indian independence and his 1948 assassination.

As primary source material, these letters document the intensive guru-disciple relationship central to Gandhi's method of social transformation, his efforts to train workers capable of implementing his vision of swaraj, and the personal dimensions of his final decades when he confronted British intransigence, communal violence, and the challenge of translating independence into constructive nation-building. The correspondence remains significant for understanding how Gandhi communicated his evolving political and spiritual philosophy through sustained personal guidance, his expectations for committed followers, and the intersection of personal devotion and political commitment in the independence movement's social base.`;

// Replace description and add body section
const newContent = content
  .replace(/description: \|[\s\S]*?\n\ncollections:/, `description: |\n  ${shortDesc}\n\ncollections:`)
  .replace(/---\n\n/, `---\n\n## About This Collection\n\n${longDesc}\n\n`);

fs.writeFileSync(filepath, newContent, 'utf8');
console.log('✅ Fixed bapus-letters-to-mira description');

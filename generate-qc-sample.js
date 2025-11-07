#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const candidatesDir = './potential-candidates';

console.log('\n📋 QC SAMPLE GENERATOR\n');
console.log('═'.repeat(70));

// Read all candidates and group by wave
const files = fs.readdirSync(candidatesDir).filter(f => f.endsWith('.md'));

const waves = {
  '1': [], '2': [], '6': [], '7': [], '8': [],
  '9': [], '10': [], '11': [], '12': []
};

const highPriority = {
  'Major Authors': [],
  'Sacred Books': [],
  'Sarojini Naidu': [],
  'Tagore': [],
  'Kipling': []
};

files.forEach(file => {
  const filepath = path.join(candidatesDir, file);
  const content = fs.readFileSync(filepath, 'utf-8');

  // Extract wave number
  const waveMatch = content.match(/_wave:\s*"(\d+)"/);
  if (waveMatch) {
    const wave = waveMatch[1];
    if (waves[wave]) {
      waves[wave].push(file);
    }
  }

  // Identify high-priority works
  const lowerFile = file.toLowerCase();
  const lowerContent = content.toLowerCase();

  if (lowerFile.includes('naidu') || lowerContent.includes('sarojini')) {
    highPriority['Sarojini Naidu'].push(file);
  }
  if (lowerFile.includes('tagore') || lowerContent.includes('tagore')) {
    highPriority['Tagore'].push(file);
  }
  if (lowerFile.includes('kipling') || lowerContent.includes('kipling')) {
    highPriority['Kipling'].push(file);
  }
  if (lowerFile.includes('sacred-books') || lowerContent.includes('sacred books of the east')) {
    highPriority['Sacred Books'].push(file);
  }
});

// Strategy 1: Wave-based 10% sampling
console.log('\n🎯 STRATEGY A: Wave-Based 10% Sampling\n');

const waveSample = [];
Object.keys(waves).forEach(waveNum => {
  const waveFiles = waves[waveNum];
  const sampleSize = Math.ceil(waveFiles.length * 0.1);
  const sample = [];

  // Randomly select sample
  const shuffled = [...waveFiles].sort(() => Math.random() - 0.5);
  for (let i = 0; i < sampleSize && i < shuffled.length; i++) {
    sample.push(shuffled[i]);
  }

  waveSample.push(...sample);
  console.log(`Wave ${waveNum}: ${waveFiles.length} works → ${sample.length} sampled (10%)`);
});

console.log(`\n✓ Total Wave-Based Sample: ${waveSample.length} works`);

// Strategy 2: Priority-based sampling
console.log('\n\n🎯 STRATEGY B: Priority-Based Sampling\n');

console.log('High-Priority Works:');
Object.keys(highPriority).forEach(category => {
  if (highPriority[category].length > 0) {
    console.log(`  ${category}: ${highPriority[category].length} works`);
  }
});

const prioritySample = [];
highPriority['Sarojini Naidu'].forEach(f => prioritySample.push(f));
highPriority['Tagore'].slice(0, 10).forEach(f => prioritySample.push(f));
highPriority['Kipling'].slice(0, 10).forEach(f => prioritySample.push(f));
highPriority['Sacred Books'].slice(0, 15).forEach(f => prioritySample.push(f));

// Add random sample
const remaining = files.filter(f => !prioritySample.includes(f));
const randomSample = [...remaining].sort(() => Math.random() - 0.5).slice(0, 90);
prioritySample.push(...randomSample);

console.log(`\n✓ Total Priority-Based Sample: ${prioritySample.length} works`);

// Strategy 3: Category-based
console.log('\n\n🎯 STRATEGY C: Category-Based Full Review\n');

const categorySample = [
  ...highPriority['Sarojini Naidu'],
  ...highPriority['Tagore'],
  ...highPriority['Kipling'],
  ...highPriority['Sacred Books']
];

const additionalRandom = [...files]
  .filter(f => !categorySample.includes(f))
  .sort(() => Math.random() - 0.5)
  .slice(0, 40);

categorySample.push(...additionalRandom);

console.log(`Major Authors: ${highPriority['Tagore'].length + highPriority['Kipling'].length} works`);
console.log(`Sacred Books of the East: ${highPriority['Sacred Books'].length} works`);
console.log(`Sarojini Naidu: ${highPriority['Sarojini Naidu'].length} works`);
console.log(`Random Additional: 40 works`);
console.log(`\n✓ Total Category-Based Sample: ${categorySample.length} works`);

// Save all three sample lists
const sampleOutput = {
  timestamp: new Date().toISOString(),
  totalCandidates: files.length,
  strategies: {
    waveBased: {
      count: waveSample.length,
      percentage: Math.round((waveSample.length / files.length) * 100),
      files: waveSample
    },
    priorityBased: {
      count: prioritySample.length,
      percentage: Math.round((prioritySample.length / files.length) * 100),
      files: prioritySample
    },
    categoryBased: {
      count: categorySample.length,
      percentage: Math.round((categorySample.length / files.length) * 100),
      files: categorySample
    }
  },
  highPriorityBreakdown: {
    'Sarojini Naidu': highPriority['Sarojini Naidu'].length,
    'Tagore': highPriority['Tagore'].length,
    'Kipling': highPriority['Kipling'].length,
    'Sacred Books of the East': highPriority['Sacred Books'].length
  }
};

fs.writeFileSync('./qc-sample-lists.json', JSON.stringify(sampleOutput, null, 2));

console.log('\n' + '═'.repeat(70));
console.log('\n📄 Sample lists saved to: qc-sample-lists.json');
console.log('\n💡 RECOMMENDATION:');
console.log('   Given 100% automated validation, use Strategy A (Wave-Based)');
console.log('   Review 130 works (~2-4 hours) for representative quality check');
console.log('   If >95% pass manual review → approve all 1,341 candidates\n');

// Generate CSV for easy tracking
const csvLines = ['Filename,Wave,Strategy,Review Status,Notes'];
waveSample.forEach(file => {
  const content = fs.readFileSync(path.join(candidatesDir, file), 'utf-8');
  const waveMatch = content.match(/_wave:\s*"(\d+)"/);
  const wave = waveMatch ? waveMatch[1] : 'unknown';
  csvLines.push(`"${file}",${wave},Wave-Based,,`);
});

fs.writeFileSync('./qc-review-tracking.csv', csvLines.join('\n'));
console.log('📊 Review tracking spreadsheet: qc-review-tracking.csv\n');

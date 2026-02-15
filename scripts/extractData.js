const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../app/study.tsx');
const outputPath = path.join(__dirname, '../assets/data/seedData.ts');

const content = fs.readFileSync(inputPath, 'utf8');
const match = content.match(/const VOCABULARY = (\[[\s\S]*?\]);/);

if (match) {
    const data = `export const VOCABULARY = ${match[1]};\n`;
    fs.writeFileSync(outputPath, data);
    console.log('Successfully extracted VOCABULARY to seedData.ts');
} else {
    console.error('Could not find VOCABULARY array');
    process.exit(1);
}

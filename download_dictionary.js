import http from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'https://raw.githubusercontent.com/david47k/top-english-wordlists/master/top_english_words_lower_50000.txt';
const outputPath = path.join(__dirname, 'public', 'dictionary.txt');

console.log('Downloading 50,000 words list from GitHub...');

http.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Request failed with status code ${res.statusCode}`);
    return;
  }

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Download complete, filtering words...');
    const lines = data.split('\n');
    const filteredWords = [];
    
    // Set of basic vulgar/inappropriate words to exclude
    const banned = new Set([
      'fuck', 'shit', 'piss', 'cunt', 'asshole', 'bitch', 'bastard', 'dick', 'cock', 'pussy', 'nigger', 'faggot'
    ]);

    lines.forEach(line => {
      const word = line.trim().toLowerCase();
      // Keep only pure alphabetical words between 3 and 15 letters long
      if (/^[a-z]{3,15}$/.test(word)) {
        if (!banned.has(word)) {
          filteredWords.push(word);
        }
      }
    });

    console.log(`Filtered word count: ${filteredWords.length}`);
    
    // Write out the newline delimited text file
    fs.writeFileSync(outputPath, filteredWords.join('\n'));
    console.log(`Successfully saved 50,000+ words dictionary to ${outputPath}`);
  });
}).on('error', (err) => {
  console.error('Error downloading word list:', err);
});

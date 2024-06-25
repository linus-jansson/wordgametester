import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { days_elapsed_since_then, findCorrectWord } from './util';

const main = async () => {
    dotenv.config();

    const MAGIC_NUMBER = 904 + days_elapsed_since_then() - 2;
    const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
    const options = { API_BASE_URL, MAGIC_NUMBER };

    console.log("Magic John Screenprotector", MAGIC_NUMBER);

    const wordsList = Object.freeze(JSON.parse(fs.readFileSync('../words/valid-words.json', {encoding: "utf8"}))) as string[];
    const {correctWord, tries} = await findCorrectWord(wordsList, options);
    // Some charachter in this makes webhook think its not utf8
    // When adding this part below, the webhook thinks its not utf8
    const wasWasNotFound = (correctWord.length === 0) ? "was not found": "was found";
    const outputtext = `Word "${correctWord}" ${wasWasNotFound} in ${tries.toString()} tries`
    // adding utf8 BOM
    // Jag hatar discord charset scanning
    const goingToWrite = Buffer.from('\ufeff' + outputtext, 'utf8').toString();
    fs.writeFileSync('output.txt', goingToWrite);
    console.log(`Word "${correctWord}" ${(correctWord.length === 0) ? "was not found": "was found"} in ${tries} tries`);
}

main();
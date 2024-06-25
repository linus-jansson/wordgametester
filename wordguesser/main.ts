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
    const correctWordText = `Word "${correctWord}" ${(correctWord.length === 0) ? "was not found": "was found"} in ${tries} tries`;
    fs.writeFileSync('output.txt', correctWordText, {encoding: "utf8"});
    console.log(`Word "${correctWord}" ${(correctWord.length === 0) ? "was not found": "was found"} in ${tries} tries`);
}

main();
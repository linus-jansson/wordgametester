import * as fs from 'fs';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

type ResponseData = {letters: number[]} | { error: string };

async function parseResponse(response: Response) {
    const data = await response.json() as ResponseData;
    if ('error' in data) {
        return null;
    }
    return data.letters;
    
}

const days_elapsed_since_then = () => {
    const then = new Date(2024, 5, 19); // June is month 5 (0-indexed)
    const now = new Date();
    const diff = now.getTime() - then.getTime();
    const ONE_DAY_IN_MILISECONDS = 1000 * 3600 * 24;
    // Return diff in days
    return Math.floor(diff / ONE_DAY_IN_MILISECONDS);
}

// const MAGIC_NUMBER = 904 + days_elapsed_since_then();
const MAGIC_NUMBER = 906;

function craftFetchRequest(n: number, word: string, someId: number = 904) {
    return fetch(`${API_BASE_URL}?n=${n}&guess=${word}&id=${someId}`)
}

enum Letter {
    NotPresent = -1,
    WrongPosition = 0,
    CorrectPosition = 1
}


/*
    Filter function to remove words that are not possible based on the response:
        - If the number is -1, then the char in the current word is not present in the answer
            So remove it from the list of words.
        - If the number is 0, then the char is present but in the wrong position
            If the char exists in multiple positions, then the char may be in the correct position. do not remove it.
            If the char is in only one position in the words list, then remove it.
        - If the number is 1, then the char is present in the correct position
            The char is in the correct position, so do nothing.
*/
const filterFunction = (response_array: Letter[], candidate: string, word: string) => {
    const tested_chars = new Set<string>();
    for (let index = 0; index < response_array.length; index++) {
        const current_status = response_array[index];
        const current_char_in_word = word[index];
        const current_char_in_candidate = candidate[index];
        tested_chars.add(current_char_in_candidate);

        switch (current_status) {
            case Letter.NotPresent:
                if (candidate.includes(current_char_in_word)) {
                    console.log(`Filtering out ${candidate} because it contains ${current_char_in_word} which is not present.`);
                    return false;
                }
                break;
            case Letter.WrongPosition:
                if (current_char_in_candidate === current_char_in_word) {
                    console.log(`Filtering out ${candidate} because ${current_char_in_word} is in the wrong position.`);
                    return false;
                }
                break;
            case Letter.CorrectPosition:
                if (current_char_in_candidate !== current_char_in_word) {
                    console.log(`Filtering out ${candidate} because ${current_char_in_word} should be in position ${index}.`);
                    return false;
                }
                break;
            default:
                throw new Error("Invalid status");
        }
    }
    return true;
}


/*
    loop through list of words
    for each word, send a requst to the API
    

    repeat until response array is all 1's
*/
async function moreCalculatedGuess(words: string[]): Promise<{ correctWord: string, tries: number }> {
    let currentWordList = [...words];
    let tries = 0;

    while (currentWordList.length > 0) {
        const current_word = currentWordList[0];  // get first word in the list
        const res = await craftFetchRequest(tries, current_word, MAGIC_NUMBER); // Assume this sends an API request
        const letters = await parseResponse(res); // Parses the response

        console.log(`Trying word: ${current_word}, Remaining words: ${currentWordList.length}, Response: ${letters}`);

        if (letters === null) { // If the word is invalid, remove it and continue
            currentWordList = currentWordList.filter(candidate => candidate !== current_word);
            tries++;
            continue;
        }

        if (letters.every(status => status === 1)) { // All letters are correct
            return { correctWord: current_word, tries: tries + 1 }; // Return the correct word and number of tries
        } else {
            // Filter the list based on the response
            currentWordList = currentWordList.filter(candidate => filterFunction(letters, candidate, current_word));
        }
        
        tries++;
    }

    return { correctWord: "", tries: tries }; // Return empty string and tries if no word is correct
}



(async() => {
    console.log("MAGIC_NUMBER", MAGIC_NUMBER);
    let wordsList = JSON.parse(fs.readFileSync('words.json', 'utf8')) as string[];
    // scramble wordslist
    const {correctWord, tries} = await moreCalculatedGuess(wordsList);
    if (correctWord.length === 0) {
        console.log("Word not found");
        console.log("Tries: ", tries);
        return;
    }
    console.log("word ", `"${correctWord}"`, " was found in", tries, "tries");
})();
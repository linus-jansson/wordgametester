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

// loop through list of words
// for each word, send a requst to the API
// for each response, 
    // if any of the numbers in the response array is -1 then the char in the position of the word is not present in the answer.
    // if so, remove all words from the words list that has that char in any position.
    // if any number in the response array is 0, then the char is present but in the wrong position OR the char is in multiple positions. 
    // if so, remove all  words which only has that char in the position of the response array and the char is not in multiple places.
    // if any number in the response array is 1, then the char is present in the correct position. remove all words from the words list that does not have that char in the position of the response array.
// repeat until response array is all 1's
async function moreCalculatedGuess(words: string[]): Promise<{ correctWord: string, tries: number }> {
    let currentWordList = [...words];
    let index = 0;

    while (currentWordList.length > 0) {
        const word = currentWordList[0]; // Always picks the first word from the list
        const res = await craftFetchRequest(index, word, MAGIC_NUMBER); // Assume this sends an API request
        const letters = await parseResponse(res); // Parses the response

        console.log(currentWordList.length, "words left to guess", "word", word, "response", letters);

        if (letters === null) { // If the word is invalid, remove it and continue
            currentWordList = currentWordList.filter(candidate => candidate !== word);
            index++;
            continue;
        }

        if (letters.every(num => num === 1)) { // If all responses are 1, we found the correct word
            return { correctWord: word, tries: index + 1 };
        }

        // Filter words based on the response
        currentWordList = currentWordList.filter(candidate => {
            for (let i = 0; i < letters.length; i++) {
                if (letters[i] === -1) {
                    console.log("removing", word[i])
                    // Remove words containing this character if it should not be present at all
                    if (candidate.includes(word[i])) {
                        return false;
                    }
                } else if (letters[i] === 0) {
                    // Character is present but not in this position, remove words that only have this character in this position
                    if (candidate[i] === word[i] && !(candidate.split(word[i]).length > 1)) { // Split gives n+1 parts for n occurrences of the character
                        return true;
                    }
                } else if (letters[i] === 1) {
                    // Character must be in this exact position
                    if (candidate[i] !== word[i]) {
                        return false;
                    }
                }
            }
            return true;
        });

        index++;
    }

    return { correctWord: "", tries: index }; // Return empty string and tries if no word is correct
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
import fs from 'fs';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/guess';


async function parseResponse(response: Response) {
    const data = await response.json();
    return data.every((n: number) => n === 1)
}

const calculate_how_many_days_since_beginning = () => {
    // 28 december 2021
    const then = new Date(2021, 12, 28)
    const now = new Date();
    const diff = now.getTime() - then.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function craftFetchRequest(n: number, word: string, someId = "904") {
    return fetch(`${API_BASE_URL}?n=${n}&guess=${word}&id=${someId}`)
}

function wordSpray() {
    // load all words from words.json
    const words = JSON.parse(fs.readFileSync('words.json', 'utf8')) as string;

    Promise.all(
        Array.from(words, (word, i) => craftFetchRequest(i, word))
    ).then(async (responses) => {
        for (const response of responses) {
            const json = await response.json() as number[];
            // if all numbers in response are 1 then the word is correct
            if (json.every((n) => n === 1)) {
                console.log('Word is correct');
            } else {
                console.log('Word is incorrect');
            }
        }
    })
}
// loop through all words
// for each word, send a requst to the API
// for each response, 
    // if any of the numbers in the response array is -1 then the char in the position of the word is not present in the answer.
    // if so, remove all words from the words list that has that char in any position.
    // if any number in the response array is 0, then the char is present but in the wrong position.
    // if so, remove all words from the words list that has that char in the position of the response array.
// repeat until response array is all 1's
async function moreCalculatedGuess() {
    // load in words
    let words = JSON.parse(fs.readFileSync('words.json', 'utf8')) as string[];

    // loop through all words
    for (const word of words) {
        // send a request to the API for each word
        const response = await craftFetchRequest(words.indexOf(word), word);
        const json = await response.json() as number[];

        // check if any number in the response array is -1
        if (json.includes(-1)) {
            // remove all words from the words list that have the char in any position
            const charToRemove = word[json.indexOf(-1)];
            words = words.filter((w) => !w.includes(charToRemove));
        }

        // check if any number in the response array is 0
        if (json.includes(0)) {
            // remove all words from the words list that have the char in the position of the response array
            const charIndexToRemove = json.indexOf(0);
            words = words.filter((w) => w[charIndexToRemove] !== word[charIndexToRemove]);
        }

        // check if all numbers in the response array are 1
        if (json.every((n) => n === 1)) {
            console.log('Word is correct');
        } else {
            console.log('Word is incorrect');
        }
    }

    // repeat until response array is all 1's
}

function generateAllStrings(chars: string[]): string[] {
    const result: string[] = [];

    function backtrack(currentString: string, remainingLength: number) {
        if (remainingLength === 0) {
            result.push(currentString);
            return;
        }

        for (const char of chars) {
            backtrack(currentString + char, remainingLength - 1);
        }
    }

    backtrack('', 5);

    return result;
}

// Spray and pray ahh type shit
// probably a very bad idea to send 118,755 requests compared to roughly 14,505 each day
async function bruteForceWords() {
    // Brute force all alphabetical chars in all positions
    const chars = 'abcdefghijklmnopqrstuvwxyzåäö'.split('');

    // loop through all combination
    const longAssWordList = generateAllStrings(chars);

    const veryBigPromise = Promise.all(
        Array.from(longAssWordList, (word, i) => craftFetchRequest(i, word))
    ).then(async (responses) => {
        for (const response of responses) {
            const json = await response.json() as number[];
            // if all numbers in response are 1 then the word is correct
            if (json.every((n) => n === 1)) {
                console.log('Word is correct');
            } else {
                console.log('Word is incorrect');
            }
        }
    })
    ;

    // send request to api for each word
    for (const word of longAssWordList) {
        const response = await craftFetchRequest(longAssWordList.indexOf(word), word);
        const json = await response.json() as number[];

        // check if all numbers in the response array are 1
        if (json.every((n) => n === 1)) {
            console.log('Word is correct');
        } else {
            console.log('Word is incorrect');
        }
    }
}

console.log("Days since start? (this shit is wrong) ,", calculate_how_many_days_since_beginning());
// wordSpray();
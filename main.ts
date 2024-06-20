import fs from 'fs';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/guess';

type ResponseData = {letters: number[]} | { error: string };

async function parseResponse(response: Response) {
    const data = await response.json() as Number[];
    return data.every((n) => n === 1)
}

const days_elapsed_since_then = () => {
    const then = new Date(2024, 5, 19); // June is month 5 (0-indexed)
    const now = new Date();
    const diff = now.getTime() - then.getTime();
    // Return diff in days
    return Math.floor(diff / (1000 * 3600 * 24));
}

const MAGIC_NUMBER = 904 + days_elapsed_since_then();


function craftFetchRequest(n: number, word: string, someId: number = 904) {
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
    // repeat until response array is all 1's
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        console.log("Word: ", word);
        console.log("Words left: ", words.length);

        // Send a request to the API for each word
        const response = await craftFetchRequest(i, word, MAGIC_NUMBER);
        const json = await response.json() as ResponseData;
        console.log(json);

        if ("error" in json && json?.error === "INVALID_WORD") {
            console.error("INVALID_WORD");
            continue;
        }

        if ("letters" in json) {
            const responseArray = json?.letters;

            // Filter words based on response array conditions
            words = words.filter((w) => {
                // Check if any number in the response array is -1
                if (responseArray.includes(-1)) {
                    const charToRemove = word[responseArray.indexOf(-1)];
                    if (w.includes(charToRemove)) return false;
                }

                // Check if any number in the response array is 0
                if (responseArray.includes(0)) {
                    const charIndexToRemove = responseArray.indexOf(0);
                    if (w[charIndexToRemove] === word[charIndexToRemove]) return false;
                }

                return true;
            });

            // Check if all numbers in the response array are 1
            if (responseArray.every((n) => n === 1)) {
                console.log('Word is correct');
                break;
            } else {
                console.log('Word is incorrect');
            }
        }

        console.log("Words left: ", words.length);
    }
}

console.log("more better since behinning", MAGIC_NUMBER);
moreCalculatedGuess();
// wordSpray();
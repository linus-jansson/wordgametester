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

function shuffle(array: any[]) {
    let temp_list = [...array];
    let currentIndex = temp_list.length;
  
    while (currentIndex != 0) {
  
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      [temp_list[currentIndex], temp_list[randomIndex]] = [temp_list[randomIndex], temp_list[currentIndex]];
    }

    return temp_list;
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

// loop through list of words
// for each word, send a requst to the API
// for each response, 
    // if any of the numbers in the response array is -1 then the char in the position of the word is not present in the answer.
    // if so, remove all words from the words list that has that char in any position.
    // if any number in the response array is 0, then the char is present but in the wrong position.
    // if so, remove all words from the words list that has that char in the position of the response array.
    // if any number in the response array is 1, then the char is present in the correct position. remove all words from the words list that does not have that char in the position of the response array.
// repeat until response array is all 1's
async function moreCalculatedGuess(words: string[]): Promise<{correctWord: string, tries: number}> {
    let currentWordList = [...words];

    let index = 0;
    while (currentWordList.length > 0) {
        const word = currentWordList[0];
        const res = await craftFetchRequest(index, word, MAGIC_NUMBER);
        const letters = await parseResponse(res);
        
        // remove word if response was an invalid word eg
        if (letters === null) {
            currentWordList = currentWordList.filter(candidate => candidate !== word);
            continue;
        }

        if (letters.every(num => num === 1)) {
            // return word and number of tries
            return {correctWord: word, tries: index + 1};
        }

        currentWordList = currentWordList.filter(candidate => {
            for (let i = 0; i < letters.length; i++) {
                if (letters[i] === -1 && candidate.includes(word[i])) {
                    return false;
                }
                if (letters[i] === 0 && candidate[i] === word[i]) {
                    return false;
                }
                if (letters[i] === 1 && candidate[i] !== word[i]) {
                    return false;
                }
            }

            for (let i = 0; i < letters.length; i++) {
                if (letters[i] === 0 && !candidate.includes(word[i])) {
                    return false;
                }
            }

            return true;
        });

        index++;
    }

    return {correctWord: "", tries: index + 1};;
}

// async function doThisThousandTimesAndFindTheAvaerageWhenScramblingWords(inputList: string[], numberOfTimes: number) {
//     let wordsList = [...inputList];
//     let totalTries = 0;
//     let failedAttempts = 0;
//     for (let i = 0; i < numberOfTimes; i++) {
//         let scrambledWordsList = shuffle([...wordsList]);
//         const {correctWord, tries} = await moreCalculatedGuess(scrambledWordsList);
//         if (i % 10 === 0) {
//             console.log("Number of times run: ", i);
//         }
        
//         if (correctWord.length === 0) {
//             failedAttempts++;
//         }

//         totalTries += tries;
//     }
//     return {
//         totalTries: totalTries,
//         failedAttempts: failedAttempts,
//         average : totalTries / numberOfTimes
//     }
// }

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
    // console.log("word ", correctWord, "found in", tries, "tries");
    // console.log("Finding Average tries when scrambling words list...");
    // const run_for = 100;
    // const {totalTries, failedAttempts, average} = await doThisThousandTimesAndFindTheAvaerageWhenScramblingWords(wordsList, run_for);
    // console.log("total tries", totalTries, "Average tries when scrambling words: ", average, "Failed attempts: ", failedAttempts, "out of", run_for, "runs");
})();
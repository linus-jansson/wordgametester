import { DebugOptions, ResponseData } from "./types";

export enum LETTER { WRONG = -1, KINDA = 0, CORRECT = 1 }

async function parseResponse(response: Response) {
    const data = await response.json() as ResponseData;
    if ('error' in data) {
        return null;
    }
    return data.letters;
}

function craftFetchRequest(n: number, word: string, someId: number = 904, API_BASE_URL: string) {
    return fetch(`${API_BASE_URL}?n=${n}&guess=${word}&id=${someId}`)
}

export const isCorrectAnswer = (num_array: LETTER[]) =>  num_array.reduce((acc, val) => acc + val, 0) === 5;
export const filterIncorrectWords = (result_num_array: LETTER[], attempted_word: string, candidate_word: string): boolean => {
    /*
        Filter function to remove words that are not possible based on the response:
        - If the number is 0 or if the number is -1,
            The char may exists but is in the wrong position. Remove all words which has that char in that position.
        - If the number is 1, then the char is present in the correct position
            The char is in the correct position, so do nothing.
    */
    for (let i = 0; i < result_num_array.length; i++) {
        const currentStatus = result_num_array[i];

        switch (currentStatus) {
            case LETTER.CORRECT:
                if (candidate_word[i] !== attempted_word[i]) return false;
                break;
            case LETTER.KINDA:
            case LETTER.WRONG:
                if (candidate_word[i] === attempted_word[i]) return false;
                break;
            default:
                return false;  // Invalid response value
        }
    }
    return true;
};

export function shuffle(array: any[]) {
    let temp_list = [...array];
    let currentIndex = temp_list.length;

    while (currentIndex != 0) {

      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [temp_list[currentIndex], temp_list[randomIndex]] = [temp_list[randomIndex], temp_list[currentIndex]];
    }

    return temp_list;
}

export const days_elapsed_since_then = () => {
    const then = new Date(2024, 5, 19); // June is month 5 (0-indexed)
    const now = new Date();
    const diff = now.getTime() - then.getTime();
    const ONE_DAY_IN_MILISECONDS = 1000 * 3600 * 24;
    // Return diff in days
    return Math.floor(diff / ONE_DAY_IN_MILISECONDS);
}


export async function simulatedParseResponse(guessedWord: string, correctWord: string): Promise<number[] | null> {
    if (guessedWord.length !== correctWord.length) {
        return null;
    }
    
    const guessedWordArray = guessedWord.split('');
    const correctWordArray = correctWord.split('');
    const result = new Array(guessedWordArray.length).fill(LETTER.WRONG);

    const correctCount: Record<string, number> = {};
    const guessedCount: Record<string, number> = {};

    // First pass: identify correct letters
    guessedWordArray.forEach((char, index) => {
        if (char === correctWordArray[index]) {
            result[index] = LETTER.CORRECT;
            correctCount[char] = (correctCount[char] || 0) + 1;
        }
    });

    // Second pass: identify kinda correct letters
    guessedWordArray.forEach((char, index) => {
        if (result[index] !== LETTER.CORRECT) {
            const correctLetterCount = correctWordArray.filter(c => c === char).length;
            const correctOccurrences = correctCount[char] || 0;
            const guessedOccurrences = guessedCount[char] || 0;

            if (guessedOccurrences < correctLetterCount - correctOccurrences) {
                result[index] = LETTER.KINDA;
                guessedCount[char] = (guessedCount[char] || 0) + 1;
            }
        }
    });

    return result;
}

export async function findCorrectWord(words: string[], options: DebugOptions): Promise<{ correctWord: string, tries: number }> {
    let wordsList = [...words];
    let tries = 0;

    while (wordsList.length > 0) {
        const guessedWord = wordsList[0];  // get first word in the list
        let result_num_array: number[] | null = null;
        if (options?.debug) {
            result_num_array = await simulatedParseResponse(guessedWord, options.correct_word);

        } else {
            const res = await craftFetchRequest(tries, guessedWord, options?.MAGIC_NUMBER, options.API_BASE_URL); // Assume this sends an API request
            result_num_array = await parseResponse(res); // Parses the response
        }

        if (result_num_array === null) { // If the word is invalid, remove it and continue
            wordsList = wordsList.filter(candidate => candidate !== guessedWord);
        }
        else if (isCorrectAnswer(result_num_array)) { 
            return { correctWord: guessedWord, tries: tries + 1 }; // Return the correct word and number of tries
        } 
        else {
            // Filter the list based on the response
            wordsList = wordsList.filter(candidate => filterIncorrectWords(result_num_array, guessedWord, candidate));
        }
        
        tries++;
    }
    return { correctWord: "", tries: tries }; // Return empty string and tries if no word is correct
}

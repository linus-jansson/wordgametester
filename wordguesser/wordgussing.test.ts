import {describe, expect, test} from '@jest/globals';
import { findCorrectWord, shuffle } from './util';

import * as fs from 'fs';

const sum = (a: number, b: number) => a + b;

describe('sum module', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
});

describe('shuffle module', () => {
    test('shuffles an array', () => {
        const shuffled = shuffle([1, 2, 3, 4, 5]);
        expect(shuffled).not.toEqual([1, 2, 3, 4, 5]);
    });

    test('shuffles long array', () => {
        const original_array = Array.from({length: 100}, (_, i) => i);
        const shuffled = shuffle(original_array);
        expect(shuffled).not.toEqual(original_array);
    });
});

describe('wordguesser module',() => {
    test('find correct word from shuffled list', async () => {
        const words = Object.freeze(JSON.parse(fs.readFileSync('../words/all-words.json', 'utf8'))) as string[];

        const shuffledList = shuffle(words);
        const randomWords = shuffledList.slice(0, 50);
        for (const word of randomWords) {
            const {correctWord, tries} = await findCorrectWord(words, { debug: true, correct_word: word, MAGIC_NUMBER: 0, API_BASE_URL: ''});
            expect(tries).toBeLessThanOrEqual(words.length);
            expect(correctWord).toBe(word);
        }
    });

    test('find correct word when word includes å, ä or ö', async () => {
        const words = Object.freeze(JSON.parse(fs.readFileSync('../words/all-words.json', 'utf8'))) as string[];
        const correctWords = ["valör", "affär", "aktör"];
        for (const correctWord of correctWords) {
            const {correctWord: guessedCorrectWord, tries} = await findCorrectWord(words, { debug: true, correct_word: correctWord, MAGIC_NUMBER: 0, API_BASE_URL: ''});
            expect(guessedCorrectWord).toBe(correctWord);
        }
    });
})
import { test } from '@playwright/test';
import fs from 'fs/promises';

const CONQURENT_PAGES = 30;
const BASE_URL = 'https://www.kryssakuten.se';
const PAGE_URL = BASE_URL + '/ord-som-inneh%C3%A5ller/%3F%3F%3F%3F%3F?minletters=5&maxletters=5';

test('get all words parallel', async ({ browser }) => {
    test.setTimeout(0);
    const collectedWords: string[] = [];
    const invalidWords: string[] = [];
    const pageUrls: string[] = [];
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1080, height: 720 });
    await page.goto(PAGE_URL);
    const cookie_accept = page.getByText("Jag samtycker");
    await cookie_accept.click();

    const allPageNumberElements = await page.locator('.pagenumber').all();
    const lastRealPageNumber = parseInt(await allPageNumberElements[allPageNumberElements.length - 2].innerText(), 10);
    console.log("Last real page number:", lastRealPageNumber);
    // Collect all page URLs
    for (let i = 1; i <= lastRealPageNumber; i++) {
        const url = `${PAGE_URL}&pageno=${i}`;
        pageUrls.push(url);
    }

    await page.close();

    const scrapePage = async (url: string): Promise<void> => {
        const page = await browser.newPage();

        try {
            await page.goto(url);

            const links = await page.$$('.search-result-word-box>a:first-child');
            const hrefs = await Promise.all(links.map(async (link) => await link.getAttribute('href')));

            for (const link of hrefs) {
                if (!link || !link.includes("/ord/")) {
                    continue;
                }

                let word = link.split("/").pop();

                if (!word) {
                    continue;
                }

                if (word.includes("%")) {
                    word = decodeURIComponent(word);
                }

                if (word.length !== 5) {
                    continue;
                }

                if (word.match(/[^a-zåäö]/i)) {
                    if (!invalidWords.includes(word)) {
                        invalidWords.push(word);
                    }
                } else {
                    if (!collectedWords.includes(word)) {
                        collectedWords.push(word);
                    }
                }
            }

            // Print the accumulated words immediately
            console.log(`Scraped from ${url}\n Accumulated valid words: ${collectedWords.length}\n Accumulated invalid words: ${invalidWords.length}\n Total accumulated words: ${collectedWords.length + invalidWords.length}`);
        } finally {
            await page.close();
        }
    };

    const { default: pLimit } = await import('p-limit');
    const limit = pLimit(CONQURENT_PAGES);

    // Scrape all pages with controlled concurrency
    const scrapePromises = pageUrls.map(url => limit(() => scrapePage(url)));
    await Promise.all(scrapePromises);

    // Remove duplicates and write to files
    const uniqueWords = [...new Set(structuredClone(collectedWords).sort())];
    await fs.writeFile('../words/valid-words.json', JSON.stringify(uniqueWords), { encoding: 'utf8' });

    const uniqueInvalidWords =  [...new Set(structuredClone(invalidWords).sort())];
    await fs.writeFile('../words/invalid-words.json', JSON.stringify(uniqueInvalidWords), { encoding: 'utf8' });

    const uniqueAllWords =  [...new Set(uniqueWords.concat(uniqueInvalidWords).sort())];
    await fs.writeFile('../words/all-words.json', JSON.stringify(uniqueAllWords), { encoding: 'utf8' });
});
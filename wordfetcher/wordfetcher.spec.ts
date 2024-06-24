import { test, expect } from '@playwright/test';
import fs from 'fs';

test('get all words', async ({ page }) => {
    test.setTimeout(0);
    page.setViewportSize({ width: 1080, height: 720 });
    
    const baseUrl = 'https://www.kryssakuten.se';
    const pageUrl = baseUrl + '/ord-som-inneh%C3%A5ller/%3F%3F%3F%3F%3F?minletters=5&maxletters=5'
    const collectedWords:any = [];
    let isLastPage = false;
    await page.goto(pageUrl);
    const cookie_accept = await page.getByText("Jag samtycker");
    await cookie_accept.click();

    const allPageNumberElements = await page.locator('.pagenumber').all();
    const lastRealPageNumber = await allPageNumberElements[allPageNumberElements.length - 2].innerText();
    
    while (!isLastPage) {
        const pagnition_next = await page.getByText("Nästa").first();
        const pagnition_next_href = await pagnition_next.getAttribute('href');
        const parsedNextUrl = new URL(pagnition_next_href!, baseUrl);
        // get query params
        const searchParams = parsedNextUrl.searchParams;
        const nextClickPageNumber = searchParams.get('pageno')!;

        // collect all links which href includes "/ord/"
        const links = await page.$$('a');

        for (const link of links) {
            const href = await link.getAttribute('href');
            if (!href || !href.includes("/ord/")) {
                continue;
            }

            const word = href.split("/").pop();

            if (!word)
            {
                console.log("Skipping word -", href, word)
                continue;
            }
            
            if (word.length < 5 || word.length > 5)
            {
                console.log("Skipping word -", href, word)
                continue;
            }


            // if word contains any non-alphabetic characters, skip it
            if (word.match(/[^a-zåäö]/i)) {
                console.log("Skipping word -", href, word)
                continue;
            }

            // check if word is url encoded or not and decode it
            if (word.includes("%")) {
                const decodedWord = decodeURIComponent(word);
                collectedWords.push(decodedWord);
            } else {
                collectedWords.push(word);
            }

            console.log("Adding new word -", href, collectedWords[collectedWords.length - 1])
        }

        // if currentpage is the last page, break the loop
        const get_current_page = page.locator('.pagenumbercurrent').first();
        const current_page = await get_current_page.innerText();
        console.log("Current page", current_page, "Next page", nextClickPageNumber, "max page", lastRealPageNumber, "collected words", collectedWords.length)

        if (current_page === nextClickPageNumber) {
            isLastPage = true;
            break;
        }

        await page.goto(baseUrl + pagnition_next_href);
        // repeat the same process for the next page
    }

    // filter out duplicates
    const uniqueWords = [...new Set(collectedWords)];
    
    fs.writeFileSync('words.json', JSON.stringify(uniqueWords));

    // Expect a title "to contain" a substring.
    await expect(collectedWords.length).toBeCloseTo(14505);
});
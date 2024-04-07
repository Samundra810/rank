import puppeteer from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import cheerio from 'cheerio';
import fs from 'fs';

// Custom function to compute the uule parameter based on location name
function getUule(locationName) {
    const sanitizedLocation = locationName.replace(/ /g, '+');
    const encodedLocation = encodeURIComponent(sanitizedLocation);
    return `w+CAIQICI${encodedLocation}`;
}

async function fetchSearchResults(query, maxResults = 100, locationName) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        const uule = getUule(locationName); // Use the defined getUule function
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&uule=${uule}`;

        console.log('Google Search URL:', googleUrl);

        let results = [];
        let currentCount = 0;
        let scrollCount = 0;

        while (currentCount < maxResults && scrollCount < 10) {
            await page.goto(`${googleUrl}&start=${scrollCount * 10}`);

            const html = await page.content();
            const $ = cheerio.load(html);

            $('div.g:not(.Wt5Tfe div.g)').each((index, element) => {
                const titleElement = $(element).find('h3');
                const linkElement = $(element).find('a');

                const title = titleElement.text().trim();
                const href = linkElement.attr('href');

                if (title && href) {
                    results.push({ title, href });
                    currentCount++;
                }

                if (currentCount >= maxResults) {
                    return false;
                }
            });

            scrollCount++;
        }

        return results.slice(0, maxResults);
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    } finally {
        await browser.close();
    }
}

async function saveResultsToFile(results, filePath) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
        console.log(`Search results saved to ${filePath}`);
    } catch (error) {
        console.error('Error saving results to file:', error);
    }
}

async function main() {
    const query = 'stock market training';
    const outputFile = './results.json';
    const maxResults = 100;
    const locationName = 'India';

    try {
        puppeteer.use(stealthPlugin());
        const results = await fetchSearchResults(query, maxResults, locationName);
        await saveResultsToFile(results, outputFile);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();

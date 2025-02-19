import puppeteer from "puppeteer";

export const scrapePage = async (url: string): Promise<string | null> => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: "domcontentloaded" });

        // Extract only visible text
        const textContent = await page.evaluate(() => {
            const elements = document.querySelectorAll("body *");
            return Array.from(elements)
                .map(el => el.textContent?.trim())
                .filter(text => text) // Remove empty values
                .join(" ");
        });

        await browser.close();
        return textContent;
    } catch (error) {
        console.error(`Error scraping page ${url}:`, error);
        return null;
    }
};

// Example usage
//scrapePage("https://example.com").then(console.log);

//THis snippet should not be used atm for fetching semantic info as it also retains scripts and other excess information

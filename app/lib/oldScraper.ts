//import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";

// const scrapePage = async (url: string) => {
//     try {
//         const loader = new PuppeteerWebBaseLoader(url, {
//             launchOptions: { headless: true },
//             gotoOptions: { waitUntil: "domcontentloaded" },
//             evaluate: async (page, browser) => {
//                 const result = await page.evaluate(() => document.body.innerHTML);
//                 await browser.close();
//                 return result;
//             }
//         });
//         return (await loader.scrape())?.replace(/<[^>]*>?/gm, "");
//     } catch (error) {
//         console.error(`Error scraping page ${url}:`, error);
//         return null;
//     }
// };
const { convert } = require('html-to-text');
import fetch from 'node-fetch';

//THIS snippet is optimized for scraping a web page for its semantic data that is relevant for an AI model,
//the result is a clean string that is devoid of any excess information

const options = { 
    wordwrap: 130,
    ignoreHref: true,  // Ignore hyperlinks
    ignoreImage: true, // Ignore images
    selectors: [
        { selector: 'a', options: { ignoreHref: true } }, // Keep text inside links but remove the href
        { selector: 'script', format: 'skip' }, // Remove scripts
        { selector: 'style', format: 'skip' }, // Remove styles
        { selector: 'nav', format: 'skip' }, // Remove navigation elements
        { selector: '.sidebar', format: 'skip' }, // Remove potential sidebar elements
        { selector: 'ul', format: 'block' }, // Ensure lists are formatted as text blocks
        { selector: 'ol', format: 'block' }, // Ordered lists as text blocks
        // { selector: 'li', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } }, // Ensure list items don’t create gaps
    ]
};

export const scrapePage = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const html = await response.text();
        let text = convert(html, options);

        // Remove excessive empty lines (more than 2 consecutive newlines)
        text = text.replace(/\n{3,}/g, '\n\n');

        // Trim unnecessary leading/trailing whitespace
        text = text.trim();
        
        return text;
    } catch (error) {
        console.error(`Error scraping page ${url}:`, error);
        return null;
    }
};

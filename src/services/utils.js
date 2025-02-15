const puppeteer = require('puppeteer-core');
const chromium = require('chromium');

exports.getDataFromUrl = async (url) => {
    const browser = await puppeteer.launch({
        executablePath: chromium.path, // Usa o Chromium do Render
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setRequestInterception(true);
    page.on('request', (req) => {
    if (['stylesheet', 'font', 'image'].includes(req.resourceType())) {
        req.abort();
    } else {
        req.continue();
    }
});

    
    await page.goto(`https://www.gsmarena.com${url}`, { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    
    await browser.close();
    return html;
};



exports.getPrice = (text) => {
    const value = text.replace(',', '').split(' ');
    return {
        currency: value[0],
        price: parseFloat(value[1]),
    };
};

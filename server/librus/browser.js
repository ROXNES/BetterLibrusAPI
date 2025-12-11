import puppeteer from "puppeteer";

export async function puppeteerLogin() {
    const browser = await puppeteer.launch({
        headless: false
    });

    const page = await browser.newPage();

    await page.goto('https://adfslight.edukacja.gorzow.pl/LoginPage.aspx?ReturnUrl=%2f%3fwa%3dwsignin1.0%26wtrealm%3dhttps%253a%252f%252faplikacje.edukacja.gorzow.pl%253a443%252f%26wctx%3drm%253d0%2526id%253dpassive%2526ru%253d%25252f%26wct%3d2025-11-03T20%253a54%253a46Z%26rt%3d0%26rs%3d1%26fr%3d1');

    await page.type('#Username', process.env.lib_Username);

    await page.type('#Password', process.env.lib_Password);
    
    await page.click('button.submit-button.box-line');

    await page.waitForSelector('figure.figureContainer.gorzowyellow');

    await page.click('figure.figureContainer.gorzowyellow');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    console.log(await page.$eval('body', el => el.outerHTML));

    await page.close();
}
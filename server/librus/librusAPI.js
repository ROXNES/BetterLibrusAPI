import puppeteer from "puppeteer";

export default class LibrusAPI {
    constructor(browser) {
        this.browser = browser;
    }

    static async create() {
        const browser = await puppeteer.launch({
            headless: false
        });

        return new LibrusAPI(browser);
    }

    async autoLogIn() {
        const page = await this.#login();

        const grades = await this.#gradesParse(page);

        await page.close();
    }

    async getGrades() {
        const page = await this.#login();

        const grades = await this.#gradesParse(page);

        await page.close();

        return grades;
    }

    async getMessages() {
        const page = await this.#login();

        const messages = await this.#messagesParse(page);

        await page.close();

        return messages;
    }

    async getMessageContent(messageContentPath) {
        const page = await this.#login();

        const messageContent = await this.#messageContentParse(page, messageContentPath);

        await page.close();

        return messageContent;
    }

    async getAnnouncements(){

        const page = await this.#login();

        const announcements = await this.#parseAnnouncements(page);

        await page.close();

        return announcements;

    }

    async #login() {
        const page = await this.browser.newPage();

        await page.goto('https://adfslight.edukacja.gorzow.pl/LoginPage.aspx?ReturnUrl=%2f%3fwa%3dwsignin1.0%26wtrealm%3dhttps%253a%252f%252faplikacje.edukacja.gorzow.pl%253a443%252f%26wctx%3drm%253d0%2526id%253dpassive%2526ru%253d%25252f%26wct%3d2025-11-03T20%253a54%253a46Z%26rt%3d0%26rs%3d1%26fr%3d1');
        await page.type('#Username', process.env.lib_Username);
        await page.type('#Password', process.env.lib_Password);
        page.click('button.submit-button.box-line');
        await page.waitForSelector('figure.figureContainer.gorzowyellow');
        page.click('figure.figureContainer.gorzowyellow');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        return page;
    }
    async #parseAnnouncements(page){

        page.click('#icon-ogloszenia');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        const announcementTopics = await page.$$eval('table.decorated.big.center.printable.margin-top > thead > tr > td', 
            tds => tds.map(td=>td.textContent.trim())
        );

        const announcementContents = await page.$$eval('table.decorated.big.center.printable.margin-top > tbody', 
            bodies => bodies.map(body => {
                const author = body.children[0].children[1].textContent.trim();
                const message = body.children[2].children[1].textContent.trim();
                const date = body.children[1].children[1].textContent.trim();

                return [
                    author,
                    message,
                    date
                ]
            })
        );
        
        const finalObject = [];

        for (let i = 0; i < announcementTopics.length; i++) {
            finalObject.push([
                announcementTopics[i],
                announcementContents[i][0],
                announcementContents[i][1],
                announcementContents[i][2]
            ]);
        }

        return finalObject;
    }

    async #gradesParse(page) {
        const subjects = await page.$$eval('tbody > tr:not(:has(table)):not([class^="przedmioty_"]):not(.detail-grades):not(.bolded)', 
            trs => {
                const filtered = trs
                .filter(tr => tr.children.length >= 2)
                .map(tr => Array.from(tr.children).map(td => td.textContent.trim()));
                return filtered.slice(3, filtered.length - 4);
            }
        );

        const subjectNames = [];
        const semester1Grades = [];
        const proposedMidtermGrades = [];
        const midtermGrades = [];
        const semester2Grades = [];
        const proposedFinalGrades = [];
        const finalGrades = [];

        for (let i = 0; i < subjects.length; i++) {
            let subject = subjects[i]
            if(subject.length <= 5) {
                subjects.splice(i, 1);
            }
            subject = subject.slice(1);
            subject.splice(2, 1);
            subject.splice(5, 1);
            subject.splice(6, 1);
            subjects[i] = subject;
            subjectNames.push(subject[0]);
            let grades = subject[1].split('\n');
            for (let j = 0; j < grades.length; j++) {
                grades[j] = grades[j].trim();
            }
            semester1Grades.push(grades);
            proposedMidtermGrades.push(subject[2]);
            midtermGrades.push(subject[3]);
            grades = subject[4].split('\n');
            for (let j = 0; j < grades.length; j++) {
                grades[j] = grades[j].trim();
            }
            semester2Grades.push(grades);
            proposedFinalGrades.push(subject[5]);
            finalGrades.push(subject[6]);
        }
        const finalObject = []
        
        for (let i = 0; i < subjectNames.length; i++) {
            finalObject.push([
                subjectNames[i],
                semester1Grades[i],
                proposedMidtermGrades[i],
                midtermGrades[i],
                semester2Grades[i],
                proposedFinalGrades[i],
                finalGrades[i]
            ]);
        }
        
        return finalObject;
    }

    async #messagesParse(page) {
        page.click('#icon-wiadomosci');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        const messages = await page.$$eval('table.decorated.stretch > tbody > tr', 
            trs => {
                const filtered = trs
                .map(tr => {
                    const cells = Array.from(tr.children).map(td => td.textContent.trim()).filter(td => td !== '')
                    cells.push(tr.children[2].children[0].getAttribute('href'));
                    return cells;
                });
                return filtered;
            }
        );

        return messages;
    }

    async #messageContentParse(page, messageContentPath) {
        await page.goto('https://synergia.librus.pl' + messageContentPath);

        const messageInfo = await page.$$eval('td > table.stretch > tbody > tr:has(.medium.left)',
             trs => {
                const filtered = trs
                .map(tr => tr.children[1].textContent.trim());
                return filtered;
            }
        );

        const messagecontent = await page.$eval('.container-message-content',
            content => content.textContent.trim()
        );

        return {
            messageInfo,
            messagecontent
        }
    }
}
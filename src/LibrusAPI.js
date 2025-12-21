import puppeteer from "puppeteer-extra";
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export default class LibrusAPI {
    #credentialsArray;

    constructor(credentialsArray) {
        this.#credentialsArray = credentialsArray;
    }

    async getAllData() {
        const result = await Promise.all(
            this.#credentialsArray.map(async credentials => {
                let browser;
                try {
                    browser = await this.#createBrowser();

                    const page = await this.#login(browser, credentials);

                    const grades = await this.#getGrades(page);

                    await this.#gotoMessages(page);

                    const messages = await this.#messagesParse(page);

                    const announcements = await this.#announcementsParse(page);

                    return {grades, messages, announcements};
                }finally{
                    if (browser){
                        await browser.close();
                    }
                }
            })
        );

        return result;
    }

    async getGrades(credentials) {
        return this.#withBrowser(credentials, async page => 
            this.#getGrades(page)
        );
    }

    async getGradeInfo(credentials, gradeInfoPath) {
        return this.#withBrowser(credentials, async page => {
            await page.goto('https://synergia.librus.pl' + gradeInfoPath);
            return this.#gradeInfoParse(page);
        });
    }

    async getMessages(credentials) {
        return this.#withBrowser(credentials, async page => {
            await this.#gotoMessages(page);
            return this.#messagesParse(page);
        });
    }

    async getMessageContent(credentials, messageContentPath) {
        return this.#withBrowser(credentials, async page => {
            await page.goto('https://synergia.librus.pl' + messageContentPath);
            return this.#messageContentParse(page, messageContentPath);
        });
    }

    async getAnnouncements(credentials){
        return this.#withBrowser(credentials, async page => 
            this.#announcementsParse(page)
        );
    }

    async sendMessage(credentials, addressee, topic, message) {
        const addresseeSplit = addressee.trim().replaceAll(',', '').split(' ');

        if (addresseeSplit.length < 2) return;

        return this.#withBrowser(credentials, async page => {
            await this.#gotoMessages(page);
            return this.#sendMessage(page, addresseeSplit, topic, message);
        });
    }

    async #login(browser, credentials) {
        const page = await browser.newPage();

        await page.goto('https://synergia.librus.pl/loguj/gorzow_wlkp');
        await page.waitForSelector('#Username');
        await page.type('#Username', credentials[0]);
        await page.type('#Password', credentials[1]);
        page.click('button.submit-button.box-line');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        return page;
    }

    async #getGrades(page) {
        const subjects = await this.#getSubjects(page);

        return this.#gradesParse(subjects);
    }
    
    async #getSubjects(page) {
        return page.$$eval('tbody > tr:not(:has(table)):not([class^="przedmioty_"]):not(.detail-grades):not(.bolded)', 
            trs => {
                const filtered = trs
                .filter(tr => tr.children.length >= 2)
                .map(tr => Array.from(tr.children).map(td => {
                    const grades = td.textContent.trim().split('\n');
                    const gradePaths = []
                    for (let i = 0; i < grades.length; i++) {
                        grades[i] = grades[i].trim();
                        gradePaths.push(td.children[i]?.children[0]?.getAttribute('href'))
                    }

                    const gradeArray = [];

                    for (let i = 0; i < grades.length; i++) {
                        gradeArray.push([
                            grades[i],
                            gradePaths[i]
                        ]);
                    }

                    return gradeArray;
                }));
                const EMPTY_BEGINNING = 3;
                const EMPTY_END = filtered.length - 4;
                return filtered.slice(EMPTY_BEGINNING, EMPTY_END);
            }
        );
    }

    #gradesParse(subjects) {
        const subjectNames = [];
        const semester1Grades = [];
        const proposedMidtermGrades = [];
        const midtermGrades = [];
        const semester2Grades = [];
        const proposedFinalGrades = [];
        const finalGrades = [];


        subjects = subjects.filter(subject => subject.length > 5);
        for (let subject of subjects) {
            subject = subject.slice(1);

            const EMPTY_INDEXES = [8, 6, 2];

            for (const index of EMPTY_INDEXES) {
                subject.splice(index, 1);
            }
            subject[0] = subject[0][0];
            subjectNames.push(subject[0][0]);
            semester1Grades.push(subject[1]);
            proposedMidtermGrades.push(subject[2][0]);
            midtermGrades.push(subject[3][0]);
            semester2Grades.push(subject[4][0]);
            proposedFinalGrades.push(subject[5][0]);
            finalGrades.push(subject[6][0]);
        }
        const finalObject = []
        
        for (let i = 0; i < subjectNames.length; i++) {
            finalObject.push({
                name: subjectNames[i],
                semester1Grades: semester1Grades[i],
                proposedMidtermGrades: proposedMidtermGrades[i],
                midtermGrades: midtermGrades[i],
                semester2Grades: semester2Grades[i],
                proposedFinalGrades: proposedFinalGrades[i],
                finalGrades: finalGrades[i]
            });
        }

        return finalObject;
    }

    async #gradeInfoParse(page) {
        const gradeInfo = await page.$$eval('table.decorated.medium.center > tbody > tr > td',
            tds => tds.map(td => {
                return (td.textContent.trim() !== '') ? td.textContent.trim() : ((td.children[0].getAttribute('src') == '/images/aktywne.png') ? true : false);
            })
        )

        return {
            grade: gradeInfo[0],
            category: gradeInfo[1],
            date: gradeInfo[2],
            subjectTeacher: gradeInfo[3],
            subject: gradeInfo[4],
            author: gradeInfo[5],
            comment: gradeInfo[6]
        };
    }

    async #messagesParse(page) {
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

        const finalObject = []

        for (let i = 0; i < messages.length; i++) {
            finalObject.push({
                author: messages[i][0],
                topic: messages[i][1],
                date: messages[i][2],
                path: messages[i][3]
            });
        }

        return finalObject;
    }

    async #messageContentParse(page) {
        const messageInfo = await page.$$eval('td > table.stretch > tbody > tr:has(.medium.left)',
             trs => {
                const filtered = trs
                .map(tr => tr.children[1].textContent.trim());
                return filtered;
            }
        );

        const message = await page.$eval('.container-message-content',
            content => content.textContent.trim()
        );

        return {
            author: messageInfo[0],
            topic: messageInfo[1],
            date: messageInfo[2],
            message
        }
    }

    async #gotoMessages(page) {
        page.click('#icon-wiadomosci');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });
    }

    async #sendMessage(page, addressee, topic, message) {
        page.click('a#wiadomosci-napisz.button.left.blue');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        let found = false;

        let index = 0;

        const AMOUNT_OF_SECTIONS = 7;

        while (!found && index <= AMOUNT_OF_SECTIONS) {
            await page.reload();
            await this.#clickAddresseesSection(page, index);
            found = await this.#checkAddressees(page, addressee);
            index++;
        }

        if (!found) {
            return false;
        }

        await this.#selectAddressee(page, found);

        await page.type('input#temat', topic.trim());
        await page.type('textarea#tresc_wiadomosci', message.trim());

        let beforeUrl = page.url();

        page.click('input#sendButton');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        if (beforeUrl !== page.url()) {
            return "Sent";
        }else{
            return "Unable to send";
        }
    }

    async #clickAddresseesSection(page, index) {
        const section = ({
            0: 'radio_wychowawca',
            1: 'radio_rada_rodzicow',
            2: 'radio_szkolna_rada_rodzicow',
            3: 'radio_nauczyciel',
            4: 'radio_pedagog',
            5: 'radio_admin',
            6: 'radio_sekretariat',
            7: 'radio_sadmin'
        })[index];
        page.click(`input#${section}`);
    }

    async #checkAddressees(page, addressee) {
        try {
            await page.waitForSelector('div#adresaci > table.message-recipients-detail > tbody > tr', { timeout: 1000 });
        } catch (err) {
            return false;
        }

        const found = await page.$$eval('div#adresaci > table.message-recipients-detail > tbody > tr',
            (trs, addressee) => trs.map(tr => {
                const name = tr.children[1].children[0].textContent.trim().replaceAll(',', '').split(' ');
                let matches = 0;
                for (let namePart of name) {
                    for (let addresseePart of addressee) {
                        if (addresseePart === namePart) {
                            matches++;
                        }
                    }
                }
                if (matches >= 2) {
                    return tr.children[1].children[0].textContent;
                }
            }), addressee
        );

        return found.filter(item => item != null)[0];
    }

    async #selectAddressee(page, name) {
        const needsChecking = await page.$$eval('div#adresaci > table.message-recipients-detail > tbody > tr > td > label',
            labels => labels.length > 1
        );

        if (needsChecking){
            await page.locator(`label ::-p-text(${name})`).click();
        }
    }

    async #announcementsParse(page){

        page.click('#icon-ogloszenia');

        await page.waitForNavigation({ waitUntil: 'networkidle0'});

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
            finalObject.push({
                topic: announcementTopics[i],
                author: announcementContents[i][0],
                date: announcementContents[i][1],
                content: announcementContents[i][2]
            });
        }

        return finalObject;
    }

    async #createBrowser() {
        return puppeteer.launch({
            headless: "new"
        });
    }

    async #withBrowser(credentials, fn) {
        let browser;
        try{
            browser = await this.#createBrowser();
            const page = await this.#login(browser, credentials);
            return await fn(page);
        }finally{
            if (browser){
                await browser.close();
            }
        }
    }
}
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

import express from 'express';
const app = express();
import http from 'http';
const server = http.createServer(app);
const port = 4155;
import ocenyRouter from "./routes/get.js";

app.use("/", ocenyRouter);

import { puppeteerLogin } from './librus/browser.js';
(async () => {
    try {
        await puppeteerLogin();
        //server.close()
    } catch (err) {
        console.error(err);
    }
})();

server.listen(port, () => {
    console.log(`Running on http://localhost:${port}`)
});

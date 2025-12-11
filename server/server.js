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

import { login } from './librus_connection/connection.js';

app.get('/login', async (req, res) => {
    const result = await login();
    res.send(result);
});

server.listen(port, () => {
    console.log(`Running on http://localhost:${port}`)
})
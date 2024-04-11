import sqlite3 from 'sqlite3';
import { open } from 'sqlite'
import { join } from "path";
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export default async () => {

    const db = await open({
        filename: join(__dirname, '..', 'dist', 'ac_locations.db'),
        driver: sqlite3.Database
    });

    return db;
};

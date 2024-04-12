import sqlite3 from 'sqlite3';
import { open } from 'sqlite'
import { unlinkSync, existsSync, lstatSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export default async () => {

    const dbPath = join(__dirname, '..', 'dist', 'ac_locations.db');
    if (!existsSync(dbPath)) {
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        await db.close()
    }

}

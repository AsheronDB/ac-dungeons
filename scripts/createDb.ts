import sqlite3 from 'sqlite3';
import { open } from 'sqlite'
import { unlinkSync, existsSync, lstatSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export default async () => {
    const dbPath = join(__dirname, '..', 'dist', 'ac_locations.db');
    if (existsSync(dbPath)) unlinkSync(dbPath);
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    })
    const createDbSql = readFileSync(join(__dirname, '..', 'sql', 'create_db.sql')).toString();
    await db.exec(createDbSql);
    await db.close()
}

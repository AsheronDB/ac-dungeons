import openDb from '../utils/openDb';
import { readFileSync } from "fs";
import { join } from 'path';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import pkg from '../package.json';

export default async () => {

    console.log(pkg.version);

    const db = await openDb();
    const createTableQuery = readFileSync(join(__dirname, '..', 'sql', 'createVersionTable.sql')).toString();
    await db.exec(createTableQuery);

    await db.run(`INSERT INTO version (version) VALUES(?)`, [`v${pkg.version}`]);

    await db.close();
    console.log('Version built.')
}

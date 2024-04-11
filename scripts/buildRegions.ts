import sqlite3 from 'sqlite3';
import { open } from 'sqlite'
import getLocations from '../utils/getLocations';
import flatArrayToTree from '../utils/flatArrayToTree';
import treeToCellHashMap from '../utils/treeToCellHashMap';
import traverseTreePaths from '../utils/traverseTreePaths';
import openDb from '../utils/openDb';
import { readFileSync } from "fs";
import { join } from 'path';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const dbPath = join(__dirname, '..', 'dist', 'ac_locations.db');

// ../database/regions

// function printProgress(current, total) {
//     process.stdout.clearLine(0);
//     process.stdout.cursorTo(0);
//     process.stdout.write('Processed: ' + current + ' of ' + total);
// }

const findLocationQuery = `SELECT id, uuid FROM locations WHERE uuid = ?`;
const insertLocationQuery = `INSERT INTO locations (name, uuid, type, category, label) VALUES(?, ?, ?, ?, ?) RETURNING id`;
const insertCellQuery = `INSERT INTO cells (obj_cell_id, location_id, rank) VALUES(?, ?, ?)`;

export default async () => {

    // Generate region data structures
    const regions = getLocations(join(__dirname, '..', 'database', 'regions'));
    const regionTree = flatArrayToTree(regions);
    const regionCellHashMap = treeToCellHashMap(regionTree);

    const db = await openDb();

    const createTableQuery = readFileSync(join(__dirname, '..', 'sql', 'createCellsTable.sql')).toString();
    await db.exec(createTableQuery);

    for (let i = 0; i < regions.length; i++) {
        const region = regions[i];
        const insertValues = [region.name, region.id, 'region', null, region.label || null];
        await db.get(insertLocationQuery, insertValues);
    }


    const landblockEntries = Object.entries(regionCellHashMap);

    for (let i = 0; i < landblockEntries.length; i++) {
        const [landblockId, cells] = landblockEntries[i];
        const cellEntries = Object.entries(cells);
        for (let j = 0; j < cellEntries.length; j++) {
            const [cellId, locationsArray] = cellEntries[j];
            const objCellId = parseInt(`${landblockId}${cellId}`, 16);


            for (let k = 0; k < locationsArray.length; k++) {
                const location = locationsArray[k];
                const locationObj = regions.find(zone => zone.id === location.id);
                if (!locationObj) return false;

                const locRow = await db.get(findLocationQuery, location.id);

                console.log("Adding cell: ", objCellId)
                await db.run(insertCellQuery, [objCellId, locRow.id, location.rank]);



                // Populate link connections

                // if (lastInsertedId) {
                //     const findCurrentLinkQuery = `SELECT id FROM links WHERE parent_id = ? AND child_id = ?`;
                //     const currentLink = await db.get(findCurrentLinkQuery, [lastInsertedId, insertedId]);

                //     if (!currentLink) {
                //         const insertLinkQuery = `INSERT INTO links (parent_id, child_id) VALUES(?, ?)`;
                //         await db.run(insertLinkQuery, [lastInsertedId, insertedId]);
                //     }
                // } else {

                // }


                // lastInsertedId = insertedId;

            }
        }

    }

    await db.close()
    console.log('Regions built.')
}

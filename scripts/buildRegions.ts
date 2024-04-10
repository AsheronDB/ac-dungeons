import sqlite3 from 'sqlite3';
import { open } from 'sqlite'
import getLocations from '../utils/getLocations';
import flatArrayToTree from '../utils/flatArrayToTree';
import treeToCellHashMap from '../utils/treeToCellHashMap';
import { join } from 'path';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const dbPath = join(__dirname, '..', 'dist', 'ac_locations.db');

// ../database/regions

export default async () => {

    // Generate region data structures
    const regions = getLocations(join(__dirname, '..', 'database', 'regions'));
    const regionTree = flatArrayToTree(regions);
    const regionCellHashMap = treeToCellHashMap(regionTree);

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    })

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



                const findLocationQuery = `SELECT id, uuid FROM locations WHERE uuid = ?`;
                const insertLocationQuery = `INSERT INTO locations (name, uuid, type, category, label) VALUES(?, ?, ?, ?, ?) RETURNING id`;
                const insertCellQuery = `INSERT INTO cells (obj_cell_id, location_id, rank) VALUES(?, ?, ?)`;

                const locRow = await db.get(findLocationQuery, location.id);

                let insertedId;

                if (!locRow) {
                    console.log("No location row found, inserting...")
                    const insertValues = [locationObj.name, locationObj.id, 'region', null, locationObj.label || null];
                    const insertedRow = await db.get(insertLocationQuery, insertValues);

                    console.log(insertedRow);
                    insertedId = insertedRow.id;
                } else {
                    insertedId = locRow.id;
                }
                console.log("Adding cell: ", objCellId)
                await db.run(insertCellQuery, [objCellId, insertedId, location.rank]);

            }
        }

    }

    await db.close()
    console.log('Regions built.')
}

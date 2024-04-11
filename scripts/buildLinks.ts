
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
const findCurrentLinkQuery = `SELECT id FROM links WHERE parent_id = ? AND child_id = ?`;
const findParentLinkQuery = `SELECT id FROM links WHERE parent_id = ? AND child_id = null`;
const insertLinkQuery = `INSERT INTO links (parent_id, child_id) VALUES(?, ?) RETURNING *`;

export default async () => {

    // Generate region data structures
    const locations = getLocations(join(__dirname, '..', 'database'));
    const locationsTree = flatArrayToTree(locations);

    const db = await openDb();

    const createTableQuery = readFileSync(join(__dirname, '..', 'sql', 'createLinksTable.sql')).toString();
    await db.exec(createTableQuery);


    await traverseTreePaths(locationsTree, async (node, path, index) => {

        if (index === 0) {
            console.log('-----------')
            console.log('NEW PATH');

        }
        console.log('> ', node.name);
        console.log('Index:', index);
        console.log('Path length:', path.length)


        const nodeRow = await db.get(findLocationQuery, node.id);

        console.log('Loc row ID:', nodeRow.id)



        // If not last path iteration, insert current node as a childless link
        if (path.length == 1 || (path.length > 1 && index !== path.length - 1)) {
            console.log('Adding row with parent ID and null child')
            const insertedLink = await db.get(`INSERT INTO links (parent_id) VALUES(?) RETURNING *`, [nodeRow.id]);
            path[index].insertedLinkId = insertedLink.id;

        }

        if (path.length > 1 && index !== 0) {
            console.log('Adding row to parent link')
            const parentNode = path[index - 1];
            // console.log(parentNode);
            const parentRow = await db.get(findLocationQuery, parentNode.id);
            console.log('parentRow:', parentRow);
            // const parentLinkNullRow = await db.get(`SELECT * FROM links WHERE parent_id = ? AND child_id IS NULL`, [parentRow.id]);
            const parentLinkRow = await db.get(`SELECT * FROM links WHERE parent_id = ? AND child_id = ?`, [parentRow.id, nodeRow.id]);

            // console.log('parentLinkNullRow:', parentLinkNullRow);
            // console.log('parentLinkRow:', parentLinkRow)

            if (!parentLinkRow) await db.run(`UPDATE links SET child_id = ? WHERE id = ?`, [nodeRow.id, parentNode.insertedLinkId]);
        }

    });

    await db.close()
    console.log('Links built.')
}

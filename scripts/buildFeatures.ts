import sqlite3 from 'sqlite3';
import { open } from 'sqlite'
import getLocations from '../utils/getLocations';
import { join } from "path";
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import { ACPosition, radarToPos } from '@asherondb/ac-position';

const dbPath = join(__dirname, '..', 'dist', 'ac_locations.db');

export default async () => {

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    })

    const features = getLocations(join(__dirname, '..', 'database', 'features'));

    for (let i = 0; i < features.length; i++) {
        const feature = features[i];
        const insertLocationQuery = `INSERT INTO locations (name, uuid, type, category) VALUES(?, ?, ?, ?) RETURNING id`;
        const insertPositionQuery = `INSERT INTO positions (location_id, obj_cell_id, origin_x, origin_y, origin_z, angles_w, angles_x, angles_y, angles_z) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const pos = radarToPos(feature.coordinates);
        const insertedRow = await db.get(insertLocationQuery, [feature.name, feature.id, 'feature', feature.category || null]);
        await db.run(insertPositionQuery, [insertedRow.id, pos.objCellId, ...pos.origin, ...pos.rotation]);
    }

    await db.close()
    console.log('Features built.');
}

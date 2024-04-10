import { groupBy, forEach as _forEach } from "lodash-es";
import { unlinkSync, existsSync, lstatSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import sqlite3 from 'sqlite3';
import { open } from 'sqlite'

const dbPath = './db/ac_locations.db'

if (existsSync(dbPath)) unlinkSync(dbPath);


function getAllLocationFiles() {

  const allPaths = [];

  function traverseDir(dir) {
    readdirSync(dir).forEach((file) => {
      let fullPath = join(dir, file);
      if (lstatSync(fullPath).isDirectory()) {
        traverseDir(fullPath);
      } else {
        // console.log(file);
        if (!/(^|\/)\.[^\/\.]/g.test(file)) {
          // console.log('valid file')
          allPaths.push(fullPath);
        }
      }
    });
  }

  traverseDir("./src/regions");

  const zones = [];
  const locations = {};

  allPaths.forEach((filePath) => {
    // console.log(file);
    const data = readFileSync(filePath, "utf8");
    const json = JSON.parse(data);
    locations.push(json);
  });

  return locations;
}

const locations = getAllLocationFiles();

const dupeNames = Object.entries(groupBy(locations, 'name')).filter(group => group[1].length > 1);
console.log(dupeNames);

function createTree(objects) {
  // Create a map of objects by their ID for easy lookup
  const objectMap = {};
  for (const obj of objects) {
    objectMap[obj.id] = obj;
  }

  // Helper function to recursively build the tree
  function buildTree(objId) {
    const obj = objectMap[objId];
    if (obj.children) {
      obj.children = obj.children.map(childId => buildTree(childId));
    }
    return obj;
  }

  // Find root objects (objects without a parent)
  const rootObjects = objects.filter(obj => !objects.some(parent => parent.children && parent.children.includes(obj.id)));

  // Build the tree starting from root objects
  const tree = rootObjects.map(root => buildTree(root.id));

  return tree;
}

function traverseTreeMultipleRoots(roots: [], path = [], paths = []) {
  // Iterate over each root node
  for (const root of roots) {
    // Add the current root node's name to the path

    path.push({ id: root.id, rank: path.length });


    if (root.cells) {
      root.cells.forEach((cell: string) => {
        // console.log(cell);

        const objCellId = cell.slice(2);

        // console.log(objCellId);

        const lbId = objCellId.slice(0, 4);
        const cellId = objCellId.slice(-4);

        // console.log('objCellId', objCellId);
        // console.log('LB ID', lbId);
        // console.log('Cell ID', cellId);
        // console.log('-----------')

        if (!landblocks[lbId]) landblocks[lbId] = {};

        landblocks[lbId][cellId] = [...path];
      });
    }

    // If the current node is a leaf node, execute the logic and then add the path to the list of paths
    if (!root.children || root.children.length === 0) {
      // Execute your logic here, using the full path
      // console.log("Reached end of path:", path);

      // Add the path to the list of paths
      paths.push([...path]); // Add a copy of the path
    } else {
      // Recursively traverse the children
      for (const child of root.children) {
        traverseTreeMultipleRoots([child], path, paths);
      }
    }

    // Reset the path back to its original state for the next traversal
    path.pop();
  }

  return paths;
}

const tree = createTree(locations);

// console.log(tree);

traverseTreeMultipleRoots(tree);

const createLocationsTableQuery = `CREATE TABLE locations (id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NULL,
	uuid TEXT NOT NULL,
	type TEXT NOT NULL,
  category TEXT NULL
);`

const createCellsTableQuery = `CREATE TABLE cells (id INTEGER PRIMARY KEY,
  obj_cell_id INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  rank NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id)
);`

async function createSqliteDB() {

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })

  await db.exec(createLocationsTableQuery);
  await db.exec(createCellsTableQuery);


  const landblockEntries = Object.entries(landblocks);

  for (let i = 0; i < landblockEntries.length; i++) {
    const [landblockId, cells] = landblockEntries[i];
    const cellEntries = Object.entries(cells);
    for (let j = 0; j < cellEntries.length; j++) {
      const [cellId, locationsArray] = cellEntries[j];
      const objCellId = parseInt(`${landblockId}${cellId}`, 16);

      for (let k = 0; k < locationsArray.length; k++) {

        const location = locationsArray[k];
        const locationObj = locations.find(zone => zone.id === location.id);


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


}

createSqliteDB();


// writeFileSync("./export/all-dungeons.json", JSON.stringify(tree, null, 2));
// writeFileSync(
//   "./export/dungeon-names.json",
//   JSON.stringify(landblocks, null, 2)
// );

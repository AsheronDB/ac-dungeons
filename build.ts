import { groupBy, forEach as _forEach } from "lodash-es";
import { lstatSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

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

// const zonesFolder = "./src/regions/";
// let zoneFiles = readdirSync(zonesFolder);

// allFiles = allFiles.filter((item) => );

const zones = [];

allPaths.forEach((filePath) => {
  // console.log(file);
  const data = readFileSync(filePath, "utf8");
  const json = JSON.parse(data);
  zones.push(json);
});

const dupeNames = Object.entries(groupBy(zones, 'name')).filter(group => group[1].length > 1);

console.log(dupeNames);

// console.log(zones);

const landblocks = {};

function buildTree(nodes) {
  // const treeArray = [];

  // const idMap = nodes.reduce((obj, node) => {

  //   if (obj[node.id]) {
  //     console.log('item ID already found on object');
  //       console.log(node)
  //   } else {
  //     Object.assign(obj, {
  //       [node.id]: node,
  //     });
  //   }

  //   return obj;
  // }, {});

  // console.log(idMap);

  // const recurseChildren = (node) => {
  //   const childNodes = [];

  //   console.log('Current node')
  //   console.log(node);
  //   node.children.forEach((childId: string) => {
  //     const childNode = idMap[childId];
  //     childNodes.push(childNode);
  //     delete idMap[childId];
  //     console.log('recursing children')
  //     console.log('childId', childId)

  //     if (childNode.children && childNode.children.length) {
  //       childNode.children = recurseChildren(childNode);
  //     }
  //   });
  //   return childNodes;
  // };

  // nodes.forEach((node) => {

  //   if (!idMap[node.id]) return false;

  //   if (node.children && node.children.length) {

  //     node.children = recurseChildren(node);
  //   }
  //   treeArray.push(node);
  // });
  // return treeArray;

  const map = {};

  function findChildren(children) {

    // console.log('Find children')
    // console.log(children)
    let childNodes = children.map((childId) => {
      // console.log('findChildren children.map');
      // console.log(childId);
      const mapId = map[childId];
      // console.log(mapId);
      return mapId;
    });

    // console.log(childNodes);

    childNodes.forEach((node) => {

      if (!map[node.id]) return false;
      delete map[node.id]
      if (node.children && node.children.length > 0) {
        node.children = findChildren(node.children);

        //node.children = node.children.map(childId => map[childId]);
      }
    });

    return childNodes;
  }



  // Create a map of IDs to objects
  nodes.forEach((node) => {
    map[node.id] = node;
  });

  // Build the nested structure
  nodes.forEach((node) => {

    if (!map[node.id]) return false;
    if (node.children && node.children.length > 0) {
      node.children = findChildren(node.children);

      //node.children = node.children.map(childId => map[childId]);
    }
  });

  // Find root objects
  // const rootObjects = nodes.filter(node => !node.children);

  return nodes;
}

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
    path.push(root.name);

    if (root.name == "Arrival Chamber") {
      console.log("ARRIVAL FACILITY!");
      console.log(root);
      console.log(path);
    }

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

const tree = createTree(zones);

// console.log(tree);

traverseTreeMultipleRoots(tree);

writeFileSync("./export/all-dungeons.json", JSON.stringify(tree, null, 2));
writeFileSync(
  "./export/dungeon-names.json",
  JSON.stringify(landblocks, null, 2)
);

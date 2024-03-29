import { groupBy, forEach as _forEach } from "lodash-es";
import { readdirSync, readFileSync, writeFileSync } from "fs";

const zonesFolder = "./src/zones/";
let zoneFiles = readdirSync(zonesFolder);

zoneFiles = zoneFiles.filter((item) => !/(^|\/)\.[^\/\.]/g.test(item));

const zones = [];

zoneFiles.forEach((file) => {
  // console.log(file);
  const fullPath = `${zonesFolder}${file}`;
  const data = readFileSync(fullPath, "utf8");
  const json = JSON.parse(data);
  zones.push(json);
});

// console.log(zones);

const landblocks = {};

function buildTree(nodes) {
  const treeArray = [];
  const idMap = nodes.reduce(
    (obj, item) =>
      Object.assign(obj, {
        [item.id]: item,
      }),
    {}
  );

  const recurseChildren = (node) => {
    const childNodes = [];
    node.children.forEach((childId) => {
      const childNode = idMap[childId];
      childNodes.push(childNode);
      delete idMap[childId];
      if (childNode.children && childNode.children.length) {
        childNode.children = recurseChildren(childNode);
      }
    });
    return childNodes;
  };

  nodes.forEach((node) => {
    if (!idMap[node.id]) return false;
    if (node.children && node.children.length) {
      node.children = recurseChildren(node);
    }
    treeArray.push(node);
  });
  return treeArray;
}

function traverseTreeMultipleRoots(roots, path = [], paths = []) {
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
      root.cells.forEach((cell) => {
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

// Example usage:
// const flatArray = [
//   { id: 1, name: "Node 1", children: [2, 3] },
//   { id: 2, name: "Node 2", children: [4] },
//   { id: 3, name: "Node 3", children: [] },
//   { id: 4, name: "Node 4", children: [] },
// ];

// console.log(nestedTree);

// function traverseCallback(node) {
// if (node.cells) {
//   node.cells.forEach((cell) => {
//     // console.log(cell);

//     const objCellId = cell.slice(2);

//     // console.log(objCellId);

//     const lbId = objCellId.slice(0, 4);
//     const cellId = objCellId.slice(-4);

//     // console.log('objCellId', objCellId);
//     // console.log('LB ID', lbId);
//     // console.log('Cell ID', cellId);
//     // console.log('-----------')

//     if (landblocks[lbId]) {
//       if (landblocks[lbId][cellId]) {
//         landblocks[lbId][cellId].push(node.label || node.name);
//       } else {
//         landblocks[lbId][cellId] = [node.label || node.name];
//       }
//     } else {
//       landblocks[lbId] = {};
//       landblocks[lbId][cellId] = [node.label || node.name];
//     }
//   });
// }

//   //  label += ' ' + node.name
// }

const tree = buildTree(zones);

console.log(tree);

traverseTreeMultipleRoots(tree);

writeFileSync("./export/all-dungeons.json", JSON.stringify(tree));
writeFileSync(
  "./export/dungeon-names.json",
  JSON.stringify(landblocks, null, 2)
);

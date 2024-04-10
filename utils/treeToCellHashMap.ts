function buildHash(roots: [], path = [], hash = {}) {
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

                if (!hash[lbId]) hash[lbId] = {};

                hash[lbId][cellId] = [...path];
            });
        }

        // If the current node is a leaf node, execute the logic and then add the path to the list of paths
        if (!root.children || root.children.length === 0) {
            // Execute your logic here, using the full path
            // console.log("Reached end of path:", path);

            // Add the path to the list of paths
            // paths.push([...path]); // Add a copy of the path
        } else {
            // Recursively traverse the children
            for (const child of root.children) {
                buildHash([child], path, hash);
            }
        }

        // Reset the path back to its original state for the next traversal
        path.pop();
    }
    return hash;
}

function treeToCellHashMap(tree) {
    return buildHash(tree);
}


export default treeToCellHashMap;

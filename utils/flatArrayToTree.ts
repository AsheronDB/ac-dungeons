export default (flatArray) => {
    // Create a map of objects by their ID for easy lookup
    const objectMap = {};
    for (const obj of flatArray) {
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
    const rootObjects = flatArray.filter(obj => !flatArray.some(parent => parent.children && parent.children.includes(obj.id)));

    // Build the tree starting from root objects
    const tree = rootObjects.map(root => buildTree(root.id));

    return tree;
}

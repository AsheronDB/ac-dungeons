function traverse(roots) {
    const paths = [];
    for (let root of roots) {
        traverseHelper(root, [], paths);
    }
    return paths;
}

function traverseHelper(node, path, paths) {
    path.push(node);
    if (!hasChildren(node)) {
        paths.push([...path]);
    } else {
        for (let child of getChildren(node)) {
            traverseHelper(child, path, paths);
        }
    }
    path.pop();
}

function hasChildren(node) {
    return Array.isArray(getChildren(node)) && getChildren(node).length > 0;
}

function getChildren(node) {
    if (Array.isArray(node.children)) {
        return node.children;
    } else {
        return [];
    }
}

export default async (tree, callback) => {
    const paths = traverse(tree);

    for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        for (let j = 0; j < path.length; j++) {
            const node = path[j];
            await callback(node, path, j);
        }
    }
}

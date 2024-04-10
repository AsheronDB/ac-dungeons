import { groupBy, forEach as _forEach } from "lodash-es";
import { unlinkSync, existsSync, lstatSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export default (path) => {

    if (!path) return false;

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

    traverseDir(path);

    const locations = [];


    allPaths.forEach((filePath) => {
        // console.log(file);
        const data = readFileSync(filePath, "utf8");
        const json = JSON.parse(data);
        locations.push(json);
    });

    return locations;
}

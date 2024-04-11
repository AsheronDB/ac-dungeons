// Build scripts
import createDb from './scripts/createDb';
import buildRegions from './scripts/buildRegions';
import buildFeatures from './scripts/buildFeatures';
import buildVersion from './scripts/buildVersion';
import buildLinks from './scripts/buildLinks';

// Set up new Sqlite DB
// await createDb();

// Run build scripts to populate DB
// await buildRegions();
// await buildFeatures();
await buildLinks();

await buildVersion();
// Generate other data products here from database



console.log('Build finished.')

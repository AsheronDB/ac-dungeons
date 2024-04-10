// Build scripts
import createDb from './scripts/createDb';
import buildRegions from './scripts/buildRegions';
import buildFeatures from './scripts/buildFeatures';

// Set up new Sqlite DB
await createDb();

// Run build scripts to populate DB
await buildRegions();
await buildFeatures();

// Generate other data products here from database


console.log('Build finished.')

DROP TABLE IF EXISTS locations;
CREATE TABLE locations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    label TEXT NULL,
    uuid TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NULL
);

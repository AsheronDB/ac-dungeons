DROP TABLE IF EXISTS positions;

CREATE TABLE positions (
    id INTEGER PRIMARY KEY,
    location_id INTEGER NOT NULL,
    obj_cell_id INTEGER NOT NULL,
    origin_x REAL NOT NULL,
    origin_y REAL NOT NULL,
    origin_z REAL NOT NULL,
    angles_w REAL NOT NULL,
    angles_x REAL NOT NULL,
    angles_y REAL NOT NULL,
    angles_z REAL NOT NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

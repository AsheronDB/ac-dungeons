CREATE TABLE cells (
    id INTEGER PRIMARY KEY,
    obj_cell_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    rank NOT NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id)
)

DROP TABLE IF EXISTS links;
CREATE TABLE links (
    id INTEGER PRIMARY KEY,
    parent_id INTEGER,
    child_id INTEGER,
    FOREIGN KEY (parent_id) REFERENCES locations(id),
    FOREIGN KEY (child_id) REFERENCES locations(id)
);

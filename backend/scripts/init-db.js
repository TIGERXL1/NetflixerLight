const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "..", "data", "netflixlight.db");
const schemaPath = path.join(__dirname, "..", "database", "schema.sql");

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
const schema = fs.readFileSync(schemaPath, "utf8");

try {
    db.exec(schema);
    console.log("Database initialized successfully at:", dbPath);
    console.log("Tables created: users, watchlist, ratings, viewing_history");
} catch (error) {
    console.error("Error initializing database:", error.message);
    process.exit(1);
} finally {
    db.close();
}
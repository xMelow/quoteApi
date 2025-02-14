import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import moment from "moment";

const app = express();
const PORT = 3000;

app.use(cors());

let db;

const initDB = async () => {
    db = await open({
        filename: "quotes.db",
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS quotes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL
        );
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS state (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);
};

const getQuoteOfTheDay = async () => {
    const today = moment().format("YYYY-MM-DD");
    let lastQuote = await db.get("SELECT value FROM state WHERE key = 'lastQuote'");
    let lastDate = await db.get("SELECT value FROM state WHERE key = 'lastDate'");

    if (lastDate && lastDate.value === today && lastQuote) {
        return JSON.parse(lastQuote.value);
    }

    const quotes = await db.all("SELECT * FROM quotes");
    const newQuote = quotes[Math.floor(Math.random() * quotes.length)];

    await db.run("INSERT INTO state (key, value) VALUES ('lastQuote', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", JSON.stringify(newQuote));
    await db.run("INSERT INTO state (key, value) VALUES ('lastDate', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", today);

    return newQuote;
};

app.get("/quote", async (req, res) => {
    const quote = await getQuoteOfTheDay();
    res.json(quote);
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running...`);
    });
});
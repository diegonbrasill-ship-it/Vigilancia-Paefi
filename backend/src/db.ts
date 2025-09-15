// backend/src/db.ts
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";
import path from "path";

const DB_FILE = path.join(__dirname, "..", "database.sqlite");

export async function initDb() {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      passwordHash TEXT,
      role TEXT
    );
  `);

  // Seed de usuários iniciais
  const seeds = [
    { username: "coordenador", password: "senha123", role: "coordenador" },
    { username: "gestor", password: "senha123", role: "gestor" },
    { username: "tecnico", password: "senha123", role: "tecnico" }
  ];

  for (const s of seeds) {
    const existing = await db.get("SELECT id FROM users WHERE username = ?", s.username);
    if (!existing) {
      const hash = await bcrypt.hash(s.password, 10);
      await db.run("INSERT INTO users (username, passwordHash, role) VALUES (?, ?, ?)", [s.username, hash, s.role]);
    }
  }

  return db;
}



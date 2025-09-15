import { openDb } from "./db";
import bcrypt from "bcrypt";

async function seed() {
  const db = await openDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    );
  `);

  const hash = await bcrypt.hash("senha123", 10);

  // Inserir usuário se não existir
  await db.run(
    `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
    ["coordenador", hash, "coordenador"]
  );

  console.log("✅ Banco populado (usuário: coordenador / senha123)");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

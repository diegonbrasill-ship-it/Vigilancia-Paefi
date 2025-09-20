// backend/src/db.ts
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Sua configuração de conexão, 100% preservada
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'senha123', // Lembre-se que esta é a senha que deve estar correta
  port: 5433,
});

// Sua lógica de inicialização
let isDbInitialized = false;

export async function initDb() {
  if (isDbInitialized) {
    return pool;
  }

  const client = await pool.connect();
  console.log("🐘 Conectado ao PostgreSQL com sucesso!");

  try {
    // Tabela 'users', 100% preservada
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL
      );
    `);
    console.log("Tabela 'users' verificada/criada.");
    
    // Tabela 'casos', 100% preservada
    await client.query(`
      CREATE TABLE IF NOT EXISTS casos (
        id SERIAL PRIMARY KEY,
        "dataCad" DATE NOT NULL,
        "tecRef" TEXT NOT NULL,
        nome TEXT, 
        dados_completos JSONB,
        "userId" INTEGER NOT NULL REFERENCES users(id)
      );
    `);
    console.log("Tabela 'casos' verificada/criada.");

    // Tabela 'logs', 100% preservada
    await client.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "userId" INTEGER REFERENCES users(id),
        username TEXT,
        action TEXT NOT NULL,
        details JSONB
      );
    `);
    console.log("Tabela 'logs' verificada/criada.");
    
    // Tabela 'acompanhamentos', 100% preservada
    await client.query(`
      CREATE TABLE IF NOT EXISTS acompanhamentos (
        id SERIAL PRIMARY KEY,
        texto TEXT NOT NULL,
        data TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "casoId" INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
        "userId" INTEGER NOT NULL REFERENCES users(id)
      );
    `);
    console.log("Tabela 'acompanhamentos' verificada/criada.");

    // ========================================================
    // 📌 ADIÇÃO DAS NOVAS TABELAS
    // ========================================================
    
    // Tabela 'encaminhamentos'
    await client.query(`
      CREATE TABLE IF NOT EXISTS encaminhamentos (
          id SERIAL PRIMARY KEY,
          "casoId" INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
          "userId" INTEGER NOT NULL REFERENCES users(id),
          "servicoDestino" VARCHAR(255) NOT NULL,
          "dataEncaminhamento" DATE NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Pendente',
          "dataRetorno" DATE,
          observacoes TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tabela 'encaminhamentos' verificada/criada.");

    // Tabela 'anexos'
    await client.query(`
      CREATE TABLE IF NOT EXISTS anexos (
          id SERIAL PRIMARY KEY,
          "casoId" INTEGER NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
          "userId" INTEGER NOT NULL REFERENCES users(id),
          "nomeOriginal" VARCHAR(255) NOT NULL,
          "nomeArmazenado" VARCHAR(255) NOT NULL UNIQUE,
          "caminhoArquivo" VARCHAR(255) NOT NULL,
          "tipoArquivo" VARCHAR(100) NOT NULL,
          "tamanhoArquivo" INTEGER NOT NULL,
          descricao TEXT,
          "dataUpload" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tabela 'anexos' verificada/criada.");
    
    // ========================================================
    // 📌 ATUALIZAÇÃO DO SEED DE USUÁRIOS
    // ========================================================
    const seeds = [
      { username: "coordenador", password: "senha123", role: "coordenador" },
      { username: "gestor", password: "senha123", role: "gestor" },
      { username: "tecnico", password: "senha123", role: "tecnico" },
      { username: "vigilancia", password: "senha123", role: "vigilancia" } // <-- Usuário adicionado
    ];

    for (const s of seeds) {
      const res = await client.query("SELECT id FROM users WHERE username = $1", [s.username]);
      if (res.rowCount === 0) {
        const hash = await bcrypt.hash(s.password, 10);
        await client.query("INSERT INTO users (username, passwordHash, role) VALUES ($1, $2, $3)", 
          [s.username, hash, s.role]
        );
        console.log(`Usuário '${s.username}' criado.`);
      }
    }

    isDbInitialized = true;
  } catch (err) {
    console.error("Erro durante a inicialização do banco de dados:", err);
    throw err;
  } finally {
    client.release();
  }

  return pool;
}

export default pool;



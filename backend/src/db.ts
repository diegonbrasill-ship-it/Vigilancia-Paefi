// backend/src/db.ts
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Sua configuração de conexão, 100% preservada
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'suasdb123',
  port: 5433,
});

// Sua lógica de inicialização, 100% preservada
let isDbInitialized = false;

export async function initDb() {
  if (isDbInitialized) {
    return pool;
  }

  const client = await pool.connect();
  console.log("🐘 Conectado ao PostgreSQL com sucesso!");

  try {
    // Sua tabela 'users', 100% preservada
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL
      );
    `);
    console.log("Tabela 'users' verificada/criada.");
    
    // Tabela 'casos' com a correção aplicada
    await client.query(`
      CREATE TABLE IF NOT EXISTS casos (
        id SERIAL PRIMARY KEY,
        "dataCad" DATE NOT NULL,
        "tecRef" TEXT NOT NULL,
        
        -- CORREÇÃO APLICADA AQUI: O campo 'nome' agora é opcional.
        nome TEXT, 
        
        dados_completos JSONB,
        "userId" INTEGER NOT NULL REFERENCES users(id)
      );
    `);
    console.log("Tabela 'casos' verificada/criada.");

    /*
      NOTA IMPORTANTE: Se a tabela 'casos' já existe no seu banco de dados,
      o comando acima pode não alterar a estrutura. Se o problema persistir,
      você pode precisar executar o seguinte comando SQL manualmente uma vez:
      ALTER TABLE casos ALTER COLUMN nome DROP NOT NULL;
    */

    // Sua tabela 'logs', 100% preservada
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
    
    // Sua tabela 'acompanhamentos', 100% preservada
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
    
    // Seu seed de usuários, 100% preservado
    const seeds = [
      { username: "coordenador", password: "senha123", role: "coordenador" },
      { username: "gestor", password: "senha123", role: "gestor" },
      { username: "tecnico", password: "senha123", role: "tecnico" }
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



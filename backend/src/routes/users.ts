// backend/src/routes/users.ts
import { Router } from "express";
import { initDb } from "../db";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// ROTA PARA LISTAR TODOS OS USUÁRIOS
// Esta rota agora é protegida pelo 'authMiddleware'. 
// Apenas usuários autenticados (logados) podem ver a lista de usuários.
router.get("/", authMiddleware, async (req, res) => {
  try {
    const db = await initDb();
    // Seleciona apenas os campos seguros para não expor o hash da senha
    const users = await db.all("SELECT id, username, role FROM users");
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: "Erro ao listar usuários", error: err.message });
  }
});

// ROTA PARA CRIAR UM NOVO USUÁRIO
// Esta rota também foi protegida. Apenas um usuário logado
// (como um 'coordenador' ou 'gestor') pode criar novos usuários.
router.post("/", authMiddleware, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Nome de usuário e senha são obrigatórios" });
  }

  try {
    const db = await initDb();
    const hash = await bcrypt.hash(password, 10);

    // Bug corrigido: inserindo na coluna 'passwordHash' e não 'password'
    await db.run("INSERT INTO users (username, passwordHash, role) VALUES (?, ?, ?)", [
      username, 
      hash, 
      role || "tecnico"
    ]);
    
    res.status(201).json({ message: "Usuário criado com sucesso" });

  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ message: "Este nome de usuário já está em uso." });
    }
    res.status(500).json({ message: "Erro ao criar usuário.", error: err.message });
  }
});

export default router;

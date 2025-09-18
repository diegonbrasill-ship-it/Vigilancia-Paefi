// backend/src/routes/users.ts
import { Router } from "express";
import pool from "../db"; // Importa o pool do PostgreSQL
import bcrypt from "bcryptjs";
import { authMiddleware, checkRole } from "../middleware/auth";

const router = Router();

// ROTA PARA LISTAR TODOS OS USUÁRIOS (SINTAXE CORRIGIDA)
router.get(
  "/", 
  authMiddleware,
  checkRole(["coordenador", "gestor"]), 
  async (req, res) => {
    try {
      // ANTES: db.all(...)
      // AGORA: pool.query(...) e acessamos o resultado em .rows
      const result = await pool.query("SELECT id, username, role FROM users");
      const users = result.rows;

      res.json(users);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao listar usuários", error: err.message });
    }
  }
);

// ROTA PARA CRIAR UM NOVO USUÁRIO (SINTAXE CORRIGIDA)
router.post(
  "/", 
  authMiddleware, 
  checkRole(["coordenador", "gestor"]),
  async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Nome de usuário e senha são obrigatórios" });
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      
      // ANTES: db.run(...)
      // AGORA: pool.query(...) com placeholders $1, $2, etc.
      await pool.query("INSERT INTO users (username, passwordHash, role) VALUES ($1, $2, $3)", [
        username, 
        hash, 
        role || "tecnico"
      ]);
      
      res.status(201).json({ message: "Usuário criado com sucesso" });

    } catch (err: any) {
      if (err.message.includes("duplicate key value violates unique constraint")) {
        return res.status(409).json({ message: "Este nome de usuário já está em uso." });
      }
      res.status(500).json({ message: "Erro ao criar usuário.", error: err.message });
    }
  }
);

export default router;

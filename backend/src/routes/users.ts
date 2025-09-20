import { Router, Request, Response } from "express";
import pool from "../db";
import bcrypt from "bcryptjs";
import { authMiddleware, checkRole } from "../middleware/auth";
import { logAction } from "../services/logger";

const router = Router();

// =======================================================================
// ROTA PARA LISTAR TODOS OS USUÁRIOS
// =======================================================================
/**
 * @route   GET /api/users
 * @desc    Lista todos os usuários do sistema (sem a senha)
 * @access  Private (Coordenador, Gestor)
 */
router.get("/", authMiddleware, checkRole(['coordenador', 'gestor']), async (req: Request, res: Response) => {
  try {
    const query = 'SELECT id, username, role FROM users ORDER BY username ASC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err: any) {
    console.error("Erro ao listar usuários:", err.message);
    res.status(500).json({ message: "Erro ao buscar usuários." });
  }
});

// =======================================================================
// ROTA PARA CRIAR UM NOVO USUÁRIO
// =======================================================================
/**
 * @route   POST /api/users
 * @desc    Cria um novo usuário
 * @access  Private (Coordenador, Gestor)
 */
router.post("/", authMiddleware, checkRole(['coordenador', 'gestor']), async (req: Request, res: Response) => {
  const { username, password, role } = req.body;
  const adminUser = req.user!;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "Nome de usuário, senha e perfil são obrigatórios." });
  }

  const validRoles = ['tecnico', 'coordenador', 'gestor', 'vigilancia'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Perfil (role) inválido." });
  }

  try {
    const userExists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    
    // CORREÇÃO APLICADA AQUI:
    // A checagem `if (userExists.rowCount)` é uma forma segura e concisa de verificar 
    // se o valor não é nulo e é maior que zero.
    if (userExists.rowCount) {
      return res.status(400).json({ message: "Este nome de usuário já está em uso." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (username, passwordHash, role) 
      VALUES ($1, $2, $3) 
      RETURNING id, username, role;
    `;
    const result = await pool.query(query, [username, passwordHash, role]);
    const newUser = result.rows[0];
    
    await logAction({
      userId: adminUser.id,
      username: adminUser.username,
      action: 'CREATE_USER',
      details: { createdUserId: newUser.id, createdUsername: newUser.username, role: newUser.role }
    });

    res.status(201).json(newUser);

  } catch (err: any) {
    console.error("Erro ao criar usuário:", err.message);
    res.status(500).json({ message: "Erro no servidor ao criar usuário." });
  }
});

// =======================================================================
// ROTA PARA DELETAR/DESATIVAR UM USUÁRIO (A ser implementada no futuro)
// =======================================================================
router.delete("/:id", authMiddleware, checkRole(['coordenador', 'gestor']), async (req: Request, res: Response) => {
  res.status(501).json({ message: "Funcionalidade de exclusão/desativação ainda não implementada." });
});


export default router;

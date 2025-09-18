// backend/src/routes/auth.ts
import { Router } from "express";
import pool from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logAction } from "../services/logger"; // Importa nossa nova função

const router = Router();

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: "Usuário e senha são obrigatórios." });
    }
    
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (result.rowCount === 0) {
            // Log de tentativa de login falha
            await logAction({ username, action: 'LOGIN_FAILURE', details: { reason: 'User not found' } });
            return res.status(401).json({ message: "Usuário ou senha inválidos." });
        }
        
        const user = result.rows[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.passwordhash);
        
        if (!isPasswordCorrect) {
            // Log de tentativa de login falha
            await logAction({ userId: user.id, username: user.username, action: 'LOGIN_FAILURE', details: { reason: 'Incorrect password' } });
            return res.status(401).json({ message: "Usuário ou senha inválidos." });
        }
        
        // LOG DE LOGIN BEM-SUCEDIDO
        await logAction({ userId: user.id, username: user.username, action: 'LOGIN_SUCCESS' });
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'seu_segredo_padrao_para_testes',
            { expiresIn: '8h' }
        );
        
        res.json({
            message: "Login bem-sucedido!",
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });

    } catch (err: any) {
        res.status(500).json({ message: "Erro interno do servidor.", error: err.message });
    }
});

// A rota de registro pode ser mantida como está
// ...

export default router;



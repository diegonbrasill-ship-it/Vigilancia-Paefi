// backend/src/routes/auth.ts
import { Router } from "express";
import { initDb } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

// ROTA DE LOGIN: POST /auth/login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: "Usuário e senha são obrigatórios." });
    }
    
    try {
        const db = await initDb();
        const user = await db.get('SELECT * FROM users WHERE username = ?', username);
        
        if (!user) {
            return res.status(401).json({ message: "Usuário ou senha inválidos." });
        }
        
        const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
        
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Usuário ou senha inválidos." });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'seu_segredo_padrao_para_testes',
            { expiresIn: '8h' }
        );
        
        res.json({
            message: "Login bem-sucedido!",
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (err: any) {
        res.status(500).json({ message: "Erro interno do servidor.", error: err.message });
    }
});

// Você pode adicionar uma rota de registro aqui também, se desejar.
// ROTA DE REGISTRO: POST /auth/register
router.post("/register", async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Dados incompletos" });
    }

    try {
        const db = await initDb();
        const hash = await bcrypt.hash(password, 10);
        
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



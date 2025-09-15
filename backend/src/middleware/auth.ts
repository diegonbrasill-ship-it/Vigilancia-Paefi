// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "troque_essa_chave_antes_da_producao";
const COOKIE_NAME = "sid";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req as any).cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ message: "Não autenticado" });
    const decoded = jwt.verify(token, SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Token inválido" });
  }
}


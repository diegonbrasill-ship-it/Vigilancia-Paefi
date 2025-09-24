import { Router, Request, Response } from "express";
import pool from "../db";
import { authMiddleware } from "../middleware/auth";
import { logAction } from "../services/logger";

const router = Router();

// Middleware para garantir que todas as rotas de demandas são protegidas
router.use(authMiddleware);

// ROTA: Listar todas as demandas (GET /api/demandas)
router.get("/", async (req: Request, res: Response) => {
    try {
        // Uma consulta SQL que junta informações de 'demandas', 'casos' e 'users'
        // para termos uma lista completa e informativa.
        const query = `
            SELECT
                d.id,
                d.tipo_documento,
                d.instituicao_origem,
                d.data_recebimento,
                d.prazo_resposta,
                d.status,
                c.nome AS nome_caso,
                c.id AS caso_id,
                u_tec.username AS tecnico_designado,
                u_reg.username AS registrado_por
            FROM demandas d
            LEFT JOIN casos c ON d.caso_associado_id = c.id
            LEFT JOIN users u_tec ON d.tecnico_designado_id = u_tec.id
            LEFT JOIN users u_reg ON d.registrado_por_id = u_reg.id
            ORDER BY d.data_recebimento DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err: any) {
        console.error("Erro ao listar demandas:", err.message);
        res.status(500).json({ message: "Erro interno ao buscar demandas." });
    }
});

// ROTA: Criar uma nova demanda (POST /api/demandas)
router.post("/", async (req: Request, res: Response) => {
    const {
        tipo_documento,
        instituicao_origem,
        numero_documento,
        data_recebimento,
        prazo_resposta,
        assunto,
        caso_associado_id,
        tecnico_designado_id
    } = req.body;

    const registrado_por_id = req.user!.id;

    // Validação básica
    if (!tipo_documento || !instituicao_origem || !data_recebimento || !tecnico_designado_id) {
        return res.status(400).json({ message: "Campos obrigatórios estão faltando." });
    }

    try {
        const result = await pool.query(
            `INSERT INTO demandas (
                tipo_documento, instituicao_origem, numero_documento, data_recebimento, 
                prazo_resposta, assunto, caso_associado_id, tecnico_designado_id, registrado_por_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [
                tipo_documento, instituicao_origem, numero_documento, data_recebimento,
                prazo_resposta, assunto, caso_associado_id, tecnico_designado_id, registrado_por_id
            ]
        );
        const novaDemandaId = result.rows[0].id;
        
        await logAction({ 
            userId: registrado_por_id, 
            username: req.user!.username, 
            action: 'CREATE_DEMAND', 
            details: { demandaId: novaDemandaId, assunto } 
        });
        
        res.status(201).json({ message: "Demanda registrada com sucesso!", demandaId: novaDemandaId });
    } catch (err: any) {
        console.error("Erro ao registrar demanda:", err.message);
        res.status(500).json({ message: "Erro interno ao registrar a demanda." });
    }
});

// (Aqui podemos adicionar as rotas GET /:id, PUT /:id, DELETE /:id no futuro)

export default router;
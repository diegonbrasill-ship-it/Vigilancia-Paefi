// backend/src/routes/dashboard.ts

import { Router, Request, Response } from "express";
import pool from "../db";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Função auxiliar para adicionar o filtro de data de forma segura
const addDateFilter = (baseQuery: string, params: any[], mes?: any): [string, any[]] => {
    let newQuery = baseQuery;
    if (mes && typeof mes === 'string' && mes !== '') {
        const whereClause = ` TO_CHAR("dataCad", 'YYYY-MM') = $${params.length + 1} `;
        newQuery += newQuery.toUpperCase().includes('WHERE') ? ` AND ${whereClause}` : ` WHERE ${whereClause}`;
        params.push(mes);
    }
    return [newQuery, params];
};

// ROTA PARA OPÇÕES DE FILTRO
router.get("/filter-options", authMiddleware, async (req: Request, res: Response) => {
    try {
        const mesesQuery = `SELECT DISTINCT TO_CHAR("dataCad", 'YYYY-MM') AS mes FROM casos WHERE "dataCad" IS NOT NULL ORDER BY mes DESC;`;
        const result = await pool.query(mesesQuery);
        const meses = result.rows.map(row => row.mes);
        res.json({ meses });
    } catch (err: any) {
        console.error("Erro ao buscar opções de filtro:", err.message);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});

// Função genérica para executar consultas de CONTAGEM SIMPLES
const executeCountQuery = async (req: Request, res: Response, resultKey: string, baseQuery: string) => {
    try {
        const { mes } = req.query;
        let [query, params] = addDateFilter(baseQuery, [], mes);
        const result = await pool.query(query, params);
        const total = result.rows[0]?.total ? parseInt(result.rows[0].total, 10) : 0;
        res.json({ [resultKey]: total });
    } catch (err: any) {
        console.error(`Erro ao buscar ${resultKey}:`, err.message);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};

// Função genérica para executar consultas de ITEM PRINCIPAL (mais comum)
const executePrincipalQuery = async (req: Request, res: Response, resultKey: string, field: string) => {
    try {
        const { mes } = req.query;
        let [query, params] = addDateFilter(`SELECT dados_completos->>'${field}' AS name FROM casos WHERE dados_completos->>'${field}' IS NOT NULL AND dados_completos->>'${field}' <> ''`, [], mes);
        query += ' GROUP BY name ORDER BY COUNT(*) DESC LIMIT 1';
        const result = await pool.query(query, params);
        const principal = result.rows.length > 0 ? result.rows[0].name : "N/I";
        res.json({ [resultKey]: principal });
    } catch (err: any) {
        console.error(`Erro ao buscar ${resultKey}:`, err.message);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};

// Função genérica para executar consultas de GRÁFICO (agrupamento)
const executeChartQuery = async (req: Request, res: Response, field: string, limit?: number) => {
     try {
        const { mes } = req.query;
        let [query, params] = addDateFilter(`SELECT dados_completos->>'${field}' AS name, COUNT(*) AS value FROM casos WHERE dados_completos->>'${field}' IS NOT NULL AND dados_completos->>'${field}' <> ''`, [], mes);
        query += ` GROUP BY name ORDER BY value DESC ${limit ? `LIMIT ${limit}` : ''}`;
        const result = await pool.query(query, params);
        const dataFormatada = result.rows.map(row => ({ name: row.name, value: parseInt(row.value, 10) }));
        res.json(dataFormatada);
    } catch (err: any) {
        console.error(`Erro ao buscar dados do gráfico para ${field}:`, err.message);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};

// --- ROTAS DE INDICADORES (TODAS ATUALIZADAS PARA ACEITAR FILTROS) ---
router.get("/total-casos", authMiddleware, (req, res) => executeCountQuery(req, res, "totalAtendimentos", 'SELECT COUNT(id) AS total FROM casos'));
router.get("/novos-no-mes", authMiddleware, (req, res) => executeCountQuery(req, res, "novosNoMes", `SELECT COUNT(id) AS total FROM casos WHERE "dataCad" >= date_trunc('month', CURRENT_DATE)`));
router.get("/inseridos-paefi", authMiddleware, (req, res) => executeCountQuery(req, res, "inseridosPAEFI", `SELECT COUNT(id) AS total FROM casos WHERE dados_completos->>'inseridoPAEFI' = 'Sim'`));
router.get("/casos-reincidentes", authMiddleware, (req, res) => executeCountQuery(req, res, "reincidentes", `SELECT COUNT(id) AS total FROM casos WHERE dados_completos->>'reincidente' = 'Sim'`));
router.get("/recebem-bolsa-familia", authMiddleware, (req, res) => executeCountQuery(req, res, "recebemBolsaFamilia", `SELECT COUNT(id) AS total FROM casos WHERE dados_completos->>'recebePBF' = 'Sim'`));

// =======================================================================
// CORREÇÃO APLICADA AQUI: A query agora busca apenas pelos valores explícitos 'Idoso' ou 'PCD'.
// =======================================================================
router.get("/recebem-bpc", authMiddleware, (req, res) => executeCountQuery(req, res, "recebemBPC", `SELECT COUNT(id) AS total FROM casos WHERE dados_completos->>'recebeBPC' IN ('Idoso', 'PCD')`));

router.get("/violencia-confirmada", authMiddleware, (req, res) => executeCountQuery(req, res, "violenciaConfirmada", `SELECT COUNT(id) AS total FROM casos WHERE dados_completos->>'confirmacaoViolencia' = 'Confirmada'`));
router.get("/notificados-sinan", authMiddleware, (req, res) => executeCountQuery(req, res, "notificadosSINAN", `SELECT COUNT(id) AS total FROM casos WHERE dados_completos->>'notificacaoSINAM' = 'Sim'`));
router.get("/contexto-familiar", authMiddleware, async (req, res) => {
    try {
        const { mes } = req.query;
        let [whereClause, params] = addDateFilter('', [], mes);
        whereClause = whereClause.replace('WHERE', 'AND'); 
        const query = `
            SELECT
                COUNT(*) FILTER (WHERE dados_completos->>'dependeFinanceiro' = 'Sim' ${whereClause}) AS "dependenciaFinanceira",
                COUNT(*) FILTER (WHERE dados_completos->>'vitimaPCD' = 'Sim' ${whereClause}) AS "vitimaPCD",
                COUNT(*) FILTER (WHERE dados_completos->>'membroCarcerario' = 'Sim' ${whereClause}) AS "membroCarcerario",
                COUNT(*) FILTER (WHERE dados_completos->>'membroSocioeducacao' = 'Sim' ${whereClause}) AS "membroSocioeducacao"
            FROM casos
        `;
        const result = await pool.query(query, params);
        const data = result.rows[0];
        res.json({
            dependenciaFinanceira: parseInt(data.dependenciaFinanceira, 10), vitimaPCD: parseInt(data.vitimaPCD, 10),
            membroCarcerario: parseInt(data.membroCarcerario, 10), membroSocioeducacao: parseInt(data.membroSocioeducacao, 10),
        });
    } catch(err) { res.status(500).json({ message: "Erro no servidor." });}
});

router.get("/moradia-principal", authMiddleware, (req, res) => executePrincipalQuery(req, res, "moradiaPrincipal", "tipoMoradia"));
router.get("/escolaridade-principal", authMiddleware, (req, res) => executePrincipalQuery(req, res, "escolaridadePrincipal", "escolaridade"));
router.get("/violencia-principal", authMiddleware, (req, res) => executePrincipalQuery(req, res, "violenciaPrincipal", "tipoViolencia"));
router.get("/local-principal", authMiddleware, (req, res) => executePrincipalQuery(req, res, "localPrincipal", "localOcorrencia"));

router.get("/tipos-violacao", authMiddleware, (req, res) => executeChartQuery(req, res, "tipoViolencia"));
router.get("/casos-por-bairro", authMiddleware, (req, res) => executeChartQuery(req, res, "bairro", 5));
router.get("/casos-por-sexo", authMiddleware, (req, res) => executeChartQuery(req, res, "sexo"));
router.get("/encaminhamentos-top5", authMiddleware, (req, res) => executeChartQuery(req, res, "encaminhamentoDetalhe", 5));
router.get("/canal-denuncia", authMiddleware, (req, res) => executeChartQuery(req, res, "canalDenuncia"));

export default router;


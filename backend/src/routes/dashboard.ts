// backend/src/routes/dashboard.ts

import { Router, Request, Response } from "express";
import pool from "../db";
import { authMiddleware } from "../middleware/auth";
import { QueryResult } from "pg";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
    try {
        const { mes } = req.query as { mes?: string };

        const addDateFilter = (baseQuery: string): [string, any[]] => {
            const params: any[] = [];
            let newQuery = baseQuery;
            if (mes && mes !== '') {
                const whereClause = ` TO_CHAR("dataCad", 'YYYY-MM') = $1 `;
                newQuery += newQuery.toUpperCase().includes('WHERE') ? ` AND ${whereClause}` : ` WHERE ${whereClause}`;
                params.push(mes);
            }
            return [newQuery, params];
        };

        const queries = [];
        
        queries.push(pool.query(...addDateFilter('SELECT COUNT(id) AS total FROM casos')));
        queries.push(pool.query(...addDateFilter(`SELECT COUNT(id) AS total FROM casos WHERE "dataCad" >= date_trunc('month', CURRENT_DATE)`)));
        queries.push(pool.query(...addDateFilter(`SELECT COUNT(id) AS total FROM casos WHERE dados_completos->>'inseridoPAEFI' = 'Sim'`)));
        queries.push(pool.query(...addDateFilter(`SELECT COUNT(id) AS total FROM casos WHERE dados_completos->>'reincidente' = 'Sim'`)));
        queries.push(pool.query(...addDateFilter(`SELECT COUNT(id) AS total FROM casos WHERE dados_completos->>'recebePBF' = 'Sim'`)));
        queries.push(pool.query(...addDateFilter(`SELECT COUNT(id) AS total FROM casos WHERE dados_completos->>'recebeBPC' IN ('Idoso', 'PCD')`)));
        queries.push(pool.query(...addDateFilter(`SELECT COUNT(id) AS total FROM casos WHERE dados_completos->>'confirmacaoViolencia' = 'Confirmada'`)));
        queries.push(pool.query(...addDateFilter(`SELECT COUNT(id) AS total FROM casos WHERE dados_completos->>'notificacaoSINAM' = 'Sim'`)));

        let [contextoWhere, contextoParams] = addDateFilter('');
        contextoWhere = contextoWhere.replace('WHERE', 'AND');
        const contextoQuery = `SELECT
            COUNT(*) FILTER (WHERE dados_completos->>'dependeFinanceiro' = 'Sim' ${contextoWhere}) AS "dependenciaFinanceira",
            COUNT(*) FILTER (WHERE dados_completos->>'vitimaPCD' = 'Sim' ${contextoWhere}) AS "vitimaPCD",
            COUNT(*) FILTER (WHERE dados_completos->>'membroCarcerario' = 'Sim' ${contextoWhere}) AS "membroCarcerario",
            COUNT(*) FILTER (WHERE dados_completos->>'membroSocioeducacao' = 'Sim' ${contextoWhere}) AS "membroSocioeducacao"
            FROM casos`;
        queries.push(pool.query(contextoQuery, contextoParams));

        const principalFields = ["tipoMoradia", "escolaridade", "tipoViolencia", "localOcorrencia"];
        principalFields.forEach(field => {
            const [query, params] = addDateFilter(`SELECT dados_completos->>'${field}' AS name FROM casos WHERE dados_completos->>'${field}' IS NOT NULL AND dados_completos->>'${field}' <> '' GROUP BY dados_completos->>'${field}' ORDER BY COUNT(*) DESC LIMIT 1`);
            queries.push(pool.query(query, params));
        });

        const chartFields = [
            { field: "tipoViolencia" }, { field: "bairro", limit: 5 }, { field: "sexo" },
            { field: "encaminhamentoDetalhe", limit: 5 }, { field: "canalDenuncia" }, { field: "corEtnia" }
        ];
        chartFields.forEach(({ field, limit }) => {
            let [query, params] = addDateFilter(`SELECT dados_completos->>'${field}' AS name, COUNT(*) AS value FROM casos WHERE dados_completos->>'${field}' IS NOT NULL AND dados_completos->>'${field}' <> ''`);
            query += ` GROUP BY dados_completos->>'${field}' ORDER BY value DESC ${limit ? `LIMIT ${limit}` : ''}`;
            queries.push(pool.query(query, params));
        });
        
        const faixaEtariaExpression = `CASE WHEN (dados_completos->>'idade')::integer BETWEEN 0 AND 11 THEN 'Criança (0-11)' WHEN (dados_completos->>'idade')::integer BETWEEN 12 AND 17 THEN 'Adolescente (12-17)' WHEN (dados_completos->>'idade')::integer BETWEEN 18 AND 29 THEN 'Jovem (18-29)' WHEN (dados_completos->>'idade')::integer BETWEEN 30 AND 59 THEN 'Adulto (30-59)' WHEN (dados_completos->>'idade')::integer >= 60 THEN 'Idoso (60+)' ELSE 'Não informado' END`;
        let [faixaQuery, faixaParams] = addDateFilter(`SELECT ${faixaEtariaExpression} AS name, COUNT(*) AS value FROM casos WHERE dados_completos->>'idade' ~ '^\\d+$'`);
        faixaQuery += ` GROUP BY (${faixaEtariaExpression}) ORDER BY CASE (${faixaEtariaExpression}) WHEN 'Criança (0-11)' THEN 1 WHEN 'Adolescente (12-17)' THEN 2 WHEN 'Jovem (18-29)' THEN 3 WHEN 'Adulto (30-59)' THEN 4 WHEN 'Idoso (60+)' THEN 5 ELSE 6 END`;
        queries.push(pool.query(faixaQuery, faixaParams));

        const results: QueryResult[] = await Promise.all(queries);

        const dashboardData = {
            indicadores: {
                totalAtendimentos: parseInt(results[0].rows[0]?.total || 0, 10),
                novosNoMes: parseInt(results[1].rows[0]?.total || 0, 10),
                inseridosPAEFI: parseInt(results[2].rows[0]?.total || 0, 10),
                reincidentes: parseInt(results[3].rows[0]?.total || 0, 10),
                recebemBolsaFamilia: parseInt(results[4].rows[0]?.total || 0, 10),
                recebemBPC: parseInt(results[5].rows[0]?.total || 0, 10),
                violenciaConfirmada: parseInt(results[6].rows[0]?.total || 0, 10),
                notificadosSINAN: parseInt(results[7].rows[0]?.total || 0, 10),
                contextoFamiliar: {
                    dependenciaFinanceira: parseInt(results[8].rows[0]?.dependenciaFinanceira || 0, 10),
                    vitimaPCD: parseInt(results[8].rows[0]?.vitimaPCD || 0, 10),
                    membroCarcerario: parseInt(results[8].rows[0]?.membroCarcerario || 0, 10),
                    membroSocioeducacao: parseInt(results[8].rows[0]?.membroSocioeducacao || 0, 10),
                },
            },
            principais: {
                moradiaPrincipal: results[9].rows[0]?.name || "N/I",
                escolaridadePrincipal: results[10].rows[0]?.name || "N/I",
                violenciaPrincipal: results[11].rows[0]?.name || "N/I",
                localPrincipal: results[12].rows[0]?.name || "N/I",
            },
            graficos: {
                tiposViolacao: results[13].rows.map((r: any) => ({ ...r, value: parseInt(r.value, 10) })),
                casosPorBairro: results[14].rows.map((r: any) => ({ ...r, value: parseInt(r.value, 10) })),
                casosPorSexo: results[15].rows.map((r: any) => ({ ...r, value: parseInt(r.value, 10) })),
                encaminhamentosTop5: results[16].rows.map((r: any) => ({ ...r, value: parseInt(r.value, 10) })),
                canalDenuncia: results[17].rows.map((r: any) => ({ ...r, value: parseInt(r.value, 10) })),
                casosPorCor: results[18].rows.map((r: any) => ({ ...r, value: parseInt(r.value, 10) })),
                casosPorFaixaEtaria: results[19].rows.map((r: any) => ({ ...r, value: parseInt(r.value, 10) })),
            }
        };
        res.json(dashboardData);
    } catch (err: any) {
        console.error("Erro na rota unificada do dashboard:", err.message);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});

router.get("/filter-options", authMiddleware, async (req: Request, res: Response) => {
    try {
        const mesesQuery = `SELECT DISTINCT TO_CHAR("dataCad", 'YYYY-MM') AS mes FROM casos WHERE "dataCad" IS NOT NULL ORDER BY mes DESC;`;
        const result = await pool.query(mesesQuery);
        const meses = result.rows.map((row: any) => row.mes);
        res.json({ meses });
    } catch (err: any) {
        console.error("Erro ao buscar opções de filtro:", err.message);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});

export default router;
// backend/src/routes/casos.ts

import { Router, Request, Response } from "express";
import pool from "../db";
import { authMiddleware, checkRole } from "../middleware/auth";
import { logAction } from "../services/logger";

const router = Router();

// ROTA PARA CRIAR UM NOVO CASO (ATENDIMENTO) - VERSÃO FINAL CORRIGIDA
router.post("/", authMiddleware, async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const casoData = req.body;

    try {
        // Extraímos os campos do corpo da requisição.
        // Se 'nome' não for enviado, ele será 'null', o que é permitido pelo banco de dados agora.
        const { dataCad, tecRef, nome = null } = casoData; 

        // VALIDAÇÃO FINAL: Apenas data e técnico são obrigatórios, conforme a regra de negócio.
        if (!dataCad || !tecRef) {
            return res.status(400).json({ 
                message: "Falha na validação: Os campos 'Data do Cadastro' e 'Técnico Responsável' são obrigatórios." 
            });
        }
        
        // O objeto completo 'casoData' será salvo no campo JSON para não perder nenhuma informação.
        const dados_completos = casoData;

        // O comando INSERT está alinhado com a estrutura da tabela no db.ts
        const result = await pool.query(
            `INSERT INTO casos ("dataCad", "tecRef", nome, dados_completos, "userId")
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [ dataCad, tecRef, nome, JSON.stringify(dados_completos), userId ]
        );

        const novoCasoId = result.rows[0].id;
        await logAction({ userId, username: req.user!.username, action: 'CREATE_CASE', details: { casoId: novoCasoId, nomeVitima: nome } });
        
        res.status(201).json({ message: "Caso cadastrado com sucesso!", casoId: novoCasoId });

    } catch (err: any) {
        console.error("Erro ao cadastrar caso:", err.message);
        res.status(500).json({ message: "Erro interno no servidor ao cadastrar o caso." });
    }
});

// =======================================================================
// NOVA ROTA PARA ATUALIZAR UM CASO EXISTENTE (PUT)
// =======================================================================
/**
 * @route   PUT /api/casos/:id
 * @desc    Atualiza um caso existente com novos dados.
 * @access  Private
 */
router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    const novosDados = req.body;
    const userId = req.user!.id;
    const username = req.user!.username;

    try {
        // 1. Primeiro, buscamos os dados existentes no banco.
        const resultadoAtual = await pool.query('SELECT dados_completos FROM casos WHERE id = $1', [id]);
        if (resultadoAtual.rowCount === 0) {
            return res.status(404).json({ message: "Caso não encontrado." });
        }
        const dadosAntigos = resultadoAtual.rows[0].dados_completos;

        // 2. Mesclamos os dados antigos com os novos.
        // Isso garante que os dados preenchidos na Aba 1 não sejam apagados
        // quando salvarmos os dados da Aba 2, e assim por diante.
        const dadosMesclados = { ...dadosAntigos, ...novosDados };
        
        // 3. Extraímos os campos que têm colunas próprias.
        const { dataCad, tecRef, nome = null } = dadosMesclados;

        // 4. Executamos o comando UPDATE no banco de dados.
        await pool.query(
            `UPDATE casos 
             SET "dataCad" = $1, "tecRef" = $2, nome = $3, dados_completos = $4
             WHERE id = $5`,
            [dataCad, tecRef, nome, JSON.stringify(dadosMesclados), id]
        );

        await logAction({ userId, username, action: 'UPDATE_CASE', details: { casoId: id } });

        res.status(200).json({ message: "Prontuário atualizado com sucesso!", caso: dadosMesclados });

    } catch (err: any) {
        console.error(`Erro ao atualizar caso ${id}:`, err.message);
        res.status(500).json({ message: "Erro interno ao atualizar o prontuário." });
    }
});


// ROTA PARA LISTAR CASOS - 100% PRESERVADA
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const userId = req.user!.id;
  const { tecRef } = req.query;

  try {
    let query = 'SELECT id, "dataCad", "tecRef", nome, dados_completos->>\'bairro\' as bairro FROM casos';
    const params: (string | number)[] = [];
    const whereClauses: string[] = [];

    if (userRole === 'tecnico') {
      params.push(userId);
      whereClauses.push(`"userId" = $${params.length}`);
    }

    if (tecRef && typeof tecRef === 'string') {
      params.push(`%${tecRef}%`);
      whereClauses.push(`"tecRef" ILIKE $${params.length}`);
    }
    
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    query += ' ORDER BY "dataCad" DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (err: any) {
    console.error("Erro ao listar casos:", err.message);
    res.status(500).json({ message: "Erro ao buscar casos." });
  }
});


// ROTA PARA BUSCAR UM ÚNICO CASO POR ID - 100% PRESERVADA
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    const userRole = req.user!.role;
    const userId = req.user!.id;

    try {
        let query = 'SELECT * FROM casos WHERE id = $1';
        const params: (string | number)[] = [id];
        if (userRole === 'tecnico') {
            query += ' AND "userId" = $2';
            params.push(userId);
        }
        const result = await pool.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Caso não encontrado ou você não tem permissão para vê-lo." });
        }
        const casoBase = result.rows[0];
        // Monta o objeto de resposta final, combinando os campos da tabela com o JSON
        const casoCompleto = {
            ...casoBase.dados_completos,
            id: casoBase.id,
            dataCad: casoBase.dataCad,
            tecRef: casoBase.tecRef,
            nome: casoBase.nome,
            userId: casoBase.userId
        };
        res.json(casoCompleto);
    } catch (err: any) {
        res.status(500).json({ message: "Erro ao buscar detalhes do caso." });
    }
});


// ROTA PARA EXCLUIR UM CASO - 100% PRESERVADA
router.delete("/:id", authMiddleware, checkRole(['coordenador']), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { id: userId, username } = req.user!;

    try {
        const result = await pool.query('DELETE FROM casos WHERE id = $1 RETURNING nome', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Caso não encontrado.' });
        }
        const nomeVitima = result.rows[0].nome;
        await logAction({
            userId,
            username,
            action: 'DELETE_CASE',
            details: { casoId: id, nomeVitima }
        });
        res.status(200).json({ message: 'Caso excluído com sucesso.' });
    } catch (err: any) {
        console.error("Erro ao excluir caso:", err.message);
        res.status(500).json({ message: "Erro ao excluir caso." });
    }
});


// ROTA PARA LISTAR OS ENCAMINHAMENTOS DE UM CASO ESPECÍFICO - 100% PRESERVADA
router.get("/:casoId/encaminhamentos", authMiddleware, async (req: Request, res: Response) => {
  const { casoId } = req.params;
  try {
    const query = `
      SELECT
        enc.id,
        enc."servicoDestino",
        enc."dataEncaminhamento",
        enc.status,
        enc.observacoes,
        usr.username AS "tecRef" 
      FROM encaminhamentos enc
      LEFT JOIN users usr ON enc."userId" = usr.id
      WHERE enc."casoId" = $1
      ORDER BY enc."dataEncaminhamento" DESC;
    `;
    const result = await pool.query(query, [casoId]);
    res.json(result.rows);
  } catch (err: any) {
    console.error(`Erro ao listar encaminhamentos para o caso ${casoId}:`, err.message);
    res.status(500).json({ message: "Erro ao buscar encaminhamentos." });
  }
});


export default router;
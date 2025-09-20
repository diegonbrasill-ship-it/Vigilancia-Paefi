// backend/src/routes/casos.ts

import { Router, Request, Response } from "express";
import pool from "../db";
import { authMiddleware, checkRole } from "../middleware/auth";
import { logAction } from "../services/logger";

const router = Router();

// =======================================================================
// FUNÇÃO AUXILIAR PARA ANONIMIZAR DADOS
// =======================================================================
function anonimizarDadosSeNecessario(user: { id: number; role: string }, data: any): any {
  if (user.role !== 'vigilancia') {
    return data;
  }
  const removerCamposSensiveis = (caso: any) => {
    const casoAnonimizado = { ...caso };
    delete casoAnonimizado.nome;
    delete casoAnonimizado.cpf;
    delete casoAnonimizado.nis;
    if (casoAnonimizado.dados_completos) {
      delete casoAnonimizado.dados_completos.nome;
      delete casoAnonimizado.dados_completos.cpf;
      delete casoAnonimizado.dados_completos.nis;
    }
    return casoAnonimizado;
  };
  if (Array.isArray(data)) {
    return data.map(removerCamposSensiveis);
  } else {
    return removerCamposSensiveis(data);
  }
}

// ROTA PARA CRIAR UM NOVO CASO (ATENDIMENTO)
router.post("/", authMiddleware, async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const casoData = req.body;
    try {
        const { dataCad, tecRef, nome = null } = casoData; 
        if (!dataCad || !tecRef) {
            return res.status(400).json({ 
                message: "Falha na validação: Os campos 'Data do Cadastro' e 'Técnico Responsável' são obrigatórios." 
            });
        }
        const dados_completos = casoData;
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

// ROTA PARA ATUALIZAR UM CASO EXISTENTE (PUT)
router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    const novosDados = req.body;
    const userId = req.user!.id;
    const username = req.user!.username;
    try {
        const resultadoAtual = await pool.query('SELECT dados_completos FROM casos WHERE id = $1', [id]);
        if (resultadoAtual.rowCount === 0) {
            return res.status(404).json({ message: "Caso não encontrado." });
        }
        const dadosAntigos = resultadoAtual.rows[0].dados_completos;
        const dadosMesclados = { ...dadosAntigos, ...novosDados };
        const { dataCad, tecRef, nome = null } = dadosMesclados;
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

// ROTA DE LISTAGEM DE CASOS (GET) - COM FILTROS AVANÇADOS
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const user = req.user!;
  const { tecRef, filtro, valor } = req.query;

  try {
    // A seleção de colunas agora é mais completa para a lista do modal
    let query = 'SELECT id, "dataCad", "tecRef", nome, dados_completos->>\'bairro\' as bairro FROM casos';
    const params: (string | number)[] = [];
    let whereClauses: string[] = [];

    // Filtro 1: Restrição por perfil 'tecnico'
    if (user.role === 'tecnico') {
      params.push(user.id);
      whereClauses.push(`"userId" = $${params.length}`);
    }

    // Filtro 2: Busca por nome do técnico de referência
    if (tecRef && typeof tecRef === 'string') {
      params.push(`%${tecRef}%`);
      whereClauses.push(`"tecRef" ILIKE $${params.length}`);
    }
    
    // Filtro 3: Novos filtros dinâmicos para o "Drill-Down"
    if (filtro && typeof filtro === 'string') {
        switch (filtro) {
            case 'todos':
                // Novo filtro para listar todos os casos (usado na Sobrecarga da Equipe)
                break; // Nenhuma cláusula WHERE necessária
            case 'novos_no_mes':
                whereClauses.push(`"dataCad" >= date_trunc('month', current_date)`);
                break;
            case 'reincidentes':
                whereClauses.push(`LOWER(dados_completos->>'reincidente') = 'sim'`);
                break;
            case 'inseridos_paefi':
                whereClauses.push(`LOWER(dados_completos->>'inseridoPAEFI') = 'sim'`);
                break;
            case 'por_bairro':
                if (valor && typeof valor === 'string') {
                    params.push(valor);
                    whereClauses.push(`dados_completos->>'bairro' = $${params.length}`);
                }
                break;
            case 'por_violencia':
                 if (valor && typeof valor === 'string') {
                    params.push(valor);
                    whereClauses.push(`dados_completos->>'tipoViolencia' = $${params.length}`);
                }
                break;
            case 'por_canal':
                 if (valor && typeof valor === 'string') {
                    params.push(valor);
                    whereClauses.push(`dados_completos->>'canalDenuncia' = $${params.length}`);
                }
                break;
            case 'por_sexo':
                if (valor && typeof valor === 'string') {
                    params.push(valor);
                    whereClauses.push(`dados_completos->>'sexo' = $${params.length}`);
                }
                break;
        }
    }
    
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    query += ' ORDER BY "dataCad" DESC';

    const result = await pool.query(query, params);
    
    const dadosProcessados = anonimizarDadosSeNecessario(user, result.rows);
    
    res.json(dadosProcessados);
  } catch (err: any) {
    console.error("Erro ao listar casos:", err.message);
    res.status(500).json({ message: "Erro ao buscar casos." });
  }
});

// ROTA PARA BUSCAR UM ÚNICO CASO POR ID
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    try {
        let query = 'SELECT * FROM casos WHERE id = $1';
        const params: (string | number)[] = [id];
        if (user.role === 'tecnico') {
            query += ' AND "userId" = $2';
            params.push(user.id);
        }
        const result = await pool.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Caso não encontrado ou você não tem permissão para vê-lo." });
        }
        const casoBase = result.rows[0];
        const casoCompleto = {
            ...casoBase.dados_completos,
            id: casoBase.id,
            dataCad: casoBase.dataCad,
            tecRef: casoBase.tecRef,
            nome: casoBase.nome,
            userId: casoBase.userId
        };
        const dadosProcessados = anonimizarDadosSeNecessario(user, casoCompleto);
        res.json(dadosProcessados);
    } catch (err: any) {
        console.error(`Erro ao buscar detalhes do caso ${id}:`, err.message);
        res.status(500).json({ message: "Erro ao buscar detalhes do caso." });
    }
});

// ROTA PARA EXCLUIR UM CASO (DELETE)
router.delete("/:id", authMiddleware, checkRole(['coordenador']), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { id: userId, username } = req.user!;
    try {
        const result = await pool.query('DELETE FROM casos WHERE id = $1 RETURNING nome', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Caso não encontrado.' });
        }
        const nomeVitima = result.rows[0].nome;
        await logAction({ userId, username, action: 'DELETE_CASE', details: { casoId: id, nomeVitima } });
        res.status(200).json({ message: 'Caso excluído com sucesso.' });
    } catch (err: any) {
        console.error("Erro ao excluir caso:", err.message);
        res.status(500).json({ message: "Erro ao excluir caso." });
    }
});

// ROTA PARA LISTAR ENCAMINHAMENTOS DE UM CASO
router.get("/:casoId/encaminhamentos", authMiddleware, async (req: Request, res: Response) => {
    const { casoId } = req.params;
    try {
        const query = `
          SELECT
            enc.id, enc."servicoDestino", enc."dataEncaminhamento", enc.status,
            enc.observacoes, usr.username AS "tecRef" 
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
// backend/src/routes/casos.ts

import { Router, Request, Response } from "express";
import pool from "../db";
import { authMiddleware, checkRole } from "../middleware/auth";
import { logAction } from "../services/logger";

const router = Router();

// =======================================================================
// NOVA FUNÇÃO AUXILIAR PARA ANONIMIZAR DADOS
// =======================================================================
/**
 * Recebe o usuário da requisição e um caso (ou uma lista de casos).
 * Se o usuário for do perfil 'vigilancia', remove os campos sensíveis.
 * @param user Objeto do usuário da requisição (contém o 'role')
 * @param data Um único objeto de caso ou um array de objetos de caso
 * @returns Os dados com os campos sensíveis removidos, se aplicável.
 */
function anonimizarDadosSeNecessario(user: { role: string }, data: any): any {
  // Se o perfil NÃO for 'vigilancia', retorna os dados originais sem modificação.
  if (user.role !== 'vigilancia') {
    return data;
  }

  // Função interna para remover os campos de um único objeto
  const removerCamposSensiveis = (caso: any) => {
    // Cria uma cópia do objeto para não modificar o original (boa prática)
    const casoAnonimizado = { ...caso };
    
    // Deleta as propriedades sensíveis. Usamos o operador 'delete'.
    delete casoAnonimizado.nome;
    delete casoAnonimizado.cpf;
    delete casoAnonimizado.nis;

    // Se os dados estiverem dentro do JSON 'dados_completos', removemos de lá também.
    if (casoAnonimizado.dados_completos) {
      delete casoAnonimizado.dados_completos.nome;
      delete casoAnonimizado.dados_completos.cpf;
      delete casoAnonimizado.dados_completos.nis;
    }

    return casoAnonimizado;
  };

  // Verifica se 'data' é um array ou um único objeto e aplica a função
  if (Array.isArray(data)) {
    return data.map(removerCamposSensiveis);
  } else {
    return removerCamposSensiveis(data);
  }
}

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

// =======================================================================
// ROTA DE LISTAGEM DE CASOS (GET) - ATUALIZADA PARA FILTROS AVANÇADOS
// =======================================================================
/**
 * @route   GET /api/casos
 * @desc    Lista casos com base em múltiplos filtros para o drill-down.
 * @access  Private
 */
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const user = req.user!;
  const { tecRef, filtro, valor } = req.query; // Novos parâmetros: filtro e valor

  try {
    let query = 'SELECT id, "dataCad", "tecRef", nome, dados_completos->>\'bairro\' as bairro FROM casos';
    const params: (string | number)[] = [];
    const whereClauses: string[] = [];

    // Filtro 1: Restrição por perfil 'tecnico' (já existente)
    if (user.role === 'tecnico') {
      params.push(user.id);
      whereClauses.push(`"userId" = $${params.length}`);
    }

    // Filtro 2: Busca por nome do técnico de referência (já existente)
    if (tecRef && typeof tecRef === 'string') {
      params.push(`%${tecRef}%`);
      whereClauses.push(`"tecRef" ILIKE $${params.length}`);
    }
    
    // Filtro 3: Novos filtros dinâmicos para o "Drill-Down"
    if (filtro && typeof filtro === 'string') {
        switch (filtro) {
            case 'novos_no_mes':
                whereClauses.push(`"dataCad" >= date_trunc('month', current_date)`);
                break;
            case 'reincidentes':
                whereClauses.push(`(dados_completos->>'reincidente')::boolean = true`);
                break;
            case 'inseridos_paefi':
                whereClauses.push(`(dados_completos->>'inseridoPAEFI')::boolean = true`);
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
                    whereClauses.push(`"tipoViolencia" = $${params.length}`);
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
    
    // Constrói a query final
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    query += ' ORDER BY "dataCad" DESC';

    const result = await pool.query(query, params);

    // Aplica a anonimização ANTES de enviar a resposta
    const dadosProcessados = anonimizarDadosSeNecessario(user, result.rows);
    
    res.json(dadosProcessados);

  } catch (err: any) {
    console.error("Erro ao listar casos:", err.message);
    res.status(500).json({ message: "Erro ao buscar casos." });
  }
});

// ROTA PARA LISTAR CASOS - ATUALIZADA COM A LÓGICA DE ANONIMIZAÇÃO
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const user = req.user!;
  const { tecRef } = req.query;

  try {
    let query = 'SELECT id, "dataCad", "tecRef", nome, dados_completos->>\'bairro\' as bairro FROM casos';
    const params: (string | number)[] = [];
    const whereClauses: string[] = [];

    if (user.role === 'tecnico') {
      params.push(user.id);
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

    // ANTES DE ENVIAR A RESPOSTA, APLICAMOS A ANONIMIZAÇÃO
    const dadosProcessados = anonimizarDadosSeNecessario(user, result.rows);
    
    res.json(dadosProcessados);

  } catch (err: any) {
    console.error("Erro ao listar casos:", err.message);
    res.status(500).json({ message: "Erro ao buscar casos." });
  }
});

// ROTA PARA BUSCAR UM ÚNICO CASO POR ID - ATUALIZADA COM A LÓGICA DE ANONIMIZAÇÃO
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

        // ANTES DE ENVIAR A RESPOSTA, APLICAMOS A ANONIMIZAÇÃO
        const dadosProcessados = anonimizarDadosSeNecessario(user, casoCompleto);

        res.json(dadosProcessados);
    } catch (err: any) {
        res.status(500).json({ message: "Erro ao buscar detalhes do caso." });
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
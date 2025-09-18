// backend/src/routes/anexos.ts

import express, { Request, Response } from 'express';
import pool from '../db';
import { authMiddleware } from '../middleware/auth';
import upload from '../middleware/upload'; // Importamos nossa configuração do multer
import { logAction } from '../services/logger';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/**
 * @route   POST /api/anexos/upload/:casoId
 * @desc    Faz o upload de um novo anexo para um caso específico
 * @access  Private
 */
router.post(
  '/upload/:casoId', 
  authMiddleware, 
  upload.single('anexo'), 
  async (req: Request, res: Response) => {
    
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    const { casoId } = req.params;
    const { descricao } = req.body;
    const userId = req.user!.id;
    const username = req.user!.username;

    const { originalname, filename, path, mimetype, size } = req.file;

    try {
      const query = `
        INSERT INTO anexos 
          ("casoId", "userId", "nomeOriginal", "nomeArmazenado", "caminhoArquivo", "tipoArquivo", "tamanhoArquivo", descricao)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, "nomeOriginal";
      `;

      const result = await pool.query(query, [
        casoId, userId, originalname, filename, path, mimetype, size, descricao
      ]);
      const novoAnexo = result.rows[0];
      await logAction({
        userId,
        username,
        action: 'UPLOAD_ANEXO',
        details: { casoId, anexoId: novoAnexo.id, nomeArquivo: novoAnexo.nomeOriginal }
      });

      res.status(201).json({ message: 'Arquivo enviado com sucesso!', anexo: novoAnexo });
    } catch (err: any) {
      console.error('Erro ao salvar informações do anexo no banco de dados:', err.message);
      res.status(500).json({ message: 'Erro no servidor ao registrar o anexo.' });
    }
});

// =======================================================================
// NOVA ROTA PARA LISTAR OS ANEXOS DE UM CASO
// =======================================================================
/**
 * @route   GET /api/anexos/casos/:casoId
 * @desc    Lista todos os anexos de um caso específico
 * @access  Private
 */
router.get('/casos/:casoId', authMiddleware, async (req: Request, res: Response) => {
  const { casoId } = req.params;
  try {
    const query = `
      SELECT
        anex.id,
        anex."nomeOriginal",
        anex."tamanhoArquivo",
        anex."dataUpload",
        anex.descricao,
        usr.username AS "uploadedBy"
      FROM anexos anex
      LEFT JOIN users usr ON anex."userId" = usr.id
      WHERE anex."casoId" = $1
      ORDER BY anex."dataUpload" DESC;
    `;
    const result = await pool.query(query, [casoId]);
    res.json(result.rows);
  } catch (err: any) {
    console.error(`Erro ao listar anexos para o caso ${casoId}:`, err.message);
    res.status(500).json({ message: 'Erro ao buscar anexos.' });
  }
});


// =======================================================================
// NOVA ROTA PARA PERMITIR O DOWNLOAD DE UM ANEXO
// =======================================================================
/**
 * @route   GET /api/anexos/download/:id
 * @desc    Faz o download de um anexo específico
 * @access  Private
 */
router.get('/download/:id', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // 1. Busca as informações do arquivo no banco de dados
    const query = `SELECT "caminhoArquivo", "nomeOriginal" FROM anexos WHERE id = $1`;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Anexo não encontrado.' });
    }

    const anexo = result.rows[0];
    const filePath = path.join(__dirname, '..', '..', anexo.caminhoArquivo);

    // 2. Verifica se o arquivo realmente existe no disco
    if (fs.existsSync(filePath)) {
      // 3. Usa a função res.download() do Express, que cuida de tudo para nós
      res.download(filePath, anexo.nomeOriginal, (err) => {
        if (err) {
          console.error('Erro durante o download do arquivo:', err);
        }
      });
    } else {
      res.status(404).json({ message: 'Arquivo não encontrado no servidor.' });
    }
  } catch (err: any) {
    console.error(`Erro ao processar download do anexo ${id}:`, err.message);
    res.status(500).json({ message: 'Erro ao processar download.' });
  }
});


export default router;
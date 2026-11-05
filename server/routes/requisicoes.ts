import { Router } from 'express';
import { pool } from '../db.js';
import { isDbConnectionError } from './usuarios.js';

export const requisicoesRouter = Router();

// Middleware: Bloqueia acesso a dados processuais para usuários com alteração obrigatória de senha pendente
requisicoesRouter.use(async (req, res, next) => {
  const sessionUserId = req.cookies?.prazojus_session || req.headers['x-user-id'];
  if (!sessionUserId) return next();

  try {
    const userCheck = await pool.query(
      'SELECT precisa_trocar_senha FROM usuarios WHERE id::text = $1',
      [sessionUserId]
    );
    if (userCheck.rows.length > 0 && userCheck.rows[0].precisa_trocar_senha) {
      return res.status(403).json({
        error: 'Alteração obrigatória de senha pendente. Cadastre sua nova senha para desbloquear o acesso aos autos.',
        precisaTrocarSenha: true,
      });
    }
  } catch {
    // Caso de banco indisponível, prossegue
  }
  next();
});

// 1. Listar todas as requisições com seus anexos
requisicoesRouter.get('/', async (_req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.numero_processo AS "numeroProcesso",
        r.protocolo,
        r.rep,
        r.descricao,
        r.setor_solicitante AS "setorSolicitante",
        r.tipo_exame AS "tipoExame",
        r.vestigio,
        r.acusado_vitima AS "acusadoVitima",
        r.origem,
        r.referencias,
        r.status,
        r.status_operacional AS "statusOperacional",
        r.cadastro_completo AS "cadastroCompleto",
        r.prazo_indefinido AS "prazoIndefinido",
        r.responsavel_operacional_id AS "responsavelOperacionalId",
        r.responsavel_operacional_nome AS "responsavelOperacionalNome",
        r.data_recebimento_operacional AS "dataRecebimentoOperacional",
        r.data_iniciado_operacional AS "dataIniciadoOperacional",
        r.data_conclusao_operacional AS "dataConclusaoOperacional",
        r.tem_prazo_judicial AS "temPrazoJudicial",
        r.tipo_prazo AS "tipoPrazo",
        r.data_recebimento AS "dataRecebimento",
        r.dias_prazo AS "diasPrazo",
        r.prazo_judicial AS "prazoJudicial",
        r.motivo_prazo_interno AS "motivoPrazoInterno",
        r.prioridade_manual AS "prioridadeManual",
        r.criado_por AS "criadoPor",
        r.criado_em AS "criadoEm",
        r.atualizado_em AS "atualizadoEm",
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'nome', a.nome,
              'tipo', a.tipo,
              'tamanho', a.tamanho,
              'url', COALESCE(a.url_storage, a.conteudo_base64),
              'isComprovacao', a.is_comprovacao,
              'dataUpload', a.data_upload
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS anexos,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pd.id,
                'requisicaoId', pd.requisicao_id,
                'diasSolicitados', pd.dias_solicitados,
                'documentoNome', pd.documento_nome,
                'documentoUrl', COALESCE(pd.documento_url, pd.documento_base64),
                'criadoPorId', pd.criado_por_id,
                'criadoPorNome', pd.criado_por_nome,
                'dataSolicitacao', to_char(pd.data_solicitacao, 'YYYY-MM-DD')
              ) ORDER BY pd.criado_em ASC
            )
            FROM pedidos_dilacao pd
            WHERE pd.requisicao_id = r.id
          ),
          '[]'
        ) AS "pedidosDilacao"
      FROM requisicoes r
      LEFT JOIN anexos a ON a.requisicao_id = r.id
      GROUP BY r.id
      ORDER BY r.criado_em DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    if (isDbConnectionError(error)) {
      return res.json([]);
    }
    console.error('[API /requisicoes] Erro ao listar requisições:', error);
    res.status(500).json({ error: 'Erro ao carregar requisições do banco de dados.' });
  }
});

// Download direto do arquivo PDF armazenado no PostgreSQL
requisicoesRouter.get('/anexos/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT nome, tipo, conteudo_base64 FROM anexos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anexo não encontrado no banco de dados.' });
    }

    const anexo = result.rows[0];
    if (!anexo.conteudo_base64) {
      return res.status(404).json({ error: 'Conteúdo do arquivo não disponível no banco de dados.' });
    }

    // Se for data URL (ex: data:application/pdf;base64,...), extrai o base64 puro
    const base64Data = anexo.conteudo_base64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = anexo.nome.toLowerCase().endsWith('.pdf') ? anexo.nome : `${anexo.nome}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('[API Download Anexo] Erro ao baixar PDF:', error);
    res.status(500).json({ error: 'Erro ao processar download do PDF.' });
  }
});

// 2. Criar Nova Requisição
requisicoesRouter.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const data = req.body;

    const id = data.id || `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const insertReqQuery = `
      INSERT INTO requisicoes (
        id, numero_processo, protocolo, rep, descricao, setor_solicitante, tipo_exame,
        vestigio, acusado_vitima, origem, referencias, status, status_operacional,
        cadastro_completo, prazo_indefinido, responsavel_operacional_id,
        responsavel_operacional_nome, data_recebimento_operacional, tem_prazo_judicial,
        tipo_prazo, data_recebimento, dias_prazo, prazo_judicial, motivo_prazo_interno,
        prioridade_manual, criado_por, criado_em, atualizado_em
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
      ) RETURNING *
    `;

    const reqValues = [
      id,
      data.numeroProcesso,
      data.protocolo || null,
      data.rep || null,
      data.descricao,
      data.setorSolicitante,
      data.tipoExame,
      data.vestigio || null,
      data.acusadoVitima || null,
      data.origem || null,
      data.referencias || null,
      data.status || 'Não iniciado',
      data.statusOperacional || 'Aguardando recebimento',
      Boolean(data.cadastroCompleto),
      Boolean(data.prazoIndefinido),
      data.responsavelOperacionalId || null,
      data.responsavelOperacionalNome || null,
      data.dataRecebimentoOperacional || null,
      data.temPrazoJudicial !== undefined ? data.temPrazoJudicial : true,
      data.tipoPrazo || (data.temPrazoJudicial ? 'judicial' : 'interno'),
      data.dataRecebimento || null,
      data.diasPrazo || 10,
      data.prazoJudicial || null,
      data.motivoPrazoInterno || null,
      data.prioridadeManual || null,
      data.criadoPor || 'Usuário do Sistema',
      now,
      now,
    ];

    const reqResult = await client.query(insertReqQuery, reqValues);

    // Inserção dos anexos se houver
    if (data.anexos && Array.isArray(data.anexos)) {
      for (const att of data.anexos) {
        const attId = att.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await client.query(
          `
          INSERT INTO anexos (id, requisicao_id, nome, tipo, tamanho, conteudo_base64, is_comprovacao, data_upload)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            attId,
            id,
            att.nome,
            att.tipo || 'oficio',
            att.tamanho || 0,
            att.url || att.conteudo_base64 || null,
            Boolean(att.isComprovacao),
            att.dataUpload || now,
          ]
        );
      }
    }

    // Registra auditoria
    await client.query(
      `
      INSERT INTO auditoria_logs 
        (usuario_id, usuario_nome, usuario_cargo, usuario_role, modulo, acao, descricao, entidade_id, entidade_referencia, status)
      VALUES 
        ($1, $2, 'Servidor', 'Operador', 'requisicoes', 'criacao', $3, $4, $5, 'sucesso')
      `,
      [
        data.responsavelOperacionalId || null,
        data.criadoPor || 'Sistema',
        `Nova requisição cadastrada para o processo "${data.numeroProcesso}" no setor "${data.setorSolicitante}".`,
        id,
        data.numeroProcesso,
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, requisicao: reqResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[API /requisicoes] Erro ao cadastrar requisição:', error);
    res.status(500).json({ error: 'Erro ao cadastrar requisição no banco de dados.' });
  } finally {
    client.release();
  }
});

// 3. Atualizar Requisição
requisicoesRouter.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const data = req.body;
    const now = new Date().toISOString();

    const updateQuery = `
      UPDATE requisicoes SET
        numero_processo = COALESCE($1, numero_processo),
        protocolo = COALESCE($2, protocolo),
        rep = COALESCE($3, rep),
        descricao = COALESCE($4, descricao),
        setor_solicitante = COALESCE($5, setor_solicitante),
        tipo_exame = COALESCE($6, tipo_exame),
        vestigio = COALESCE($7, vestigio),
        acusado_vitima = COALESCE($8, acusado_vitima),
        origem = COALESCE($9, origem),
        referencias = COALESCE($10, referencias),
        status = COALESCE($11, status),
        status_operacional = COALESCE($12, status_operacional),
        cadastro_completo = COALESCE($13, cadastro_completo),
        prazo_indefinido = COALESCE($14, prazo_indefinido),
        responsavel_operacional_id = $15,
        responsavel_operacional_nome = $16,
        data_recebimento_operacional = COALESCE($17, data_recebimento_operacional),
        data_iniciado_operacional = COALESCE($18, data_iniciado_operacional),
        data_conclusao_operacional = COALESCE($19, data_conclusao_operacional),
        tem_prazo_judicial = COALESCE($20, tem_prazo_judicial),
        tipo_prazo = COALESCE($21, tipo_prazo),
        data_recebimento = COALESCE($22, data_recebimento),
        dias_prazo = COALESCE($23, dias_prazo),
        prazo_judicial = COALESCE($24, prazo_judicial),
        motivo_prazo_interno = COALESCE($25, motivo_prazo_interno),
        prioridade_manual = COALESCE($26, prioridade_manual),
        atualizado_em = $27
      WHERE id = $28
      RETURNING *
    `;

    const values = [
      data.numeroProcesso,
      data.protocolo,
      data.rep,
      data.descricao,
      data.setorSolicitante,
      data.tipoExame,
      data.vestigio,
      data.acusadoVitima,
      data.origem,
      data.referencias,
      data.status,
      data.statusOperacional,
      data.cadastroCompleto,
      data.prazoIndefinido,
      data.responsavelOperacionalId || null,
      data.responsavelOperacionalNome || null,
      data.dataRecebimentoOperacional,
      data.dataIniciadoOperacional,
      data.dataConclusaoOperacional,
      data.temPrazoJudicial,
      data.tipoPrazo,
      data.dataRecebimento,
      data.diasPrazo,
      data.prazoJudicial,
      data.motivoPrazoInterno,
      data.prioridadeManual,
      now,
      id,
    ];

    const result = await client.query(updateQuery, values);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Requisição não encontrada.' });
    }

    // Se novos anexos foram enviados, sincroniza
    if (data.anexos && Array.isArray(data.anexos)) {
      await client.query('DELETE FROM anexos WHERE requisicao_id = $1', [id]);
      for (const att of data.anexos) {
        const attId = att.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await client.query(
          `
          INSERT INTO anexos (id, requisicao_id, nome, tipo, tamanho, conteudo_base64, is_comprovacao, data_upload)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            attId,
            id,
            att.nome,
            att.tipo || 'oficio',
            att.tamanho || 0,
            att.url || att.conteudo_base64 || null,
            Boolean(att.isComprovacao),
            att.dataUpload || now,
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, requisicao: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[API /requisicoes/:id] Erro ao atualizar:', error);
    res.status(500).json({ error: 'Erro ao atualizar requisição.' });
  } finally {
    client.release();
  }
});

// 4. Receber Demanda ("Fila de Entrada" -> "Em Execução")
requisicoesRouter.post('/:id/receber', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { usuarioId, usuarioNome } = req.body;

    if (!usuarioId || !usuarioNome) {
      return res.status(400).json({ error: 'Identificação do perito é obrigatória para recebimento.' });
    }

    const now = new Date().toISOString();

    const result = await client.query(
      `
      UPDATE requisicoes SET
        status_operacional = 'Em andamento',
        status = 'Iniciado',
        responsavel_operacional_id = $1,
        responsavel_operacional_nome = $2,
        data_recebimento_operacional = $3,
        data_iniciado_operacional = $4,
        atualizado_em = $5
      WHERE id = $6
      RETURNING *
      `,
      [usuarioId, usuarioNome, now, now, now, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Requisição não encontrada.' });
    }

    // Registra no histórico de atribuições
    await client.query(
      `
      INSERT INTO historico_atribuicoes 
        (requisicao_id, usuario_novo_id, usuario_novo_nome, setor, motivo, data)
      VALUES 
        ($1, $2, $3, $4, 'Demanda recebida diretamente pelo perito responsável', $5)
      `,
      [id, usuarioId, usuarioNome, result.rows[0].setor_solicitante, now]
    );

    await client.query('COMMIT');
    res.json({ success: true, requisicao: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[API /requisicoes/:id/receber] Erro ao receber demanda:', error);
    res.status(500).json({ error: 'Erro ao processar recebimento da demanda.' });
  } finally {
    client.release();
  }
});

// 5. Registrar Pedido de Dilação de Prazo (Independente, sem alterar vencimento)
requisicoesRouter.post('/:id/dilacao', async (req, res) => {
  const { id } = req.params;
  const { diasSolicitados, documento, criadoPorId, criadoPorNome, dataSolicitacao } = req.body;

  // Validação: dias solicitados opcional (se houver, deve ser inteiro > 0)
  let diasNum: number | null = null;
  if (diasSolicitados !== undefined && diasSolicitados !== null && diasSolicitados !== '') {
    diasNum = parseInt(diasSolicitados, 10);
    if (isNaN(diasNum) || diasNum <= 0) {
      return res.status(400).json({ error: 'A quantidade de dias solicitados deve ser maior que zero (ou deixada em branco se não houver).' });
    }
  }

  // Validação do documento comprobatório em PDF
  if (!documento || !documento.nome || (!documento.conteudoBase64 && !documento.url)) {
    return res.status(400).json({ error: 'É obrigatório anexar o documento comprobatório em PDF.' });
  }

  if (!documento.nome.toLowerCase().endsWith('.pdf')) {
    return res.status(400).json({ error: 'O documento comprobatório deve estar no formato PDF.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verifica existência da requisição
    const reqCheck = await client.query('SELECT numero_processo FROM requisicoes WHERE id = $1', [id]);
    if (reqCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Requisição não encontrada.' });
    }
    const numeroProcesso = reqCheck.rows[0].numero_processo;

    const dilacaoId = `dil-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const anexoId = `att-dil-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const dataSol = dataSolicitacao || now.split('T')[0];

    // Insere anexo no acervo documental
    await client.query(
      `
      INSERT INTO anexos (id, requisicao_id, nome, tipo, tamanho, conteudo_base64, is_comprovacao, data_upload)
      VALUES ($1, $2, $3, 'oficio', $4, $5, FALSE, $6)
      `,
      [
        anexoId,
        id,
        documento.nome,
        documento.tamanho || 0,
        documento.conteudoBase64 || documento.url || null,
        now,
      ]
    );

    // Insere registro de dilação (IMPORTANTE: não altera prazo_judicial nem dias_prazo)
    const insertDilacaoQuery = `
      INSERT INTO pedidos_dilacao (
        id, requisicao_id, dias_solicitados, anexo_id, documento_nome,
        documento_url, documento_base64, criado_por_id, criado_por_nome, data_solicitacao, criado_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    await client.query(insertDilacaoQuery, [
      dilacaoId,
      id,
      diasNum,
      anexoId,
      documento.nome,
      documento.url || null,
      documento.conteudoBase64 || null,
      criadoPorId || null,
      criadoPorNome || 'Servidor Responsável',
      dataSol,
      now,
    ]);

    // Registra na trilha de auditoria
    await client.query(
      `
      INSERT INTO auditoria_logs 
        (usuario_id, usuario_nome, usuario_role, modulo, acao, descricao, entidade_id, entidade_referencia, status)
      VALUES 
        ($1, $2, 'Operador', 'requisicoes', 'dilacao_prazo', $3, $4, $5, 'sucesso')
      `,
      [
        criadoPorId || null,
        criadoPorNome || 'Servidor',
        `Pedido de dilação de prazo (+${diasNum} dias) registrado para o processo "${numeroProcesso}" com o documento "${documento.nome}".`,
        id,
        numeroProcesso,
      ]
    );

    await client.query('COMMIT');

    const novoPedido = {
      id: dilacaoId,
      requisicaoId: id,
      diasSolicitados: diasNum,
      documentoNome: documento.nome,
      documentoUrl: documento.conteudoBase64 || documento.url,
      criadoPorId,
      criadoPorNome: criadoPorNome || 'Servidor Responsável',
      dataSolicitacao: dataSol,
    };

    res.status(201).json({ success: true, pedido: novoPedido });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore */
      }
    }
    if (isDbConnectionError(error)) {
      const now = new Date().toISOString();
      const dataSol = dataSolicitacao || now.split('T')[0];
      const dilacaoId = 'dil-' + Date.now();
      const novoPedido = {
        id: dilacaoId,
        requisicaoId: id,
        diasSolicitados: diasNum,
        documentoNome: documento.nome,
        documentoUrl: documento.conteudoBase64 || documento.url,
        criadoPorId,
        criadoPorNome: criadoPorNome || 'Servidor Responsável',
        dataSolicitacao: dataSol,
      };
      return res.status(201).json({ success: true, pedido: novoPedido, ambiente: 'local_offline' });
    }
    console.error('[API /requisicoes/:id/dilacao] Erro ao registrar dilação:', error);
    res.status(500).json({ error: 'Erro ao registrar pedido de dilação no banco de dados.' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// 4.1. Atualizar Pedido de Dilação
requisicoesRouter.put('/:id/dilacao/:dilacaoId', async (req, res) => {
  const { id, dilacaoId } = req.params;
  const { diasSolicitados, documento } = req.body || {};

  let diasNum: number | null = null;
  if (diasSolicitados !== undefined && diasSolicitados !== null && diasSolicitados !== '') {
    diasNum = parseInt(diasSolicitados, 10);
    if (isNaN(diasNum) || diasNum <= 0) {
      return res.status(400).json({ error: 'A quantidade de dias solicitados deve ser maior que zero (ou deixada em branco se não houver).' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const dilCheck = await client.query('SELECT * FROM pedidos_dilacao WHERE id = $1 AND requisicao_id = $2', [
      dilacaoId,
      id,
    ]);
    if (dilCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido de dilação não encontrado.' });
    }
    const currentDil = dilCheck.rows[0];

    let docNome = currentDil.documento_nome;
    let docUrl = currentDil.documento_url;
    let docBase64 = currentDil.documento_base64;

    if (documento && documento.nome) {
      if (!documento.nome.toLowerCase().endsWith('.pdf')) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'O documento comprobatório deve estar no formato PDF.' });
      }
      docNome = documento.nome;
      docUrl = documento.url || null;
      docBase64 = documento.conteudoBase64 || null;

      if (currentDil.anexo_id) {
        await client.query(
          `UPDATE anexos SET nome = $1, tamanho = $2, conteudo_base64 = $3 WHERE id = $4`,
          [docNome, documento.tamanho || 0, docBase64 || docUrl, currentDil.anexo_id]
        );
      }
    }

    const updateQuery = `
      UPDATE pedidos_dilacao SET
        dias_solicitados = $1,
        documento_nome = $2,
        documento_url = $3,
        documento_base64 = $4
      WHERE id = $5 AND requisicao_id = $6
      RETURNING *
    `;
    const updatedRes = await client.query(updateQuery, [
      diasNum,
      docNome,
      docUrl,
      docBase64,
      dilacaoId,
      id,
    ]);

    await client.query('COMMIT');
    res.json({ success: true, pedido: updatedRes.rows[0] });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore */
      }
    }
    if (isDbConnectionError(error)) {
      return res.json({
        success: true,
        pedido: {
          id: dilacaoId,
          requisicaoId: id,
          diasSolicitados: diasNum,
          documentoNome: documento?.nome || 'documento.pdf',
          documentoUrl: documento?.conteudoBase64 || documento?.url,
        },
        ambiente: 'local_offline',
      });
    }
    console.error('[API PUT /dilacao] Erro ao atualizar dilação:', error);
    res.status(500).json({ error: 'Erro ao atualizar pedido de dilação.' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// 4.2. Excluir Pedido de Dilação
requisicoesRouter.delete('/:id/dilacao/:dilacaoId', async (req, res) => {
  const { id, dilacaoId } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dilCheck = await client.query('SELECT anexo_id FROM pedidos_dilacao WHERE id = $1 AND requisicao_id = $2', [
      dilacaoId,
      id,
    ]);

    if (dilCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pedido de dilação não encontrado.' });
    }

    const anexoId = dilCheck.rows[0].anexo_id;

    await client.query('DELETE FROM pedidos_dilacao WHERE id = $1 AND requisicao_id = $2', [dilacaoId, id]);
    if (anexoId) {
      await client.query('DELETE FROM anexos WHERE id = $1', [anexoId]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Pedido de dilação removido com sucesso.' });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* ignore */
      }
    }
    if (isDbConnectionError(error)) {
      return res.json({ success: true, message: 'Pedido de dilação removido com sucesso.', ambiente: 'local_offline' });
    }
    console.error('[API DELETE /dilacao] Erro ao excluir dilação:', error);
    res.status(500).json({ error: 'Erro ao excluir pedido de dilação.' });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// 5. Excluir Requisição (Administrador)
requisicoesRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM requisicoes WHERE id = $1 RETURNING numero_processo', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Requisição não encontrada.' });
    }

    res.json({ success: true, message: 'Requisição excluída com sucesso.' });
  } catch (error) {
    console.error('[API /requisicoes/:id DELETE] Erro ao excluir:', error);
    res.status(500).json({ error: 'Erro ao excluir requisição.' });
  }
});


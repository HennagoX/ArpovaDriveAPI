import { getCurrent, moveToNext } from "../services/modulo.service.js";

/**
 * Utilitário de extração e normalização de parâmetros para as rotas de módulo.
 * Garante compatibilidade tanto com params, body, query strings e headers de autenticação.
 */
function extrairParametros(req) {
  const contentId = 
    req.params?.id || 
    req.body?.contentId || 
    req.body?.id || 
    req.body?.conteudo || 
    req.body?.materia || 
    req.query?.contentId || 
    req.query?.id || 
    req.query?.conteudo || 
    req.query?.materia;

  const userId = 
    req.body?.userId || 
    req.body?.id_usuario || 
    req.body?.usuario || 
    req.query?.userId || 
    req.query?.id_usuario || 
    req.query?.usuario || 
    req.headers?.['x-user-id'] || 
    req.headers?.['x-requester-id'] || 
    'Henrique';

  return { contentId, userId };
}

/**
 * Retorna o progresso atual do módulo para o conteúdo e usuário informados.
 * GET /modulo?contentId=CodigoTransito&userId=...
 * GET /modulo/:id
 */
export async function getCurrentModule(req, res) {
  try {
    const { contentId, userId } = extrairParametros(req);

    if (!contentId) {
      return res.status(400).json({ 
        error: 'Conteúdo não informado. Envie contentId ou id via query, params ou body.' 
      });
    }

    const resultado = await getCurrent(contentId, userId);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Avança o usuário para o próximo módulo do conteúdo especificado (+1 no banco de dados).
 * POST /modulo/next
 * POST /modulo/:id/next
 * POST /modulo
 */
export async function moveToNextModule(req, res) {
  try {
    const { contentId, userId } = extrairParametros(req);

    if (!contentId) {
      return res.status(400).json({ 
        error: 'Conteúdo não informado para avançar módulo. Envie contentId ou id via body, query ou params.' 
      });
    }

    const resultado = await moveToNext(contentId, userId);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
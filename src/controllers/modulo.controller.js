import { getCurrent, moveToNext, setPointer } from "../services/modulo.service.js";

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

export async function setModulePointer(req, res) {
  try {
    const { contentId, userId } = extrairParametros(req);
    const numero = req.body?.numero || req.query?.numero || req.params?.numero;

    if (!contentId) {
      return res.status(400).json({ 
        error: 'Conteúdo não informado para definir ponteiro.' 
      });
    }

    if (numero === undefined || numero === null) {
      return res.status(400).json({ 
        error: 'Número do módulo não informado.' 
      });
    }

    const resultado = await setPointer(contentId, userId, numero);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
import { getCurrent, moveToNext } from "../services/modulo.service.js";

export async function getCurrentModule(req, res) {
  try {
    const contentId = req.query.id || req.query.contentId || req.params.id || req.body?.id || req.body?.contentId;
    const userId = req.query.userId || req.query.id_usuario || req.body?.userId || req.body?.id_usuario;

    if (!contentId || !userId) {
      return res.status(400).json({ error: 'Conteúdo ou usuário não informado' });
    }

    const resultado = await getCurrent(contentId, userId);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function moveToNextModule(req, res) {
  try {
    const contentId = req.body?.id || req.body?.contentId || req.query.id || req.query.contentId || req.params.id;
    const userId = req.body?.userId || req.body?.id_usuario || req.query.userId || req.query.id_usuario;

    if (!contentId || !userId) {
      return res.status(400).json({ error: 'Conteúdo ou usuário não informado' });
    }

    const resultado = await moveToNext(contentId, userId);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
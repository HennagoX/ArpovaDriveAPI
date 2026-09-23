import { checarAcerto, obterQuestoes } from "../services/questoes.service.js";

export async function checkAcerto(req, res) {
  try {
    const userId = req.body?.userId || req.body?.id_usuario || req.query.userId || req.query.id_usuario;
    const resultado = await checarAcerto(req.body, userId);

    if (!resultado) {
      return res.status(400).json({ sucess: false, success: false, message: "Questão ou resposta inválida" });
    }

    return res.status(200).json({
      sucess: resultado.correto,
      success: resultado.correto,
      message: resultado.mensagem,
      ...resultado
    });
  } catch (error) {
    return res.status(400).json({ sucess: false, success: false, message: "Não foi possível checar o acerto" });
  }
}

export const checkQuestao = checkAcerto;

export async function getQuestoesConcluidas(req, res) {
  try {
    const userId = req.query.userId || req.query.id_usuario || req.query.id;
    const materia = req.query.materia || req.query.conteudo || req.query.id;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Usuário não informado" });
    }

    const resultado = await obterQuestoes(materia, userId);
    return res.status(200).json({ success: true, acertos: resultado });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}
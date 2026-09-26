import { getAiResponse } from "../services/ai.service.js";

export async function chatWithAi(req, res) {
  try {
    const message = req.body?.message || req.body?.mensagem || req.body?.prompt;
    const history = req.body?.history || req.body?.historico || [];
    const context = req.body?.context || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: "Mensagem é obrigatória para interagir com o Tutor IA."
      });
    }

    const aiResult = await getAiResponse(message.trim(), history, context);
    return res.status(200).json(aiResult);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Erro interno ao processar a resposta do Tutor IA."
    });
  }
}

import { getAiResponse, getSmartFallbackResponse } from "../services/ai.service.js";

export async function chatWithAi(req, res) {
  try {
    const message = req.body?.message || req.body?.mensagem || req.body?.prompt;
    const history = req.body?.history || req.body?.historico || [];
    const context = req.body?.context || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(200).json(getSmartFallbackResponse('', context));
    }

    const aiResult = await getAiResponse(message.trim(), history, context);
    return res.status(200).json(aiResult);
  } catch (error) {
    const context = req.body?.context || {};
    const message = req.body?.message || '';
    return res.status(200).json(getSmartFallbackResponse(message, context));
  }
}

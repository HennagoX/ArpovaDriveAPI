import { getAiResponse, getSmartFallbackResponse, sugerirTarefasSemanaisComIA } from "../services/ai.service.js";
import { obterDesempenhoUsuario } from "../services/desempenho.service.js";
import taskRepository from "../Repositories/task.repository.js";

export async function chatWithAi(req, res) {
  let context = req.body?.context && typeof req.body.context === 'object' ? { ...req.body.context } : {};
  const message = req.body?.message || req.body?.mensagem || req.body?.prompt || '';
  const history = req.body?.history || req.body?.historico || [];

  try {
    const userId =
      req.headers['x-user-id'] ||
      context.userId ||
      context.id_usuario ||
      req.body?.userId ||
      null;

    // Garante que o contexto sempre tenha os dados completos de desempenho do aluno
    if (!context.desempenho) {
      try {
        const dadosDesempenho = await obterDesempenhoUsuario(userId);
        if (dadosDesempenho) {
          context.desempenho = dadosDesempenho;
          if (!context.nome && dadosDesempenho.usuario?.nome) {
            context.nome = dadosDesempenho.usuario.nome;
          }
          if (context.taxaAproveitamento === undefined) {
            context.taxaAproveitamento = dadosDesempenho.resumo?.taxaAproveitamento;
          }
          if (context.nivel === undefined) {
            context.nivel = dadosDesempenho.usuario?.lv;
          }
        }
      } catch (err) {
        console.warn('[AiController] Falha ao enriquecer desempenho para AI:', err.message);
      }
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(200).json(getSmartFallbackResponse('', context));
    }

    const aiResult = await getAiResponse(message.trim(), history, context);
    return res.status(200).json(aiResult);
  } catch (error) {
    console.error('[AiController] Erro no chat IA, acionando fallback:', error.message);
    return res.status(200).json(getSmartFallbackResponse(message, context));
  }
}

export async function sugerirTarefasController(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || req.body?.userId || req.body?.id_usuario || req.query?.userId || null;
    const user = await taskRepository.findUser(userId);
    const resolvedId = user?.id_usuario || userId;
    const desempenho = await obterDesempenhoUsuario(resolvedId);
    const tarefas = await sugerirTarefasSemanaisComIA(user || { id_usuario: resolvedId }, desempenho);
    return res.status(200).json({
      success: true,
      tarefas
    });
  } catch (error) {
    next(error);
  }
}

export default {
  chatWithAi,
  sugerirTarefasController
};


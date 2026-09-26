import {
  checarAcerto,
  obterQuestoes,
  obterPerguntas,
  obterBaterias,
  concluirBateria,
  verificarAcessoBateria,
  gerarQuestoesSimulado,
  concluirSimulado,
  obterResultadosSimulados
} from "../services/questoes.service.js";

function extrairUserId(req) {
  return req.body?.userId ||
         req.body?.id_usuario ||
         req.body?.usuario ||
         req.query?.userId ||
         req.query?.id_usuario ||
         req.query?.usuario ||
         req.query?.id ||
         req.headers?.['x-user-id'] ||
         req.headers?.['x-usuario-id'] ||
         null;
}

export async function checkAcerto(req, res) {
  try {
    const userId = extrairUserId(req);
    const resultado = await checarAcerto(req.body, userId);
    
    if (!resultado) {
      return res.status(400).json({
        sucesso: false,
        success: false,
        message: "Questão ou resposta inválida"
      });
    }


    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({
      sucesso: false,
      success: false,
      message: error.message || "Não foi possível checar o acerto"
    });
  }
}

export const checkQuestao = checkAcerto;

export async function getQuestoesConcluidas(req, res) {
  try {
    const userId = extrairUserId(req);
    const materia = req.query.materia || req.query.conteudo || req.query.disciplina;

    if (!userId) {
      return res.status(400).json({
        sucesso: false,
        success: false,
        message: "Usuário não informado"
      });
    }

    const resultado = await obterQuestoes(materia, userId);
    return res.status(200).json({
      sucesso: true,
      success: true,
      acertos: resultado
    });
  } catch (error) {
    return res.status(400).json({
      sucesso: false,
      success: false,
      message: error.message
    });
  }
}

export async function getPerguntas(req, res) {
  try {
    const userId = extrairUserId(req);
    const materia = req.query.materia || req.params?.materia || 'MeioAmbiente';
    const bateria = Number(req.query.bateria || req.query.bateriaId || req.params?.bateria || 1);

    if (userId && bateria >= 1) {
      const acesso = await verificarAcessoBateria(materia, bateria, userId);
      if (!acesso.permitido) {
        return res.status(403).json({
          sucesso: false,
          success: false,
          bloqueado: true,
          message: acesso.mensagem,
          moduloAtual: acesso.moduloAtual,
          moduloMinimo: acesso.moduloMinimo
        });
      }
    }

    const perguntas = obterPerguntas(materia, bateria);

    return res.status(200).json({
      sucesso: true,
      success: true,
      materia,
      bateria,
      total: perguntas.length,
      questoes: perguntas
    });
  } catch (error) {
    return res.status(400).json({
      sucesso: false,
      success: false,
      message: error.message
    });
  }
}

export async function verificarAcessoBateriaController(req, res) {
  try {
    const userId = extrairUserId(req);
    const materia = req.query.materia || req.params?.materia || 'MeioAmbiente';
    const bateria = req.query.bateria || req.params?.bateria || 1;

    const resultado = await verificarAcessoBateria(materia, bateria, userId);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({
      sucesso: false,
      permitido: false,
      message: error.message
    });
  }
}

export async function getBaterias(req, res) {
  try {
    const materia = req.query.materia || req.params?.materia || 'MeioAmbiente';
    const baterias = obterBaterias(materia);

    return res.status(200).json({
      sucesso: true,
      success: true,
      materia,
      baterias
    });
  } catch (error) {
    return res.status(400).json({
      sucesso: false,
      success: false,
      message: error.message
    });
  }
}

export async function concluirBateriaController(req, res) {
  try {
    const userId = extrairUserId(req);
    const resultado = await concluirBateria(req.body, userId);

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({
      sucesso: false,
      success: false,
      message: error.message || "Erro ao concluir bateria de questões"
    });
  }
}

export async function getSimuladoQuestoesController(req, res) {
  try {
    const materia = req.query.materia || req.params?.materia || 'Geral';
    const questoes = gerarQuestoesSimulado(materia);

    return res.status(200).json({
      sucesso: true,
      success: true,
      materia,
      total: questoes.length,
      questoes
    });
  } catch (error) {
    return res.status(400).json({
      sucesso: false,
      success: false,
      message: error.message || "Erro ao gerar questões para o simulado"
    });
  }
}

export async function concluirSimuladoController(req, res) {
  try {
    const userId = extrairUserId(req);
    const resultado = await concluirSimulado(req.body, userId);

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({
      sucesso: false,
      success: false,
      message: error.message || "Erro ao registrar conclusão do simulado"
    });
  }
}

export async function getSimuladoResultadosController(req, res) {
  try {
    const userId = extrairUserId(req);
    if (!userId) {
      return res.status(400).json({
        sucesso: false,
        success: false,
        message: "Usuário não informado"
      });
    }

    const resultados = await obterResultadosSimulados(userId);

    return res.status(200).json({
      sucesso: true,
      success: true,
      resultados
    });
  } catch (error) {
    return res.status(400).json({
      sucesso: false,
      success: false,
      message: error.message || "Erro ao buscar histórico de simulados"
    });
  }
}
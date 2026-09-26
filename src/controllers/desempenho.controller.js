import { obterDesempenhoUsuario } from '../services/desempenho.service.js';

export async function getDesempenho(req, res) {
  try {
    const userId =
      req.query?.userId ||
      req.query?.id ||
      req.headers['x-user-id'] ||
      req.body?.userId ||
      req.params?.userId ||
      null;

    const desempenho = await obterDesempenhoUsuario(userId);

    if (!desempenho) {
      return res.status(404).json({
        sucesso: false,
        message: 'Usuário não encontrado para geração de relatório de desempenho.'
      });
    }

    return res.status(200).json(desempenho);
  } catch (error) {
    console.error('[DesempenhoController] Erro ao obter desempenho:', error);
    return res.status(500).json({
      sucesso: false,
      message: 'Erro interno ao processar desempenho do aluno.'
    });
  }
}

export default {
  getDesempenho
};

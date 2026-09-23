import { getQuestoes, incrementarAcerto } from '../Repositories/questoes.repository.js';
import { incrementXp } from './exp.service.js';

const ACERTOS_COLUNAS = {
  CodigoTransito: 'acertos_codigotransito',
  PlacasTransito: 'acertos_placatransito',
  DirecaoDefensiva: 'acertos_direcaodefensiva',
  PrimeirosSocorros: 'acertos_primeirossocorros',
  Cidadania: 'acertos_meioambiente'
};

const questoes = {
  CodigoTransito: { '1': 'A' },
  PlacasTransito: { '1': 'A' },
  DirecaoDefensiva: { '1': 'A' },
  PrimeirosSocorros: { '1': 'A' },
  Cidadania: { '1': 'A' }
};

export async function checarAcerto(respostas, userId) {
  const questaoKey = respostas?.questao;
  const materia = typeof questaoKey === 'string'
    ? questaoKey
    : (respostas?.materia || respostas?.conteudo || questaoKey?.materia || 'CodigoTransito');

  const numQuestao = String(
    respostas?.num ||
    respostas?.numQuestao ||
    respostas?.numero ||
    (typeof questaoKey === 'object' ? questaoKey?.num : null) ||
    '1'
  );

  const respostaUsuario = String(respostas?.resposta || respostas?.respostaUsuario || '').toUpperCase().trim();

  const gabaritoMateria = questoes[materia];
  if (!gabaritoMateria || !respostaUsuario) {
    return null;
  }

  const gabarito = gabaritoMateria[numQuestao];
  if (!gabarito) {
    return null;
  }

  if (gabarito === respostaUsuario) {
    const coluna = ACERTOS_COLUNAS[materia] || 'acertos_codigotransito';
    let totalAcertos = null;
    if (userId) {
      totalAcertos = await incrementarAcerto(coluna, userId);
      await incrementXp(userId, 10);
    }
    return {
      correto: true,
      acertou: true,
      acertos: totalAcertos,
      expGanha: 10,
      mensagem: 'Resposta correta!'
    };
  }

  return {
    correto: false,
    acertou: false,
    mensagem: 'Resposta incorreta'
  };
}

export async function obterQuestoes(materia, userId) {
  const coluna = materia ? ACERTOS_COLUNAS[materia] : null;
  return await getQuestoes(coluna, userId);
}
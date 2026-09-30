import { getQuestoes, incrementarAcerto, incrementarErro, salvarResultadoBateria, salvarResultadoSimulado, obterResultadosSimuladosUsuario } from '../Repositories/questoes.repository.js';
import { incrementXp } from './exp.service.js';
import { getCurrent } from './modulo.service.js';
import { QUESTOES_BANCO } from './questoes.data.js';

const ACERTOS_COLUNAS = {
  CodigoTransito: 'acertos_codigotransito',
  codigotransito: 'acertos_codigotransito',
  legislacao: 'acertos_codigotransito',
  PlacasTransito: 'acertos_placatransito',
  PlacaTransito: 'acertos_placatransito',
  placas: 'acertos_placatransito',
  placatransito: 'acertos_placatransito',
  DirecaoDefensiva: 'acertos_direcaodefensiva',
  DirecaoOfensiva: 'acertos_direcaodefensiva',
  seguranca: 'acertos_direcaodefensiva',
  direcaodefensiva: 'acertos_direcaodefensiva',
  PrimeirosSocorros: 'acertos_primeirossocorros',
  primeirossocorros: 'acertos_primeirossocorros',
  saude: 'acertos_primeirossocorros',
  Cidadania: 'acertos_meioambiente',
  cidadania: 'acertos_meioambiente',
  MeioAmbiente: 'acertos_meioambiente',
  meioambiente: 'acertos_meioambiente',
  'meio-ambiente': 'acertos_meioambiente',
  ambiente: 'acertos_meioambiente'
};

const ERROS_COLUNAS = {
  CodigoTransito: 'erros_codigotransito',
  codigotransito: 'erros_codigotransito',
  legislacao: 'erros_codigotransito',
  PlacasTransito: 'erros_placatransito',
  PlacaTransito: 'erros_placatransito',
  placas: 'erros_placatransito',
  placatransito: 'erros_placatransito',
  DirecaoDefensiva: 'erros_direcaodefensiva',
  DirecaoOfensiva: 'erros_direcaodefensiva',
  seguranca: 'erros_direcaodefensiva',
  direcaodefensiva: 'erros_direcaodefensiva',
  PrimeirosSocorros: 'erros_primeirossocorros',
  primeirossocorros: 'erros_primeirossocorros',
  saude: 'erros_primeirossocorros',
  Cidadania: 'erros_meioambiente',
  cidadania: 'erros_meioambiente',
  MeioAmbiente: 'erros_meioambiente',
  meioambiente: 'erros_meioambiente',
  'meio-ambiente': 'erros_meioambiente',
  ambiente: 'erros_meioambiente'
};

const LETRAS = ['A', 'B', 'C', 'D'];

export function normalizarMateria(materia) {
  if (!materia) return 'MeioAmbiente';
  const clean = String(materia).trim();
  const lower = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (lower.includes('meio') || lower.includes('ambiente') || lower.includes('cidadania')) return 'MeioAmbiente';
  if (lower.includes('codigo') || lower.includes('legislacao')) return 'CodigoTransito';
  if (lower.includes('placa') || lower.includes('sinalizacao')) return 'PlacasTransito';
  if (lower.includes('direcao') || lower.includes('defensiva') || lower.includes('ofensiva') || lower.includes('seguranca')) return 'DirecaoDefensiva';
  if (lower.includes('socorro') || lower.includes('saude') || lower.includes('primeiro')) return 'PrimeirosSocorros';
  return clean;
}

export function normalizarBateriaNumero(bateria) {
  if (!bateria) return 1;
  if (typeof bateria === 'number') return Math.max(1, Math.min(4, Math.floor(bateria)));
  const str = String(bateria).trim().toLowerCase();
  const match = str.match(/\d+/);
  if (match) return Math.max(1, Math.min(4, Number(match[0])));
  return 1;
}

export function normalizarRespostaLetra(resp) {
  if (resp === null || resp === undefined) return '';
  if (typeof resp === 'number') return LETRAS[resp] || '';
  const str = String(resp).trim().toUpperCase();
  if (LETRAS.includes(str)) return str;
  const num = Number(str);
  if (!isNaN(num) && num >= 0 && num < LETRAS.length) return LETRAS[num];
  return str;
}

export function obterPerguntas(materia, bateriaNumero) {
  const materiaNorm = normalizarMateria(materia);
  const batNum = normalizarBateriaNumero(bateriaNumero);
  const questoesMateria = QUESTOES_BANCO[materiaNorm];
  if (!questoesMateria || !questoesMateria[batNum]) {
    return [];
  }
  return questoesMateria[batNum];
}

export function obterBaterias(materia) {
  const materiaNorm = normalizarMateria(materia);
  const questoesMateria = QUESTOES_BANCO[materiaNorm];
  if (!questoesMateria) return [];
  return Object.keys(questoesMateria).map(num => ({
    numero: Number(num),
    totalQuestoes: questoesMateria[num].length
  }));
}

const BATERIAS_MODULOS_MINIMOS = {
  1: 4,
  2: 7,
  3: 10,
  4: 10
};

export function obterModuloMinimoBateria(materia, bateriaNumero) {
  const batNum = normalizarBateriaNumero(bateriaNumero);
  return BATERIAS_MODULOS_MINIMOS[batNum] || 4;
}

export async function verificarAcessoBateria(materia, bateriaNumero, userId) {
  const materiaNorm = normalizarMateria(materia);
  const batNum = normalizarBateriaNumero(bateriaNumero);
  const moduloMinimo = obterModuloMinimoBateria(materiaNorm, batNum);

  let moduloAtual = 1;
  if (userId) {
    try {
      const moduloInfo = await getCurrent(materiaNorm, userId);
      moduloAtual = Number(moduloInfo?.modulo_atual || 1);
    } catch {
      moduloAtual = 1;
    }
  }

  const permitido = moduloAtual >= moduloMinimo;

  return {
    sucesso: true,
    permitido,
    bloqueado: !permitido,
    materia: materiaNorm,
    bateria: batNum,
    moduloAtual,
    moduloMinimo,
    mensagem: permitido
      ? 'Acesso liberado para esta bateria.'
      : `Requer no mínimo a conclusão do Módulo ${batNum === 1 ? 3 : (batNum === 2 ? 6 : (batNum === 3 ? 9 : 10))}.`
  };
}

export async function checarAcerto(respostas, userId) {
  const materiaRaw = respostas?.materia || respostas?.conteudo || respostas?.disciplina || respostas?.questao?.materia || 'MeioAmbiente';
  const materiaNorm = normalizarMateria(materiaRaw);
  const bateriaRaw = respostas?.bateria || respostas?.bateriaNumero || respostas?.bateriaId || respostas?.bateria_id || 1;
  const bateriaNum = normalizarBateriaNumero(bateriaRaw);

  const numQuestao = Number(
    respostas?.num ||
    respostas?.numQuestao ||
    respostas?.numero ||
    respostas?.questao?.num ||
    1
  );

  const respostaLetra = normalizarRespostaLetra(
    respostas?.resposta ?? respostas?.respostaUsuario ?? respostas?.alternativa
  );

  const perguntas = obterPerguntas(materiaNorm, bateriaNum);
  const questaoEncontrada = perguntas.find(q => Number(q.numero) === numQuestao);

  const textoResposta = String(respostas?.textoResposta || respostas?.texto || '').trim();

  if (!questaoEncontrada || (!respostaLetra && !textoResposta)) {
    return {
      sucesso: false,
      success: false,
      correto: false,
      acertou: false,
      mensagem: 'Questão ou resposta não encontrada.'
    };
  }

  const isCorretoPorTexto = textoResposta && questaoEncontrada.opcoes[questaoEncontrada.correta] === textoResposta;
  const isCorretoPorLetra = respostaLetra && questaoEncontrada.corretaLetra === respostaLetra;
  const isCorreto = Boolean(isCorretoPorTexto || isCorretoPorLetra);
  const coluna = ACERTOS_COLUNAS[materiaNorm] || 'acertos_meioambiente';

  let totalAcertos = null;
  let totalErros = null;
  let expData = null;

  if (userId) {
    if (isCorreto) {
      totalAcertos = await incrementarAcerto(coluna, userId, 1);
      expData = await incrementXp(userId, 10);
    } else {
      const colunaErro = ERROS_COLUNAS[materiaNorm] || 'erros_meioambiente';
      totalErros = await incrementarErro(colunaErro, userId, 1);
    }
  }

  return {
    sucesso: true,
    success: true,
    correto: isCorreto,
    acertou: isCorreto,
    materia: materiaNorm,
    bateria: bateriaNum,
    numero: numQuestao,
    respostaEnviada: respostaLetra,
    correta: questaoEncontrada.corretaLetra,
    corretaIndex: questaoEncontrada.correta,
    explicacao: questaoEncontrada.explicacao,
    acertos: totalAcertos,
    erros: totalErros,
    expGanha: isCorreto ? 10 : 0,
    totalExp: expData?.exp ?? null,
    lv: expData?.lv ?? null,
    mensagem: isCorreto ? 'Resposta correta!' : 'Resposta incorreta'
  };
}

export async function concluirBateria(dados, userId) {
  const materiaNorm = normalizarMateria(dados?.materia);
  const bateriaNum = normalizarBateriaNumero(dados?.bateria);
  const perguntas = obterPerguntas(materiaNorm, bateriaNum);
  const total = Math.max(1, Number(dados?.total) || perguntas.length || 10);

  const respostasEnviadas = dados?.respostas || {};
  let acertos = 0;

  perguntas.forEach((q) => {
    const resp = normalizarRespostaLetra(respostasEnviadas[q.numero]);
    if (resp && resp === q.corretaLetra) {
      acertos++;
    }
  });

  if (typeof dados?.acertos === 'number' && dados.acertos >= 0) {
    acertos = Math.min(total, dados.acertos);
  }

  const porcentagem = Math.round((acertos / total) * 100);
  const aprovado = porcentagem >= 70;
  const expBonus = aprovado ? 50 : 20;

  let expData = null;
  if (userId) {
    expData = await incrementXp(userId, expBonus);
    try {
      await salvarResultadoBateria(
        userId,
        materiaNorm,
        bateriaNum,
        acertos,
        total,
        porcentagem,
        aprovado
      );
    } catch (err) {
      console.warn('[QuestoesService] Falha ao registrar resultado da bateria no banco:', err.message);
    }
  }

  const proximaBateriaNum = bateriaNum + 1;
  let proximaBateriaLiberada = false;
  let proximaModuloMinimo = null;
  let moduloAtualUsuario = 1;

  if (proximaBateriaNum <= 4) {
    const acessoProxima = await verificarAcessoBateria(materiaNorm, proximaBateriaNum, userId);
    proximaBateriaLiberada = Boolean(acessoProxima.permitido);
    proximaModuloMinimo = acessoProxima.moduloMinimo;
    moduloAtualUsuario = acessoProxima.moduloAtual;
  }

  return {
    sucesso: true,
    success: true,
    materia: materiaNorm,
    bateria: bateriaNum,
    totalQuestoes: total,
    acertos,
    porcentagem,
    aprovado,
    expBonus,
    totalExp: expData?.exp ?? null,
    lv: expData?.lv ?? null,
    proximaBateria: proximaBateriaNum <= 4 ? proximaBateriaNum : null,
    proximaBateriaLiberada,
    proximaModuloMinimo,
    moduloAtual: moduloAtualUsuario
  };
}

export async function obterQuestoes(materia, userId) {
  const materiaNorm = materia ? normalizarMateria(materia) : null;
  const coluna = materiaNorm ? ACERTOS_COLUNAS[materiaNorm] : null;
  return await getQuestoes(coluna, userId);
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function gerarQuestoesSimulado(materia = 'Geral') {
  const materiaNorm = normalizarMateria(materia);
  const isGeral = !materia || String(materia).toLowerCase() === 'geral' || String(materia).toLowerCase() === 'todos' || String(materia).toLowerCase() === 'detran';

  let bancoSelecionado = [];

  if (isGeral) {
    const materias = ['CodigoTransito', 'PlacasTransito', 'DirecaoDefensiva', 'PrimeirosSocorros', 'MeioAmbiente'];
    materias.forEach(mat => {
      const qMateria = QUESTOES_BANCO[mat] || {};
      const todasMat = Object.values(qMateria).flat();
      const shuffledMat = shuffleArray(todasMat);
      const sample = shuffledMat.slice(0, 6).map(q => ({
        ...q,
        materia: mat
      }));
      bancoSelecionado.push(...sample);
    });
  } else {
    const qMateria = QUESTOES_BANCO[materiaNorm] || {};
    const todasMat = Object.values(qMateria).flat();
    const shuffledMat = shuffleArray(todasMat);
    bancoSelecionado = shuffledMat.slice(0, 30).map(q => ({
      ...q,
      materia: materiaNorm
    }));
  }

  const questoesEmbaralhadas = shuffleArray(bancoSelecionado);

  return questoesEmbaralhadas.map((q, idx) => ({
    numero: idx + 1,
    modulo: q.modulo || 1,
    materia: q.materia || materiaNorm,
    texto: q.texto,
    opcoes: q.opcoes,
    correta: q.correta,
    corretaLetra: q.corretaLetra,
    explicacao: q.explicacao
  }));
}

export async function concluirSimulado(dados, userId) {
  const materia = dados?.materia || 'Geral';
  const total = 30;
  const respostasEnviadas = dados?.respostas || {};
  const questoesOriginais = dados?.questoes || [];

  let acertos = 0;
  if (Array.isArray(questoesOriginais) && questoesOriginais.length > 0) {
    questoesOriginais.forEach(q => {
      const resp = normalizarRespostaLetra(respostasEnviadas[q.numero]);
      if (resp && resp === q.corretaLetra) {
        acertos++;
      }
    });
  } else if (typeof dados?.acertos === 'number' && dados.acertos >= 0) {
    acertos = Math.min(total, dados.acertos);
  }

  const porcentagem = Math.round((acertos / total) * 100);
  const aprovado = acertos >= 20 || porcentagem >= 67;
  const expBonus = aprovado ? 150 : 50;
  const tempoGasto = Number(dados?.tempoGastoSegundos || 0);

  let expData = null;
  if (userId) {
    expData = await incrementXp(userId, expBonus);
    try {
      await salvarResultadoSimulado(
        userId,
        materia,
        acertos,
        total,
        porcentagem,
        aprovado,
        tempoGasto
      );
    } catch (err) {
      console.warn('[QuestoesService] Falha ao registrar resultado do simulado no banco:', err.message);
    }
  }

  return {
    sucesso: true,
    success: true,
    materia,
    totalQuestoes: total,
    acertos,
    porcentagem,
    aprovado,
    metaAcertos: 20,
    metaPorcentagem: 67,
    expBonus,
    tempoGastoSegundos: tempoGasto,
    totalExp: expData?.exp ?? null,
    lv: expData?.lv ?? null,
    podeReivindicarTarefaFixa: aprovado
  };
}

export async function obterResultadosSimulados(userId) {
  return await obterResultadosSimuladosUsuario(userId);
}
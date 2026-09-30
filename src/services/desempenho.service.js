import pool from '../Repositories/db.js';
import { resolveUserId } from '../Repositories/modulo.repository.js';
import { initBateriaResultadoTable } from '../Repositories/questoes.repository.js';
import { getLevelInfo } from './exp.service.js';
import { normalizarMateria } from './questoes.service.js';

export const MATERIAS_CONFIG = [
  {
    id: 'CodigoTransito',
    nome: 'Legislação de Trânsito',
    icone: 'fa-solid fa-scale-balanced',
    cor: 'green',
    moduloColuna: 'modulo_codigotransito',
    acertosColuna: 'acertos_codigotransito',
    errosColuna: 'erros_codigotransito'
  },
  {
    id: 'PlacasTransito',
    nome: 'Placas e Sinalização',
    icone: 'fa-solid fa-diamond-turn-right',
    cor: 'blue',
    moduloColuna: 'modulo_placastransito',
    acertosColuna: 'acertos_placatransito',
    errosColuna: 'erros_placatransito'
  },
  {
    id: 'DirecaoDefensiva',
    nome: 'Direção Defensiva',
    icone: 'fa-solid fa-shield-halved',
    cor: 'yellow',
    moduloColuna: 'modulo_direcaodefensiva',
    acertosColuna: 'acertos_direcaodefensiva',
    errosColuna: 'erros_direcaodefensiva'
  },
  {
    id: 'MeioAmbiente',
    nome: 'Meio Ambiente e Cidadania',
    icone: 'fa-solid fa-leaf',
    cor: 'purple',
    moduloColuna: 'modulo_cidadania',
    acertosColuna: 'acertos_meioambiente',
    errosColuna: 'erros_meioambiente'
  },
  {
    id: 'PrimeirosSocorros',
    nome: 'Primeiros Socorros',
    icone: 'fa-solid fa-kit-medical',
    cor: 'red',
    moduloColuna: 'modulo_primeirossocorros',
    acertosColuna: 'acertos_primeirossocorros',
    errosColuna: 'erros_primeirossocorros'
  },
  {
    id: 'MecanicaBasica',
    nome: 'Mecânica Básica',
    icone: 'fa-solid fa-gears',
    cor: 'cyan',
    moduloColuna: null,
    acertosColuna: null,
    errosColuna: null
  }
];

function classificarPorcentagem(porcentagem, totalQuestoes = 0) {
  const pct = Math.max(0, Math.min(100, Math.round(porcentagem || 0)));
  if (totalQuestoes === 0) {
    return {
      status: 'Pendente',
      statusClasse: 'badge-revisao',
      fillClasse: 'fill-revisao'
    };
  }
  if (pct >= 80) {
    return {
      status: 'Excelente',
      statusClasse: 'badge-excelente',
      fillClasse: 'fill-excelente'
    };
  }
  if (pct >= 70) {
    return {
      status: 'Bom',
      statusClasse: 'badge-bom',
      fillClasse: 'fill-bom'
    };
  }
  if (pct >= 50) {
    return {
      status: 'Atenção',
      statusClasse: 'badge-atencao',
      fillClasse: 'fill-atencao'
    };
  }
  return {
    status: 'Revisão',
    statusClasse: 'badge-revisao',
    fillClasse: 'fill-revisao'
  };
}

function formatarTempoSimulado(segundos) {
  const seg = Math.max(0, Number(segundos) || 0);
  if (seg === 0) return '30 min';
  const min = Math.round(seg / 60);
  if (min < 1) return `${seg} seg`;
  return `${min} min`;
}

function formatarDataSimulado(dataIso) {
  if (!dataIso) return 'Recentemente';
  try {
    const data = new Date(dataIso);
    if (isNaN(data.getTime())) return 'Recentemente';
    const agora = new Date();
    const mesmoDia = data.toDateString() === agora.toDateString();

    const ontem = new Date(agora);
    ontem.setDate(ontem.getDate() - 1);
    const foiOntem = data.toDateString() === ontem.toDateString();

    const hora = String(data.getHours()).padStart(2, '0');
    const min = String(data.getMinutes()).padStart(2, '0');

    if (mesmoDia) {
      return `Hoje às ${hora}:${min}`;
    }
    if (foiOntem) {
      return `Ontem às ${hora}:${min}`;
    }

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes} às ${hora}:${min}`;
  } catch {
    return 'Recentemente';
  }
}

export async function obterDesempenhoUsuario(userId) {
  const resolvedId = await resolveUserId(userId);
  if (!resolvedId) {
    return null;
  }

  // 1. Obter dados do usuário
  const userResult = await pool.query(
    `SELECT id_usuario, nome, email, exp, lv,
            modulo_codigotransito, modulo_placastransito, modulo_direcaodefensiva,
            modulo_primeirossocorros, modulo_cidadania,
            acertos_codigotransito, acertos_placatransito, acertos_direcaodefensiva,
            acertos_primeirossocorros, acertos_meioambiente,
            COALESCE(erros_codigotransito, 0) AS erros_codigotransito,
            COALESCE(erros_placatransito, 0) AS erros_placatransito,
            COALESCE(erros_direcaodefensiva, 0) AS erros_direcaodefensiva,
            COALESCE(erros_primeirossocorros, 0) AS erros_primeirossocorros,
            COALESCE(erros_meioambiente, 0) AS erros_meioambiente
     FROM usuario
     WHERE id_usuario = $1`,
    [resolvedId]
  );

  const user = userResult.rows[0];
  if (!user) {
    return null;
  }

  const expTotal = Number(user.exp || 0);
  const levelInfo = getLevelInfo(expTotal);
  const nivel = Math.max(Number(user.lv || 1), levelInfo.nivel);

  // 2. Obter baterias do usuário
  let baterias = [];
  try {
    await initBateriaResultadoTable();
    const batResult = await pool.query(
      `SELECT materia, bateria, acertos, total_questoes, porcentagem, aprovado, atualizado_em
       FROM bateria_resultado
       WHERE id_usuario = $1
       ORDER BY atualizado_em DESC`,
      [resolvedId]
    );
    baterias = batResult.rows;
  } catch (err) {
    console.warn('[DesempenhoService] Falha ao consultar bateria_resultado:', err.message);
  }

  // 3. Obter simulados do usuário
  let simulados = [];
  try {
    const simResult = await pool.query(
      `SELECT id_simulado, materia, acertos, total_questoes, porcentagem, aprovado, tempo_gasto_segundos, criado_em
       FROM simulado_resultado
       WHERE id_usuario = $1
       ORDER BY criado_em DESC`,
      [resolvedId]
    );
    simulados = simResult.rows;
  } catch (err) {
    console.warn('[DesempenhoService] Falha ao consultar simulado_resultado:', err.message);
  }

  // 4. Calcular desempenho por matéria
  const materiasDesempenho = MATERIAS_CONFIG.map(cfg => {
    const idNorm = normalizarMateria(cfg.id);
    const bateriasMateria = baterias.filter(b => normalizarMateria(b.materia) === idNorm);

    const bateriasQuestoes = bateriasMateria.reduce((acc, b) => acc + Number(b.total_questoes || 10), 0);
    const bateriasAcertos = bateriasMateria.reduce((acc, b) => acc + Number(b.acertos || 0), 0);
    const bateriasErros = Math.max(0, bateriasQuestoes - bateriasAcertos);
    const bateriasFeitas = bateriasMateria.length;

    // Simulados específicos da matéria
    const simsMateria = simulados.filter(s => normalizarMateria(s.materia) === idNorm);
    const simsQuestoes = simsMateria.reduce((acc, s) => acc + Number(s.total_questoes || 30), 0);
    const simsAcertos = simsMateria.reduce((acc, s) => acc + Number(s.acertos || 0), 0);
    const simsErros = Math.max(0, simsQuestoes - simsAcertos);

    // Integrar contadores acumulados de acertos e erros do perfil por matéria
    const acertosPerfil = cfg.acertosColuna ? Number(user[cfg.acertosColuna] || 0) : 0;
    const errosPerfil = cfg.errosColuna ? Number(user[cfg.errosColuna] || 0) : 0;

    const acertosBateriasConsolidados = Math.max(bateriasAcertos, acertosPerfil);
    const errosBateriasConsolidados = Math.max(bateriasErros, errosPerfil);

    const acertos = acertosBateriasConsolidados + simsAcertos;
    const erros = errosBateriasConsolidados + simsErros;
    const totalQuestoes = acertos + erros;

    const porcentagem = totalQuestoes > 0 ? Math.round((acertos / totalQuestoes) * 100) : 0;

    const classificacao = classificarPorcentagem(porcentagem, totalQuestoes);
    const moduloAtual = cfg.moduloColuna ? Number(user[cfg.moduloColuna] || 1) : 1;

    return {
      id: cfg.id,
      nome: cfg.nome,
      icone: cfg.icone,
      cor: cfg.cor,
      totalQuestoes,
      acertos,
      erros,
      porcentagem,
      bateriasFeitas,
      moduloAtual,
      status: classificacao.status,
      statusClasse: classificacao.statusClasse,
      fillClasse: classificacao.fillClasse
    };
  });

  // 5. Totais Gerais consolidados
  const somaMateriasQuestoes = materiasDesempenho.reduce((acc, m) => acc + m.totalQuestoes, 0);
  const somaMateriasAcertos = materiasDesempenho.reduce((acc, m) => acc + m.acertos, 0);
  const somaMateriasErros = materiasDesempenho.reduce((acc, m) => acc + m.erros, 0);

  const simsGerais = simulados.filter(s => !s.materia || s.materia.toLowerCase() === 'geral' || s.materia.toLowerCase() === 'todos');
  const simsGeraisQuestoes = simsGerais.reduce((acc, s) => acc + Number(s.total_questoes || 30), 0);
  const simsGeraisAcertos = simsGerais.reduce((acc, s) => acc + Number(s.acertos || 0), 0);
  const simsGeraisErros = Math.max(0, simsGeraisQuestoes - simsGeraisAcertos);

  const totalQuestoes = somaMateriasQuestoes + simsGeraisQuestoes;
  const totalAcertos = somaMateriasAcertos + simsGeraisAcertos;
  const totalErros = somaMateriasErros + simsGeraisErros;
  const taxaAproveitamento = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;

  const totalSimulados = simulados.length;
  const simuladosAprovados = simulados.filter(s => Boolean(s.aprovado) || (Number(s.acertos) >= 20) || (Number(s.porcentagem) >= 67)).length;
  const simuladosReprovados = totalSimulados - simuladosAprovados;

  let statusGeral = 'Atenção';
  let statusCor = '#dc2626';
  let statusDescricao = 'Sua pontuação atual está abaixo de 50%. Dedique mais tempo aos módulos teóricos e pratique as baterias de questões antes de realizar a prova do DETRAN.';

  if (taxaAproveitamento >= 70) {
    statusGeral = 'Apto';
    statusCor = '#16a34a';
    statusDescricao = 'Você atingiu a pontuação mínima para aprovação (70%), mas recomendamos reforçar matérias críticas para ter ainda mais segurança no dia da prova!';
  } else if (taxaAproveitamento >= 50) {
    statusGeral = 'Médio';
    statusCor = '#f59e0b';
    statusDescricao = 'Sua pontuação atual está próxima dos 70%. Priorize as matérias em que você teve maior índice de erro para garantir sua aprovação de primeira.';
  } else if (totalQuestoes === 0) {
    statusGeral = 'Iniciando';
    statusCor = '#0284c7';
    statusDescricao = 'Você ainda não concluiu baterias ou simulados suficientes. Comece resolvendo questões para medir seu índice real de prontidão!';
  }

  // 6. Pontos Fortes e Fracos
  const materiasComQuestoes = materiasDesempenho.filter(m => m.totalQuestoes > 0);
  let pontosFortes = [];
  let pontosFracos = [];

  if (materiasComQuestoes.length > 0) {
    const ordenadas = [...materiasComQuestoes].sort((a, b) => b.porcentagem - a.porcentagem);
    pontosFortes = ordenadas.filter(m => m.porcentagem >= 70).map(m => m.nome);
    if (pontosFortes.length === 0 && ordenadas[0]) {
      pontosFortes = [ordenadas[0].nome];
    }
    pontosFracos = ordenadas.filter(m => m.porcentagem < 70).map(m => m.nome);
    if (pontosFracos.length === 0 && ordenadas.length > 2) {
      pontosFracos = [ordenadas[ordenadas.length - 1].nome];
    }
  } else {
    pontosFracos = ['Legislação de Trânsito', 'Direção Defensiva'];
  }

  // 7. Diagnóstico Dinâmico do Tutor IA
  let diagnosticoIa = '';
  if (totalQuestoes === 0) {
    diagnosticoIa = 'Você está iniciando seus estudos! Para a prova oficial do DETRAN, o melhor caminho é começar pelos conteúdos de Legislação de Trânsito e Direção Defensiva, que concentram mais de 60% das questões da prova oficial.';
  } else if (pontosFracos.length > 0) {
    const matsFracasTexto = pontosFracos.slice(0, 2).join(' e ');
    diagnosticoIa = `Detectamos que seu índice em ${matsFracasTexto} precisa de reforço para atingir a margem segura de aprovação no DETRAN (70%). Sugerimos priorizar a releitura dos módulos teóricos e refazer as baterias dessas matérias no seu cronograma.`;
  } else {
    diagnosticoIa = `Parabéns! Seu rendimento geral é de ${taxaAproveitamento}%, acima da nota de corte oficial do DETRAN (70%). Suas melhores matérias são ${pontosFortes.slice(0, 2).join(' e ')}. Continue resolvendo simulados para consolidar a agilidade de resposta!`;
  }

  // 8. Lista de Últimos Simulados formatados
  const ultimosSimulados = simulados.slice(0, 6).map((sim, index) => {
    const isAprovado = Boolean(sim.aprovado) || Number(sim.acertos) >= 20 || Number(sim.porcentagem) >= 67;
    const matNome = sim.materia && sim.materia !== 'todos' && sim.materia.toLowerCase() !== 'geral'
      ? (MATERIAS_CONFIG.find(m => normalizarMateria(m.id) === normalizarMateria(sim.materia))?.nome || sim.materia)
      : 'Geral';
    const numSimulado = sim.id_simulado || (simulados.length - index);

    return {
      id: sim.id_simulado,
      numero: numSimulado,
      titulo: `Simulado ${matNome} #${numSimulado}`,
      materia: matNome,
      acertos: Number(sim.acertos || 0),
      totalQuestoes: Number(sim.total_questoes || 30),
      notaTexto: `${Number(sim.acertos || 0)} / ${Number(sim.total_questoes || 30)}`,
      porcentagem: Number(sim.porcentagem || 0),
      aprovado: isAprovado,
      statusTexto: isAprovado ? 'Aprovado' : 'Reprovado',
      statusClasse: isAprovado ? 'badge-excelente' : 'badge-revisao',
      notaClasse: isAprovado ? 'nota-aprovado' : 'nota-reprovado',
      tempoTexto: formatarTempoSimulado(sim.tempo_gasto_segundos),
      dataTexto: formatarDataSimulado(sim.criado_em)
    };
  });

  return {
    sucesso: true,
    usuario: {
      id: user.id_usuario,
      nome: user.nome || 'Aluno',
      email: user.email,
      exp: expTotal,
      lv: nivel,
      tituloNivel: levelInfo.tituloNivel
    },
    resumo: {
      taxaAproveitamento,
      totalQuestoes,
      totalAcertos,
      totalErros,
      totalSimulados,
      simuladosAprovados,
      simuladosReprovados,
      statusGeral,
      statusCor,
      statusDescricao
    },
    materias: materiasDesempenho,
    pontosFortes,
    pontosFracos,
    diagnosticoIa,
    ultimosSimulados
  };
}

export function formatarDesempenhoParaPrompt(desempenho) {
  if (!desempenho || !desempenho.resumo) return '';

  const { usuario, resumo, materias, pontosFortes, pontosFracos, diagnosticoIa, ultimosSimulados } = desempenho;
  const materiasTexto = Array.isArray(materias)
    ? materias.map(m => `  * ${m.nome}: ${m.porcentagem}% de aproveitamento (${m.status}), Módulo atual: ${m.moduloAtual}/10, Acertos: ${m.acertos}/${m.totalQuestoes}`).join('\n')
    : '  * Sem dados detalhados por matéria.';

  const ultimoSimuladoTexto = Array.isArray(ultimosSimulados) && ultimosSimulados.length > 0
    ? `${ultimosSimulados[0].titulo}: ${ultimosSimulados[0].notaTexto} (${ultimosSimulados[0].porcentagem}%) - ${ultimosSimulados[0].statusTexto} em ${ultimosSimulados[0].dataTexto}`
    : 'Nenhum simulado registrado até o momento.';

  return `DESEMPENHO REAL E DETALHADO DO ALUNO NO APROVADRIVE:
- Aluno: ${usuario?.nome || 'Aluno'} | Nível: ${usuario?.lv || 1} (${usuario?.tituloNivel || 'Futuro Condutor'}) | XP Total: ${usuario?.exp || 0} XP
- Aproveitamento Geral: ${resumo.taxaAproveitamento}% (${resumo.statusGeral} para a prova oficial do DETRAN - Exigência mínima: 70%)
- Estatísticas de Questões: ${resumo.totalQuestoes} questões resolvidas | ${resumo.totalAcertos} acertos | ${resumo.totalErros} erros
- Simulados DETRAN (30 questões): ${resumo.totalSimulados} realizados (${resumo.simuladosAprovados} aprovados, ${resumo.simuladosReprovados} reprovados)
- Último Simulado: ${ultimoSimuladoTexto}
- Desempenho por Matéria:
${materiasTexto}
- Pontos Fortes do Aluno: ${pontosFortes && pontosFortes.length > 0 ? pontosFortes.join(', ') : 'Em desenvolvimento'}
- Matérias Críticas que Precisam de Reforço: ${pontosFracos && pontosFracos.length > 0 ? pontosFracos.join(', ') : 'Nenhuma matéria crítica'}
- Diagnóstico Pedagógico do Tutor: "${diagnosticoIa}"

INSTRUÇÃO AO TUTOR IA:
Use estritamente estes dados reais do aluno acima. Se o aluno perguntar sobre seu desempenho, taxa de acertos, simulados, matérias onde precisa melhorar, pontos fracos ou chances de passar no DETRAN, cite os números exatos e matérias correspondentes com tom encorajador, instrutivo e orientador. Não invente números.`;
}

export default {
  MATERIAS_CONFIG,
  obterDesempenhoUsuario,
  formatarDesempenhoParaPrompt
};

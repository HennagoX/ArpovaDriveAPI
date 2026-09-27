import taskRepository from '../Repositories/task.repository.js';
import { getLevelInfo } from './exp.service.js';
import { sugerirTarefasSemanaisComIA, gerarTarefasSemanaisFallback } from './ai.service.js';
import { obterDesempenhoUsuario } from './desempenho.service.js';
import { normalizarMateria } from './questoes.service.js';

export const MAX_PER_DAY = 3;
export const MAX_DAYS_WEEK = 6;

export const NOMES_DIAS = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado'
};

export const MAPA_DIAS = {
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado'
};

export const CHAVE_PARA_NUMERO = {
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6
};

export const NOMES_MATERIAS_EXIBICAO = {
  CodigoTransito: 'Legislação de Trânsito',
  PlacasTransito: 'Placas e Sinalização',
  DirecaoDefensiva: 'Direção Defensiva',
  PrimeirosSocorros: 'Primeiros Socorros',
  MeioAmbiente: 'Meio Ambiente e Cidadania',
  MecanicaBasica: 'Mecânica Básica',
  Geral: 'DETRAN Geral'
};

export const MODULO_COLUNAS_MAP = {
  CodigoTransito: 'modulo_codigotransito',
  PlacasTransito: 'modulo_placastransito',
  DirecaoDefensiva: 'modulo_direcaodefensiva',
  PrimeirosSocorros: 'modulo_primeirossocorros',
  MeioAmbiente: 'modulo_cidadania'
};

export const ACERTOS_COLUNAS_MAP = {
  CodigoTransito: 'acertos_codigotransito',
  PlacasTransito: 'acertos_placatransito',
  DirecaoDefensiva: 'acertos_direcaodefensiva',
  PrimeirosSocorros: 'acertos_primeirossocorros',
  MeioAmbiente: 'acertos_meioambiente'
};

export function inferirTipoValidacao(task) {
  const titulo = String(task?.titulo || '').toLowerCase();
  const desc = String(task?.descricao || '').toLowerCase();
  const texto = `${titulo} ${desc}`;

  let materia = 'CodigoTransito';
  if (texto.includes('placa') || texto.includes('sinaliza')) materia = 'PlacasTransito';
  else if (texto.includes('direcao') || texto.includes('defensiva')) materia = 'DirecaoDefensiva';
  else if (texto.includes('socorro') || texto.includes('saude') || texto.includes('primeiro')) materia = 'PrimeirosSocorros';
  else if (texto.includes('meio') || texto.includes('ambiente') || texto.includes('cidada')) materia = 'MeioAmbiente';
  else if (texto.includes('mecanica')) materia = 'MecanicaBasica';

  if (texto.includes('simulado')) {
    const isGeral = texto.includes('geral') || texto.includes('detran') || texto.includes('oficial') || !texto.includes('especifico');
    return {
      tipo: 'simulado',
      parametros: {
        materia: isGeral ? 'Geral' : materia,
        meta_porcentagem: 40,
        acertos_minimos: 12
      }
    };
  }

  if (texto.includes('quiz') || texto.includes('bateria') || texto.includes('questõ') || texto.includes('questo')) {
    return {
      tipo: 'bateria',
      parametros: {
        materia,
        bateria: 1,
        meta_porcentagem: 40
      }
    };
  }

  if (texto.includes('estudar') || texto.includes('capitulo') || texto.includes('capítulo') || texto.includes('leitura') || texto.includes('modulo') || texto.includes('módulo')) {
    return {
      tipo: 'modulo',
      parametros: {
        materia,
        modulo_minimo: 1
      }
    };
  }

  if (texto.includes('revis') || texto.includes('erros') || texto.includes('fixacao') || texto.includes('fixação') || texto.includes('desafio')) {
    return {
      tipo: 'bateria',
      parametros: {
        materia,
        bateria: 1,
        meta_porcentagem: 40
      }
    };
  }

  return {
    tipo: 'bateria',
    parametros: {
      materia,
      bateria: 1,
      meta_porcentagem: 40
    }
  };
}

export function obterLinkAcao(tipo, params = {}) {
  const materia = params.materia || 'CodigoTransito';
  if (tipo === 'simulado') {
    return {
      tipo: 'simulado',
      rota: 'simulado',
      label: 'Fazer Simulado',
      icone: 'fa-solid fa-graduation-cap'
    };
  }
  if (tipo === 'modulo') {
    return {
      tipo: 'modulo',
      rota: 'modulos',
      label: 'Estudar Módulo',
      icone: 'fa-solid fa-book-open-reader',
      conteudoId: materia
    };
  }
  if (tipo === 'bateria') {
    return {
      tipo: 'questoes',
      rota: 'questoes-resolucao',
      label: 'Praticar Questões',
      icone: 'fa-solid fa-play',
      materiaId: materia,
      bateriaNumero: params.bateria || 1
    };
  }
  if (tipo === 'acertos') {
    return {
      tipo: 'questoes',
      rota: 'questoes-modulos',
      label: 'Resolver Questões',
      icone: 'fa-solid fa-bolt',
      materiaId: materia
    };
  }
  return {
    tipo: 'questoes',
    rota: 'questoes-resolucao',
    label: 'Revisar Conteúdo',
    icone: 'fa-solid fa-rotate-left',
    materiaId: materia,
    bateriaNumero: 1
  };
}


export function getInicioSemana(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const segunda = new Date(d);
  segunda.setDate(d.getDate() - diff);
  segunda.setHours(0, 0, 0, 0);
  return segunda;
}

export function formatToYmd(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function resolveReferenceDate(dateOrDay) {
  if (!dateOrDay) {
    return new Date();
  }

  if (dateOrDay instanceof Date) {
    return dateOrDay;
  }

  const str = String(dateOrDay).toLowerCase().trim();
  const mapaNomes = {
    domingo: 0,
    dom: 0,
    '0': 0,
    segunda: 1,
    'segunda-feira': 1,
    seg: 1,
    '1': 1,
    terca: 2,
    terça: 2,
    'terca-feira': 2,
    'terça-feira': 2,
    ter: 2,
    '2': 2,
    quarta: 3,
    'quarta-feira': 3,
    qua: 3,
    '3': 3,
    quinta: 4,
    'quinta-feira': 4,
    qui: 4,
    '4': 4,
    sexta: 5,
    'sexta-feira': 5,
    sex: 5,
    '5': 5,
    sabado: 6,
    sábado: 6,
    'sabado-feira': 6,
    'sábado-feira': 6,
    sab: 6,
    '6': 6
  };

  if (mapaNomes[str] !== undefined) {
    const targetDay = mapaNomes[str];
    const hoje = new Date();
    const monday = getInicioSemana(hoje);
    const targetDate = new Date(monday);
    const offset = targetDay === 0 ? 6 : targetDay - 1;
    targetDate.setDate(monday.getDate() + offset);
    targetDate.setHours(12, 0, 0, 0);
    return targetDate;
  }

  const parsed = new Date(dateOrDay);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date();
}

export function getCurrentWeekDays(date = new Date()) {
  const startOfWeek = getInicioSemana(date);
  const days = [];
  for (let i = 0; i < MAX_DAYS_WEEK; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
}

export const DEFAULT_WEEK_TEMPLATES = [
  {
    dia_semana: 1,
    sort: 1,
    titulo: 'Estudar capítulo 1 do Código de Trânsito',
    descricao: 'Leia o capítulo 1 do Código de Trânsito e anote os conceitos principais e regras gerais.',
    xp_reward: 50,
    horario: '08:00',
    duracao: '20 min'
  },
  {
    dia_semana: 1,
    sort: 2,
    titulo: 'Mini-Quiz: 10 Questões de Direção Defensiva',
    descricao: 'Acerte no mínimo 70% para liberar o bônus diário de XP.',
    xp_reward: 100,
    horario: '12:30',
    duracao: '15 min'
  },
  {
    dia_semana: 1,
    sort: 3,
    titulo: 'Leitura Guiada & Fixação de Placas',
    descricao: 'Revisão rápida das placas de Regulamentação e Advertência.',
    xp_reward: 75,
    horario: '19:00',
    duracao: '40 min'
  },
  {
    dia_semana: 2,
    sort: 1,
    titulo: 'Estudar capítulo 2 do Código de Trânsito',
    descricao: 'Revise o capítulo 2 com foco nas normas gerais de circulação e conduta.',
    xp_reward: 40,
    horario: '08:00',
    duracao: '20 min'
  },
  {
    dia_semana: 2,
    sort: 2,
    titulo: 'Prática de Placas de Sinalização',
    descricao: 'Fixação das placas de advertência, indicação e serviços auxiliares.',
    xp_reward: 60,
    horario: '12:30',
    duracao: '15 min'
  },
  {
    dia_semana: 2,
    sort: 3,
    titulo: 'Simulado de Legislação (30 Questões)',
    descricao: 'Simulado completo com meta de 67% de aproveitamento (20 questões corretas).',
    xp_reward: 80,
    horario: '19:00',
    duracao: '40 min'
  },
  {
    dia_semana: 3,
    sort: 1,
    titulo: 'Estudar Direção Defensiva - Parte 1',
    descricao: 'Princípios básicos e métodos preventivos para evitar colisões com outros veículos.',
    xp_reward: 50,
    horario: '08:00',
    duracao: '20 min'
  },
  {
    dia_semana: 3,
    sort: 2,
    titulo: 'Condições Adversas de Tráfego e Tempo',
    descricao: 'Chuva, neblina, escuridão e estado de conservação da via.',
    xp_reward: 50,
    horario: '12:30',
    duracao: '15 min'
  },
  {
    dia_semana: 3,
    sort: 3,
    titulo: 'Quiz de Fixação de Direção Defensiva',
    descricao: '10 perguntas práticas simulando situações reais e perigosas de trânsito.',
    xp_reward: 70,
    horario: '19:00',
    duracao: '40 min'
  },
  {
    dia_semana: 4,
    sort: 1,
    titulo: 'Primeiros Socorros no Trânsito',
    descricao: 'Atendimento inicial a vítimas de acidentes e isolamento/sinalização do local.',
    xp_reward: 45,
    horario: '08:00',
    duracao: '20 min'
  },
  {
    dia_semana: 4,
    sort: 2,
    titulo: 'Procedimentos de Emergência e Telefones Úteis',
    descricao: 'Quando e como acionar SAMU, Corpo de Bombeiros e Polícia Rodoviária.',
    xp_reward: 45,
    horario: '12:30',
    duracao: '15 min'
  },
  {
    dia_semana: 4,
    sort: 3,
    titulo: 'Revisão Prática de Primeiros Socorros',
    descricao: 'Revisão dos conceitos essenciais sobre sinais vitais, contenção e cuidados pós-acidente.',
    xp_reward: 60,
    horario: '19:00',
    duracao: '40 min'
  },
  {
    dia_semana: 5,
    sort: 1,
    titulo: 'Meio Ambiente e Convívio Social no Trânsito',
    descricao: 'Emissão de poluentes, poluição sonora, respeito mútuo e direitos do pedestre.',
    xp_reward: 40,
    horario: '08:00',
    duracao: '20 min'
  },
  {
    dia_semana: 5,
    sort: 2,
    titulo: 'Mecânica Básica para Habilitação',
    descricao: 'Componentes essenciais do veículo, painel de instrumentos e manutenção preventiva.',
    xp_reward: 50,
    horario: '12:30',
    duracao: '15 min'
  },
  {
    dia_semana: 5,
    sort: 3,
    titulo: 'Simulado Geral DETRAN (30 Questões)',
    descricao: 'Prova de 30 questões nos moldes oficiais. Atinja no mínimo 67% de aproveitamento (20 acertos).',
    xp_reward: 120,
    horario: '19:00',
    duracao: '40 min'
  },
  {
    dia_semana: 6,
    sort: 1,
    titulo: 'Revisão dos Erros da Semana',
    descricao: 'Reanálise de todas as questões erradas nos simulados e questionários anteriores.',
    xp_reward: 80,
    horario: '08:00',
    duracao: '20 min'
  },
  {
    dia_semana: 6,
    sort: 2,
    titulo: 'Maratona de Questões Desafiadoras',
    descricao: 'Bateria de 20 questões com histórico de maior índice de reprovação.',
    xp_reward: 100,
    horario: '12:30',
    duracao: '15 min'
  },
  {
    dia_semana: 6,
    sort: 3,
    titulo: 'Desafio Semanal de Fixação Rápida',
    descricao: 'Conquiste o bônus de XP semanal e mantenha sua ofensiva de estudos ativa!',
    xp_reward: 150,
    horario: '19:00',
    duracao: '40 min'
  }
];

const taskService = {
  async getUsuario(identifier) {
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      const err = new Error('ID de usuário é obrigatório. Forneça o identificador de um usuário cadastrado.');
      err.statusCode = 400;
      throw err;
    }

    const user = await taskRepository.findUser(identifier.trim());
    if (!user) {
      const err = new Error(`Usuário "${identifier.trim()}" não encontrado. O ID fornecido não consta na lista de usuários cadastrados.`);
      err.statusCode = 404;
      throw err;
    }
    return user;
  },

  async listarUsuarios() {
    return await taskRepository.listUsers();
  },

  async ensureWeeklyTasks(userId, refDate = new Date()) {
    const inicioSemanaDate = getInicioSemana(refDate);
    const inicioSemanaStr = formatToYmd(inicioSemanaDate);
    const weekDays = getCurrentWeekDays(refDate);

    let tasks = await taskRepository.getTasksByUserAndWeek(userId, inicioSemanaStr);

    const hasLegacyOnly = Array.isArray(tasks) && tasks.length > 0 && !tasks.some(t => t.tipo_validacao) && !tasks.some(t => t.concluida || t.status === 'done');

    if (!tasks || tasks.length === 0 || hasLegacyOnly) {
      if (hasLegacyOnly) {
        await taskRepository.deleteUncompletedTasksByUserAndWeek(userId, inicioSemanaStr);
      }

      let user = null;
      let desempenho = null;
      try {
        user = await this.getUsuario(userId);
        desempenho = await obterDesempenhoUsuario(user.id_usuario);
      } catch (err) {
        console.warn('[TaskService] Falha ao obter dados para sugestão IA:', err.message);
      }

      const templatesSugeridos = await sugerirTarefasSemanaisComIA(user || { id_usuario: userId }, desempenho);

      const tasksToInsert = templatesSugeridos.map((tmpl) => {
        const dayDate = weekDays[tmpl.dia_semana - 1];
        return {
          id_usuario: userId,
          titulo: tmpl.titulo,
          descricao: tmpl.descricao,
          xp_reward: tmpl.xp_reward,
          status: tmpl.sort === 1 ? 'current' : 'pending',
          concluida: false,
          sort: tmpl.sort,
          dia_semana: tmpl.dia_semana,
          horario: tmpl.horario,
          duracao: tmpl.duracao,
          data_agendada: formatToYmd(dayDate),
          inicio_semana: inicioSemanaStr,
          tipo_validacao: tmpl.tipo_validacao || 'bateria',
          parametros_validacao: { ...(tmpl.parametros_validacao || {}), sugerida_por_ia: true },
          validada: false,
          motivo_bloqueio: null
        };
      });

      tasks = await taskRepository.insertWeeklyTasks(tasksToInsert);
    }

    return tasks;
  },

  async validarCumprimentoTarefa(task, user, refDate = new Date(), preloadedData = null) {
    if (!task) {
      return { valido: false, motivo: 'Tarefa inválida.' };
    }

    const userId = user.id_usuario;
    let tipo = task.tipo_validacao;
    let params = task.parametros_validacao;

    if (typeof params === 'string') {
      try { params = JSON.parse(params); } catch { params = {}; }
    }
    params = params || {};

    if (!tipo) {
      const inferido = inferirTipoValidacao(task);
      tipo = inferido.tipo;
      params = { ...inferido.parametros, ...params };
    }

    const materiaNorm = normalizarMateria(params.materia || 'CodigoTransito');
    const nomeMateria = NOMES_MATERIAS_EXIBICAO[materiaNorm] || params.materia || 'Matéria';
    const linkAcao = obterLinkAcao(tipo, { ...params, materia: materiaNorm });

    const progresso = preloadedData?.progresso || await taskRepository.getUserProgresso(userId);
    const baterias = preloadedData?.baterias || await taskRepository.getUserBaterias(userId);
    const simulados = preloadedData?.simulados || await taskRepository.getUserSimulados(userId);

    if (tipo === 'modulo') {
      const moduloMin = Number(params.modulo_minimo || 1);
      const col = MODULO_COLUNAS_MAP[materiaNorm] || 'modulo_codigotransito';
      const modAtual = Number(progresso?.[col] || 1);

      if (modAtual >= moduloMin) {
        return {
          valido: true,
          tipo,
          progressoAtual: modAtual,
          meta: moduloMin,
          motivo: `Módulo ${moduloMin} de ${nomeMateria} estudado! Requisito cumprido.`,
          linkAcao
        };
      } else {
        return {
          valido: false,
          tipo,
          progressoAtual: modAtual,
          meta: moduloMin,
          motivo: `Para concluir esta missão, estude o Módulo ${moduloMin} de ${nomeMateria} na aba Módulos (Seu progresso atual: Módulo ${modAtual}).`,
          linkAcao
        };
      }
    }

    if (tipo === 'bateria') {
      const batNum = params.bateria ? Number(params.bateria) : null;
      const metaPct = Number(params.meta_porcentagem || 40);

      const bateriasMateria = (baterias || []).filter(b => normalizarMateria(b.materia) === materiaNorm);

      let batAlvo = null;
      if (batNum) {
        batAlvo = bateriasMateria.find(b => Number(b.bateria) === batNum);
      }

      if (batAlvo) {
        const pct = Number(batAlvo.porcentagem || 0);
        const aprovado = Boolean(batAlvo.aprovado) || pct >= metaPct;
        if (aprovado) {
          return {
            valido: true,
            tipo,
            progressoAtual: pct,
            meta: metaPct,
            motivo: `Bateria ${batNum} de ${nomeMateria} superada com ${pct}% de acertos! Requisito cumprido.`,
            linkAcao
          };
        } else {
          return {
            valido: false,
            tipo,
            progressoAtual: pct,
            meta: metaPct,
            motivo: `Você obteve ${pct}% na Bateria ${batNum} de ${nomeMateria}. A missão exige no mínimo ${metaPct}% de acertos para validação. Pratique novamente na aba Questões!`,
            linkAcao
          };
        }
      }

      const algumaAprovada = bateriasMateria.find(b => Boolean(b.aprovado) || Number(b.porcentagem) >= metaPct);
      if (algumaAprovada) {
        return {
          valido: true,
          tipo,
          progressoAtual: Number(algumaAprovada.porcentagem),
          meta: metaPct,
          motivo: `Bateria de ${nomeMateria} concluída com ${algumaAprovada.porcentagem}% de acertos! Requisito cumprido.`,
          linkAcao
        };
      }

      const tentouAlguma = bateriasMateria[0];
      if (tentouAlguma) {
        return {
          valido: false,
          tipo,
          progressoAtual: Number(tentouAlguma.porcentagem),
          meta: metaPct,
          motivo: `Seu melhor rendimento em ${nomeMateria} foi ${tentouAlguma.porcentagem}%. É necessário atingir no mínimo ${metaPct}% de acertos para validar esta missão.`,
          linkAcao
        };
      }

      return {
        valido: false,
        tipo,
        progressoAtual: 0,
        meta: metaPct,
        motivo: `Para concluir esta missão, resolva a Bateria de Questões de ${nomeMateria} e acerte no mínimo ${metaPct}% das questões.`,
        linkAcao
      };
    }

    if (tipo === 'simulado') {
      const metaPct = Number(params.meta_porcentagem || 40);
      const acertosMin = Number(params.acertos_minimos || 12);
      const isGeral = !params.materia || String(params.materia).toLowerCase() === 'geral' || String(params.materia).toLowerCase() === 'todos';

      const simsFiltrados = (simulados || []).filter(s => {
        if (isGeral) return true;
        return normalizarMateria(s.materia) === materiaNorm;
      });

      const simAprovado = simsFiltrados.find(s =>
        Boolean(s.aprovado) || Number(s.porcentagem) >= metaPct || Number(s.acertos) >= acertosMin
      );

      if (simAprovado) {
        return {
          valido: true,
          tipo,
          progressoAtual: Number(simAprovado.porcentagem),
          meta: metaPct,
          motivo: `Simulado concluído (${simAprovado.porcentagem}% • ${simAprovado.acertos}/30 acertos)! Meta atingida.`,
          linkAcao
        };
      }

      const melhorSim = simsFiltrados.reduce((melhor, curr) => {
        if (!melhor || Number(curr.acertos) > Number(melhor.acertos)) return curr;
        return melhor;
      }, null);

      if (melhorSim) {
        return {
          valido: false,
          tipo,
          progressoAtual: Number(melhorSim.porcentagem),
          meta: metaPct,
          motivo: `Seu simulado anterior registrou ${melhorSim.acertos}/30 acertos (${melhorSim.porcentagem}%). A missão diária exige no mínimo ${acertosMin} acertos (${metaPct}%). Realize um novo simulado!`,
          linkAcao
        };
      }

      return {
        valido: false,
        tipo,
        progressoAtual: 0,
        meta: metaPct,
        motivo: `Para concluir esta missão, realize um Simulado no AprovaDrive e atinja no mínimo ${acertosMin} acertos (${metaPct}%).`,
        linkAcao
      };
    }

    if (tipo === 'acertos') {
      const acertosMin = Number(params.acertos_minimos || 4);
      const colAcertos = ACERTOS_COLUNAS_MAP[materiaNorm] || 'acertos_codigotransito';
      const acertosAtuais = Number(progresso?.[colAcertos] || 0);

      if (acertosAtuais >= acertosMin) {
        return {
          valido: true,
          tipo,
          progressoAtual: acertosAtuais,
          meta: acertosMin,
          motivo: `Meta de acertos superada (${acertosAtuais}/${acertosMin} acertos em ${nomeMateria})!`,
          linkAcao
        };
      } else {
        return {
          valido: false,
          tipo,
          progressoAtual: acertosAtuais,
          meta: acertosMin,
          motivo: `Você acumulou ${acertosAtuais} acertos em ${nomeMateria}. A missão exige no mínimo ${acertosMin} acertos. Pratique mais na área de Questões!`,
          linkAcao
        };
      }
    }

    if (tipo === 'revisao') {
      const metaPct = Number(params.meta_porcentagem || 40);
      const bateriasMateria = (baterias || []).filter(b => normalizarMateria(b.materia) === materiaNorm);
      const aprovada = bateriasMateria.find(b => Number(b.porcentagem) >= metaPct);

      if (aprovada) {
        return {
          valido: true,
          tipo,
          progressoAtual: Number(aprovada.porcentagem),
          meta: metaPct,
          motivo: `Revisão de ${nomeMateria} concluída com sucesso (${aprovada.porcentagem}%)!`,
          linkAcao
        };
      } else {
        return {
          valido: false,
          tipo,
          progressoAtual: 0,
          meta: metaPct,
          motivo: `Para concluir a revisão, responda a uma bateria de questões de ${nomeMateria} com pelo menos ${metaPct}% de acertos.`,
          linkAcao
        };
      }
    }

    return {
      valido: true,
      tipo: 'geral',
      motivo: 'Missão pronta para ser concluída!',
      linkAcao
    };
  },

  async getUserTaskPayload(identifier, refDate = new Date()) {
    const user = await this.getUsuario(identifier);
    const date = new Date(refDate);
    const diaSemanaAtual = date.getDay();
    const diaAtualChave = MAPA_DIAS[diaSemanaAtual] || null;

    const rawTasks = await this.ensureWeeklyTasks(user.id_usuario, date);

    // Pré-carrega dados do usuário para validação ultra-rápida (1 query cada)
    const preloadedData = {
      progresso: await taskRepository.getUserProgresso(user.id_usuario),
      baterias: await taskRepository.getUserBaterias(user.id_usuario),
      simulados: await taskRepository.getUserSimulados(user.id_usuario)
    };

    const dias = {
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
      sabado: []
    };

    const diaHojeValido = diaSemanaAtual === 0 ? 7 : diaSemanaAtual;

    for (const t of rawTasks) {
      const chave = MAPA_DIAS[t.dia_semana];
      if (chave) {
        let params = t.parametros_validacao;
        if (typeof params === 'string') {
          try { params = JSON.parse(params); } catch { params = {}; }
        }

        const isToday = t.dia_semana === diaSemanaAtual;
        const isPast = t.dia_semana < diaHojeValido;
        const isFuture = t.dia_semana > diaHojeValido;
        const isDone = Boolean(t.concluida || t.status === 'done');

        let validacao = null;
        let podeConcluir = false;
        let motivoBloqueio = null;
        let linkAcao = null;
        let taskStatus = t.status;

        if (isDone) {
          taskStatus = 'done';
          motivoBloqueio = null;
          podeConcluir = false;
          linkAcao = null;
        } else if (isPast) {
          // RIGOROSAMENTE BLOQUEADO: Se não fez no próprio dia, já era! Expirada definitivamente.
          taskStatus = 'expired';
          motivoBloqueio = `Esta missão expirou. Ela pertencia a ${NOMES_DIAS[t.dia_semana] || 'outro dia'} e não pode mais ser realizada. As tarefas diárias devem ser feitas no próprio dia.`;
          podeConcluir = false;
          linkAcao = null;
        } else if (isFuture) {
          // BLOQUEADO: Liberada apenas no próprio dia
          taskStatus = 'pending';
          motivoBloqueio = `Esta missão será liberada em ${NOMES_DIAS[t.dia_semana] || 'outro dia'}. As missões só podem ser realizadas no próprio dia.`;
          podeConcluir = false;
          linkAcao = null;
        } else {
          // É HOJE!
          validacao = await this.validarCumprimentoTarefa(t, user, date, preloadedData);
          podeConcluir = Boolean(validacao.valido && !isDone);
          motivoBloqueio = validacao.valido ? null : validacao.motivo;
          linkAcao = validacao.linkAcao;
        }

        dias[chave].push({
          ...t,
          status: taskStatus,
          concluida: isDone,
          sort: Number(t.sort),
          xp_reward: Number(t.xp_reward),
          tipo_validacao: t.tipo_validacao || validacao?.tipo || 'bateria',
          parametros_validacao: params || {},
          podeConcluir,
          expirada: !isDone && isPast,
          bloqueada: !isDone && isFuture,
          validacao,
          motivo_bloqueio: motivoBloqueio,
          linkAcao,
          sugerida_por_ia: Boolean(params?.sugerida_por_ia ?? true)
        });
      }
    }

    Object.keys(dias).forEach((k) => {
      dias[k].sort((a, b) => a.sort - b.sort);
    });

    let tarefasDoDia = [];
    let taskAtual = null;
    let diaConcluido = false;

    if (diaSemanaAtual === 0) {
      diaConcluido = true;
      taskAtual = null;
      tarefasDoDia = [];
    } else if (diaAtualChave && dias[diaAtualChave]) {
      tarefasDoDia = dias[diaAtualChave];

      const inProgress = tarefasDoDia.find((t) => t.status === 'in_progress');
      const current = tarefasDoDia.find((t) => t.status === 'current' && !t.concluida);

      const todasConcluidas = tarefasDoDia.length > 0 && tarefasDoDia.every((t) => t.concluida || t.status === 'done');

      if (todasConcluidas) {
        diaConcluido = true;
        taskAtual = null;
      } else {
        diaConcluido = false;
        taskAtual = inProgress || current || tarefasDoDia[0] || null;
      }
    }

    const diasFormatados = dias;

    const levelInfo = getLevelInfo(user.exp);

    return {
      usuario: {
        id: user.id_usuario,
        id_usuario: user.id_usuario,
        nome: user.nome,
        email: user.email,
        exp: Number(user.exp || 0),
        lv: Number(user.lv || levelInfo.nivel || 1),
        tituloNivel: levelInfo.tituloNivel,
        xpNoNivel: levelInfo.xpNoNivel,
        xpNecessarioNivel: levelInfo.xpNecessarioNivel,
        progressoPct: levelInfo.progressoPct
      },
      dataReferencia: date.toISOString(),
      diaAtual: diaAtualChave || 'domingo',
      diaSemanaAtual: diaSemanaAtual,
      diaConcluido,
      taskAtual,
      tarefasDoDia: diasFormatados[diaAtualChave] || [],
      dias: diasFormatados
    };
  },

  async getTaskById(taskId) {
    const task = await taskRepository.getTaskById(taskId);
    if (!task) {
      const err = new Error('Tarefa não encontrada.');
      err.statusCode = 404;
      throw err;
    }
    return task;
  },

  async startTask(taskId, identifier, refDate = new Date()) {
    const user = await this.getUsuario(identifier);
    const date = new Date(refDate);
    const diaSemanaHoje = date.getDay();
    const task = await taskRepository.getTaskById(taskId);
    if (!task) {
      const err = new Error('Tarefa não encontrada.');
      err.statusCode = 404;
      throw err;
    }

    if (task.id_usuario !== user.id_usuario) {
      const err = new Error('Esta tarefa não pertence ao usuário informado.');
      err.statusCode = 403;
      throw err;
    }

    const diaHojeValido = diaSemanaHoje === 0 ? 7 : diaSemanaHoje;
    if (task.dia_semana !== diaSemanaHoje) {
      const nomeDiaTarefa = NOMES_DIAS[task.dia_semana] || `Dia ${task.dia_semana}`;
      const nomeDiaHoje = diaSemanaHoje === 0 ? 'Domingo' : (NOMES_DIAS[diaSemanaHoje] || 'Hoje');
      const err = new Error(
        task.dia_semana < diaHojeValido
          ? `Esta missão expirou! Ela pertencia a ${nomeDiaTarefa}. As tarefas diárias devem ser realizadas rigorosamente no próprio dia e não podem mais ser recuperadas.`
          : `Esta missão é de ${nomeDiaTarefa}. Você só pode realizar as tarefas do dia atual (${nomeDiaHoje}). As tarefas dos demais dias ficam bloqueadas até chegar o dia.`
      );
      err.statusCode = 400;
      throw err;
    }

    if (task.concluida || task.status === 'done') {
      const err = new Error('Esta tarefa já foi concluída.');
      err.statusCode = 400;
      throw err;
    }

    if (task.sort > 1) {
      const tarefasSemana = await taskRepository.getTasksByUserAndWeek(user.id_usuario, task.inicio_semana);
      const tarefasDoMesmoDia = tarefasSemana.filter((t) => t.dia_semana === task.dia_semana);
      const tarefaAnterior = tarefasDoMesmoDia.find((t) => t.sort === task.sort - 1);

      if (tarefaAnterior && !tarefaAnterior.concluida && tarefaAnterior.status !== 'done') {
        const err = new Error(
          `Você precisa concluir a tarefa anterior (${tarefaAnterior.titulo}) antes de iniciar esta.`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    const tarefasSemana = await taskRepository.getTasksByUserAndWeek(user.id_usuario, task.inicio_semana);
    for (const t of tarefasSemana) {
      if (t.id !== task.id && t.status === 'in_progress') {
        await taskRepository.updateTask(t.id, { status: 'current' });
      }
    }

    const updatedTask = await taskRepository.updateTask(task.id, {
      status: 'in_progress'
    });

    const payload = await this.getUserTaskPayload(user.id_usuario, date);

    return {
      success: true,
      message: `Missão "${task.titulo}" iniciada com sucesso! Bons estudos!`,
      task: updatedTask,
      payload
    };
  },

  async completeTask(taskId, identifier, refDate = new Date(), options = {}) {
    const user = await this.getUsuario(identifier);
    const date = new Date(refDate);
    const diaSemanaHoje = date.getDay();

    const task = await taskRepository.getTaskById(taskId);
    if (!task) {
      const err = new Error('Tarefa não encontrada.');
      err.statusCode = 404;
      throw err;
    }

    if (task.id_usuario !== user.id_usuario) {
      const err = new Error('Esta tarefa não pertence ao usuário informado.');
      err.statusCode = 403;
      throw err;
    }

    const diaHojeValido = diaSemanaHoje === 0 ? 7 : diaSemanaHoje;
    if (task.dia_semana !== diaSemanaHoje) {
      const nomeDiaTarefa = NOMES_DIAS[task.dia_semana] || `Dia ${task.dia_semana}`;
      const nomeDiaHoje = diaSemanaHoje === 0 ? 'Domingo' : (NOMES_DIAS[diaSemanaHoje] || 'Hoje');
      const err = new Error(
        task.dia_semana < diaHojeValido
          ? `Esta missão expirou! Ela pertencia a ${nomeDiaTarefa}. Tarefas não concluídas no próprio dia expiram definitivamente e não podem mais ser recuperadas.`
          : `Esta missão é de ${nomeDiaTarefa}. Você só pode concluir tarefas rigorosamente no próprio dia (${nomeDiaHoje}).`
      );
      err.statusCode = 400;
      throw err;
    }

    if (task.concluida || task.status === 'done') {
      const err = new Error('Esta tarefa já foi concluída.');
      err.statusCode = 400;
      throw err;
    }

    // Validação real de cumprimento dos requisitos
    const validacao = await this.validarCumprimentoTarefa(task, user, date);
    if (!validacao.valido && !options.force) {
      const err = new Error(validacao.motivo || 'Você ainda não cumpriu os requisitos necessários para concluir esta missão diária.');
      err.statusCode = 400;
      err.validacao = validacao;
      throw err;
    }

    const updatedTask = await taskRepository.updateTask(task.id, {
      status: 'done',
      concluida: true,
      validada: true,
      motivo_bloqueio: null
    });

    const xpReward = Number(task.xp_reward || 30);
    const novoXp = await taskRepository.updateUserXp(user.id_usuario, xpReward);

    if (task.sort < MAX_PER_DAY) {
      const tarefasSemana = await taskRepository.getTasksByUserAndWeek(user.id_usuario, task.inicio_semana);
      const proximaTarefa = tarefasSemana.find(
        (t) => t.dia_semana === task.dia_semana && t.sort === task.sort + 1
      );

      if (proximaTarefa && !proximaTarefa.concluida && proximaTarefa.status === 'pending') {
        await taskRepository.updateTask(proximaTarefa.id, { status: 'current' });
      }
    }

    const payload = await this.getUserTaskPayload(user.id_usuario, date);

    return {
      success: true,
      message: `Missão "${task.titulo}" validada e concluída com sucesso! +${xpReward} XP!`,
      xp_reward: xpReward,
      novo_xp: novoXp,
      task: updatedTask,
      payload
    };
  },

  async pauseTask(taskId, identifier, refDate = new Date()) {
    const user = await this.getUsuario(identifier);
    const date = new Date(refDate);
    const diaSemanaHoje = date.getDay();

    const task = await taskRepository.getTaskById(taskId);
    if (!task) {
      const err = new Error('Tarefa não encontrada.');
      err.statusCode = 404;
      throw err;
    }

    if (task.id_usuario !== user.id_usuario) {
      const err = new Error('Esta tarefa não pertence ao usuário informado.');
      err.statusCode = 403;
      throw err;
    }

    if (task.dia_semana !== diaSemanaHoje) {
      const err = new Error('Você só pode pausar tarefas do próprio dia.');
      err.statusCode = 400;
      throw err;
    }

    if (task.status === 'done' || task.concluida) {
      const err = new Error('Não é possível pausar uma tarefa já concluída.');
      err.statusCode = 400;
      throw err;
    }

    const updatedTask = await taskRepository.updateTask(task.id, {
      status: 'current'
    });

    const payload = await this.getUserTaskPayload(user.id_usuario, date);

    return {
      success: true,
      message: `Missão "${task.titulo}" pausada.`,
      task: updatedTask,
      payload
    };
  },

  async resetTask(taskId, identifier, refDate = new Date()) {
    const user = await this.getUsuario(identifier);
    const date = new Date(refDate);

    const task = await taskRepository.getTaskById(taskId);
    if (!task) {
      const err = new Error('Tarefa não encontrada.');
      err.statusCode = 404;
      throw err;
    }

    if (task.id_usuario !== user.id_usuario) {
      const err = new Error('Esta tarefa não pertence ao usuário informado.');
      err.statusCode = 403;
      throw err;
    }

    const updatedTask = await taskRepository.updateTask(task.id, {
      status: task.sort === 1 ? 'current' : 'pending',
      concluida: false,
      validada: false
    });

    const payload = await this.getUserTaskPayload(user.id_usuario, date);

    return {
      success: true,
      message: `Missão "${task.titulo}" reiniciada.`,
      task: updatedTask,
      payload
    };
  },

  async resetSchedule(identifier, refDate = new Date()) {
    const user = await this.getUsuario(identifier);
    const date = new Date(refDate);
    const inicioSemanaDate = getInicioSemana(date);
    const inicioSemanaStr = formatToYmd(inicioSemanaDate);

    await taskRepository.deleteTasksByUserAndWeek(user.id_usuario, inicioSemanaStr);
    await this.ensureWeeklyTasks(user.id_usuario, date);

    const payload = await this.getUserTaskPayload(user.id_usuario, date);

    return {
      success: true,
      message: 'Cronograma semanal reinicializado com sucesso no banco de dados.',
      payload
    };
  },

  async regenerarTarefasComIA(identifier, refDate = new Date()) {
    const user = await this.getUsuario(identifier);
    const date = new Date(refDate);
    const inicioSemanaDate = getInicioSemana(date);
    const inicioSemanaStr = formatToYmd(inicioSemanaDate);
    const weekDays = getCurrentWeekDays(date);

    await taskRepository.deleteTasksByUserAndWeek(user.id_usuario, inicioSemanaStr);

    let desempenho = null;
    try {
      desempenho = await obterDesempenhoUsuario(user.id_usuario);
    } catch (err) {
      console.warn('[TaskService] Falha ao obter desempenho para regeneração:', err.message);
    }

    const templatesSugeridos = await sugerirTarefasSemanaisComIA(user, desempenho);

    const tasksToInsert = templatesSugeridos.map((tmpl) => {
      const dayDate = weekDays[tmpl.dia_semana - 1];
      return {
        id_usuario: user.id_usuario,
        titulo: tmpl.titulo,
        descricao: tmpl.descricao,
        xp_reward: tmpl.xp_reward,
        status: tmpl.sort === 1 ? 'current' : 'pending',
        concluida: false,
        sort: tmpl.sort,
        dia_semana: tmpl.dia_semana,
        horario: tmpl.horario,
        duracao: tmpl.duracao,
        data_agendada: formatToYmd(dayDate),
        inicio_semana: inicioSemanaStr,
        tipo_validacao: tmpl.tipo_validacao || 'bateria',
        parametros_validacao: { ...(tmpl.parametros_validacao || {}), sugerida_por_ia: true },
        validada: false,
        motivo_bloqueio: null
      };
    });

    await taskRepository.insertWeeklyTasks(tasksToInsert);

    const payload = await this.getUserTaskPayload(user.id_usuario, date);

    return {
      success: true,
      message: 'Missões semanais otimizadas e sugeridas com sucesso pelo Tutor IA com base no seu desempenho atual!',
      payload
    };
  },

  resolveReferenceDate
};

export default taskService;
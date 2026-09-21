import taskRepository from '../Repositories/task.repository.js';

export const MAX_PER_DAY = 3;
export const MAX_DAYS_WEEK = 6; // Segunda a Sábado

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

/**
 * Retorna a data (segunda-feira) que dá início à semana da data de referência informada.
 * Horário zerado: 00:00:00.000.
 * @param {Date|string} date 
 * @returns {Date}
 */
export function getInicioSemana(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  // Se for Domingo (0), a semana letiva começou na Segunda-feira anterior (6 dias atrás)
  const diff = day === 0 ? 6 : day - 1;
  const segunda = new Date(d);
  segunda.setDate(d.getDate() - diff);
  segunda.setHours(0, 0, 0, 0);
  return segunda;
}

/**
 * Formata um objeto Date para string no padrão YYYY-MM-DD.
 * @param {Date|string} date 
 * @returns {string}
 */
export function formatToYmd(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte um valor (nome do dia, número do dia ou data ISO) em um objeto Date de referência.
 * Permite simulações como ?simularDia=quarta ou ?mockDay=3.
 * @param {Date|string|number} [dateOrDay]
 * @returns {Date}
 */
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

/**
 * Retorna um array com os 6 dias da semana (Segunda a Sábado) como objetos Date.
 * @param {Date|string} date 
 * @returns {Date[]}
 */
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

/**
 * Lista de 18 tarefas padrão da semana com dados didáticos do AprovaDrive.
 * 3 tarefas por dia (sort 1, 2, 3), de Segunda a Sábado.
 */
export const DEFAULT_WEEK_TEMPLATES = [
  // Segunda (Dia 1)
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
    titulo: 'Leitura Guiada & Flashcards de Placas',
    descricao: 'Revisão rápida das placas de Regulamentação e Advertência.',
    xp_reward: 75,
    horario: '19:00',
    duracao: '40 min'
  },
  // Terça (Dia 2)
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
    titulo: 'Simulado Rápido de Legislação',
    descricao: '15 questões cronometradas sobre regras de circulação e preferência.',
    xp_reward: 80,
    horario: '19:00',
    duracao: '40 min'
  },
  // Quarta (Dia 3)
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
  // Quinta (Dia 4)
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
    titulo: 'Revisão com Flashcards de Primeiros Socorros',
    descricao: 'Exercícios mnemônicos sobre sinais vitais, contenção e cuidados pós-acidente.',
    xp_reward: 60,
    horario: '19:00',
    duracao: '40 min'
  },
  // Sexta (Dia 5)
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
    titulo: 'Simulado Geral Integrado',
    descricao: 'Prova de 30 questões nos moldes oficiais da prova teórica do DETRAN.',
    xp_reward: 120,
    horario: '19:00',
    duracao: '40 min'
  },
  // Sábado (Dia 6)
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
  /**
   * Obtém o usuário associado a um identificador.
   * @param {string} [identifier] 
   */
  async getUsuario(identifier) {
    const user = await taskRepository.findUser(identifier);
    if (!user) {
      const err = new Error('Usuário não encontrado.');
      err.statusCode = 404;
      throw err;
    }
    return user;
  },

  /**
   * Garante que o usuário possua as 18 tarefas da semana atual salvas no banco PostgreSQL.
   * Se for uma nova semana, as tarefas anteriores não são retornadas na consulta semanal,
   * e novas tarefas são geradas e inseridas no banco para o usuário.
   * @param {string} userId 
   * @param {Date|string} [refDate] 
   * @returns {Promise<Array>}
   */
  async ensureWeeklyTasks(userId, refDate = new Date()) {
    const inicioSemanaDate = getInicioSemana(refDate);
    const inicioSemanaStr = formatToYmd(inicioSemanaDate);
    const weekDays = getCurrentWeekDays(refDate);

    // Consulta tarefas existentes para a semana atual
    let tasks = await taskRepository.getTasksByUserAndWeek(userId, inicioSemanaStr);

    // Se ainda não existem tarefas cadastradas no banco para esta semana, gera e insere as 18 tarefas
    if (!tasks || tasks.length === 0) {
      const tasksToInsert = DEFAULT_WEEK_TEMPLATES.map((tmpl) => {
        const dayDate = weekDays[tmpl.dia_semana - 1];
        return {
          id_usuario: userId,
          titulo: tmpl.titulo,
          descricao: tmpl.descricao,
          xp_reward: tmpl.xp_reward,
          // A primeira tarefa de cada dia inicia como 'current' no banco (independente dos outros dias!)
          // As tarefas 2 e 3 iniciam como 'pending'
          status: tmpl.sort === 1 ? 'current' : 'pending',
          concluida: false,
          sort: tmpl.sort,
          dia_semana: tmpl.dia_semana,
          horario: tmpl.horario,
          duracao: tmpl.duracao,
          data_agendada: formatToYmd(dayDate),
          inicio_semana: inicioSemanaStr
        };
      });

      tasks = await taskRepository.insertWeeklyTasks(tasksToInsert);
    }

    return tasks;
  },

  /**
   * Retorna o payload completo do cronograma semanal para o usuário e data de referência.
   * Aplica a regra de negócio:
   * - O usuário só pode realizar tasks do dia atual.
   * - A primeira tarefa de cada dia não depende dos outros dias.
   * - Para os dias diferentes de hoje, as tarefas pendentes são apresentadas bloqueadas (status: 'pending').
   * @param {string} [identifier] 
   * @param {Date|string} [refDate] 
   * @returns {Promise<Object>}
   */
  async getUserTaskPayload(identifier, refDate = new Date()) {
    const user = await this.getUsuario(identifier);
    const date = new Date(refDate);
    const diaSemanaAtual = date.getDay(); // 0 = Domingo, 1..6 = Segunda..Sábado
    const diaAtualChave = MAPA_DIAS[diaSemanaAtual] || null;

    // Garante tarefas da semana no banco de dados
    const rawTasks = await this.ensureWeeklyTasks(user.id_usuario, date);

    // Mapeia tarefas por dia da semana
    const dias = {
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
      sabado: []
    };

    rawTasks.forEach((t) => {
      const chave = MAPA_DIAS[t.dia_semana];
      if (chave) {
        dias[chave].push({
          ...t,
          sort: Number(t.sort),
          xp_reward: Number(t.xp_reward)
        });
      }
    });

    // Ordena cada dia por sort
    Object.keys(dias).forEach((k) => {
      dias[k].sort((a, b) => a.sort - b.sort);
    });

    // Calcula tarefas do dia de hoje e status do dia
    let tarefasDoDia = [];
    let taskAtual = null;
    let diaConcluido = false;

    if (diaSemanaAtual === 0) {
      // Domingo: sem tarefas letivas
      diaConcluido = true;
      taskAtual = null;
      tarefasDoDia = [];
    } else if (diaAtualChave && dias[diaAtualChave]) {
      tarefasDoDia = dias[diaAtualChave];

      // Busca tarefa em andamento ou atual de hoje
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

    // Formata o payload para o frontend respeitando a regra:
    // "Não pode fazer tasks do outro dia, só no outro dia"
    // Para dias diferentes de hoje, as tarefas não concluídas aparecem como 'pending' (com botão BLOQUEADO no frontend)
    const diasFormatados = {};
    for (let d = 1; d <= MAX_DAYS_WEEK; d++) {
      const chave = MAPA_DIAS[d];
      const listaTarefas = dias[chave] || [];

      if (d === diaSemanaAtual) {
        // No dia de hoje: exibe status reais (done, in_progress, current, pending)
        diasFormatados[chave] = listaTarefas;
      } else {
        // Nos demais dias:
        // - Se concluída: exibe 'done'
        // - Se pendente/current: exibe 'pending' (botão BLOQUEADO)
        // Ao ser clicado, a requisição vai para a API, que valida e retorna erro 400
        diasFormatados[chave] = listaTarefas.map((t) => ({
          ...t,
          status: t.concluida || t.status === 'done' ? 'done' : 'pending'
        }));
      }
    }

    return {
      usuario: {
        id: user.id_usuario,
        id_usuario: user.id_usuario,
        nome: user.nome,
        email: user.email,
        exp: Number(user.exp || 0)
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

  /**
   * Busca os detalhes de uma tarefa específica por ID.
   * @param {string} taskId 
   * @returns {Promise<Object>}
   */
  async getTaskById(taskId) {
    const task = await taskRepository.getTaskById(taskId);
    if (!task) {
      const err = new Error('Tarefa não encontrada.');
      err.statusCode = 404;
      throw err;
    }
    return task;
  },

  /**
   * Inicia uma tarefa (status vira 'in_progress').
   * Aplica estritamente as regras de negócio:
   * 1. A tarefa deve pertencer ao dia atual do sistema. Não pode fazer tasks de outro dia!
   * 2. A primeira tarefa de cada dia não depende dos outros dias.
   * 3. Dentro do mesmo dia, as tarefas devem seguir a ordem (tarefa 2 requer tarefa 1 concluída, etc.).
   * @param {string} taskId 
   * @param {string} [identifier] 
   * @param {Date|string} [refDate] 
   * @returns {Promise<Object>}
   */
  async startTask(taskId, identifier, refDate = new Date()) {
    const user = await this.getUsuario(identifier);
    const date = new Date(refDate);
    const diaSemanaHoje = date.getDay(); // 0 = Domingo, 1..6 = Segunda..Sábado
    console.log(diaSemanaHoje);
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

    // REGRA FUNDAMENTAL: Não pode fazer tasks do outro dia, só no outro dia!
    if (task.dia_semana !== diaSemanaHoje) {
      const nomeDiaTarefa = NOMES_DIAS[task.dia_semana] || `Dia ${task.dia_semana}`;
      const nomeDiaHoje = diaSemanaHoje === 0 ? 'Domingo' : (NOMES_DIAS[diaSemanaHoje] || 'Hoje');
      const err = new Error(
        `Esta tarefa é de ${nomeDiaTarefa}. Você só pode realizar as tarefas do dia atual (${nomeDiaHoje}). As tarefas dos demais dias ficam bloqueadas até chegar o dia.`
      );
      err.statusCode = 400;
      throw err;
    }

    if (task.concluida || task.status === 'done') {
      const err = new Error('Esta tarefa já foi concluída.');
      err.statusCode = 400;
      throw err;
    }

    // REGRA DE SEQUÊNCIA INTERNA DO DIA:
    // A primeira do dia (sort === 1) não depende de nada de outros dias!
    // A tarefa 2 requer a tarefa 1 do mesmo dia concluída; a tarefa 3 requer a tarefa 2 concluída.
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

    // Pausa qualquer outra tarefa que esteja 'in_progress' hoje
    const tarefasSemana = await taskRepository.getTasksByUserAndWeek(user.id_usuario, task.inicio_semana);
    for (const t of tarefasSemana) {
      if (t.id !== task.id && t.status === 'in_progress') {
        await taskRepository.updateTask(t.id, { status: 'current' });
      }
    }

    // Atualiza status da tarefa selecionada no PostgreSQL
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

  /**
   * Conclui uma tarefa (status vira 'done', concluida = true, concede XP).
   * Desbloqueia a próxima tarefa do mesmo dia (se houver).
   * @param {string} taskId 
   * @param {string} [identifier] 
   * @param {Date|string} [refDate] 
   * @returns {Promise<Object>}
   */
  async completeTask(taskId, identifier, refDate = new Date()) {
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

    // REGRA: Só pode concluir tarefa no dia correspondente
    if (task.dia_semana !== diaSemanaHoje) {
      const nomeDiaTarefa = NOMES_DIAS[task.dia_semana] || `Dia ${task.dia_semana}`;
      const nomeDiaHoje = diaSemanaHoje === 0 ? 'Domingo' : (NOMES_DIAS[diaSemanaHoje] || 'Hoje');
      const err = new Error(
        `Esta tarefa é de ${nomeDiaTarefa}. Você só pode concluir tarefas no dia atual (${nomeDiaHoje}).`
      );
      err.statusCode = 400;
      throw err;
    }

    if (task.concluida || task.status === 'done') {
      const err = new Error('Esta tarefa já foi concluída.');
      err.statusCode = 400;
      throw err;
    }

    // Conclui a tarefa no PostgreSQL
    const updatedTask = await taskRepository.updateTask(task.id, {
      status: 'done',
      concluida: true
    });

    // Credita XP ao usuário no banco
    const xpReward = Number(task.xp_reward || 30);
    const novoXp = await taskRepository.updateUserXp(user.id_usuario, xpReward);

    // Se houver uma próxima tarefa no mesmo dia (sort + 1 <= 3), desbloqueia para 'current'
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
      message: `Missão "${task.titulo}" concluída com sucesso! +${xpReward} XP!`,
      xp_reward: xpReward,
      novo_xp: novoXp,
      task: updatedTask,
      payload
    };
  },

  /**
   * Pausa uma tarefa que está em andamento (volta para 'current').
   * @param {string} taskId 
   * @param {string} [identifier] 
   * @param {Date|string} [refDate] 
   * @returns {Promise<Object>}
   */
  async pauseTask(taskId, identifier, refDate = new Date()) {
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

  /**
   * Reinicia o status de uma tarefa para 'pending' ou 'current'.
   * @param {string} taskId 
   * @param {string} [identifier] 
   * @param {Date|string} [refDate] 
   * @returns {Promise<Object>}
   */
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
      concluida: false
    });

    const payload = await this.getUserTaskPayload(user.id_usuario, date);

    return {
      success: true,
      message: `Missão "${task.titulo}" reiniciada.`,
      task: updatedTask,
      payload
    };
  },

  /**
   * Limpa e reinicializa todo o cronograma da semana do usuário no PostgreSQL.
   * @param {string} [identifier] 
   * @param {Date|string} [refDate] 
   * @returns {Promise<Object>}
   */
  async resetSchedule(identifier, refDate = new Date()) {
    const user = await this.getUsuario(identifier);
    const date = new Date(refDate);
    const inicioSemanaDate = getInicioSemana(date);
    const inicioSemanaStr = formatToYmd(inicioSemanaDate);

    // Remove tarefas existentes da semana atual no banco
    await taskRepository.deleteTasksByUserAndWeek(user.id_usuario, inicioSemanaStr);

    // Recria as tarefas da semana
    await this.ensureWeeklyTasks(user.id_usuario, date);

    const payload = await this.getUserTaskPayload(user.id_usuario, date);

    return {
      success: true,
      message: 'Cronograma semanal reinicializado com sucesso no banco de dados.',
      payload
    };
  },

  resolveReferenceDate
};

export default taskService;
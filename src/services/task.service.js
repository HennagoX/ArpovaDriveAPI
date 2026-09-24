import taskRepository from '../Repositories/task.repository.js';
import { getLevelInfo } from './exp.service.js';

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
    titulo: 'Leitura Guiada & Flashcards de Placas',
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
    titulo: 'Simulado Rápido de Legislação',
    descricao: '15 questões cronometradas sobre regras de circulação e preferência.',
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
    titulo: 'Revisão com Flashcards de Primeiros Socorros',
    descricao: 'Exercícios mnemônicos sobre sinais vitais, contenção e cuidados pós-acidente.',
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
    titulo: 'Simulado Geral Integrado',
    descricao: 'Prova de 30 questões nos moldes oficiais da prova teórica do DETRAN.',
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

    if (!tasks || tasks.length === 0) {
      const tasksToInsert = DEFAULT_WEEK_TEMPLATES.map((tmpl) => {
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
          inicio_semana: inicioSemanaStr
        };
      });

      tasks = await taskRepository.insertWeeklyTasks(tasksToInsert);
    }

    return tasks;
  },

  async getUserTaskPayload(identifier, refDate = new Date()) {
    const user = await this.getUsuario(identifier);
    const date = new Date(refDate);
    const diaSemanaAtual = date.getDay();
    const diaAtualChave = MAPA_DIAS[diaSemanaAtual] || null;

    const rawTasks = await this.ensureWeeklyTasks(user.id_usuario, date);

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

    const diasFormatados = {};
    for (let d = 1; d <= MAX_DAYS_WEEK; d++) {
      const chave = MAPA_DIAS[d];
      const listaTarefas = dias[chave] || [];

      if (d === diaSemanaAtual) {
        diasFormatados[chave] = listaTarefas;
      } else {
        diasFormatados[chave] = listaTarefas.map((t) => ({
          ...t,
          status: t.concluida || t.status === 'done' ? 'done' : 'pending'
        }));
      }
    }

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

    const updatedTask = await taskRepository.updateTask(task.id, {
      status: 'done',
      concluida: true
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
      message: `Missão "${task.titulo}" concluída com sucesso! +${xpReward} XP!`,
      xp_reward: xpReward,
      novo_xp: novoXp,
      task: updatedTask,
      payload
    };
  },

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

  resolveReferenceDate
};

export default taskService;
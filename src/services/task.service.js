import taskModel from '../models/task.js';
import TaskSemanais from '../models/tasksSemanais.js';
import taskTemplates from '../config/tasksTemplates.js';

const MAX_PER_DAY = 3;
const MAX_PER_WEEK = 18;
const MAX_DAYS_WEEK = 6; // Segunda - Sábado
const WEEK_DAY_KEYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

const userSchedules = {};

export const getCurrentWeekDays = (date = new Date()) => {
  const today = new Date(date);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? MAX_DAYS_WEEK : today.getDay() - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const days = [];

  for (let i = 0; i < MAX_DAYS_WEEK; i += 1) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }

  return days;
};

const getDayKey = (date) => {
  const day = new Date(date);
  return day.toISOString().slice(0, 10);
};

const getWeekDayKey = (date) => {
  const day = new Date(date).getDay();

  if (day === 0) {
    return null;
  }

  return WEEK_DAY_KEYS[day - 1];
};

const getWeekKey = (date = new Date()) => {
  const taskSemanal = new TaskSemanais(0, date);
  return getDayKey(taskSemanal.inicioSemana);
};

const getUserWeek = (id_usuario, date = new Date()) => {
  const weekKey = getWeekKey(date);

  if (!userSchedules[id_usuario]) {
    userSchedules[id_usuario] = {};
  }

  if (!userSchedules[id_usuario][weekKey]) {
    userSchedules[id_usuario][weekKey] = Object.fromEntries(
      WEEK_DAY_KEYS.map((dayKey) => [dayKey, []]),
    );
  }

  return userSchedules[id_usuario][weekKey];
};

const attachWeeklyInfo = (task, date = new Date()) => {
  const taskDate = new Date(date);
  const dayOfWeek = taskDate.getDay();

  if (dayOfWeek === 0) {
    return null;
  }

  const semanal = new TaskSemanais(
    task.id,
    taskDate,
    dayOfWeek,
    task.sort ?? 1,
    Boolean(task.concluida),
  );

  return {
    ...task,
    semanal,
  };
};

const DEFAULT_TEMPLATES = [
  'codigoTransitoCapitulo1', 'codigoTransitoCapitulo1', 'codigoTransitoCapitulo1', // Segunda (sort 1, 2, 3)
  'codigoTransitoCapitulo1' ,'codigoTransitoCapitulo1', 'codigoTransitoCapitulo1', // Terça (sort 1, 2, 3)
  'codigoTransitoCapitulo1', 'primeirosSocorrosCapitulo1', 'codigoTransitoCapitulo1', // Quarta (sort 1, 2, 3)
  'meioAmbienteCapitulo1', 'placasTransitoCapitulo1', 'codigoTransitoCapitulo1', // Quinta (sort 1, 2, 3)
  'direcaoDefensivaCapitulo1', 'codigoTransitoCapitulo1', 'primeirosSocorrosCapitulo1', // Sexta (sort 1, 2, 3)
  'codigoTransitoCapitulo1', 'meioAmbienteCapitulo1', 'codigoTransitoCapitulo1' // Sábado (sort 1, 2, 3)
];

const taskService = {
  newTask: (id_usuario, titulo, xp_reward, descricao, ativa, status, sort) => {
    return new taskModel(id_usuario, titulo, xp_reward, descricao, ativa, status, sort);
  },

  newTaskFromTemplate: (id_usuario, templateName, overrides) => {
    const template = taskTemplates[templateName];

    if (!template) {
      throw new Error('Template de task não encontrado');
    }

    return new taskModel(
      id_usuario,
      overrides?.titulo ?? template.titulo,
      overrides?.xp_reward ?? template.xp_reward,
      overrides?.descricao ?? template.descricao,
      overrides?.ativa ?? template.ativa,
      overrides?.status ?? 'pending',
      overrides?.sort ?? template.sort,
    );
  },

  newWeeklyTask: (taskData = {}) => {
    const date = new Date(taskData.created_at || taskData.data || new Date());
    return attachWeeklyInfo(taskData, date);
  },

  canCreateTaskForWeek: (id_usuario, date = new Date()) => {
    const taskDate = new Date(date);
    const dayKey = getWeekDayKey(taskDate);

    if (!dayKey) {
      return false;
    }

    const userWeek = getUserWeek(id_usuario, taskDate);
    const currentDayTasks = userWeek[dayKey] || [];

    if (currentDayTasks.length >= MAX_PER_DAY) {
      return false;
    }

    const weeklyCount = Object.values(userWeek)
      .reduce((total, tasks) => total + tasks.length, 0);

    return weeklyCount < MAX_PER_WEEK;
  },

setDailyTask: (task) => {
  const taskDate = new Date(task.scheduled_at || new Date());
  const taskWithWeeklyInfo = attachWeeklyInfo(task, taskDate);
  const dayKey = getWeekDayKey(taskDate);

  if (!dayKey) {
    return false;
  }

  if (
    !taskService.canCreateTaskForWeek(
      taskWithWeeklyInfo.id_usuario,
      taskDate
    )
  ) {
    return false;
  }

  const userWeek = getUserWeek(
    taskWithWeeklyInfo.id_usuario,
    taskDate
  );

  userWeek[dayKey].push(taskWithWeeklyInfo);

  userWeek[dayKey].sort(
    (a, b) => (a.sort ?? 0) - (b.sort ?? 0)
  );

  return true;
},

  createWeeklySchedule: (id_usuario, templateNames = [], date = new Date()) => {
  if (templateNames.length > MAX_PER_WEEK) {
    return false;
  }

  const weekDays = getCurrentWeekDays(date);
  const createdTasks = [];

  for (let index = 0; index < templateNames.length; index += 1) {
    const dayIndex = Math.floor(index / MAX_PER_DAY);
    const position = (index % MAX_PER_DAY) + 1;
    const taskDate = weekDays[dayIndex];

    const task = taskService.newTaskFromTemplate(
      id_usuario,
      templateNames[index],
      {
        sort: position,
      }
    );

    task.scheduled_at = taskDate.toISOString();

    if (!taskService.setDailyTask(task)) {
      return false;
    }

    createdTasks.push(task);
  }

  return createdTasks;
},

getDailyTasks: (id_usuario, date = new Date()) => {
  const dayKey = getWeekDayKey(date);

  // Domingo
  if (!dayKey) {
    return [];
  }

  const userWeek = taskService.getUserSchedule(id_usuario, date);

  return userWeek[dayKey] || [];
},

  getUserSchedule: (id_usuario, date = new Date()) => {
    if (!id_usuario) {
      return userSchedules;
    }

    const userWeek = getUserWeek(id_usuario, date);
    const hasAnyTask = Object.values(userWeek).some((tasks) => tasks.length > 0);

    // Se o usuário ainda não tiver tarefas criadas para essa semana, inicializa com o cronograma padrão
    if (!hasAnyTask) {
      taskService.createWeeklySchedule(id_usuario, DEFAULT_TEMPLATES, date);
      
      // Ajusta status inicial para simulação gamificada:
      // Primeira tarefa da segunda concluída (done), segunda tarefa como atual (current)
      const segundaTasks = userWeek['segunda'] || [];
      if (segundaTasks[0]) {
        segundaTasks[0].concluida = true;
        segundaTasks[0].status = 'done';
      }
      if (segundaTasks[1]) {
        segundaTasks[1].status = 'current';
      }
    }

    return userWeek;
  },

  getCurrentTask: (id_usuario, date = new Date()) => {
    const userWeek = taskService.getUserSchedule(id_usuario, date);
    const dayKey = getWeekDayKey(date) || 'segunda';
    const dayTasks = userWeek[dayKey] || [];

    // Busca tarefa explicitamente em andamento ou marcada como 'current'
    let currentTask = dayTasks.find((t) => t.status === 'current');

    // Se não houver, pega a primeira tarefa não concluída do dia
    if (!currentTask) {
      currentTask = dayTasks.find((t) => !t.concluida && t.status !== 'done');
      if (currentTask) {
        currentTask.status = 'current';
      }
    }

    // Se todas do dia foram concluídas, retorna a primeira tarefa do próximo dia com tarefas
    if (!currentTask) {
      for (const key of WEEK_DAY_KEYS) {
        const tasks = userWeek[key] || [];
        const pending = tasks.find((t) => !t.concluida && t.status !== 'done');
        if (pending) {
          currentTask = pending;
          currentTask.status = 'current';
          break;
        }
      }
    }

    return currentTask || (dayTasks.length > 0 ? dayTasks[0] : null);
  },

  getUserTaskPayload: (id_usuario, date = new Date()) => {
    const userWeek = taskService.getUserSchedule(id_usuario, date);
    const dayKey = getWeekDayKey(date) || 'segunda';
    const dayIndex = WEEK_DAY_KEYS.indexOf(dayKey) + 1; // 1 a 6
    const taskAtual = taskService.getCurrentTask(id_usuario, date);

    return {
      usuario: id_usuario,
      dataReferencia: date.toISOString(),
      diaAtual: dayKey,
      diaSemanaAtual: dayIndex > 0 ? dayIndex : 1,
      taskAtual: taskAtual,
      tarefasDoDia: userWeek[dayKey] || [],
      dias: userWeek
    };
  }
};

export default taskService;
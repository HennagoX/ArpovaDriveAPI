import taskModel from '../models/task.js';
import TaskSemanais from '../models/tasksSemanais.js';
import taskTemplates from '../config/tasksTemplates.js';

const MAX_PER_DAY = 3;
const MAX_PER_WEEK = MAX_PER_DAY * 6;
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
  const semanal = new TaskSemanais(
    task.id,
    taskDate,
    taskDate.getDay() === 0 ? 6 : taskDate.getDay() - 1,
    task.sort ?? 0,
    Boolean(task.concluida),
  );

  return {
    ...task,
  semanal,
  };
};

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
      overrides?.titulo || template.titulo,
      overrides?.xp_reward || template.xp_reward,
      overrides?.descricao || template.descricao,
      overrides?.ativa || template.ativa,
      overrides?.status || 'pending',
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
    const taskDate = new Date(task.created_at || new Date());
    const taskWithWeeklyInfo = attachWeeklyInfo(task, taskDate);
    const dayKey = getWeekDayKey(taskDate);

    if (!dayKey) {
      return false;
    }

    if (!taskService.canCreateTaskForWeek(taskWithWeeklyInfo.id_usuario, taskDate)) {
      return false;
    }

    const userWeek = getUserWeek(taskWithWeeklyInfo.id_usuario, taskDate);

    userWeek[dayKey].push(taskWithWeeklyInfo);
    userWeek[dayKey].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    
    return true;
  },

  createWeeklySchedule: (id_usuario, templateNames = []) => {
    if (templateNames.length > MAX_PER_WEEK) {
      return false;
    }

    const weekDays = getCurrentWeekDays();
    const createdTasks = [];

    for (let index = 0; index < templateNames.length; index += 1) {
      const dayIndex = index % MAX_DAYS_WEEK;
      const taskDate = weekDays[dayIndex];
      const task = taskService.newTaskFromTemplate(id_usuario, templateNames[index], {
        sort: index % MAX_PER_DAY,
      });

      task.created_at = taskDate.toISOString();

      if (!taskService.setDailyTask(task)) {
        return false;
      }

      createdTasks.push(task);
    }

    return createdTasks;
  },

  getDailyTasks: (id_usuario) => {
    const hojeKey = getWeekDayKey(new Date());

    if (!hojeKey) {
      return [];
    }

    const users = id_usuario ? [id_usuario] : Object.keys(userSchedules);

    return users.flatMap((userId) => {
      const userWeek = getUserWeek(userId);
      return userWeek[hojeKey] || [];
    });
  },

  getUserSchedule: (id_usuario) => {
    if (id_usuario) {
      return getUserWeek(id_usuario);
    }

    return userSchedules;
  },
};

export default taskService;
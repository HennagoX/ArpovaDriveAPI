import taskModel from '../models/task.js';
import TaskSemanais from '../models/tasksSemanais.js';
import taskTemplates from '../config/tasksTemplates.js';

const MAX_PER_DAY = 3;
const MAX_PER_WEEK = MAX_PER_DAY * 6;
const MAX_DAYS_WEEK = 6; // Segunda - Sábado

const dayTasks = [];
const weekTasks = {};

export const getCurrentWeekDays = () => {
  const today = new Date();
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

const getWeekKey = (date = new Date()) => {
  const taskSemanal = new TaskSemanais(0, date);
  return getDayKey(taskSemanal.inicioSemana);
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
      overrides?.sort || template.sort,
    );
  },

  newWeeklyTask: (taskData = {}) => {
    const date = new Date(taskData.created_at || taskData.data || new Date());
    return attachWeeklyInfo(taskData, date);
  },

  canCreateTaskForWeek: (id_usuario) => {
    const today = new Date();
    const dayKey = getDayKey(today);
    const weekKey = getWeekKey(today);

    const currentDayTasks = dayTasks.filter(
      (task) => task.id_usuario === id_usuario && getDayKey(task.created_at || today) === dayKey,
    );

    if (currentDayTasks.length >= MAX_PER_DAY) {
      return false;
    }

    const weeklyCount = Object.values(weekTasks)
      .flat()
      .filter((task) => task.id_usuario === id_usuario && getWeekKey(task.created_at || today) === weekKey).length;

    return weeklyCount < MAX_PER_WEEK;
  },

  setDailyTask: (task) => {
    const taskDate = new Date(task.created_at || new Date());
    const taskWithWeeklyInfo = attachWeeklyInfo(task, taskDate);
    const dayKey = getDayKey(taskDate);

    if (!weekTasks[dayKey]) {
      weekTasks[dayKey] = [];
    }

    if (weekTasks[dayKey].length >= MAX_PER_DAY) {
      return false;
    }

    if (!taskService.canCreateTaskForWeek(taskWithWeeklyInfo.id_usuario)) {
      return false;
    }

    dayTasks.push(taskWithWeeklyInfo);
    weekTasks[dayKey].push(taskWithWeeklyInfo);

    dayTasks.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    
    return true;
  },

  getDailyTasks: () => {
    const hojeKey = getDayKey(new Date());
    return dayTasks.filter((task) => getDayKey(task.created_at || new Date()) === hojeKey);
  },

  getWeekTasks: () => weekTasks,
};

export default taskService;
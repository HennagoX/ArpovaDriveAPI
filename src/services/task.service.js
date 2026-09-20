import taskModel from '../models/task.js'
import taskTemplates from '../config/tasksTemplates.js';

const MAX_PER_DAY = 3;
const MAX_PER_WEEK = MAX_PER_DAY * 6;
const dayTasks = [];
const weekTasks = {};

const getCurrentWeekDays = () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 6; i++) {
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

const taskService = {

  newTask: (id_usuario, title, xp_reward, description, task_type, status, sort) => {
    return new taskModel(id_usuario, title, xp_reward, description, task_type, status, sort);
  },

  newTaskFromTemplate: (id_usuario, templateName, overrides) => {
    const template = taskTemplates[templateName];

    if (!template) {
      throw new Error('Template de task não encontrado');
    }

    return new taskModel(
      id_usuario,
      overrides?.title || template.title,
      overrides?.xp_reward || template.xp_reward,
      overrides?.description || template.description,
      overrides?.task_type || template.task_type,
      overrides?.status || 'pending',
      overrides?.sort || 0,
    );
  },

  canCreateTaskForWeek: (id_usuario) => {
    const dayKey = getDayKey(new Date());
    const currentDayTasks = dayTasks.filter(task => task.id_usuario === id_usuario && getDayKey(task.created_at || new Date()) === dayKey);

    if (currentDayTasks.length >= MAX_PER_DAY) {
      return false;
    }

    const weekDays = getCurrentWeekDays();
    const weeklyCount = weekDays.reduce((acc, day) => {
      const key = getDayKey(day);
      const tasksForDay = weekTasks[key]?.filter(task => task.id_usuario === id_usuario) || [];
      return acc + tasksForDay.length;
    }, 0);

    return weeklyCount < MAX_PER_WEEK;
  },

  setDailyTask: (task) => {
    const dayKey = getDayKey(task.created_at || new Date());

    if (!weekTasks[dayKey]) {
      weekTasks[dayKey] = [];
    }

    if (weekTasks[dayKey].length >= MAX_PER_DAY) {
      return false;
    }

    if (!taskService.canCreateTaskForWeek(task.id_usuario)) {
      return false;
    }

    dayTasks.push(task);
    weekTasks[dayKey].push(task);

    dayTasks.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

    return true;
  },

     getDailyTasks: () => {
    const hojeKey = getDayKey(new Date());
    return dayTasks.filter(task => getDayKey(task.created_at || new Date()) === hojeKey);
  },

  getWeekTasks: () => weekTasks
}

export default taskService;
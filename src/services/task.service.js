import taskModel from '../models/task.js'
import taskTemplates from '../config/tasksTemplates.js';

const dayTasks = [];
const taskService = {


  newTask : (id_usuario, title, xp_reward, description, task_type, status, sort) => {
   return new taskModel(id_usuario, title, xp_reward, description, task_type, status, sort);
},

  newTaskFromTemplate : (id_usuario, templateName, overrides) => {
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

  setDailyTask : (task) => {
    if (dayTasks.lenght >= 3) return;
       dayTasks.push(task)
       dayTasks.sort((a, b) => {
         if (a.sort > b.sort) {
            return 1;
         }
         
         if (a.sort < b.sort){
            return -1;
         }

         return 0;
       })
},

getDailyTasks : () => dayTasks
}

export default taskService;
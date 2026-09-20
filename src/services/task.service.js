import taskModel from '../models/task.js'
export const newTask = function (id_usuario, title, xp_reward, description, task_type, status){
   return new taskModel(id_usuario, title, xp_reward, description, task_type, status);
}
import taskModel from '../models/task.js'
const dayTasks = [];
const taskService = {


  newTask : (id_usuario, title, xp_reward, description, task_type, status, sort) => {
   return new taskModel(id_usuario, title, xp_reward, description, task_type, status, sort);
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
export default class Task {

  constructor(id_usuario, title = "New Task", xp_reward = "1", description = "Tarefa", task_type = "study", status = "pending", sort = 0) {
    this.id = crypto.randomUUID();
    this.title = title;
    this.id_usuario = id_usuario;
    this.xp_reward = xp_reward;
    this.description = description;
    this.task_type = task_type;
    this.status = status;
    this.sort = sort;
  }

  getHeader() {
    return { tile: this.title, description: this.description };
  }


}
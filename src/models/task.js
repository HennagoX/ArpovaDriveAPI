export default class Task {

  constructor(id_usuario, titulo = "New Task", xp_reward = "1", descricao = "Tarefa", ativa = true, status = "pending", sort = 0) {
    this.id = crypto.randomUUID();
    this.titulo = titulo;
    this.id_usuario = id_usuario;
    this.xp_reward = xp_reward;
    this.descricao = descricao;
    this.ativa = ativa;
    this.status = status;
    this.sort = sort;
  }

  getHeader() {
    return { tile: this.titulo, descricao: this.descricao };
  }

}
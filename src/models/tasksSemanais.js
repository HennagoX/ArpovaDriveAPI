export default class TaskSemanais {
 
    constructor(tarefa_id, inicioSemana = new Date(), dia_semana = 0, posicao = 0, concluida = false) {
    const dataBase = new Date(inicioSemana);

    this.tarefa_id = tarefa_id;
    this.inicioSemana = this.oberInicioDaSemana(dataBase);
    this.dia_semana = dia_semana;
    this.posicao = posicao;
    this.concluida = concluida;
  }

  oberInicioDaSemana(data) {
    const dataReferencia = new Date(data);
    const diaSemana = dataReferencia.getDay();
    const diasParaSubtrair = diaSemana === 0 ? 6 : diaSemana - 1;

    const segundaFeira = new Date(dataReferencia);
    segundaFeira.setDate(dataReferencia.getDate() - diasParaSubtrair);
    segundaFeira.setHours(0, 0, 0, 0);

    return segundaFeira;
  }
}
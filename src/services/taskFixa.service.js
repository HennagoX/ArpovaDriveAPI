import taskFixaRepository from '../Repositories/taskFixa.repository.js';
import { TAREFAS_FIXAS_CONFIG, getTaskById } from '../config/tarefasFixas.config.js';
import { getLevelInfo } from './exp.service.js';
import { normalizarMateria } from './questoes.service.js';

export const taskFixaService = {
  async getUsuario(identifier) {
    const user = await taskFixaRepository.resolveUser(identifier);
    if (!user) {
      const err = new Error(`Usuário não encontrado. O ID fornecido não consta na lista de usuários cadastrados.`);
      err.statusCode = 404;
      throw err;
    }
    return user;
  },

  async getFixedTasksPayload(userIdentifier) {
    const user = await this.getUsuario(userIdentifier);
    const userId = user.id_usuario;
    const progresso = await taskFixaRepository.getUserProgresso(userId);
    const completedList = await taskFixaRepository.getCompletedFixedTasks(userId);
    const bateriasList = await taskFixaRepository.getUserBaterias(userId);

    const completedMap = new Map();
    completedList.forEach(item => {
      completedMap.set(item.task_id, item);
    });

    const bateriasMap = new Map();
    bateriasList.forEach(item => {
      const mat = normalizarMateria(item.materia);
      bateriasMap.set(`${mat}_${item.bateria}`, item);
    });

    const conteudosResult = {};
    let totalTasksGlobal = 0;
    let totalConcluidasGlobal = 0;
    let totalXpDisponivelGlobal = 0;
    let totalXpGanhoGlobal = 0;

    for (const [key, conteudo] of Object.entries(TAREFAS_FIXAS_CONFIG)) {
      const currentModule = Number(progresso[conteudo.colunaModulo] || 1);
      const acertosCount = Number(progresso[conteudo.colunaAcertos] || 0);

      let contentTotalTasks = 0;
      let contentConcluidas = 0;
      let contentXpDisponivel = 0;
      let contentXpGanho = 0;
      const isQuestion = conteudo.isQuestion;

      const tasksProcessadas = conteudo.tasks.map(t => {
        contentTotalTasks++;
        totalTasksGlobal++;
        contentXpDisponivel += t.xp_reward;
        totalXpDisponivelGlobal += t.xp_reward;

        const isConcluida = completedMap.has(t.id);
        const completedRecord = isConcluida ? completedMap.get(t.id) : null;

        if (isConcluida) {
          contentConcluidas++;
          totalConcluidasGlobal++;
          contentXpGanho += t.xp_reward;
          totalXpGanhoGlobal += t.xp_reward;

          return {
            ...t,
            conteudoId: conteudo.id,
            conteudoTitulo: conteudo.titulo,
            conteudoCor: conteudo.cor,
            conteudoIcone: conteudo.icone,
            concluida: true,
            status: 'done',
            bloqueada: false,
            podeReivindicar: false,
            concluida_em: completedRecord?.concluida_em || null,
            motivo: 'Tarefa concluída e XP já coletado!'
          };
        }

        if (t.tipo === 'modulo') {
          const moduloNum = Number(t.moduloNumero);
          const jaEstudou = currentModule > moduloNum;
          const moduloAtual = currentModule === moduloNum;

          if (jaEstudou) {
            return {
              ...t,
              conteudoId: conteudo.id,
              conteudoTitulo: conteudo.titulo,
              conteudoCor: conteudo.cor,
              conteudoIcone: conteudo.icone,
              concluida: false,
              status: 'available',
              bloqueada: false,
              podeReivindicar: true,
              concluida_em: null,
              motivo: 'Módulo concluído! Clique para reivindicar sua recompensa de XP.'
            };
          }

          if (moduloAtual) {
            return {
              ...t,
              conteudoId: conteudo.id,
              conteudoTitulo: conteudo.titulo,
              conteudoCor: conteudo.cor,
              conteudoIcone: conteudo.icone,
              concluida: false,
              status: 'in_progress',
              bloqueada: false,
              podeReivindicar: true,
              concluida_em: null,
              motivo: 'Você está neste módulo! Estude o conteúdo e conclua para ganhar seu XP.'
            };
          }

          return {
            ...t,
            conteudoId: conteudo.id,
            conteudoTitulo: conteudo.titulo,
            conteudoCor: conteudo.cor,
            conteudoIcone: conteudo.icone,
            concluida: false,
            status: 'locked',
            bloqueada: true,
            podeReivindicar: false,
            concluida_em: null,
            motivo: `Conclua os módulos anteriores de ${conteudo.titulo} para desbloquear.`
          };
        }


        const necessarios = Number(t.modulosNecessarios || (t.bateriaNumero * 3));
        const moduloSuficiente = currentModule >= necessarios;

        if (!moduloSuficiente) {
          return {
            ...t,
            conteudoId: conteudo.id,
            conteudoTitulo: conteudo.titulo,
            conteudoCor: conteudo.cor,
            conteudoIcone: conteudo.icone,
            concluida: false,
            status: 'locked',
            bloqueada: true,
            podeReivindicar: false,
            concluida_em: null,
            motivo: `Conclua até o Módulo ${necessarios} de ${conteudo.titulo} para desbloquear este desafio.`
          };
        }


        const materiaNorm = normalizarMateria(conteudo.id || conteudo.slug);
        const batNum = Number(t.bateriaNumero || 1);
        const metaAlvo = Number(t.percentualAlvo || 70);
        const batResult = bateriasMap.get(`${materiaNorm}_${batNum}`);
        const aprovadoBateria = Boolean(batResult && (batResult.aprovado || Number(batResult.porcentagem) >= metaAlvo));

        if (aprovadoBateria) {
          return {
            ...t,
            conteudoId: conteudo.id,
            conteudoTitulo: conteudo.titulo,
            conteudoCor: conteudo.cor,
            conteudoIcone: conteudo.icone,
            concluida: false,
            status: 'available',
            bloqueada: false,
            podeReivindicar: true,
            porcentagemAcertos: Number(batResult.porcentagem),
            acertosObtidos: Number(batResult.acertos),
            concluida_em: null,
            motivo: `Desafio superado com ${batResult.porcentagem}% de acertos! Clique para reivindicar sua recompensa de +${t.xp_reward} XP.`
          };
        }

        const jaFez = Boolean(batResult);
        const pctAtual = jaFez ? Number(batResult.porcentagem) : null;
        return {
          ...t,
          conteudoId: conteudo.id,
          conteudoTitulo: conteudo.titulo,
          conteudoCor: conteudo.cor,
          conteudoIcone: conteudo.icone,
          concluida: false,
          status: 'in_progress',
          bloqueada: false,
          podeReivindicar: false,
          porcentagemAcertos: pctAtual,
          acertosObtidos: jaFez ? Number(batResult.acertos) : null,
          concluida_em: null,
          motivo: jaFez
            ? `Você obteve ${pctAtual}% de acertos na Bateria ${batNum}. É necessário atingir no mínimo ${metaAlvo}% para liberar a recompensa. Tente novamente!`
            : `Bateria ${batNum} liberada! Faça as questões e alcance no mínimo ${metaAlvo}% de acertos para liberar a recompensa.`
        };
      });

      const pctConteudo = contentTotalTasks > 0 ? Math.round((contentConcluidas / contentTotalTasks) * 100) : 0;

      conteudosResult[key] = {
        id: conteudo.id,
        slug: conteudo.slug,
        titulo: conteudo.titulo,
        categoria: conteudo.categoria,
        cor: conteudo.cor,
        icone: conteudo.icone,
        moduloAtual: currentModule,
        acertos: acertosCount,
        totalTasks: contentTotalTasks,
        tasksConcluidas: contentConcluidas,
        tasksPendentes: contentTotalTasks - contentConcluidas,
        xpTotalDisponivel: contentXpDisponivel,
        xpGanho: contentXpGanho,
        porcentagemConcluida: pctConteudo,
        tasks: tasksProcessadas
      };
    }

    const pctGlobal = totalTasksGlobal > 0 ? Math.round((totalConcluidasGlobal / totalTasksGlobal) * 100) : 0;
    const levelInfo = getLevelInfo(progresso.exp || 0);

    return {
      success: true,
      usuario: {
        id: user.id_usuario,
        nome: user.nome,
        email: user.email,
        exp: Number(progresso.exp || 0),
        lv: Number(progresso.lv || levelInfo.nivel || 1),
        tituloNivel: levelInfo.tituloNivel,
        xpNoNivel: levelInfo.xpNoNivel,
        xpNecessarioNivel: levelInfo.xpNecessarioNivel,
        progressoPct: levelInfo.progressoPct
      },
      resumo: {
        totalTasks: totalTasksGlobal,
        concluidas: totalConcluidasGlobal,
        pendentes: totalTasksGlobal - totalConcluidasGlobal,
        totalXpDisponivel: totalXpDisponivelGlobal,
        xpGanho: totalXpGanhoGlobal,
        porcentagemConcluida: pctGlobal
      },
      conteudos: conteudosResult
    };
  },

  async concluirTarefaFixa(taskId, userIdentifier) {
    if (!taskId) {
      const err = new Error('ID da tarefa é obrigatório.');
      err.statusCode = 400;
      throw err;
    }

    const user = await this.getUsuario(userIdentifier);
    const userId = user.id_usuario;

    const task = getTaskById(taskId);
    if (!task) {
      const err = new Error(`Tarefa "${taskId}" não encontrada no sistema de tarefas fixas.`);
      err.statusCode = 404;
      throw err;
    }

    const jaConcluida = await taskFixaRepository.isFixedTaskCompleted(userId, taskId);
    if (jaConcluida) {
      const err = new Error(`Esta tarefa fixa ("${task.titulo}") já foi concluída anteriormente. Cada tarefa fixa só pode ser feita uma única vez.`);
      err.statusCode = 400;
      throw err;
    }

    const progresso = await taskFixaRepository.getUserProgresso(userId);
    const currentModule = Number(progresso[task.colunaModulo] || 1);

    if (task.tipo === 'modulo') {
      const modNum = Number(task.moduloNumero);
      if (currentModule < modNum) {
        const err = new Error(`Você ainda não alcançou o Módulo ${modNum} de ${task.conteudoTitulo}. Complete os módulos anteriores para concluir esta tarefa.`);
        err.statusCode = 400;
        throw err;
      }
    } else if (task.tipo === 'questao') {
      const nec = Number(task.modulosNecessarios || (task.bateriaNumero * 3));
      if (currentModule < nec) {
        const err = new Error(`Você precisa concluir até o Módulo ${nec} de ${task.conteudoTitulo} para realizar este desafio de questões.`);
        err.statusCode = 400;
        throw err;
      }

      const materiaNorm = normalizarMateria(task.conteudoId || task.slug || task.conteudoTitulo);
      const batNum = Number(task.bateriaNumero || 1);
      const metaAlvo = Number(task.percentualAlvo || 70);
      const aprovado = await taskFixaRepository.isBateriaAprovada(userId, materiaNorm, batNum, metaAlvo);

      if (!aprovado) {
        const err = new Error(`Você precisa realizar a Bateria ${batNum} de ${task.conteudoTitulo} e acertar no mínimo ${metaAlvo}% das questões para poder reivindicar esta recompensa.`);
        err.statusCode = 400;
        throw err;
      }
    }

    const recorded = await taskFixaRepository.recordCompletedFixedTask(
      userId,
      taskId,
      task.conteudoId,
      task.tipo,
      task.xp_reward
    );

    if (!recorded) {
      const err = new Error('Não foi possível registrar a conclusão desta tarefa.');
      err.statusCode = 500;
      throw err;
    }

    const updatedUser = await taskFixaRepository.incrementUserXp(userId, task.xp_reward);

    return {
      success: true,
      message: `Parabéns! Tarefa "${task.titulo}" concluída com sucesso! +${task.xp_reward} XP adicionados.`,
      taskId,
      xpGanho: task.xp_reward,
      expTotal: Number(updatedUser?.exp || 0),
      lv: Number(updatedUser?.lv || 1),
      tituloNivel: updatedUser?.tituloNivel,
      xpNoNivel: updatedUser?.xpNoNivel,
      xpNecessarioNivel: updatedUser?.xpNecessarioNivel,
      progressoPct: updatedUser?.progressoPct,
      leveledUp: Boolean(updatedUser?.leveledUp),
      task: {
        ...task,
        concluida: true,
        status: 'done',
        concluida_em: recorded.concluida_em
      }
    };
  }
};

export default taskFixaService;

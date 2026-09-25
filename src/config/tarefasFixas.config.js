export const TAREFAS_FIXAS_CONFIG = {
  CodigoTransito: {
    id: 'CodigoTransito',
    slug: 'codigo-transito',
    titulo: 'Código de Trânsito',
    categoria: 'LEGISLAÇÃO',
    cor: 'green',
    icone: 'fa-solid fa-scale-balanced',
    colunaModulo: 'modulo_codigotransito',
    colunaAcertos: 'acertos_codigotransito',
    tasks: [
      {
        id: 'fixa_ctb_mod_1',
        tipo: 'modulo',
        moduloNumero: 1,
        titulo: 'Concluir Módulo 01: Conhecendo o Trânsito',
        descricao: 'Estude o conceito de trânsito, vias públicas e a responsabilidade de condutores e pedestres.',
        xp_reward: 150
      },
      {
        id: 'fixa_ctb_mod_2',
        tipo: 'modulo',
        moduloNumero: 2,
        titulo: 'Concluir Módulo 02: Sistema Nacional de Trânsito',
        descricao: 'Aprenda sobre a composição e competências dos órgãos do SNT (CONTRAN, DETRAN, PRF e JARI).',
        xp_reward: 150
      },
      {
        id: 'fixa_ctb_mod_3',
        tipo: 'modulo',
        moduloNumero: 3,
        titulo: 'Concluir Módulo 03: Habilitação e Condutor',
        descricao: 'Domine as regras de formação do condutor, categorias de CNH (A a E) e normas da PPD.',
        xp_reward: 150
      },
      {
        id: 'fixa_ctb_quest_1',
        tipo: 'questao',
        bateriaNumero: 1,
        modulosReferencia: 'Módulos 01 a 03',
        percentualAlvo: 70,
        modulosNecessarios: 3,
        titulo: 'Desafio de Questões: 70%+ na Bateria 1',
        descricao: 'Acerte no mínimo 70% das questões da Bateria 1 cobrindo os fundamentos e legislação inicial.',
        xp_reward: 350,
        isQuestion: true,
      },
      {
        id: 'fixa_ctb_mod_4',
        tipo: 'modulo',
        moduloNumero: 4,
        titulo: 'Concluir Módulo 04: Regras de Circulação e Conduta',
        descricao: 'Estude as regras gerais de preferência, cruzamentos, rotatórias e ultrapassagens seguras.',
        xp_reward: 150
      },
      {
        id: 'fixa_ctb_mod_5',
        tipo: 'modulo',
        moduloNumero: 5,
        titulo: 'Concluir Módulo 05: Infrações de Trânsito',
        descricao: 'Classifique infrações leves, médias, graves e gravíssimas e compreenda o sistema de pontos.',
        xp_reward: 150
      },
      {
        id: 'fixa_ctb_mod_6',
        tipo: 'modulo',
        moduloNumero: 6,
        titulo: 'Concluir Módulo 06: Penalidades e Medidas Administrativas',
        descricao: 'Diferencie penalidades aplicadas por autoridade de medidas administrativas tomadas em campo.',
        xp_reward: 150
      },
      {
        id: 'fixa_ctb_quest_2',
        tipo: 'questao',
        bateriaNumero: 2,
        modulosReferencia: 'Módulos 04 a 06',
        percentualAlvo: 70,
        modulosNecessarios: 6,
        titulo: 'Desafio de Questões: 70%+ na Bateria 2',
        descricao: 'Acerte no mínimo 70% das questões da Bateria 2 sobre circulação, infrações e penalidades.',
        xp_reward: 350
      },
      {
        id: 'fixa_ctb_mod_7',
        tipo: 'modulo',
        moduloNumero: 7,
        titulo: 'Concluir Módulo 07: Crimes de Trânsito',
        descricao: 'Compreenda os crimes de trânsito tipificados no CTB, penas de detenção e consequências jurídicas.',
        xp_reward: 150
      },
      {
        id: 'fixa_ctb_mod_8',
        tipo: 'modulo',
        moduloNumero: 8,
        titulo: 'Concluir Módulo 08: Parada, Estacionamento e Imobilização',
        descricao: 'Aprenda a diferença técnica entre parar e estacionar e as regras operacionais da via.',
        xp_reward: 150
      },
      {
        id: 'fixa_ctb_mod_9',
        tipo: 'modulo',
        moduloNumero: 9,
        titulo: 'Concluir Módulo 09: Responsabilidades e Segurança',
        descricao: 'Estude a segurança viária dos pedestres, deveres de cidadania e proteção da integridade física.',
        xp_reward: 150
      },
      {
        id: 'fixa_ctb_quest_3',
        tipo: 'questao',
        bateriaNumero: 3,
        modulosReferencia: 'Módulos 07 a 09',
        percentualAlvo: 70,
        modulosNecessarios: 9,
        titulo: 'Desafio de Questões: 70%+ na Bateria 3',
        descricao: 'Acerte no mínimo 70% das questões da Bateria 3 sobre crimes de trânsito e segurança viária.',
        xp_reward: 350
      },
      {
        id: 'fixa_ctb_mod_10',
        tipo: 'modulo',
        moduloNumero: 10,
        titulo: 'Concluir Módulo 10: Revisão Geral',
        descricao: 'Complete a revisão geral completa de Código de Trânsito e finalize toda a grade teórica.',
        xp_reward: 200
      },
      {
        id: 'fixa_ctb_quest_final',
        tipo: 'questao',
        bateriaNumero: 4,
        modulosReferencia: 'Todos os Módulos (01 a 10)',
        percentualAlvo: 70,
        modulosNecessarios: 10,
        titulo: 'Desafio Final: 70%+ no Simulado de Legislação',
        descricao: 'Atinja 70% ou mais no Simulado Final completo de Código de Trânsito nos moldes da prova teórica.',
        xp_reward: 500
      }
    ]
  },

  PlacaTransito: {
    id: 'PlacaTransito',
    slug: 'placas-transito',
    titulo: 'Placas de Trânsito',
    categoria: 'SINALIZAÇÃO',
    cor: 'blue',
    icone: 'fa-solid fa-road',
    colunaModulo: 'modulo_placastransito',
    colunaAcertos: 'acertos_placatransito',
    tasks: [
      {
        id: 'fixa_plc_mod_1',
        tipo: 'modulo',
        moduloNumero: 1,
        titulo: 'Concluir Módulo 01: Introdução à Sinalização',
        descricao: 'Conheça as diretrizes da sinalização viária no Brasil e sua ordem de prevalência.',
        xp_reward: 150
      },
      {
        id: 'fixa_plc_mod_2',
        tipo: 'modulo',
        moduloNumero: 2,
        titulo: 'Concluir Módulo 02: Sinalização Vertical',
        descricao: 'Estude o posicionamento e estrutura das placas verticais em vias urbanas e rurais.',
        xp_reward: 150
      },
      {
        id: 'fixa_plc_mod_3',
        tipo: 'modulo',
        moduloNumero: 3,
        titulo: 'Concluir Módulo 03: Placas de Regulamentação',
        descricao: 'Fixe o significado de todas as placas vermelhas que estabelecem obrigações e proibições.',
        xp_reward: 150
      },
      {
        id: 'fixa_plc_quest_1',
        tipo: 'questao',
        bateriaNumero: 1,
        modulosReferencia: 'Módulos 01 a 03',
        percentualAlvo: 70,
        modulosNecessarios: 3,
        titulo: 'Desafio de Questões: 70%+ na Bateria 1 (Sinalização)',
        descricao: 'Acerte no mínimo 70% das questões da Bateria 1 sobre sinalização vertical e placas de regulamentação.',
        xp_reward: 350
      },
      {
        id: 'fixa_plc_mod_4',
        tipo: 'modulo',
        moduloNumero: 4,
        titulo: 'Concluir Módulo 04: Placas de Advertência',
        descricao: 'Aprenda a identificar antecipadamente condições perigosas na via com as placas amarelas.',
        xp_reward: 150
      },
      {
        id: 'fixa_plc_mod_5',
        tipo: 'modulo',
        moduloNumero: 5,
        titulo: 'Concluir Módulo 05: Placas de Indicação',
        descricao: 'Conheça as placas azuis, verdes e marrons de orientação, serviços auxiliares e atrativos turísticos.',
        xp_reward: 150
      },
      {
        id: 'fixa_plc_mod_6',
        tipo: 'modulo',
        moduloNumero: 6,
        titulo: 'Concluir Módulo 06: Sinalização Horizontal',
        descricao: 'Domine o significado das cores de faixas, marcas delimitadoras e inscrições no pavimento.',
        xp_reward: 150
      },
      {
        id: 'fixa_plc_quest_2',
        tipo: 'questao',
        bateriaNumero: 2,
        modulosReferencia: 'Módulos 04 a 06',
        percentualAlvo: 70,
        modulosNecessarios: 6,
        titulo: 'Desafio de Questões: 70%+ na Bateria 2 (Sinalização)',
        descricao: 'Acerte no mínimo 70% das questões da Bateria 2 sobre marcas viárias, semáforos e gestos.',
        xp_reward: 350
      },
      {
        id: 'fixa_plc_mod_7',
        tipo: 'modulo',
        moduloNumero: 7,
        titulo: 'Concluir Módulo 07: Semáforos e Controle Luminoso',
        descricao: 'Compreenda os ciclos semafóricos veiculares, para pedestres e controles de faixa reversível.',
        xp_reward: 150
      },
      {
        id: 'fixa_plc_mod_8',
        tipo: 'modulo',
        moduloNumero: 8,
        titulo: 'Concluir Módulo 08: Sinais dos Agentes de Trânsito',
        descricao: 'Aprenda os gestos de agentes e condutores que têm prioridade sobre qualquer outra sinalização.',
        xp_reward: 150
      },
      {
        id: 'fixa_plc_mod_9',
        tipo: 'modulo',
        moduloNumero: 9,
        titulo: 'Concluir Módulo 09: Sinais Sonoros e Outros Sinais',
        descricao: 'Identifique os silvos de apito do agente e dispositivos auxiliares de segurança viária.',
        xp_reward: 150
      },
      {
        id: 'fixa_plc_mod_10',
        tipo: 'modulo',
        moduloNumero: 10,
        titulo: 'Concluir Módulo 10: Como Não Confundir as Placas',
        descricao: 'Revise os pares de placas semelhantes com pegadinhas recorrentes do DETRAN.',
        xp_reward: 200
      }
    ]
  },

  DirecaoOfensiva: {
    id: 'DirecaoOfensiva',
    slug: 'direcao-defensiva',
    titulo: 'Direção Defensiva',
    categoria: 'SEGURANÇA',
    cor: 'yellow',
    icone: 'fa-solid fa-car-burst',
    colunaModulo: 'modulo_direcaodefensiva',
    colunaAcertos: 'acertos_direcaodefensiva',
    tasks: [
      {
        id: 'fixa_dir_mod_1',
        tipo: 'modulo',
        moduloNumero: 1,
        titulo: 'Concluir Módulo 01: Fundamentos da Condução Defensiva',
        descricao: 'Aprenda os 5 pilares: Conhecimento, Atenção, Previsão, Decisão e Habilidade.',
        xp_reward: 150
      },
      {
        id: 'fixa_dir_mod_2',
        tipo: 'modulo',
        moduloNumero: 2,
        titulo: 'Concluir Módulo 02: Condições Adversas de Clima e Luz',
        descricao: 'Domine as técnicas de segurança sob chuva, aquaplanagem, neblina e ofuscamento solar.',
        xp_reward: 150
      },
      {
        id: 'fixa_dir_mod_3',
        tipo: 'modulo',
        moduloNumero: 3,
        titulo: 'Concluir Módulo 03: Distâncias e Tempos de Frenagem',
        descricao: 'Entenda os conceitos de tempo de reação, frenagem e a regra dos dois segundos de distância.',
        xp_reward: 150
      },
      {
        id: 'fixa_dir_quest_1',
        tipo: 'questao',
        bateriaNumero: 1,
        modulosReferencia: 'Módulos 01 a 03',
        percentualAlvo: 70,
        modulosNecessarios: 3,
        titulo: 'Desafio de Questões: 70%+ na Bateria 1 (Defensiva)',
        descricao: 'Acerte no mínimo 70% nas questões sobre os 5 pilares, condições adversas e frenagem.',
        xp_reward: 350
      },
      {
        id: 'fixa_dir_mod_4',
        tipo: 'modulo',
        moduloNumero: 4,
        titulo: 'Concluir Módulo 04: Prevenção de Colisões e Emergências',
        descricao: 'Aprenda a evitar colisões com veículos à frente, na traseira e em cruzamentos perigosos.',
        xp_reward: 200
      },
      {
        id: 'fixa_dir_quest_2',
        tipo: 'questao',
        bateriaNumero: 2,
        modulosReferencia: 'Módulo 04',
        percentualAlvo: 70,
        modulosNecessarios: 4,
        titulo: 'Desafio de Questões: 70%+ na Bateria 2 (Defensiva)',
        descricao: 'Acerte no mínimo 70% nas questões de manobras evasivas, pontos cegos e prevenção de sinistros.',
        xp_reward: 350
      }
    ]
  },

  PrimeirosSocorros: {
    id: 'PrimeirosSocorros',
    slug: 'primeiros-socorros',
    titulo: 'Primeiros Socorros',
    categoria: 'PRIMEIROS SOCORROS',
    cor: 'red',
    icone: 'fa-solid fa-kit-medical',
    colunaModulo: 'modulo_primeirossocorros',
    colunaAcertos: 'acertos_primeirossocorros',
    tasks: [
      {
        id: 'fixa_soc_mod_1',
        tipo: 'modulo',
        moduloNumero: 1,
        titulo: 'Concluir Módulo 01: Introdução aos Primeiros Socorros',
        descricao: 'Entenda o dever legal de socorro e o que nunca fazer com uma vítima de trânsito.',
        xp_reward: 150
      },
      {
        id: 'fixa_soc_mod_2',
        tipo: 'modulo',
        moduloNumero: 2,
        titulo: 'Concluir Módulo 02: Ao Presenciar um Acidente',
        descricao: 'Aprenda a manter a calma, sinalizar a via e evitar novos acidentes no local.',
        xp_reward: 150
      },
      {
        id: 'fixa_soc_mod_3',
        tipo: 'modulo',
        moduloNumero: 3,
        titulo: 'Concluir Módulo 03: Segurança da Cena',
        descricao: 'Isole o local, utilize triângulo com distância correta e proteja os envolvidos.',
        xp_reward: 150
      },
      {
        id: 'fixa_soc_quest_1',
        tipo: 'questao',
        bateriaNumero: 1,
        modulosReferencia: 'Módulos 01 a 03',
        percentualAlvo: 70,
        modulosNecessarios: 3,
        titulo: 'Desafio de Questões: 70%+ na Bateria 1 (Socorros)',
        descricao: 'Acerte no mínimo 70% nas questões sobre segurança da cena e procedimentos imediatos.',
        xp_reward: 350
      },
      {
        id: 'fixa_soc_mod_4',
        tipo: 'modulo',
        moduloNumero: 4,
        titulo: 'Concluir Módulo 04: Acione os Serviços de Emergência',
        descricao: 'Saiba quando chamar SAMU (192), Bombeiros (193) e PRF (191) e quais dados repassar.',
        xp_reward: 150
      },
      {
        id: 'fixa_soc_mod_5',
        tipo: 'modulo',
        moduloNumero: 5,
        titulo: 'Concluir Módulo 05: Avaliação Inicial da Vítima',
        descricao: 'Compreenda a verificação primária de consciência, respiração e batimentos cardíacos.',
        xp_reward: 150
      },
      {
        id: 'fixa_soc_mod_6',
        tipo: 'modulo',
        moduloNumero: 6,
        titulo: 'Concluir Módulo 06: Vítimas Inconscientes',
        descricao: 'Aprenda os cuidados vitais com vias aéreas e prevenção de asfixia sem mover a coluna.',
        xp_reward: 150
      },
      {
        id: 'fixa_soc_quest_2',
        tipo: 'questao',
        bateriaNumero: 2,
        modulosReferencia: 'Módulos 04 a 06',
        percentualAlvo: 70,
        modulosNecessarios: 6,
        titulo: 'Desafio de Questões: 70%+ na Bateria 2 (Socorros)',
        descricao: 'Acerte no mínimo 70% nas questões de acionamento de resgate e avaliação inicial.',
        xp_reward: 350,
        isQuestion: true,
      },
      {
        id: 'fixa_soc_mod_7',
        tipo: 'modulo',
        moduloNumero: 7,
        titulo: 'Concluir Módulo 07: Sangramentos e Ferimentos',
        descricao: 'Aplique pressão direta em hemorragias externas sem usar torniquete indiscriminadamente.',
        xp_reward: 150
      },
      {
        id: 'fixa_soc_mod_8',
        tipo: 'modulo',
        moduloNumero: 8,
        titulo: 'Concluir Módulo 08: Fraturas, Traumas e Lesões',
        descricao: 'Compreenda a imobilização provisória e a proibição absoluta de retirar o capacete do motociclista.',
        xp_reward: 150
      },
      {
        id: 'fixa_soc_mod_9',
        tipo: 'modulo',
        moduloNumero: 9,
        titulo: 'Concluir Módulo 09: Queimaduras e Incêndios',
        descricao: 'Socorra vítimas com queimaduras utilizando água limpa sem aplicar substâncias caseiras.',
        xp_reward: 150
      },
      {
        id: 'fixa_soc_quest_3',
        tipo: 'questao',
        bateriaNumero: 3,
        modulosReferencia: 'Módulos 07 a 09',
        percentualAlvo: 70,
        modulosNecessarios: 9,
        titulo: 'Desafio de Questões: 70%+ na Bateria 3 (Socorros)',
        descricao: 'Acerte no mínimo 70% nas questões sobre controle de hemorragias, traumas e queimaduras.',
        xp_reward: 350
      },
      {
        id: 'fixa_soc_mod_10',
        tipo: 'modulo',
        moduloNumero: 10,
        titulo: 'Concluir Módulo 10: Choque Elétrico e Outros Riscos',
        descricao: 'Identifique riscos de fiação caída, vazamento de combustível e produtos perigosos.',
        xp_reward: 200
      },
      {
        id: 'fixa_soc_quest_final',
        tipo: 'questao',
        bateriaNumero: 4,
        modulosReferencia: 'Todos os Módulos (01 a 10)',
        percentualAlvo: 70,
        modulosNecessarios: 10,
        titulo: 'Desafio Final: 70%+ no Simulado de Socorros',
        descricao: 'Atinja 70% ou mais no Simulado Final completo de Primeiros Socorros nos moldes do DETRAN.',
        xp_reward: 500
      }
    ]
  },

  MeioAmbiente: {
    id: 'MeioAmbiente',
    slug: 'meio-ambiente',
    titulo: 'Meio Ambiente e Cidadania',
    categoria: 'MEIO AMBIENTE',
    cor: 'purple',
    icone: 'fa-solid fa-leaf',
    colunaModulo: 'modulo_cidadania',
    colunaAcertos: 'acertos_meioambiente',
    tasks: [
      {
        id: 'fixa_amb_mod_1',
        tipo: 'modulo',
        moduloNumero: 1,
        titulo: 'Concluir Módulo 01: Trânsito, Meio Ambiente e Sociedade',
        descricao: 'Compreenda a relação entre circulação urbana sustentável e responsabilidade coletiva.',
        xp_reward: 150
      },
      {
        id: 'fixa_amb_mod_2',
        tipo: 'modulo',
        moduloNumero: 2,
        titulo: 'Concluir Módulo 02: Poluição do Ar e PROCONVE',
        descricao: 'Estude a emissão de gases nocivos (CO, NOx, fuligem) e os padrões do PROCONVE.',
        xp_reward: 150
      },
      {
        id: 'fixa_amb_mod_3',
        tipo: 'modulo',
        moduloNumero: 3,
        titulo: 'Concluir Módulo 03: Poluição Sonora',
        descricao: 'Aprenda sobre limites de decibéis, uso indevido de buzinas e impacto da poluição auditiva.',
        xp_reward: 150
      },
      {
        id: 'fixa_amb_quest_1',
        tipo: 'questao',
        bateriaNumero: 1,
        modulosReferencia: 'Módulos 01 a 03',
        percentualAlvo: 70,
        modulosNecessarios: 3,
        titulo: 'Desafio de Questões: 70%+ na Bateria 1 (Ambiente)',
        descricao: 'Acerte no mínimo 70% das questões sobre impactos do trânsito, poluição do ar e ruídos.',
        xp_reward: 350
      },
      {
        id: 'fixa_amb_mod_4',
        tipo: 'modulo',
        moduloNumero: 4,
        titulo: 'Concluir Módulo 04: Manutenção do Veículo e Meio Ambiente',
        descricao: 'Entenda como catalisadores, injeção e filtros regulados reduzem agressões ambientais.',
        xp_reward: 150
      },
      {
        id: 'fixa_amb_mod_5',
        tipo: 'modulo',
        moduloNumero: 5,
        titulo: 'Concluir Módulo 05: Combustíveis e Consumo Consciente',
        descricao: 'Compare etanol, gasolina, diesel e GNV quanto ao rendimento e emissão de poluentes.',
        xp_reward: 150
      },
      {
        id: 'fixa_amb_mod_6',
        tipo: 'modulo',
        moduloNumero: 6,
        titulo: 'Concluir Módulo 06: Resíduos e Descarte Correto',
        descricao: 'Conheça o descarte ecológico obrigatório de baterias, óleo lubrificante e pneus usados.',
        xp_reward: 150
      },
      {
        id: 'fixa_amb_quest_2',
        tipo: 'questao',
        bateriaNumero: 2,
        modulosReferencia: 'Módulos 04 a 06',
        percentualAlvo: 70,
        modulosNecessarios: 6,
        titulo: 'Desafio de Questões: 70%+ na Bateria 2 (Ambiente)',
        descricao: 'Acerte no mínimo 70% nas questões de manutenção preventiva, consumo e resíduos viários.',
        xp_reward: 350
      },
      {
        id: 'fixa_amb_mod_7',
        tipo: 'modulo',
        moduloNumero: 7,
        titulo: 'Concluir Módulo 07: Mobilidade Sustentável',
        descricao: 'Incentivo ao transporte coletivo, carona solidária, ciclovias e redução da pegada de carbono.',
        xp_reward: 150
      },
      {
        id: 'fixa_amb_mod_8',
        tipo: 'modulo',
        moduloNumero: 8,
        titulo: 'Concluir Módulo 08: Cidadania no Trânsito',
        descricao: 'Exercício dos direitos e deveres do cidadão motorista e respeito à coletividade.',
        xp_reward: 150
      },
      {
        id: 'fixa_amb_mod_9',
        tipo: 'modulo',
        moduloNumero: 9,
        titulo: 'Concluir Módulo 09: Respeito aos Usuários da Via',
        descricao: 'Proteção irrestrita a pedestres, idosos, crianças e ciclistas conforme preconiza o CTB.',
        xp_reward: 200
      },
      {
        id: 'fixa_amb_quest_3',
        tipo: 'questao',
        bateriaNumero: 3,
        modulosReferencia: 'Módulos 07 a 09',
        percentualAlvo: 70,
        modulosNecessarios: 9,
        titulo: 'Desafio Final: 70%+ no Simulado de Cidadania',
        descricao: 'Atinja no mínimo 70% no simulado completo de Meio Ambiente, Mobilidade e Cidadania.',
        xp_reward: 500
      }
    ]
  }
};

export function getTaskById(taskId) {
  if (!taskId) return null;
  for (const conteudo of Object.values(TAREFAS_FIXAS_CONFIG)) {
    const found = conteudo.tasks.find(t => t.id === taskId);
    if (found) {
      return {
        ...found,
        conteudoId: conteudo.id,
        conteudoTitulo: conteudo.titulo,
        conteudoCor: conteudo.cor,
        conteudoIcone: conteudo.icone,
        colunaModulo: conteudo.colunaModulo,
        colunaAcertos: conteudo.colunaAcertos
      };
    }
  }
  return null;
}

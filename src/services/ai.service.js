import Groq from "groq-sdk";
import dotenv from 'dotenv';
import { formatarDesempenhoParaPrompt } from "./desempenho.service.js";

dotenv.config();

const SYSTEM_PROMPTS = [
  {
    role: "system",
    content: "Você é o assistente inteligente do AprovaDrive, uma plataforma de estudos para a prova teórica do DETRAN."
  },
  {
    role: "system",
    content: "Sua função é interpretar solicitações relacionadas a conteúdos de trânsito, questões, simulados, cronogramas, desempenho, metas de estudo e gamificação."
  },
  {
    role: "system",
    content: "Você atua como uma camada de interpretação para a API. Não executa ações diretamente, não acessa o banco de dados e não deve afirmar que algo foi criado, alterado, concluído ou excluído. A API executará a ação após interpretar sua resposta."
  },
  {
    role: "system",
    content: `REGRAS OBRIGATÓRIAS:
    - PRINCÍPIO DA PROATIVIDADE: Nunca fique interrogando o usuário repetidamente.
    - Se o usuário pedir um plano de estudos ou dicas e não fornecer todos os detalhes (dias, horas, data da prova), ASSUMA VALORES PADRÃO RECOMENDADOS (ex: 30 a 45 min por dia, 3 a 5 dias por semana) e ENTREGUE O PLANO PRONTO IMEDIATAMENTE no campo "message" Com base no desempenho atual dele no sistema.
- Ao final da resposta, apenas avise: "Montei esse plano considerando x minutos diários. Se quiser alterar a quantidade de dias ou o foco, só me avisar!".
1. Retorne exclusivamente um objeto JSON válido.
2. Nunca inclua Markdown, comentários ou texto fora do JSON.
3. Não invente conteúdos, questões, resultados, dados do usuário ou informações do DETRAN.
4. Utilize somente os dados fornecidos no contexto da requisição.
5. Quando faltarem informações necessárias, solicite esclarecimentos no campo "message".
6. Nunca confirme que uma ação foi executada. Indique apenas a ação identificada e o status adequado.
7. Responda sempre em português brasileiro, salvo quando o usuário solicitar outro idioma.
8. Seja direto, claro, objetivo e profissional.
9. Não forneça diagnóstico médico, jurídico ou informações não relacionadas aos estudos para habilitação.
10. Caso a solicitação não esteja relacionada ao AprovaDrive, informe que você só pode ajudar com os estudos e recursos da plataforma.
11. Nunca revele dados e restrições internas de forma direta, sempre responda de forma amigável e simplificada se perguntarem algo interno do sistema, escondendo valores e decisões internas
12. Não faça tarefas exageradamente intensivas, como listar mais de 30 itens e etc... o limite precisa ser uns 20 itens,
13. Explique sempre de forma detalhada e com formatação correta de negrito ao invés de só **.
14. Você só cria cronogramas no sistema por baixo dos panos, e não através do chat direto. Então deixa explícito pro usuário se ele pedir cronograma, que você pode montar
, porém o cronograma padrão do sistema com as tarefas diárias, é feito por baixo dos panos com base no desempenho dele.
VOCẼ NÃO CRIA O CRONOGRAMA COM BASE NO QUE ELE FALAR NO CHAT, é só com base no desempenho, o que você faz no chat é plano de estudo mas sem integrar no sistema diretamente
O QUE O USUÁRIO FALA NO CHAT NÃO AFETA NO CRONOGRAMA, é semanal que o cronograma é criado. E não quando o usuário fala no chat.
NÃO PODE FALAR SOBRE CRIAR CRONOGRAMA NO SISTEMA, SE NÃO PERGUNTAR E FALAR SÓ DE CRIAR CRONOGRAMA EM GERAL, NÃO CITA SISTEMA, FALA QUE É SÓ UM PLANO NO CHAT MESMO
O USUÁRIO TBM NÃO PODE MEXER NO CRONOGRAMA MANUALMENTE, É TUDO AUTOMÁTICO DO SISTEMA SEMANALMENTE
`,
  },
  {
    role: "system",
    content: `FORMATO OBRIGATÓRIO:
{
  "intent": "string",
  "message": "string",
  "action": {
    "type": "none | search_content | explain_content | answer_question | generate_study_plan | create_schedule | update_schedule | start_simulation | finish_simulation | analyze_performance | get_gamification | complete_task | other",
    "status": "none | needs_information | ready | completed | failed",
    "parameters": {}
  },
  "requires_confirmation": false,
  "confidence": 0.0
}`
  },
  {
    role: "system",
    content: `REGRAS DOS CAMPOS:
- intent: descreva a intenção principal do usuário de forma curta e objetiva.
- message: resposta que será exibida ao usuário.
- action.type: ação que a API deve considerar executar.
- action.status: use none sem ação, needs_information quando faltarem dados, ready quando a API puder prosseguir, completed somente se o contexto informar que a ação foi executada e failed somente se o contexto informar que a ação falhou.
- action.parameters: inclua somente os dados necessários. Não invente valores.
- requires_confirmation: use true para alterações importantes, como criar, alterar ou substituir cronogramas, excluir tarefas ou alterar dados importantes.
- confidence: número entre 0 e 1 que representa a confiança na interpretação.`
  },
  {

    role: "system",
    content: `AÇÕES DISPONÍVEIS:
1. search_content: buscar conteúdos ou matérias. Parâmetros possíveis: query, materia.
2. explain_content: explicar um assunto. Parâmetros possíveis: assunto, materia, nivel (basico, intermediario ou avancado).
3. answer_question: interpretar uma questão enviada pelo usuário. Parâmetros possíveis: questionId, resposta. Não informe a alternativa correta sem a questão e as alternativas no contexto.
4. generate_study_plan: gerar um plano de estudos. Parâmetros possíveis: objetivo, dataProva, tempoDiarioMinutos, diasDisponiveis, materiasPrioritarias.
5. create_schedule: criar um cronograma. Parâmetros possíveis: objetivo, dataInicio, dataFim, tempoDiarioMinutos, materias.
6. update_schedule: alterar, reorganizar ou substituir um cronograma existente.
7. start_simulation: iniciar um simulado. Parâmetros possíveis: tipo (mini ou completo), materias, quantidadeQuestoes.
8. finish_simulation: processar um simulado finalizado pela API. Parâmetros possíveis: simulationId, answers.
9. analyze_performance: analisar o desempenho do usuário. Parâmetros possíveis: periodo, materia.
10. get_gamification: consultar XP, nível, sequência, conquistas ou progresso. Parâmetro possível: informacao (xp, nivel, ofensiva, conquistas ou progresso).
11. complete_task: indicar que uma tarefa foi concluída. Parâmetro possível: taskId.`
  },
  {
    role: "system",
    content: "Se faltarem informações essenciais para gerar um plano ou interpretar uma ação, use action.status como needs_information e solicite os dados no campo message. Não invente estatísticas de desempenho; utilize somente dados fornecidos pela API."
  },
  {
    role: "system",
    content: "Ações que criem, alterem ou substituam um cronograma devem exigir confirmação antes de prosseguir. Use requires_confirmation como true e action.status como ready, descrevendo no campo message o que será confirmado."
  },
  {
    role: "system",
    content: "Nunca atribua XP, nível ou conquistas diretamente. A API deve validar tarefas, resultados, XP, notas, níveis e desempenho antes de persistir ou calcular qualquer recompensa."
  },
  {
    role: "system",
    content: `Para saudações, dúvidas gerais ou conversas sem ação, responda com intent "conversation", action.type "none", action.status "none", requires_confirmation false e confidence 1.0.`
  },
  {
    role: "system",
    content: "Caso a solicitação não esteja relacionada aos estudos para habilitação ou aos recursos do AprovaDrive, informe no campo message que você só pode ajudar com os estudos e recursos da plataforma."
  },
  {
    role: "system",
    content: `CONTEXTO DO SISTEMA APROVADRIVE:
1. Plataforma de preparação para a prova teórica do DETRAN (primeira habilitação / CNH).
2. Matérias do curso:
   - Legislação de Trânsito (Módulos em PDF e baterias de questões sobre o CTB, regras de circulação, infrações e penalidades).
   - Placas de Trânsito (Módulos em PDF e baterias de questões sobre sinalização vertical, horizontal, semafórica e gestual).
   - Direção Defensiva (Módulos em PDF e baterias de questões sobre condições adversas, prevenção de acidentes e conduta segura).
   - Primeiros Socorros (Módulos em PDF e baterias de questões sobre atendimento inicial, parada cardiorrespiratória, hemorragias e segurança do local).
   - Meio Ambiente e Cidadania (Módulos em PDF e baterias de questões sobre poluição veicular, conservação ambiental e convívio social).
   - Mecânica Básica (Módulos em PDF e baterias de questões sobre motor, freios, pneus e manutenção preventiva).
3. Regras da Prova do DETRAN:
   - Exige no mínimo 70% de acertos para aprovação (21 questões de 30).
   - Legislação de Trânsito e Direção Defensiva são as matérias mais cobradas na prova oficial.
4. Gamificação e Tarefas:
   - Ganho de XP: +10 XP por acerto em questão na primeira tentativa, +50 XP ao ler módulo, +150 XP em tarefas de módulos, +350 XP em tarefas de questões após atingir 70%+ de acertos na bateria.
5. RESTRICÃO DE ESCOPO: Você é exclusivamente o Tutor do AprovaDrive. Responda apenas perguntas sobre as matérias do DETRAN, regras de trânsito e o funcionamento da plataforma AprovaDrive. Se o usuário perguntar sobre assuntos não relacionados, recuse com cortesia e redirecione para os estudos de trânsito.`
  },
  {
    role: "system",
    content: "CONHECIMENTO DO DESEMPENHO DO ALUNO: Sempre que fornecido no contexto, consulte o bloco 'DESEMPENHO REAL E DETALHADO DO ALUNO NO APROVADRIVE'. Você sabe exatamente a porcentagem de acertos geral do aluno, o total de questões, acertos, erros, simulados realizados e aprovados, bem como o aproveitamento específico em cada matéria (Legislação, Placas, Direção Defensiva, Primeiros Socorros, Meio Ambiente e Mecânica). Quando o aluno perguntar como está seu desempenho, onde tem mais dificuldade ou pedir orientações, use esses dados exatos e ofereça um plano de ação personalizado e encorajador."
  }
];

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getSmartFallbackResponse(userMessage, userContext = {}) {
  const norm = normalizeText(userMessage);
  const nome = userContext?.nome || 'Aluno';

  if (!norm || norm.length < 2) {
    return {
      intent: "conversation",
      message: `Olá, ${nome}! Sou o Tutor IA do AprovaDrive. Estou aqui para te ajudar a se preparar com segurança para a prova teórica do DETRAN. Como posso te orientar hoje?`,
      action: { type: "none", status: "none", parameters: {} },
      requires_confirmation: false,
      confidence: 1.0
    };
  }

  if (norm.match(/^(oi|ola|bom dia|boa tarde|boa noite|e ai|opa|fala|alo)\b/)) {
    return {
      intent: "conversation",
      message: `Olá, ${nome}! Que bom ter você aqui no Tutor IA do AprovaDrive. Posso tirar suas dúvidas sobre conteúdos do DETRAN, regras do CTB, placas, primeiros socorros ou te dar dicas para acelerar seu aprendizado. Qual assunto gostaria de explorar agora?`,
      action: { type: "none", status: "none", parameters: {} },
      requires_confirmation: false,
      confidence: 1.0
    };
  }

  const d = userContext?.desempenho;
  if (
    norm.includes('desempenho') ||
    norm.includes('aproveitamento') ||
    norm.includes('ponto fraco') ||
    norm.includes('pontos fracos') ||
    norm.includes('fraqueza') ||
    norm.includes('onde melhorar') ||
    norm.includes('preciso melhorar') ||
    norm.includes('estou pronto') ||
    norm.includes('vou passar') ||
    norm.includes('simulado') ||
    norm.includes('minhas notas') ||
    norm.includes('meus acertos') ||
    norm.includes('estatistica') ||
    norm.includes('diagnostico') ||
    norm.includes('minha evolucao')
  ) {
    if (d && d.resumo) {
      const { taxaAproveitamento, totalQuestoes, totalAcertos, totalErros, totalSimulados, simuladosAprovados, statusGeral } = d.resumo;
      const materiasTexto = (d.materias || [])
        .map(m => `• **${m.nome}:** ${m.porcentagem}% (${m.status}) — ${m.acertos}/${m.totalQuestoes} acertos`)
        .join('\n');

      const simuladoTexto = (d.ultimosSimulados && d.ultimosSimulados.length > 0)
        ? `Você realizou **${totalSimulados} simulados** (${simuladosAprovados} com aprovação). Seu último simulado foi o **${d.ultimosSimulados[0].titulo}** com nota **${d.ultimosSimulados[0].notaTexto} (${d.ultimosSimulados[0].porcentagem}%)**.`
        : `Você ainda não realizou nenhum simulado oficial de 30 questões. Fazer simulados é crucial para testar seu tempo e resistência para o DETRAN!`;

      const reforcoTexto = (d.pontosFracos && d.pontosFracos.length > 0)
        ? `⚠️ **Foco de Reforço:** Priorize urgentemente **${d.pontosFracos.slice(0, 2).join(' e ')}**, pois estão abaixo do índice ideal de segurança (70%).`
        : `✅ **Excelente:** Você está mantendo ótimo rendimento em todas as matérias praticadas!`;

      return {
        intent: "analyze_performance",
        message: `Aqui está o raio-x completo do seu desempenho no AprovaDrive, ${nome}:\n\n` +
          `📊 **Aproveitamento Geral:** **${taxaAproveitamento}%** (${statusGeral})\n` +
          `🎯 **Questões Feitas:** ${totalQuestoes} resolvidas (${totalAcertos} acertos e ${totalErros} erros)\n\n` +
          `📚 **Rendimento por Matéria:**\n${materiasTexto}\n\n` +
          `📝 **Simulados:** ${simuladoTexto}\n\n` +
          `${reforcoTexto}\n\n` +
          `💡 **Diagnóstico do Tutor:** ${d.diagnosticoIa || 'Continue firme no seu cronograma diário!'}`,
        action: { type: "analyze_performance", status: "none", parameters: { aproveitamento: taxaAproveitamento } },
        requires_confirmation: false,
        confidence: 1.0
      };
    } else {
      return {
        intent: "analyze_performance",
        message: `Olá, ${nome}! No momento não localizei registros suficientes de questões concluídas no seu perfil. Comece resolvendo as baterias de questões e fazendo um simulado geral de 30 questões para eu mapear seus pontos fortes e fracos!`,
        action: { type: "analyze_performance", status: "none", parameters: {} },
        requires_confirmation: false,
        confidence: 1.0
      };
    }
  }

  if (norm.includes('dica') || norm.includes('passar') || norm.includes('primeira') || norm.includes('estudar') || norm.includes('cronograma') || norm.includes('como passar')) {
    return {
      intent: "explain_content",
      message: `Aqui vão as melhores orientações para você passar de primeira na prova do DETRAN:\n\n1. **Foque nas matérias principais:** Legislação de Trânsito e Direção Defensiva somam mais de 60% das questões oficiais.\n2. **Estudo ativo:** Leia os módulos em PDF com calma e preste atenção aos conceitos fundamentais.\n3. **Prática com questões:** Resolva as baterias de questões no AprovaDrive até atingir 70%+ de acertos em cada conteúdo.\n4. **Constância:** Mantenha sua rotina diária para acumular XP e fixar os detalhes das regras do CTB.`,
      action: { type: "explain_content", status: "none", parameters: { assunto: "dicas_estudo" } },
      requires_confirmation: false,
      confidence: 1.0
    };
  }

  if (norm.includes('materia') || norm.includes('conteudo') || norm.includes('cobradas') || norm.includes('mais cai') || norm.includes('prova')) {
    return {
      intent: "explain_content",
      message: `As matérias cobradas na prova teórica do DETRAN são organizadas por ordem de relevância:\n\n1. **Legislação de Trânsito:** Regras de circulação, normas de preferência, infrações, penalidades e sinalização.\n2. **Direção Defensiva:** Prevenção de acidentes, condições adversas e conduta segura.\n3. **Primeiros Socorros:** Atendimento primário, sinalização do local e acionamento de emergências (SAMU 192 e Bombeiros 193).\n4. **Meio Ambiente e Cidadania:** Emissões veiculares, conservação ambiental e convivência pacífica no trânsito.\n5. **Mecânica Básica:** Manutenção preventiva, componentes do motor, pneus e freios.`,
      action: { type: "explain_content", status: "none", parameters: { assunto: "materias_detran" } },
      requires_confirmation: false,
      confidence: 1.0
    };
  }

  if (norm.includes('xp') || norm.includes('nivel') || norm.includes('tarefa') || norm.includes('gamific') || norm.includes('recompensa') || norm.includes('ofensiva')) {
    return {
      intent: "get_gamification",
      message: `O sistema de XP e progressão do AprovaDrive funciona assim:\n\n- **Questões:** +10 XP por acerto na primeira tentativa de cada questão.\n- **Leitura de Módulos:** +50 XP ao concluir a leitura de um módulo em PDF.\n- **Tarefas de Módulos:** +150 XP ao cumprir as metas fixas de leitura.\n- **Tarefas de Baterias:** +350 XP permanente ao completar a bateria com 70% ou mais de acertos.\n\nSeu XP acumulado aumenta o seu nível de condutor e ajuda a medir seu progresso rumo à aprovação!`,
      action: { type: "get_gamification", status: "none", parameters: { informacao: "xp" } },
      requires_confirmation: false,
      confidence: 1.0
    };
  }

  if (norm.includes('parada') || norm.includes('estacionamento') || norm.includes('estacionar') || norm.includes('parar')) {
    return {
      intent: "explain_content",
      message: `De acordo com o Código de Trânsito Brasileiro (CTB), a diferença é fundamental para a prova:\n\n- **Parada:** É a imobilização do veículo estritamente pelo tempo necessário para efetuar o embarque ou desembarque de passageiros. O condutor deve permanecer atento e o veículo deve sair em seguida.\n- **Estacionamento:** É a imobilização do veículo por tempo superior ao necessário para embarque ou desembarque, inclusive em operações de carga e descarga, ou quando o veículo permanece desligado/sem o condutor.`,
      action: { type: "explain_content", status: "none", parameters: { assunto: "parada_vs_estacionamento" } },
      requires_confirmation: false,
      confidence: 1.0
    };
  }

  if (norm.includes('70%') || norm.includes('70') || norm.includes('porcentagem') || norm.includes('acertos') || norm.includes('corte') || norm.includes('aprovacao')) {
    return {
      intent: "explain_content",
      message: `A regra oficial de aprovação no DETRAN exige um rendimento mínimo de **70% de acertos**:\n\n- Em provas com 30 questões, são necessários no mínimo **21 acertos**.\n- Em provas com 40 questões, são necessários no mínimo **28 acertos**.\n\nNo AprovaDrive, adotamos essa mesma exigência: as tarefas de baterias de questões só podem ser reivindicadas após você demonstrar 70% ou mais de aproveitamento!`,
      action: { type: "explain_content", status: "none", parameters: { assunto: "regra_70_porcento" } },
      requires_confirmation: false,
      confidence: 1.0
    };
  }

  if (norm.includes('primeiros socorros') || norm.includes('socorro') || norm.includes('acidente') || norm.includes('vitima') || norm.includes('samu') || norm.includes('bombeiro')) {
    return {
      intent: "explain_content",
      message: `Em Primeiros Socorros no trânsito, lembre-se destes princípios indispensáveis para o DETRAN:\n\n1. **Garantir a segurança:** Sinalize o local com o triângulo em distância segura antes de qualquer contato.\n2. **Chamar socorro especializado:** Ligue imediatamente para o **SAMU (192)** ou **Corpo de Bombeiros (193)**.\n3. **Não mover a vítima:** Se houver suspeita de fratura ou trauma na coluna cervical, mantenha a pessoa imóvel.\n4. **Não retirar capacetes de motociclistas** e não oferecer água ou medicamentos para vítimas de acidentes.`,
      action: { type: "explain_content", status: "none", parameters: { assunto: "primeiros_socorros" } },
      requires_confirmation: false,
      confidence: 1.0
    };
  }

  if (norm.includes('direcao defensiva') || norm.includes('defensiva') || norm.includes('adversa') || norm.includes('aquaplanagem')) {
    return {
      intent: "explain_content",
      message: `Na Direção Defensiva, você estuda formas de dirigir de modo a evitar acidentes a despeito das ações dos outros e das condições adversas:\n\n- **Direção Preventiva:** É a atitude permanente de prever riscos e agir antecipadamente.\n- **Direção Corretiva:** É a reação rápida diante de um perigo imprevisto.\n- **Condições Adversas (6 tipos):** Luz, Tempo, Via, Trânsito, Veículo e Condutor.\n- **Aquaplanagem:** Perda de aderência dos pneus com o solo em pista molhada. Nunca freie bruscamente; retire o pé do acelerador e segure a direção firme.`,
      action: { type: "explain_content", status: "none", parameters: { assunto: "direcao_defensiva" } },
      requires_confirmation: false,
      confidence: 1.0
    };
  }

  if (norm.includes('placa') || norm.includes('sinalizacao') || norm.includes('semaforo') || norm.includes('faixa')) {
    return {
      intent: "explain_content",
      message: `A sinalização de trânsito é dividida em três grupos principais de placas:\n\n1. **Regulamentação (circulares, borda vermelha e fundo branco):** Indicam proibições, restrições e obrigações. O desrespeito constitui infração de trânsito (ex: R-1 Pare, R-2 Dê a preferência).\n2. **Advertência (quadradas amarelas em losango):** Alertam sobre perigos ou características da via adiante (ex: A-1a Curva acentuada).\n3. **Indicação (azuis, verdes ou marrons):** Identificam vias, distâncias, serviços auxiliares e atrativos turísticos.`,
      action: { type: "explain_content", status: "none", parameters: { assunto: "placas_sinalizacao" } },
      requires_confirmation: false,
      confidence: 1.0
    };
  }

  if (norm.includes('mecanica') || norm.includes('motor') || norm.includes('freio') || norm.includes('pneu') || norm.includes('oleo') || norm.includes('radiador')) {
    return {
      intent: "explain_content",
      message: `Os pontos essenciais de Mecânica Básica para a prova teórica incluem:\n\n- **Manutenção Preventiva:** Evita quebras inesperadas e reduz acidentes de trânsito.\n- **Pneus:** A profundidade mínima dos sulcos deve ser de **1,6 mm** (indicador TWI). Sulcos abaixo disso tornam o pneu "careca" e geram infração grave.\n- **Arrefecimento e Lubrificação:** Verificar sempre o nível do óleo do motor e o nível da água/aditivo no radiador com o motor frio e em terreno plano.\n- **Painel de Instrumentos:** Luzes vermelhas indicam emergência que exige parada imediata (ex: pressão do óleo ou freios).`,
      action: { type: "explain_content", status: "none", parameters: { assunto: "mecanica_basica" } },
      requires_confirmation: false,
      confidence: 1.0
    };
  }

  if (norm.includes('meio ambiente') || norm.includes('cidadania') || norm.includes('poluicao') || norm.includes('catalisador') || norm.includes('ciclista') || norm.includes('pedestre')) {
    return {
      intent: "explain_content",
      message: `Sobre Meio Ambiente e Cidadania no trânsito:\n\n- **Poluição do Ar e Sonora:** Veículos mal regulados aumentam a emissão de gases nocivos como monóxido de carbono (CO). O catalisador no escapamento converte gases tóxicos em substâncias menos agressivas.\n- **Cidadania e Convivência:** O pedestre tem prioridade na faixa sem semáforo. Ao ultrapassar ciclistas, o condutor deve manter a distância lateral mínima de **1,5 metro** e reduzir a velocidade.`,
      action: { type: "explain_content", status: "none", parameters: { assunto: "meio_ambiente_cidadania" } },
      requires_confirmation: false,
      confidence: 1.0
    };
  }

  return {
    intent: "explain_content",
    message: `Estou aqui para te orientar em todos os conteúdos da sua habilitação! Para a prova oficial do DETRAN, o melhor caminho é dominar **Legislação de Trânsito** e **Direção Defensiva**, ler os módulos em PDF com calma e resolver as baterias de questões até alcançar mais de 70% de acertos.\n\nVocê pode me perguntar sobre placas, regras de preferência, primeiros socorros ou dicas sobre o AprovaDrive. Qual assunto você gostaria de revisar agora?`,
    action: { type: "none", status: "none", parameters: {} },
    requires_confirmation: false,
    confidence: 1.0
  };
}

export async function getAiResponse(userMessage, conversationHistory = [], userContext = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return getSmartFallbackResponse(userMessage, userContext);
  }

  const client = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  const messages = [...SYSTEM_PROMPTS];

  if (userContext?.desempenho) {
    const promptDesempenho = formatarDesempenhoParaPrompt(userContext.desempenho);
    if (promptDesempenho) {
      messages.push({
        role: "system",
        content: promptDesempenho
      });
    }
  } else if (userContext && Object.keys(userContext).length > 0) {
    messages.push({
      role: "system",
      content: `DADOS DO USUÁRIO ATUAL: Nome: ${userContext.nome || 'Aluno'}, Nível: ${userContext.nivel || 1}, Taxa de acertos atual: ${userContext.taxaAproveitamento !== undefined ? userContext.taxaAproveitamento + '%' : 'não informada'}.`
    });
  }

  if (Array.isArray(conversationHistory)) {
    conversationHistory.slice(-6).forEach(msg => {
      if (msg && msg.role && msg.content) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: String(msg.content)
        });
      }
    });
  }

  messages.push({
    role: "user",
    content: String(userMessage || '').trim()
  });

  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(rawContent);

    return {
      intent: parsed.intent || "conversation",
      message: parsed.message || "Como posso ajudar você em seus estudos para a prova do DETRAN?",
      action: parsed.action || {
        type: "none",
        status: "none",
        parameters: {}
      },
      requires_confirmation: Boolean(parsed.requires_confirmation),
      confidence: parsed.confidence !== undefined ? Number(parsed.confidence) : 1.0
    };
  } catch (error) {
    return getSmartFallbackResponse(userMessage, userContext);
  }
}

export function normalizarMateriaId(nome) {
  if (!nome) return 'CodigoTransito';
  const lower = String(nome).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (lower.includes('meio') || lower.includes('ambiente') || lower.includes('cidadania')) return 'MeioAmbiente';
  if (lower.includes('codigo') || lower.includes('legislacao')) return 'CodigoTransito';
  if (lower.includes('placa') || lower.includes('sinalizacao')) return 'PlacasTransito';
  if (lower.includes('direcao') || lower.includes('defensiva') || lower.includes('ofensiva')) return 'DirecaoDefensiva';
  if (lower.includes('socorro') || lower.includes('saude') || lower.includes('primeiro')) return 'PrimeirosSocorros';
  if (lower.includes('mecanica')) return 'MecanicaBasica';
  return 'CodigoTransito';
}

export function gerarTarefasSemanaisFallback(usuario = {}, desempenho = {}) {
  const pontosFracos = Array.isArray(desempenho?.pontosFracos) && desempenho.pontosFracos.length > 0
    ? desempenho.pontosFracos
    : ['Direção Defensiva', 'Legislação de Trânsito'];

  const matFraca1 = normalizarMateriaId(pontosFracos[0]);
  const matFraca2 = normalizarMateriaId(pontosFracos[1] || pontosFracos[0] || 'PrimeirosSocorros');

  const nomeMateria = {
    CodigoTransito: 'Legislação de Trânsito',
    PlacasTransito: 'Placas e Sinalização',
    DirecaoDefensiva: 'Direção Defensiva',
    PrimeirosSocorros: 'Primeiros Socorros',
    MeioAmbiente: 'Meio Ambiente e Cidadania',
    MecanicaBasica: 'Mecânica Básica'
  };

  return [
    // Segunda-feira (Dia 1)
    {
      dia_semana: 1,
      sort: 1,
      titulo: 'Estudo Teórico: Legislação de Trânsito (Módulo 1)',
      descricao: 'Leia o Módulo 1 com foco nas normas gerais de circulação, conduta e preferências no trânsito.',
      horario: '08:00',
      duracao: '20 min',
      xp_reward: 50,
      tipo_validacao: 'modulo',
      parametros_validacao: { materia: 'CodigoTransito', modulo_minimo: 1 }
    },
    {
      dia_semana: 1,
      sort: 2,
      titulo: 'Bateria 1 de Questões: Legislação de Trânsito',
      descricao: 'Resolva a Bateria 1 de Legislação e alcance no mínimo 40% de acertos para validar a missão.',
      horario: '12:30',
      duracao: '15 min',
      xp_reward: 80,
      tipo_validacao: 'bateria',
      parametros_validacao: { materia: 'CodigoTransito', bateria: 1, meta_porcentagem: 40 }
    },
    {
      dia_semana: 1,
      sort: 3,
      titulo: 'Fixação Prática: Placas de Sinalização',
      descricao: 'Complete a Bateria de Placas de Regulamentação e Advertência com pelo menos 40% de aproveitamento.',
      horario: '19:00',
      duracao: '40 min',
      xp_reward: 75,
      tipo_validacao: 'bateria',
      parametros_validacao: { materia: 'PlacasTransito', bateria: 1, meta_porcentagem: 40 }
    },

    // Terça-feira (Dia 2)
    {
      dia_semana: 2,
      sort: 1,
      titulo: 'Estudo Teórico: Direção Defensiva (Módulo 1)',
      descricao: 'Estude os conceitos fundamentais de prevenção de acidentes e as 6 condições adversas de tráfego.',
      horario: '08:00',
      duracao: '20 min',
      xp_reward: 50,
      tipo_validacao: 'modulo',
      parametros_validacao: { materia: 'DirecaoDefensiva', modulo_minimo: 1 }
    },
    {
      dia_semana: 2,
      sort: 2,
      titulo: 'Bateria 1 de Questões: Direção Defensiva',
      descricao: 'Aplique as técnicas defensivas respondendo à Bateria 1 com aproveitamento mínimo de 40%.',
      horario: '12:30',
      duracao: '15 min',
      xp_reward: 80,
      tipo_validacao: 'bateria',
      parametros_validacao: { materia: 'DirecaoDefensiva', bateria: 1, meta_porcentagem: 40 }
    },
    {
      dia_semana: 2,
      sort: 3,
      titulo: 'Simulado Temático: Direção Defensiva (30 Questões)',
      descricao: 'Realize o simulado de Direção Defensiva com meta diária de 40% (mínimo de 12 acertos em 30 questões).',
      horario: '19:00',
      duracao: '40 min',
      xp_reward: 110,
      tipo_validacao: 'simulado',
      parametros_validacao: { materia: 'DirecaoDefensiva', meta_porcentagem: 40, acertos_minimos: 12 }
    },

    // Quarta-feira (Dia 3)
    {
      dia_semana: 3,
      sort: 1,
      titulo: 'Estudo Teórico: Primeiros Socorros no Trânsito',
      descricao: 'Aprenda os procedimentos iniciais de socorro, sinalização segura e como acionar SAMU (192) e Bombeiros (193).',
      horario: '08:00',
      duracao: '20 min',
      xp_reward: 50,
      tipo_validacao: 'modulo',
      parametros_validacao: { materia: 'PrimeirosSocorros', modulo_minimo: 1 }
    },
    {
      dia_semana: 3,
      sort: 2,
      titulo: 'Bateria 1 de Questões: Primeiros Socorros',
      descricao: 'Resolva a Bateria 1 de Primeiros Socorros e atinja a meta mínima de 40% de acertos.',
      horario: '12:30',
      duracao: '15 min',
      xp_reward: 80,
      tipo_validacao: 'bateria',
      parametros_validacao: { materia: 'PrimeirosSocorros', bateria: 1, meta_porcentagem: 40 }
    },
    {
      dia_semana: 3,
      sort: 3,
      titulo: 'Simulado Geral DETRAN de Meio de Semana',
      descricao: 'Treine com 30 questões oficiais. Atinja pelo menos 40% (12 acertos) para cumprir a meta do dia.',
      horario: '19:00',
      duracao: '40 min',
      xp_reward: 120,
      tipo_validacao: 'simulado',
      parametros_validacao: { materia: 'Geral', meta_porcentagem: 40, acertos_minimos: 12 }
    },

    // Quinta-feira (Dia 4)
    {
      dia_semana: 4,
      sort: 1,
      titulo: 'Estudo Teórico: Meio Ambiente e Cidadania',
      descricao: 'Revise regras sobre emissão de poluentes, respeito aos pedestres, ciclistas e convívio no trânsito.',
      horario: '08:00',
      duracao: '20 min',
      xp_reward: 50,
      tipo_validacao: 'modulo',
      parametros_validacao: { materia: 'MeioAmbiente', modulo_minimo: 1 }
    },
    {
      dia_semana: 4,
      sort: 2,
      titulo: 'Bateria de Questões: Meio Ambiente e Cidadania',
      descricao: 'Responda à bateria prática de Meio Ambiente e alcance pelo menos 40% de acertos.',
      horario: '12:30',
      duracao: '15 min',
      xp_reward: 80,
      tipo_validacao: 'bateria',
      parametros_validacao: { materia: 'MeioAmbiente', bateria: 1, meta_porcentagem: 40 }
    },
    {
      dia_semana: 4,
      sort: 3,
      titulo: 'Desafio Prático de Acertos: Placas de Trânsito',
      descricao: 'Acumule pelo menos 4 acertos nas questões de placas para fixar a sinalização obrigatória.',
      horario: '19:00',
      duracao: '40 min',
      xp_reward: 75,
      tipo_validacao: 'acertos',
      parametros_validacao: { materia: 'PlacasTransito', acertos_minimos: 4 }
    },

    // Sexta-feira (Dia 5)
    {
      dia_semana: 5,
      sort: 1,
      titulo: `Reforço no Ponto Fraco: ${nomeMateria[matFraca1] || 'Legislação'}`,
      descricao: `Dedique foco especial à matéria de ${nomeMateria[matFraca1] || 'Legislação'}, superando suas dúvidas críticas (meta 40%+).`,
      horario: '08:00',
      duracao: '20 min',
      xp_reward: 90,
      tipo_validacao: 'bateria',
      parametros_validacao: { materia: matFraca1, bateria: 2, meta_porcentagem: 40 }
    },
    {
      dia_semana: 5,
      sort: 2,
      titulo: 'Bateria Avançada: Legislação e Infrações',
      descricao: 'Pratique questões sobre infrações leves, médias, graves e gravíssimas (meta 40%+ de acertos).',
      horario: '12:30',
      duracao: '15 min',
      xp_reward: 90,
      tipo_validacao: 'bateria',
      parametros_validacao: { materia: 'CodigoTransito', bateria: 2, meta_porcentagem: 40 }
    },
    {
      dia_semana: 5,
      sort: 3,
      titulo: `Simulado Temático: ${nomeMateria[matFraca1] || 'Legislação'}`,
      descricao: `Simulado de 30 questões focado em ${nomeMateria[matFraca1] || 'Legislação'}. Meta: 12 acertos (40%).`,
      horario: '19:00',
      duracao: '40 min',
      xp_reward: 120,
      tipo_validacao: 'simulado',
      parametros_validacao: { materia: matFraca1, meta_porcentagem: 40, acertos_minimos: 12 }
    },

    // Sábado (Dia 6)
    {
      dia_semana: 6,
      sort: 1,
      titulo: `Revisão dos Erros em ${nomeMateria[matFraca2] || 'Direção Defensiva'}`,
      descricao: `Revisão direcionada dos pontos com mais dúvidas em ${nomeMateria[matFraca2] || 'Direção Defensiva'} (meta 40%+).`,
      horario: '08:00',
      duracao: '20 min',
      xp_reward: 85,
      tipo_validacao: 'revisao',
      parametros_validacao: { materia: matFraca2, meta_porcentagem: 40 }
    },
    {
      dia_semana: 6,
      sort: 2,
      titulo: 'Bateria de Fixação Rápida: Legislação & Placas',
      descricao: 'Bateria intensiva de consolidação com meta acessível de 40% de acertos.',
      horario: '12:30',
      duracao: '15 min',
      xp_reward: 100,
      tipo_validacao: 'bateria',
      parametros_validacao: { materia: 'CodigoTransito', bateria: 3, meta_porcentagem: 40 }
    },
    {
      dia_semana: 6,
      sort: 3,
      titulo: 'Grande Simulado Geral Oficial DETRAN (30 Questões)',
      descricao: 'Prova simulada oficial de 30 questões. Atinja no mínimo 40% (12 acertos) para comemorar sua prontidão do dia!',
      horario: '19:00',
      duracao: '40 min',
      xp_reward: 150,
      tipo_validacao: 'simulado',
      parametros_validacao: { materia: 'Geral', meta_porcentagem: 40, acertos_minimos: 12 }
    }
  ];
}

export async function sugerirTarefasSemanaisComIA(usuario = {}, desempenho = {}) {
  const fallbackTasks = gerarTarefasSemanaisFallback(usuario, desempenho);
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return fallbackTasks;
  }

  const client = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

  const nome = usuario?.nome || 'Aluno';
  const taxa = desempenho?.resumo?.taxaAproveitamento ?? 50;
  const pontosFracos = (desempenho?.pontosFracos || ['Direção Defensiva', 'Legislação de Trânsito']).join(', ');
  const pontosFortes = (desempenho?.pontosFortes || ['Placas e Sinalização']).join(', ');

  const prompt = `Você é o orientador pedagógico de inteligência artificial do AprovaDrive (plataforma de estudos para a prova teórica do DETRAN / CNH).
O aluno ${nome} tem taxa de acertos atual de ${taxa}%.
Pontos fracos para reforço urgente: ${pontosFracos}.
Pontos fortes: ${pontosFortes}.

Gere um cronograma semanal completo e pedagógico com exatamente 18 tarefas (Dias 1 a 6, sorts 1 a 3 para cada dia: manhã 08:00, tarde 12:30, noite 19:00).
As tarefas devem ser práticas e fazer sentido com os recursos reais do AprovaDrive:
1. Módulos teóricos em PDF (tipo_validacao = 'modulo')
2. Baterias de 10 questões práticas por matéria (tipo_validacao = 'bateria')
3. Simulados oficiais de 30 questões gerais ou temáticos (tipo_validacao = 'simulado')
4. Desafios de acertos acumulados (tipo_validacao = 'acertos')
5. Revisão de erros em pontos fracos (tipo_validacao = 'revisao')

Matérias válidas para os parâmetros: 'CodigoTransito', 'PlacasTransito', 'DirecaoDefensiva', 'PrimeirosSocorros', 'MeioAmbiente', 'Geral'.

Retorne exclusivamente um JSON com a chave 'tarefas' contendo um array de 18 objetos:
{
  "tarefas": [
    {
      "dia_semana": 1,
      "sort": 1,
      "titulo": "string",
      "descricao": "string",
      "horario": "08:00",
      "duracao": "20 min",
      "xp_reward": 50,
      "tipo_validacao": "modulo",
      "parametros_validacao": { "materia": "CodigoTransito", "modulo_minimo": 1 }
    }
  ]
}`;

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'Você é o orientador pedagógico de inteligência artificial do AprovaDrive para a prova teórica do DETRAN / CNH. Responda ESTRITAMENTE em formato JSON com a chave "tarefas".'
        },
        {
          role: 'user',
          content: `${prompt}\n\nPor favor, retorne o objeto JSON com a chave "tarefas" contendo as 18 tarefas semanais.`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed.tarefas) && parsed.tarefas.length >= 6) {
      const resultMap = new Map();
      fallbackTasks.forEach(t => {
        resultMap.set(`${t.dia_semana}_${t.sort}`, { ...t });
      });

      parsed.tarefas.forEach(aiTask => {
        const dia = Number(aiTask.dia_semana);
        const sort = Number(aiTask.sort);
        if (dia >= 1 && dia <= 6 && sort >= 1 && sort <= 3) {
          const key = `${dia}_${sort}`;
          const base = resultMap.get(key) || {};
          const tipoVal = ['modulo', 'bateria', 'simulado', 'acertos', 'revisao'].includes(aiTask.tipo_validacao)
            ? aiTask.tipo_validacao
            : base.tipo_validacao || 'bateria';

          const matVal = normalizarMateriaId(aiTask.parametros_validacao?.materia || aiTask.titulo);

          const paramsVal = {
            ...(base.parametros_validacao || {}),
            ...(aiTask.parametros_validacao || {}),
            materia: matVal
          };

          if (tipoVal === 'bateria' && !paramsVal.meta_porcentagem) paramsVal.meta_porcentagem = 40;
          if (tipoVal === 'simulado' && !paramsVal.meta_porcentagem) paramsVal.meta_porcentagem = 40;
          if (tipoVal === 'simulado' && !paramsVal.acertos_minimos) paramsVal.acertos_minimos = 12;
          if (tipoVal === 'modulo' && !paramsVal.modulo_minimo) paramsVal.modulo_minimo = 1;
          if (tipoVal === 'acertos' && !paramsVal.acertos_minimos) paramsVal.acertos_minimos = 4;
          if (tipoVal === 'revisao' && !paramsVal.meta_porcentagem) paramsVal.meta_porcentagem = 40;

          resultMap.set(key, {
            ...base,
            dia_semana: dia,
            sort,
            titulo: String(aiTask.titulo || base.titulo).trim(),
            descricao: String(aiTask.descricao || base.descricao).trim(),
            horario: aiTask.horario || base.horario,
            duracao: aiTask.duracao || base.duracao,
            xp_reward: Math.max(30, Math.min(200, Number(aiTask.xp_reward) || base.xp_reward || 80)),
            tipo_validacao: tipoVal,
            parametros_validacao: paramsVal,
            sugerida_por_ia: true
          });
        }
      });

      return Array.from(resultMap.values()).sort((a, b) => {
        if (a.dia_semana !== b.dia_semana) return a.dia_semana - b.dia_semana;
        return a.sort - b.sort;
      });
    }

    return fallbackTasks;
  } catch (error) {
    console.warn('[AiService] Falha ao gerar tarefas com Groq, usando fallback inteligente:', error.message);
    return fallbackTasks;
  }
}
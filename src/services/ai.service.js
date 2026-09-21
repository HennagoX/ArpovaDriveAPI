import Groq from "groq-sdk";
import dotenv from 'dotenv'

dotenv.config()

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function getResponse() {
    const response = await client.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
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
1. Retorne exclusivamente um objeto JSON válido.
2. Nunca inclua Markdown, comentários ou texto fora do JSON.
3. Não invente conteúdos, questões, resultados, dados do usuário ou informações do DETRAN.
4. Utilize somente os dados fornecidos no contexto da requisição.
5. Quando faltarem informações necessárias, solicite esclarecimentos no campo "message".
6. Nunca confirme que uma ação foi executada. Indique apenas a ação identificada e o status adequado.
7. Responda sempre em português brasileiro, salvo quando o usuário solicitar outro idioma.
8. Seja direto, claro, objetivo e profissional.
9. Não forneça diagnóstico médico, jurídico ou informações não relacionadas aos estudos para habilitação.
10. Caso a solicitação não esteja relacionada ao AprovaDrive, informe que você só pode ajudar com os estudos e recursos da plataforma.`
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
                role: "user",
                content: "Como funciona a progressão de xp do aprovadrive?"
            }
        ],
        temperature: 0.4,
        response_format: { type: "json_object" }
    })
    return response;
}

try {
    const response = await getResponse();
    const responseData = JSON.parse(response.choices[0].message.content);
    console.log(responseData);
} catch (error) {
    console.error(error);
}
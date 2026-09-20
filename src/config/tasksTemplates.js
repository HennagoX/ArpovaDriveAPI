const taskTemplates = {
	CodigoTransito: {
		title: 'Estudar 4 capítulos de Código de Trânsito',
		xp_reward: 100,
		description: 'Aprenda as principais leis e regras do Código de Trânsito Brasileiro em conteúdos.',
		task_type: 'study'
	},
	reviewConstitutionalLaw: {
		title: 'Revisar Direito Constitucional',
		xp_reward: 25,
		description: 'Revise suas anotações de Direito Constitucional e destaque os assuntos que precisam de reforço.',
		task_type: 'review'
	},
	solvePortugueseQuestions: {
		title: 'Resolver questões de Português',
		xp_reward: 35,
		description: 'Resolva 20 questões de interpretação de texto e confira seus erros.',
		task_type: 'exercise'
	},
	studyMathematics: {
		title: 'Estudar Matemática',
		xp_reward: 30,
		description: 'Estude um tópico de Matemática e resolva exercícios para fixar o conteúdo.',
		task_type: 'study'
	},
	reviewPreviousErrors: {
		title: 'Revisar questões erradas',
		xp_reward: 25,
		description: 'Revise as questões que você errou e registre o motivo de cada erro.',
		task_type: 'review'
	},
	watchLesson: {
		title: 'Assistir a uma aula',
		xp_reward: 20,
		description: 'Assista a uma aula sobre um assunto do seu edital e anote as ideias principais.',
		task_type: 'video_lesson'
	},
	readStudyMaterial: {
		title: 'Ler material de estudo',
		xp_reward: 20,
		description: 'Leia um capítulo do material de estudo e faça uma breve síntese.',
		task_type: 'reading'
	},
	completeMockTest: {
		title: 'Fazer um simulado',
		xp_reward: 100,
		description: 'Faça um simulado completo respeitando o tempo limite da prova.',
		task_type: 'mock_test'
	},
	analyzeMockTest: {
		title: 'Analisar resultado do simulado',
		xp_reward: 40,
		description: 'Analise seu desempenho no simulado e identifique os conteúdos que precisam de atenção.',
		task_type: 'review'
	},
	planStudyWeek: {
		title: 'Planejar a semana de estudos',
		xp_reward: 15,
		description: 'Organize as matérias, horários e metas de estudo para os próximos dias.',
		task_type: 'planning'
	}
};

export default taskTemplates;

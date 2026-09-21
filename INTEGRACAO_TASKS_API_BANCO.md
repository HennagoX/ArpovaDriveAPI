# AprovaDrive - Documentação Técnica: Integração de Tarefas, API e PostgreSQL

Este documento descreve a integração completa entre o front-end (`AprovaDriveFront`), a API Express (`AprovaDriveAPI`) e o banco de dados relacional **PostgreSQL** (Neon DB), contemplando o ciclo de vida semanal, as regras de bloqueio diário, a independência entre os dias e a persistência de gamificação (XP).

---

## 1. Script SQL para Criação das Tabelas no PostgreSQL

Execute o script DDL abaixo no seu banco de dados PostgreSQL para criar a estrutura completa da tabela de tarefas com suas chaves estrangeiras, índices de performance e restrições de integridade.

```sql
-- 1. Habilita a extensão para geração de UUIDs nativos
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Criação da tabela tarefa
CREATE TABLE IF NOT EXISTS tarefa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- Estados: 'pending', 'current', 'in_progress', 'done'
    concluida BOOLEAN NOT NULL DEFAULT FALSE,
    sort INTEGER NOT NULL DEFAULT 1,               -- 1, 2 ou 3 (máximo de 3 tarefas por dia)
    dia_semana INTEGER NOT NULL,                   -- 1: Segunda, 2: Terça, 3: Quarta, 4: Quinta, 5: Sexta, 6: Sábado
    horario VARCHAR(10),                           -- Ex: '08:00', '12:30', '19:00'
    duracao VARCHAR(20),                           -- Ex: '20 min', '15 min', '40 min'
    data_agendada DATE NOT NULL,                   -- Data exata do dia da tarefa (YYYY-MM-DD)
    inicio_semana DATE NOT NULL,                   -- Data da segunda-feira de início da semana (YYYY-MM-DD)
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tarefa_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_tarefa_sort CHECK (sort >= 1 AND sort <= 3),
    CONSTRAINT chk_tarefa_dia CHECK (dia_semana >= 1 AND dia_semana <= 6)
);

-- 3. Índices para otimização de consultas da semana e do dia
CREATE INDEX IF NOT EXISTS idx_tarefa_usuario_semana ON tarefa (id_usuario, inicio_semana);
CREATE INDEX IF NOT EXISTS idx_tarefa_usuario_data ON tarefa (id_usuario, data_agendada);
```

---

## 2. Regras de Negócio e Ciclos de Tarefas

### 2.1 Rotação Semanal de Tarefas
* **Referência por Segunda-feira (`inicio_semana`)**: Todas as 18 tarefas de uma semana letiva (3 tarefas $\times$ 6 dias) são associadas à data da respectiva segunda-feira.
* **Transição de Semana**:
  - Quando uma nova semana se inicia no sistema, a API consulta tarefas associadas ao novo `inicio_semana`.
  - As tarefas das semanas anteriores **não são retornadas** no payload semanal (somem da visualização do cronograma atual do usuário), permanecendo salvas no banco para auditoria e histórico de XP.
  - Caso o usuário ainda não possua tarefas para a nova semana, a API gera e insere automaticamente as 18 novas tarefas no banco de dados.

### 2.2 Bloqueio Diário Estrito (Regra do Dia Atual)
* **Confinamento ao Dia Atual**: O usuário só pode iniciar (`/iniciar`) ou concluir (`/concluir`) tarefas cujo `dia_semana` coincida com o dia atual do sistema (`diaSemanaAtual`).
* **Tentativa de Acesso a Outros Dias**:
  - Se o usuário tentar iniciar uma tarefa de um dia futuro ou passado, a API rejeita com status `400 Bad Request`.
  - Mensagem retornada:
    > *"Esta tarefa é de [Dia da Tarefa]. Você só pode realizar as tarefas do dia atual ([Dia de Hoje]). As tarefas dos demais dias ficam bloqueadas até chegar o dia."*
  - O front-end captura a mensagem e a exibe no toast de notificação flutuante.

### 2.3 Independência entre Dias e Sequência Interna
* **Independência Diária**:
  - A primeira tarefa de qualquer dia (`sort: 1`) **não depende** das tarefas dos dias anteriores.
  - O usuário pode estar na primeira tarefa da segunda-feira e, ao chegar terça-feira, a primeira tarefa da terça estará disponível (`status: 'current'`), independentemente de ter completado ou não as tarefas de segunda.
* **Sequência Interna do Dia (Máximo 3 tarefas)**:
  - **Tarefa 1 (`sort: 1`)**: Desbloqueada por padrão no respectivo dia (`status: 'current'`).
  - **Tarefa 2 (`sort: 2`)**: Requer que a Tarefa 1 do mesmo dia esteja concluída (`concluida: true` e `status: 'done'`).
  - **Tarefa 3 (`sort: 3`)**: Requer que a Tarefa 2 do mesmo dia esteja concluída.
  - Máximo de 3 tarefas por dia (`sort: 1, 2, 3`), garantido inclusive por constraint no banco de dados.
* **Conclusão do Dia**:
  - Ao concluir a tarefa 3 de hoje, o dia é considerado finalizado (`diaConcluido: true` e `taskAtual: null`).
  - O sistema exibe o banner: *"Parabéns! Você concluiu todas as missões de hoje. Descanse e volte amanhã!"*.
  - Os dias futuros continuam bloqueados até chegarem seus respectivos dias.

---

## 3. Endpoints da API (`/task`)

Todas as rotas aceitam o usuário tanto via `query` (`?userId=` ou `?id=`), parâmetros de rota (`/:id`), ou no `body` (`id_usuario`, `userId`, `usuario`), e resolvem tanto pelo UUID quanto pelo nome ou e-mail cadastrado no banco.

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/task` ou `/task/tasks` | Retorna o payload completo da semana e a tarefa atual de hoje |
| `GET` | `/task/:id` | Retorna os detalhes de uma tarefa específica por ID |
| `POST` | `/task/:id/iniciar` ou `/task/iniciar` | Inicia a tarefa (muda status para `in_progress`) |
| `POST` | `/task/:id/concluir` ou `/task/concluir` | Conclui a tarefa (`done`), credita XP no usuário e desbloqueia a próxima do dia |
| `POST` | `/task/:id/pausar` ou `/task/pausar` | Pausa uma tarefa em andamento (retorna para `current`) |
| `POST` | `/task/:id/reiniciar` ou `/task/reiniciar` | Reinicia o status da tarefa |
| `POST` | `/task/reset-schedule` | Limpa e reinicializa todo o cronograma da semana no banco |

### 3.1 Exemplo do Payload Retornado (`GET /task/tasks`)

```json
{
  "usuario": {
    "id": "0b0c0d89-2cea-48ad-9988-928337357643",
    "nome": "Henrique",
    "email": "Henrique@gmail.com",
    "exp": 100
  },
  "dataReferencia": "2026-09-21T18:00:00.000Z",
  "diaAtual": "segunda",
  "diaSemanaAtual": 1,
  "diaConcluido": false,
  "taskAtual": {
    "id": "c1130dea-6371-4f42-bae8-7c5b0716d152",
    "titulo": "Estudar capítulo 1 do Código de Trânsito",
    "status": "current",
    "xp_reward": 50,
    "sort": 1
  },
  "tarefasDoDia": [ ... ],
  "dias": {
    "segunda": [ ... ],
    "terca": [ ... ],
    "quarta": [ ... ],
    "quinta": [ ... ],
    "sexta": [ ... ],
    "sabado": [ ... ]
  }
}
```

---

## 4. Estrutura dos Arquivos do Projeto

```text
AprovaDrive/
├── AprovaDriveAPI/
│   ├── src/
│   │   ├── Repositories/
│   │   │   ├── db.js                 # Pool de conexão PostgreSQL (Neon DB)
│   │   │   └── task.repository.js   # Queries SQL de busca, inserção, update de status e XP
│   │   ├── services/
│   │   │   └── task.service.js      # Regras de negócio, confinamento e geração semanal
│   │   ├── controllers/
│   │   │   └── task.controller.js   # Handlers HTTP Express e extração unificada de IDs
│   │   ├── routes/
│   │   │   └── task.routes.js       # Definição das rotas REST de tarefas
│   │   └── config/
│   │       └── cors.js              # Liberação flexível de origens de desenvolvimento
│   └── app.js                       # Servidor Express e inicialização do banco
├── AprovaDriveFront/
│   ├── src/
│   │   ├── js/
│   │   │   ├── services/
│   │   │   │   └── cronogramaService.js # Fetch HTTP com tratamento de usuário autenticado
│   │   │   ├── pages/
│   │   │   │   ├── cronograma.js        # Lógica de renderização das abas e envio das ações
│   │   │   │   └── dashboard.js         # Missões do dia dinâmicas e sincronização de XP
│   │   │   └── components/
│   │   │       └── taskCard.js          # Componente dos cards de missão
│   │   ├── pages/
│   │   │   ├── cronograma.html          # Página do cronograma com as 6 divs diárias
│   │   │   └── telaInicial.html         # Dashboard principal do aluno
│   │   └── css/
│   │       └── cronograma.css           # Estilos visuais integrados
└── INTEGRACAO_TASKS_API_BANCO.md        # Esta documentação
```

---

## 5. Como Executar o Projeto

### 5.1 Iniciar a API
No terminal, dentro da pasta da API:
```bash
cd AprovaDriveAPI
npm install
npm start
```
O servidor inicializa na porta `3000` (ou na porta configurada no `.env`) e conecta diretamente ao PostgreSQL.

### 5.2 Abrir o Front-end
Abra a pasta `AprovaDriveFront` no VS Code e inicie via **Live Server**, ou abra diretamente o arquivo `index.html` ou `src/pages/cronograma.html` no navegador.

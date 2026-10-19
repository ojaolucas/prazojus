# PrazoJus — Sistema de Prazos Judiciais e Requisições Periciais

O **PrazoJus** é uma aplicação web moderna, funcional e projetada para cadastrar requisições judiciais, controlar prazos processuais e organizar vencimentos em um calendário interativo inspirado no **Google Agenda**.

O sistema opera localmente no navegador utilizando **LocalStorage** para persistência e cálculo dinâmico de indicadores, permitindo a futura integração com backend Node.js e banco de dados PostgreSQL.

---

## 🏛️ Identidade Visual e Experiência

- **Ambiente Jurídico**: Design limpo, neutro e institucional, construído com paleta em tons *Slate*, *Navy* e azul judicial, garantindo legibilidade e contraste acessível.
- **Responsividade Total**: Layout adaptável para telas desktop, tablets e celulares, com gaveta móvel para navegação lateral.
- **Feedback Imediato**: Alertas *toast* contextuais, caixas de diálogo de confirmação para ações destrutivas e estados vazios com ilustrações descritivas.

---

## 🛠️ Tecnologias Utilizadas

- **Ambiente de Execução**: Node.js
- **Gerenciador de Pacotes**: npm
- **Framework Front-end**: React com TypeScript
- **Ferramenta de Build**: Vite
- **Estilização**: Tailwind CSS v3
- **Ícones**: Lucide React
- **Persistência**: LocalStorage com versionamento de esquema (`v1.0`)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
Certifique-se de ter o **Node.js** (versão 18+) e o **npm** instalados na sua máquina.

### Passos de Instalação e Execução

1. **Acessar a pasta do projeto**:
   ```bash
   cd prazojus
   ```

2. **Instalar as dependências**:
   ```bash
   npm install
   ```

3. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acessar a aplicação**:
   Abra seu navegador em: [http://localhost:5173](http://localhost:5173)

5. **Build de produção (opcional)**:
   ```bash
   npm run build
   ```

---

## 👥 Contas Demonstrativas e Perfis de Acesso

O sistema dispõe de três perfis fictícios pré-configurados para validação das regras de acesso:

| Perfil | Usuário Fictício | Cargo / Setor | Matrícula | Permissões Principais |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | **Dra. Helena Souza** | Diretora Técnico-Científica | `PJ-00192` | Acesso irrestrito: gestão de usuários, exportação/importação de backups e reset de dados. |
| **Supervisor** | **Dr. Carlos Menezes** | Perito Criminal Chefe de Seção | `PJ-04812` | Gestão pericial: homologa conclusões, cancela requisições e autoriza exclusões. |
| **Operador** | **Lucas Silveira** | Técnico Pericial de Protocolo | `PJ-10943` | Operação básica: cadastra e edita dados, sem permissão para exclusão ou conclusão direta. |

> ⚠️ **Aviso de Demonstração**: A autenticação deste MVP é puramente demonstrativa e executada em memória/LocalStorage. Não utiliza credenciais reais e pode ser alternada com 1 clique pelo menu ou cabeçalho.

---

## 📅 Módulos e Funcionalidades

### 1. Dashboard de Controle
- **Cartões de Indicadores (KPIs)**: Total de requisições, Pendentes, Em andamento, Vencidas, Vencimentos próximos (7 dias) e Concluídas — todos calculados a partir dos dados locais reais.
- **Próximos Prazos**: Tabela cronológica dos vencimentos mais imediatos com contagem regressiva.
- **Alertas Críticos**: Destaque em banner para casos vencidos ou que expiram na data de hoje.
- **Demandas por Setor**: Gráfico percentual da distribuição de trabalho pericial.

### 2. Calendário de Prazos (Estilo Google Agenda)
- **Visualizações**:
  - **Mês**: Grade mensal clássica com chips de status, contagem diária e popover "+X prazos".
  - **Semana**: Colunas diárias detalhadas com cards de processo e horários.
  - **Dia**: Agenda concentrada no expediente do dia selecionado.
- **Navegação Temporal**: Botões Anterior/Próximo e atalho **"Hoje"** para retorno imediato.
- **Filtros Avançados**: Filtragem instantânea por Status, Prioridade, Setor Pericial, Tipo de Exame e Origem Judicial.
- **Interação Rápida**: Clique em qualquer dia vazio para cadastrar uma nova requisição com a data pré-preenchida.

### 3. Cadastro e Gestão de Requisições
- **Campos Obrigatórios**: Número do Processo (padrão CNJ), Descrição detalhada do objeto, Setor solicitante, Prazo judicial limite e Tipo de exame pericial.
- **Campos Opcionais**: Vestígio apreendido, Acusado/Vítima, Protocolo geral, REP (Registro de Entrada de Peças), Origem/Vara e Referências de inquérito/BO.
- **CRUD Completo**: Cadastrar, consultar autos, editar e excluir (com modal de confirmação).
- **Busca Global**: Pesquisa por número do processo, protocolo, REP, partes ou palavras-chave na descrição.

### 4. Regras de Vencimento e Prioridade
- **Status Disponíveis**: *Pendente*, *Em andamento*, *Concluído*, *Vencido*, *Cancelado* e *Aguardando informações*.
- **Vencimento Automático**: Ao ultrapassar a data/hora do prazo, o status é automaticamente promovido para **Vencido**, salvo se já estiver *Concluído* ou *Cancelado*.
- **Prioridade Calculada**:
  - **Urgente**: Vencido ou vencimento em até 24 horas;
  - **Alta**: Vencimento entre 2 e 3 dias;
  - **Média**: Vencimento entre 4 e 7 dias;
  - **Baixa**: Vencimento em mais de 7 dias;
  - **Concluído**: Indicação visual própria (*Laudo Entregue*).
- **Prioridade Manual**: Permite sobrepor a classificação da urgência com valor customizado, mantendo sempre visível a prioridade calculada original para conferência.

### 5. Central de Notificações
- Alertas preventivos baseados em 5 marcos temporais:
  1. 7 dias antes do vencimento;
  2. 3 dias antes do vencimento;
  3. 1 dia antes do vencimento;
  4. No dia do vencimento (0 dias);
  5. Após o vencimento (prazo ultrapassado).
- **Deduplicação Inteligente**: Utiliza chaves determinísticas (`requisicaoId_marco`) para nunca gerar notificações duplicadas para o mesmo evento.
- **Estados Lida/Não Lida**: Filtro e controle para marcar alertas como lidos.

### 6. Armazenamento Local, Backup e Restauração
- **Versionamento de Esquema**: `prazojus_requests_v1` e `prazojus_schema_version`.
- **Exportação JSON**: Download de backup completo estruturado com carimbo de data/hora.
- **Importação JSON**: Suporte para *Substituição Total* ou *Mesclagem* com validação rigorosa dos campos obrigatórios antes da aplicação.
- **Restaurar Demonstração**: Opção de reset para a base inicial com confirmação explícita.

---

## 📂 Estrutura de Pastas do Projeto

```
prazojus/
├── src/
│   ├── types/
│   │   ├── request.ts          # Definições de Requisição, Status, Prioridade e Filtros
│   │   ├── user.ts             # Definições de Usuário, Perfis e Matriz de Permissões
│   │   └── notification.ts     # Interfaces de Notificações e Marcos
│   ├── services/
│   │   ├── deadlineService.ts  # Lógica de cálculo de prazo, prioridade e auto-vencimento
│   │   ├── notificationService.ts # Geração de alertas e deduplicação determinística
│   │   ├── permissionService.ts   # Matriz centralizada de controle de acesso (RBAC)
│   │   └── storageService.ts   # Persistência em LocalStorage, export/import e backup
│   ├── data/
│   │   ├── constants.ts        # Setores periciais, tipos de exames, origens e cores
│   │   ├── mockUsers.ts        # Usuários padrão (Admin, Supervisor, Operador)
│   │   └── mockRequests.ts     # Dados de demonstração calibrados para Outubro/2026
│   ├── context/
│   │   ├── AuthContext.tsx     # Gerenciamento do perfil ativo e checagem de permissões
│   │   ├── RequestContext.tsx  # Estado global de requisições, filtros e notificações
│   │   └── ToastContext.tsx    # Sistema de toasts de notificação visual
│   ├── components/
│   │   ├── auth/
│   │   │   └── DemoLoginModal.tsx # Tela modal de login e alternância de perfis
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx     # Menu lateral responsivo com badges de contagem
│   │   │   ├── Header.tsx      # Barra superior com notificações, perfil e ações
│   │   │   ├── Modal.tsx       # Componente modal reutilizável e acessível
│   │   │   └── ConfirmDialog.tsx # Diálogo de confirmação para ações críticas
│   │   ├── dashboard/
│   │   │   ├── DashboardView.tsx # Visão geral de métricas e painel analítico
│   │   │   ├── MetricCards.tsx # Cartões de indicadores dinâmicos
│   │   │   ├── UpcomingDeadlines.tsx # Lista de próximos prazos com countdown
│   │   │   └── UrgentAlerts.tsx # Alertas de vencidos e urgências do dia
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx # Container do calendário estilo Google Agenda
│   │   │   ├── MonthView.tsx    # Grade mensal com eventos por dia
│   │   │   ├── WeekView.tsx     # Visão semanal em colunas diárias
│   │   │   ├── DayView.tsx      # Visão detalhada da agenda do dia
│   │   │   ├── CalendarEventCard.tsx # Chip estilizado do evento pericial
│   │   │   └── CalendarFilters.tsx  # Barra de filtros dinâmicos da agenda
│   │   ├── requests/
│   │   │   ├── RequestList.tsx  # Tabela com busca ampla, ordenação e filtros
│   │   │   ├── RequestFormModal.tsx # Formulário de cadastro e edição com validação
│   │   │   ├── RequestDetailModal.tsx # Inspeção completa dos autos e tramitação
│   │   │   └── StatusBadge.tsx  # Badges de status e prioridade calculada vs manual
│   │   ├── notifications/
│   │   │   └── NotificationCenter.tsx # Central de notificações com lidas/não lidas
│   │   ├── users/
│   │   │   └── UserManagement.tsx # Lista de contas e matriz explicativa de permissões
│   │   └── settings/
│   │       └── BackupSettings.tsx # Painel de backup JSON e restauração demo
│   ├── App.tsx                 # Componente raiz com roteamento entre abas
│   ├── main.tsx                # Ponto de entrada do React
│   └── index.css               # Diretivas do Tailwind CSS e estilos globais
├── index.html                  # HTML base com fontes e ícones institucionais
├── package.json                # Dependências e scripts do projeto
├── tailwind.config.js          # Configurações de tema e cores judiciais
└── tsconfig.app.json           # Configurações do compilador TypeScript
```

---

## 🔒 Escopo e Limitações do MVP

- **Armazenamento**: O sistema opera no navegador do usuário via LocalStorage. Os dados não sincronizam automaticamente entre múltiplos navegadores ou dispositivos sem a realização de backup/restauração manual.
- **Autenticação**: A autenticação e o controle de acesso por perfis demonstram a hierarquia operacional e a interface adaptativa, sem substituir uma camada de segurança de backend.
- **Dados Fictícios**: Todos os processos, nomes, números de protocolo e vestígios são inventados para fins de demonstração técnica e conformidade com privacidade.

---
name: prazojus-regras-negocio
description: >-
  Use esta skill quando precisar entender, modificar ou auditar as regras de negócio forense do PrazoJus, incluindo fluxo de recebimento, matriz de permissões por perfil, validações de completude cadastral e cálculo de prazos legais (Art. 160 CPP).
---

# Regras de Negócio e Fluxo Operacional Forense — PrazoJus

Este guia detalha a implementação das regras de negócio aplicadas no sistema PrazoJus para garantir a conformidade procedimental da Polícia Científica.

---

## 1. Perfis de Usuário e Restrições de Acesso

### Administrador
- Acesso irrestrito a todos os setores forenses.
- Único autorizado a realizar a **Triagem Rápida** (4 campos obrigatórios: Processo, Setor, Tipo de Exame e Protocolo Geral).
- Único autorizado a **Reatribuir Requisições** entre peritos do mesmo setor.
- Único autorizado a **Excluir** requisições ou resetar a base de dados.
- Pode editar requisições mesmo na fase de "Aguardando recebimento".

### Operacional (Peritos e Técnicos Forenses)
- Acesso delimitado aos seus **setores de lotação** (`currentUser.setores`).
- Pode cadastrar novas requisições diretamente no modo completo para o seu setor.
- Na fila de entrada ("Aguardando recebimento"), **apenas visualiza** a demanda. Não pode editar dados nem alterar status antes de clicar em `[ Receber ]`.
- Após receber a demanda, o servidor assume a responsabilidade técnica e o formulário de preenchimento completo é liberado.
- Só pode editar demandas que estejam sob sua responsabilidade técnica (`isMine`).

### Visualizador (Juizados, Varas, Promotorias, Controle Externo)
- Perfil estritamente de consulta externa.
- **Acesso bloqueado ao Quadro Kanban** (aba oculta na navegação).
- Botões de criação (`+ Nova Requisição`), edição, exclusão e recebimento permanecem ocultos.
- Nunca aparece na listagem de peritos disponíveis para reatribuição.

---

## 2. Validações de Completude Cadastral (100% vs Rascunho)

O sistema calcula a completude técnica baseando-se em 9 campos indispensáveis:
1. Número do Processo Judicial
2. Setor Responsável
3. Descrição / Ofício Requisitório
4. Tipo de Exame Pericial
5. Parâmetros de Prazo (Data de Recebimento, Dias de Prazo, Tipo de Prazo)
6. Origem / Vara Criminal Solicitante
7. Protocolo Geral
8. REP (Registro de Entrada de Procedimento)
9. Anexo em PDF da Peça Requisitória

### Regras do Botão Inteligente de Salvamento:
- **Completude < 100%:** O formulário exibe o botão **`Salvar Rascunho`** (âmbar). Salva o progresso parcial sem exigir os campos que ainda não foram obtidos.
- **Completude = 100%:** O botão se transforma dinamicamente em **`Concluir Cadastro / Salvar`** (azul marinho). Marca `cadastroCompleto: true`.

---

## 3. Bloqueio Mandatório de Conclusão

Nenhuma requisição pode ter seu status alterado para **Concluído** (seja via Kanban drag-and-drop, modal de detalhes ou atalhos) se:
1. `cadastroCompleto !== true` (houver dados pendentes para preencher).
2. Não houver pelo menos um **PDF de comprovação** anexado (laudo pericial finalizado e/ou comprovante de entrega).

No Kanban, cards em execução com pendências exibem **apenas o botão `[ Preencher ]`**. O botão `[ Concluir ]` só surge após a homologação completa dos dados.

---

## 4. Cálculo de Prazos Processuais (Art. 160 do CPP)

- **Prazo Judicial:** Fixado pela autoridade judiciária no ofício requisitório.
- **Sem Prazo Expresso (Meta Interna):** Aplica-se o prazo legal padrão de **10 dias** conforme o Art. 160 do Código de Processo Penal, com justificativa registrada.
- **Contagem Regressiva e Alertas:**
  - `Vencido`: Prazo expirado (alerta vermelho).
  - `Vence Hoje`: Menos de 24 horas restantes (alerta âmbar pulsante).
  - `Próximo (<= 5 dias)`: Alerta de atenção para o perito responsável.

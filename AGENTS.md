# PrazoJus — Diretrizes e Regras do Projeto (AGENTS.md)

Este documento define os padrões arquiteturais, regras de negócio forense, matriz de permissões e diretrizes técnicas para agentes de IA e desenvolvedores que atuam no **PrazoJus** — Sistema de Controle de Prazos Processuais e Requisições Periciais da Polícia Científica de Alagoas (POLCAL).

---

## 1. Visão Geral do Sistema

O **PrazoJus** é um sistema web responsivo desenvolvido para gerenciar o fluxo de entrada, tramitação, execução pericial e homologação de laudos requisitados pelo Poder Judiciário, Ministério Público e Delegacias de Polícia.

- **Público-alvo:** Direção-Geral, Chefias de Seções Periciais, Peritos Criminais e Técnicos Forenses da Polícia Científica.
- **Identidade Visual Oficial (POLCAL):**
  - Azul Marinho Profundo: `#122443`
  - Azul Institucional: `#274578`
  - Dourado / Âmbar de Destaque: `#C5B641`
  - Estados Semânticos: Sucesso (`#10B981` / Emerald), Atenção (`#F59E0B` / Amber), Crítico/Vencido (`#E11D48` / Rose).

---

## 2. Stack Tecnológica e Ferramentas

- **Linguagem & Tipagem:** TypeScript 5+ (modo strict)
- **Frontend Framework:** React 19 (Hooks, Context API, SPA)
- **Build & Bundler:** Vite 8+
- **Estilização:** Tailwind CSS (utilitários semânticos e consistentes)
- **Ícones:** Lucide React
- **Linter & Qualidade:** Oxlint + TypeScript Compiler (`tsc -b`)

---

## 3. Matriz de Perfis e Permissões (RBAC)

O sistema possui 3 perfis de usuário com restrições rigorosas:

| Funcionalidade / Ação | Administrador | Operacional | Visualizador |
| :--- | :---: | :---: | :---: |
| **Triagem Rápida (4 campos)** | Sim | Não | Não |
| **Cadastro Completo (+ Nova Requisição)** | Sim | Sim (do seu setor) | Não |
| **Acesso ao Quadro Kanban** | Sim | Sim | **Não** (Aba oculta) |
| **Receber Demanda ("Fila de Entrada")** | Sim | Sim (do seu setor) | Não |
| **Editar Dados Técnicos** | Sim (Total) | Sim (Apenas demandas recebidas por ele) | Não |
| **Alterar Status Operacional** | Sim | Sim (Apenas após receber e se for dele) | Não |
| **Concluir Requisição (Homologar Laudo)** | Sim (se 100% preenchido + PDF) | Sim (se 100% preenchido + PDF) | Não |
| **Reatribuir Requisição Pericial** | Sim (apenas peritos do mesmo setor) | Não | Não |
| **Excluir Registro / Requisição** | Sim | Não | Não |
| **Auditoria e Backup** | Sim | Não | Não |

### Regras Críticas de Acesso:
1. **Perfil Visualizador:** Consulta somente leitura na lista geral. Nunca vê Kanban, nunca cria, não edita, não conclui nem recebe demandas.
2. **Demanda Aguardando Recebimento:** O usuário Operacional **apenas visualiza** as informações da requisição. Fica bloqueada qualquer edição ou alteração de status até que o botão `[ Receber ]` seja clicado.
3. **Reatribuição de Demanda:** Apenas o Administrador pode reatribuir. O seletor de peritos filtra **estritamente** usuários ativos do setor da demanda, excluindo qualquer usuário com perfil Visualizador.

---

## 4. Ciclo de Vida e Estados da Requisição

Para manter o fluxo limpo, profissional e sem redundâncias, existem apenas **3 colunas e estados principais**:

```
[ 1. Aguardando Recebimento ] ──(Receber / Atribuir)──> [ 2. Em Execução ] ──(Homologar com Laudo PDF)──> [ 3. Concluídas ]
```

### Regras de Transição:
1. **Aguardando Recebimento:** Demanda criada na triagem preliminar sem perito responsável. Fica na fila do setor.
2. **Em Execução:** Assim que um perito recebe a demanda ou ela é transferida a ele, ela entra automaticamente em execução. Não existe botão redundante de "iniciar atendimento".
3. **Bloqueio de Conclusão sem Preenchimento:** **É proibido** mover para "Concluído" (seja via Kanban, modal ou API) enquanto a requisição tiver dados técnicos pendentes (`cadastroCompleto: false`). O card exibe exclusivamente o botão `[ Preencher ]`.
4. **Comprovação Obrigatória:** Para concluir, é obrigatório o upload de pelo menos um PDF comprobatório (laudo pericial e/ou comprovante de entrega).

---

## 5. Padrões de Código e Boas Práticas

1. **Persistência de Dados:**
   - Centralizada exclusivamente em `src/services/storageService.ts` e despachada via `src/context/RequestContext.tsx`.
   - Toda alteração cadastral, de status, anexo ou transferência gera obrigatoriamente um registro em `src/services/auditService.ts`.
2. **Links e Navegação:**
   - Usar formato de links de arquivo `[nome_arquivo.tsx](file:///caminho/completo)`.
3. **Validações antes de Commits:**
   - Sempre executar `npm run build` (`tsc -b && vite build`) para garantir que não há erros de tipagem.
   - Mensagens de commit no padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`).

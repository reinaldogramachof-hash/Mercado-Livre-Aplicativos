# Roteiro de Testes — Gestão Sorveteria & Açaí Pro
**Versão:** 1.0 — 2026-03-19
**Agente executor:** Gemini Pro High (Tier 3)
**Validador final:** Claude (Arquiteto)

---

## Instruções para o Agente Executor

Você é um **QA Sênior simulando um usuário real** — um operador de sorveteria usando o sistema pela primeira vez após ativação. Execute cada caso de teste na ordem indicada. Para cada teste:

1. Siga os passos exatamente como descritos
2. Registre o resultado: `✅ PASS`, `❌ FAIL` ou `⚠️ PARCIAL`
3. Em caso de FAIL, descreva o comportamento real observado
4. Ao final, gere um **Relatório de Resultados** consolidado

**Como acessar o sistema:**
- Abrir `gestao-sorveteria/index.html` no navegador (Chrome/Edge recomendado)
- Servidor local PHP: `php -S localhost:8080` na raiz do projeto
- URL: `http://localhost:8080/gestao-sorveteria/index.html`

**Dados de teste padrão:**
- Chave de licença: usar master mode via `localStorage.setItem('ml_master_mode','true')` no console, depois recarregar
- Ou utilizar a chave de licença fornecida pelo operador

---

## BLOCO 1 — Acesso e Ativação

### T-01 — Login com chave válida
**Módulo:** Airlock / index.html
**Cenário:** Operador recebe a chave de licença e acessa o sistema pela primeira vez.

**Pré-condição:** Sem dados no localStorage (`gestao_sorveteria_v1`)

**Passos:**
1. Abrir `index.html` no navegador
2. Verificar se a tela de login é exibida (não redireciona para o app diretamente)
3. Observar o campo de input da chave de licença e o botão "Desbloquear Acesso"
4. Ativar via console: `localStorage.setItem('ml_master_mode','true')` + F5
5. Verificar se o sistema carrega o Dashboard automaticamente após ativação

**Resultado esperado:**
- Tela de login exibida limpa, sem rastros de marca/CNPJ
- Após ativação, Dashboard é carregado com sidebar visível
- Título da página: "Gestão Sorveteria & Açaí Pro" (ou equivalente)

**Status:** ⬜

---

### T-02 — Header e informações em tempo real
**Módulo:** Header
**Cenário:** Operador verifica o cabeçalho do sistema.

**Passos:**
1. Observar o header (barra superior)
2. Verificar se data atual está sendo exibida (ex: "19/03/2026")
3. Verificar se hora atual está sendo exibida e atualizando
4. Clicar no botão "Venda Rápida" no header
5. Fechar o modal de venda rápida

**Resultado esperado:**
- Data e hora reais exibidas no header
- Modal "Venda Rápida" abre com lista de produtos em estoque
- Modal fecha sem erros ao clicar X ou fora dele

**Status:** ⬜

---

## BLOCO 2 — Dashboard

### T-03 — KPIs do Dashboard com banco vazio
**Módulo:** Dashboard
**Cenário:** Sistema recém-ativado, sem nenhuma venda ou produção cadastrada.

**Passos:**
1. Navegar para o Dashboard (deve ser a view inicial)
2. Observar os 4 KPI cards (Vendas Hoje, Produtos, Produção Hoje, Clientes)
3. Verificar se os valores são `R$ 0,00` / `0` — sem dados fictícios
4. Observar a seção "Últimas Vendas" — deve estar vazia com mensagem

**Resultado esperado:**
- Todos os KPIs mostram zero (dados reais = sem vendas = zero)
- Nenhum dado inventado ou exemplo hardcoded visível

**Status:** ⬜

---

### T-04 — Sistema de Verificação de Freezers
**Módulo:** Dashboard — Freezer Log
**Cenário:** Operador inicia o turno e registra a temperatura dos freezers.

**Passos:**
1. No Dashboard, localizar o card "Verificação de Freezers"
2. Verificar se os 3 freezers padrão estão listados (Freezer Picolés, Sorvetes, Açaí)
3. No campo de temperatura do "Freezer Picolés", digitar `-18`
4. Clicar no botão ✓ (confirmar)
5. Verificar se a última temperatura e horário aparecem no card
6. Repetir para "Freezer Sorvetes" com valor `-20`
7. Repetir para "Freezer Açaí" com valor `-15`
8. Verificar se o KPI "Temp. Média" atualiza no Dashboard

**Resultado esperado:**
- Cada freezer exibe a temperatura inserida + horário do registro
- Nenhum valor gerado automaticamente/aleatoriamente
- KPI de temperatura reflete média dos valores inseridos

**Status:** ⬜

---

### T-05 — Banner de lembrete de verificação de freezer
**Módulo:** Dashboard — Freezer Reminder
**Cenário:** Simular que passou mais de 1 hora sem registro de temperatura.

**Passos:**
1. No console, executar:
   ```javascript
   localStorage.setItem('freezer_reminder_dismissed', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());
   ```
2. Recarregar a página (F5)
3. Observar se o banner âmbar de lembrete aparece no Dashboard
4. Clicar em "Verificar Agora" no banner
5. Verificar se a página rola até o card de freezers

**Resultado esperado:**
- Banner âmbar aparece quando >1h sem registro
- Botão "Verificar Agora" rola suavemente até o card de freezers
- Banner some ao ser descartado (X) ou após nova temperatura ser registrada

**Status:** ⬜

---

## BLOCO 3 — PDV / Frente de Caixa

### T-06 — Cadastrar produto para venda
**Módulo:** Produtos (pré-requisito para PDV)
**Cenário:** Antes de testar o PDV, o operador cadastra produtos no catálogo.

**Passos:**
1. Navegar para "Produtos" via sidebar
2. Clicar em "Novo Produto"
3. Preencher:
   - Código: `SRV001`
   - Nome: `Sorvete de Chocolate`
   - Categoria: `sorvete`
   - Preço de Custo: `3,50`
   - Preço de Venda: `8,00`
   - Estoque: `50`
   - Estoque Mínimo: `10`
   - Unidade: `unidade`
4. Clicar em "Salvar"
5. Repetir e cadastrar mais 2 produtos:
   - `Açaí Médio` / categoria `acai` / R$12,00 / estoque 30
   - `Casquinha Simples` / categoria `casquinha` / R$4,00 / estoque 100

**Resultado esperado:**
- Os 3 produtos aparecem no catálogo após salvar cada um
- Badges de estoque exibem os valores corretos
- Nenhum erro no console

**Status:** ⬜

---

### T-07 — Fluxo completo de venda (PDV)
**Módulo:** PDV / Frente de Caixa
**Cenário:** Operador atende um cliente que compra 2 sorvetes e 1 açaí.

**Pré-condição:** Produtos cadastrados no T-06

**Passos:**
1. Navegar para "Frente de Caixa" via sidebar
2. Verificar se os produtos aparecem nos cards do catálogo
3. Clicar em "Sorvete de Chocolate" → deve aparecer no carrinho com qty 1
4. Clicar novamente em "Sorvete de Chocolate" → qty deve ir para 2
5. Clicar em "Açaí Médio" → adicionar ao carrinho
6. Verificar subtotal: `2 × R$8,00 + 1 × R$12,00 = R$28,00`
7. No campo "Desconto", digitar `3`
8. Verificar se o total passa para `R$25,00`
9. Selecionar forma de pagamento "Dinheiro"
10. No campo "Valor Recebido", digitar `30`
11. Verificar se o troco calculado é `R$5,00`
12. Clicar em "Finalizar Venda"

**Resultado esperado:**
- Carrinho atualiza em tempo real
- Cálculo de desconto e troco corretos
- Notificação de sucesso aparece
- Carrinho é limpo após finalização
- Estoque dos produtos reduz (Sorvete: 50→48, Açaí: 30→29)

**Status:** ⬜

---

### T-08 — Troco para valor acima de R$999,99
**Módulo:** PDV — cálculo de troco (bug fix validation)
**Cenário:** Venda de alto valor para testar o fix do replace global.

**Passos:**
1. Adicionar qualquer produto ao carrinho (ex: 200 × Sorvete = R$1.600,00)
2. Selecionar "Dinheiro"
3. No campo "Valor Recebido", digitar `2000`
4. Verificar se o troco calculado é `R$400,00` (e não um valor errado por bug de replace)

**Resultado esperado:**
- Troco exibido corretamente: `R$ 400,00`
- Sem NaN, sem valor distorcido

**Status:** ⬜

---

### T-09 — Limpar venda e resetar estado
**Módulo:** PDV — clearSale
**Cenário:** Operador cancela a venda antes de finalizar.

**Passos:**
1. Adicionar produtos ao carrinho
2. Inserir desconto de R$5,00
3. Selecionar "PIX" como forma de pagamento
4. Clicar em "Limpar" / "Nova Venda"
5. Verificar estado do PDV após limpeza

**Resultado esperado:**
- Carrinho completamente vazio
- Campo de desconto zerado (`0`)
- Total exibido: `R$ 0,00`
- Forma de pagamento resetada para "Dinheiro"
- Campo "Valor Recebido" limpo

**Status:** ⬜

---

### T-10 — Venda Rápida (Quick Sale)
**Módulo:** PDV — openQuickSaleModal
**Cenário:** Operador usa o atalho de Venda Rápida no header.

**Passos:**
1. Clicar no botão "Venda Rápida" no header (qualquer view)
2. Verificar se o modal abre com produtos em estoque listados
3. Clicar em um produto para adicioná-lo ao carrinho
4. Verificar se o modal fecha e o item está no carrinho (navegando para PDV)

**Resultado esperado:**
- Modal lista até 8 produtos com estoque > 0
- Ao selecionar, item vai para o carrinho do PDV
- Modal fecha automaticamente

**Status:** ⬜

---

## BLOCO 4 — Produção

### T-11 — Registrar nova produção
**Módulo:** Produção
**Cenário:** Operador inicia uma batelada de sorvete no início do turno.

**Passos:**
1. Navegar para "Produção" via sidebar
2. Clicar em "Nova Produção" (ou botão equivalente)
3. Preencher o modal:
   - Produto/Sabor: `Sorvete de Morango`
   - Tipo: `sorvete`
   - Quantidade: `10`
   - Unidade: `litro`
   - Data de Produção: data de hoje
   - Observações: `Batelada matutina`
4. Adicionar 1 ingrediente via "+" :
   - Nome: `Polpa de Morango`
   - Quantidade: `5`
   - Unidade: `kg`
5. Clicar em "Salvar"

**Resultado esperado:**
- Registro aparece na tabela com status "Produzindo"
- KPI "Em Produção" incrementa para 1
- KPI "Ingredientes Usados" exibe `5,0 kg`
- Código PRD gerado automaticamente

**Status:** ⬜

---

### T-12 — Marcar produção como pronta
**Módulo:** Produção — updateProductionStatus
**Cenário:** Sorvete ficou pronto, operador atualiza o status.

**Pré-condição:** T-11 executado

**Passos:**
1. Na tabela de produção, localizar "Sorvete de Morango"
2. Clicar no botão "Pronto" na coluna de ações
3. Verificar mudança de status no badge
4. Verificar se o KPI "Prontos" incrementa

**Resultado esperado:**
- Badge muda de "Produzindo" (amarelo) para "Pronto" (verde)
- Botão "Pronto" some da linha (já está pronto)
- KPI "Prontos" = 1, "Em Produção" = 0

**Status:** ⬜

---

## BLOCO 5 — Estoque

### T-13 — Cadastrar ingrediente via modal
**Módulo:** Estoque — openInventoryItemModal
**Cenário:** Operador cadastra um novo ingrediente recebido na entrega.

**Passos:**
1. Navegar para "Estoque" via sidebar
2. Verificar que a tab "Ingredientes" já está ativa (sem precisar clicar)
3. Clicar em "Novo Ingrediente"
4. Preencher o modal:
   - Nome: `Leite Integral`
   - Categoria: `Leite e Creme`
   - Unidade: `litro`
   - Qtd. Atual: `20`
   - Estoque Mínimo: `5`
   - Custo Unitário: `4,50`
   - Data de Validade: data daqui a 10 dias
5. Clicar em "Salvar Ingrediente"

**Resultado esperado:**
- Modal fecha após salvar
- "Leite Integral" aparece na tab Ingredientes com código ING gerado
- KPI "Ingredientes" incrementa para 1
- Badge de status: "OK" (estoque acima do mínimo)

**Status:** ⬜

---

### T-14 — Alerta de validade
**Módulo:** Estoque — renderExpiryAlerts
**Cenário:** Verificar se itens com validade próxima aparecem no alerta.

**Passos:**
1. Cadastrar um ingrediente com validade para **amanhã**:
   - Nome: `Creme de Leite Teste`
   - Validade: data de amanhã
2. Descer até a seção "Alertas de Validade" na página de Estoque
3. Verificar se "Creme de Leite Teste" aparece no alerta

**Resultado esperado:**
- Seção "Alertas de Validade" lista o item com validade próxima
- Cor/badge indica urgência (laranja = 1-2 dias, amarelo = 3-7 dias)
- Sem itens falsos — apenas os realmente cadastrados

**Status:** ⬜

---

### T-15 — Entrada de estoque via tabela
**Módulo:** Estoque — openStockEntryModal por linha
**Cenário:** Chegou reposição de Leite Integral, operador registra entrada.

**Pré-condição:** T-13 executado

**Passos:**
1. Na tabela de ingredientes, localizar "Leite Integral"
2. Clicar no botão "+" (plus-circle) na coluna de ações
3. Inserir quantidade: `10`
4. Confirmar

**Resultado esperado:**
- Estoque de "Leite Integral" vai de 20 → 30
- Badge permanece "OK"
- Notificação de sucesso exibida

**Status:** ⬜

---

## BLOCO 6 — Temperatura

### T-16 — Registrar temperatura via modal da view Temperatura
**Módulo:** Temperatura
**Cenário:** Operador acessa a aba de temperatura e registra leitura manual.

**Passos:**
1. Navegar para "Temperatura" via sidebar
2. Verificar os cards dos 3 freezers — devem mostrar `--°C` se nunca registrado, ou último valor registrado
3. No card "Freezer Picolés", clicar em "Registrar Temperatura"
4. Verificar se o modal abre com "Freezer Picolés" **pré-selecionado** no dropdown
5. Inserir temperatura: `-19`
6. Inserir nota: `Leitura das 10h`
7. Confirmar

**Resultado esperado:**
- Modal abre com freezer correto pré-selecionado
- Após salvar: card mostra `-19°C` e horário da leitura
- Histórico na tabela abaixo exibe o novo registro
- "Última leitura" no card mostra a hora real (não "Agora" hardcoded)

**Status:** ⬜

---

### T-17 — Gráfico de temperatura (sem dados fictícios)
**Módulo:** Temperatura — renderTemperatureChart
**Cenário:** Verificar que o gráfico não exibe dados falsos.

**Passos:**
1. Acessar a aba Temperatura
2. Observar o gráfico de barras das últimas 24 horas
3. **Se não há registros:** verificar se aparece mensagem "Nenhum registro nas últimas 24 horas" (e não uma reta plana em -18°C)
4. Registrar 2-3 temperaturas via modal
5. Verificar se as barras aparecem apenas nas horas com registro real

**Resultado esperado:**
- Sem registros: mensagem de estado vazio (sem linha -18°C)
- Com registros: barras apenas nos horários onde houve entrada manual
- Horas sem registro: barra vazia (sem valor)

**Status:** ⬜

---

## BLOCO 7 — Clientes e Fornecedores

### T-18 — Cadastrar cliente
**Módulo:** Clientes
**Cenário:** Operador cadastra um cliente fidelidade.

**Passos:**
1. Navegar para "Clientes" via sidebar
2. Clicar em "Novo Cliente"
3. Preencher:
   - Nome: `Maria Santos`
   - Telefone: `(12) 99999-0001`
   - Email: `maria@email.com`
4. Salvar
5. Verificar se o cliente aparece na tabela com 0 pontos

**Resultado esperado:**
- Cliente cadastrado e visível na lista
- Busca por "Maria" filtra o resultado corretamente

**Status:** ⬜

---

### T-19 — Cadastrar fornecedor
**Módulo:** Fornecedores
**Cenário:** Operador cadastra o fornecedor de insumos.

**Passos:**
1. Navegar para "Fornecedores" via sidebar
2. Clicar em "Novo Fornecedor"
3. Preencher:
   - Nome: `Distribuidora Polar Ltda`
   - Contato: `João`
   - Telefone: `(12) 3333-4444`
   - Categoria: `laticínio`
4. Salvar

**Resultado esperado:**
- Fornecedor visível na tabela com badge de categoria

**Status:** ⬜

---

## BLOCO 8 — Relatórios

### T-20 — Relatório com dados reais
**Módulo:** Relatórios
**Cenário:** Após realizar vendas no T-07, o operador consulta o relatório.

**Pré-condição:** T-07 executado (venda de R$28,00 com desconto R$3,00 = R$25,00)

**Passos:**
1. Navegar para "Relatórios" via sidebar
2. Selecionar período "Hoje"
3. Observar os 3 KPI cards:
   - Receita Total
   - Nº de Vendas
   - Ticket Médio

**Resultado esperado:**
- Receita Total: `R$ 25,00` (valor real da venda)
- Nº de Vendas: `1 venda(s)`
- Ticket Médio: `R$ 25,00`
- **Nenhum valor de "Despesas" fictício (40%)**

**Status:** ⬜

---

## BLOCO 9 — Configurações e Backup

### T-21 — Salvar configurações da empresa
**Módulo:** Configurações
**Cenário:** Operador configura o nome da sorveteria no sistema.

**Passos:**
1. Navegar para "Configurações" via sidebar
2. Preencher:
   - Nome: `Sorveteria Polar`
   - Endereço: `Rua das Flores, 123`
   - Telefone: `(12) 3000-0000`
3. Clicar em "Salvar Configurações"
4. Recarregar a página (F5)
5. Navegar de volta para Configurações

**Resultado esperado:**
- Dados persistem após recarregar (salvos no localStorage)
- Notificação de sucesso ao salvar

**Status:** ⬜

---

### T-22 — Backup e restauração
**Módulo:** Configurações — Backup
**Cenário:** Operador gera backup ao fim do dia.

**Passos:**
1. Na aba Configurações, clicar em "Baixar Backup"
2. Verificar se um arquivo `.json` é baixado com nome padrão `ml_sorveteria_backup_YYYY-MM-DD.json`
3. Abrir o arquivo e verificar se contém os dados criados nos testes anteriores (clientes, produtos, vendas)

**Resultado esperado:**
- Arquivo JSON válido baixado
- Contém campos: `products`, `sales`, `clients`, `suppliers`, `inventory`, `production`, `temperatures`

**Status:** ⬜

---

## BLOCO 10 — Navegação e UX

### T-23 — Collapse da sidebar
**Módulo:** Sidebar
**Cenário:** Operador prefere mais espaço de tela e colapsa a sidebar.

**Passos:**
1. Clicar no botão de colapso da sidebar (ícone de seta/chevron)
2. Verificar se a sidebar colapsa para modo icon-only (~68px)
3. Verificar se os labels de navegação desaparecem e apenas ícones ficam visíveis
4. Navegar para outro módulo clicando em um ícone
5. Recarregar a página (F5)
6. Verificar se a sidebar permanece colapsada (estado persistido)
7. Clicar novamente para expandir

**Resultado esperado:**
- Transição suave de colapso
- Navegação funcional em modo colapsado
- Estado persiste após F5 (localStorage)
- Expansão restaura labels

**Status:** ⬜

---

### T-24 — Persistência de dados após F5
**Módulo:** localStorage / db.js
**Cenário:** Garantir que todos os dados sobrevivem a um reload.

**Passos:**
1. Com dados criados nos testes anteriores, pressionar F5
2. Navegar para cada módulo e verificar se os dados persistem:
   - Produtos: 3 cadastrados
   - Clientes: Maria Santos
   - Fornecedores: Distribuidora Polar
   - Vendas: 1 venda de R$25,00
   - Produção: Sorvete de Morango (pronto)
   - Estoque: Leite Integral (30L)

**Resultado esperado:**
- Todos os dados permanecem após reload
- Nenhum módulo volta ao estado zero

**Status:** ⬜

---

### T-25 — Verificação White-Label
**Módulo:** Compliance / Manifesto Lei 1
**Cenário:** Garantir que nenhuma marca, CNPJ ou contato da fábrica é visível.

**Passos:**
1. Inspecionar visualmente todas as views do sistema
2. Verificar header, footer, sidebar, modais, login screen
3. Buscar por: "ML Factory", CNPJ, "Mercado Livre", "Reina", e-mail, telefone da fábrica

**Resultado esperado:**
- Nenhuma referência à identidade do fabricante visível
- Somente conteúdo genérico de sorveteria

**Status:** ⬜

---

## Relatório de Resultados

> Preencher após execução completa

| ID | Módulo | Status | Observação |
|----|--------|--------|------------|
| T-01 | Login / Ativação | ⬜ | |
| T-02 | Header | ⬜ | |
| T-03 | Dashboard KPIs | ⬜ | |
| T-04 | Freezer Log | ⬜ | |
| T-05 | Freezer Reminder | ⬜ | |
| T-06 | Cadastro Produtos | ⬜ | |
| T-07 | PDV — Fluxo completo | ⬜ | |
| T-08 | PDV — Troco > R$999 | ⬜ | |
| T-09 | PDV — Limpar venda | ⬜ | |
| T-10 | Venda Rápida | ⬜ | |
| T-11 | Produção — Registrar | ⬜ | |
| T-12 | Produção — Marcar Pronto | ⬜ | |
| T-13 | Estoque — Novo Ingrediente | ⬜ | |
| T-14 | Estoque — Alerta Validade | ⬜ | |
| T-15 | Estoque — Entrada por linha | ⬜ | |
| T-16 | Temperatura — Modal | ⬜ | |
| T-17 | Temperatura — Gráfico | ⬜ | |
| T-18 | Clientes | ⬜ | |
| T-19 | Fornecedores | ⬜ | |
| T-20 | Relatórios | ⬜ | |
| T-21 | Configurações | ⬜ | |
| T-22 | Backup | ⬜ | |
| T-23 | Sidebar Collapse | ⬜ | |
| T-24 | Persistência F5 | ⬜ | |
| T-25 | White-Label | ⬜ | |

---

## Score Final

```
PASS:    __/25
FAIL:    __/25
PARCIAL: __/25
```

**Classificação:**
- 25/25 — Sistema aprovado para produção ✅
- 22-24/25 — Aprovado com ressalvas (corrigir FAILs antes de publicar) ⚠️
- < 22/25 — Reprovado — reportar bugs ao Claude para novo ciclo de correção ❌

---

## Bugs Encontrados

> Listar aqui cada FAIL com detalhes

| # | Teste | Comportamento Observado | Reproduzível? |
|---|-------|------------------------|---------------|
| | | | |

---

*Documento gerado por Claude (Arquiteto) — ML Factory*
*Executor designado: Gemini Pro High (Tier 3)*

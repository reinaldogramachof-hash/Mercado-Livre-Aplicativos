# Skill: Conversão de Produto SaaS para Vitalício (ML-Conversion)

## Descrição
Esta habilidade descreve o processo passo-a-passo para clonar uma aplicação SaaS existente e refatorá-la para o padrão "Mercado Livre Standalone".

## Workflow de Execução

### Passo 1: Setup do Diretório
1.  Criar pasta `Mercado Livre/[nome-produto]/`.
2.  Criar pasta `Mercado Livre/[nome-produto]/assets/`.
3.  Copiar `css`, `js`, e `img` essenciais da raiz para dentro de `./assets/`.

### Passo 2: Criação do Launcher (Airlock)
1.  Criar `index.html` na pasta do produto.
2.  Implementar formulário de ativação (Input Chave + Email).
3.  **Lógica JS:**
    * POST para `../api_licenca_ml.php?action=activate`.
    * Sucesso: `localStorage.setItem('ml_license', ...)` e `window.location.href = 'app.html'`.

### Passo 3: Adaptação do App (Core)
1.  Copiar o `index.html` original do SaaS e renomear para `app.html`.
2.  **Refatoração de Links:**
    * Substituir referências absolutas/externas por relativas locais.
    * Ex: `src="../../assets/js/app.js"` -> `src="./assets/js/app.js"`.
3.  **Injeção de Segurança:**
    * Adicionar `<script src="lock.js"></script>` na primeira linha do `<head>`.

### Passo 4: Implementação do Lock (Guardião)
1.  Criar `lock.js` na pasta do produto.
2.  **Código Obrigatório:**
```javascript
(function() {
    const key = localStorage.getItem('plena_ml_license');
    if (!key) {
        window.location.href = 'index.html'; // Chuta para o launcher
    }
    // Opcional: Validar fingerprint silenciosamente
})();
```

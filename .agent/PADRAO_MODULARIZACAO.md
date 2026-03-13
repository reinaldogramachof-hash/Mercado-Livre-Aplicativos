# Padrão Ouro de Modularização - Sistemas Local-First

Este documento estabelece as diretrizes para a modularização de sistemas monolíticos (arquivo único) para a arquitetura organizada do ecossistema "Gestão Pro".

## 1. Arquitetura de Diretórios (Estrutura Recomendada)

Para garantir escalabilidade e separação de responsabilidades, siga esta estrutura:

```text
/
├── index.html              # Shell de UI e importação de módulos
├── assets/
│   ├── js/
│   │   ├── db.js           # Camada de persistência (LocalStorage) e Utils
│   │   ├── router.js       # Gerenciamento de navegação SPA
│   │   ├── app.js          # Bootloader e Event Listeners Globais
│   │   └── modules/
│   │       ├── orders.js   # Lógica de Ordens de Serviço
│   │       ├── pdv.js      # Frente de Caixa e Controles de Venda
│   │       ├── clients.js  # Gestão de Clientes e Perfil 360
│   │       └── ...         # Outros módulos específicos
└── assets/css/             # Estilização (Tailwind + Custom CSS)
```

## 2. Camada de Dados (db.js)

O arquivo `db.js` deve ser o primeiro a ser carregado. Ele centraliza:
- **Estado Global**: Objeto `db` carregado do `localStorage`.
- **Preenchimento de Schema**: Uso de `Object.assign({}, defaultDB, parsed)` para garantir que novos campos sejam adicionados a bancos antigos sem quebras.
- **Utilitários Universais**: Funções como `fmtMoney`, `fmtDate`, `getID`, e `showNotification`.

## 3. Padrão de Módulos (JS)

Cada módulo (ex: `pdv.js`) deve seguir estas regras:
1. **Encapsulamento**: Variáveis de estado local (ex: `cart`) devem ser voláteis. Dados permanentes devem ir para o `db`.
2. **Naming Convention**: 
   - `render[NomeDoModulo]`: Principal função de atualização da UI do módulo.
   - `submit[NomeDoModulo]`: Processamento de formulários/ações.
   - `open[NomeDoModulo]Modal`: Gerenciamento de janelas de diálogo.
3. **Automação de Fluxo**: Módulos devem se comunicar via eventos ou chamadas de funções de outros módulos (ex: `usePartsFromOrder()` em `orders.js` chamando `addMovement()` em `inventory.js`).

## 4. Integração SPA (router.js)

O roteamento deve ser baseado em troca de visibilidade de IDs de seção (`display: block/none`). Isso mantém o estado do sistema fluido sem recarregar a página.

## 5. Auditoria de Migração

Ao modularizar um sistema base, a auditoria deve validar:
- **Paridade Funcional**: Garantir que cada linha de lógica do arquivo original existe no novo módulo.
- **Limpeza de Globais**: Evitar que variáveis temporárias do arquivo único poluam o espaço global dos módulos.
- **Integridade de UI**: Verificando se os IDs do HTML modular coincidem com os seletores do JavaScript extraído.

---
*Documentação gerada pelo Agente Auditor Sênior para o ecossistema Mercado Livre Aplicativos.*

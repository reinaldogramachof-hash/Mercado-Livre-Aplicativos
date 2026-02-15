# Receita Mestre - Replicação V11.5 (Stealth Edition)

Este guia define o padrão "Padrão Ouro" para a replicação de sistemas de gestão dentro do ecossistema de venda do Mercado Livre. Todas as novas aplicações devem seguir rigorosamente esta estrutura para garantir segurança, white-label e performance.

## 1. Estrutura de Pastas Obrigatória
Cada sistema deve ser independente e auto-contido na raiz ou em sua respectiva subpasta:

```text
/nome-do-sistema/
├── index.html          # Ponto de entrada (UI Principal)
├── lock.js             # Filtro de Segurança Anti-Loop (V11.3+)
├── manifest.json       # Configuração PWA
├── sw.js               # Service Worker (Cache offline)
├── assets/             # Bibliotecas (Tailwind, Lucide, Fontes)
├── css/                # Estilos customizados
└── js/
    ├── app_core.js     # Lógica Central (CRUD, Store, UI)
    └── tailwind_config.js
```

## 2. Padrão de Segurança (Airlock)
O arquivo `lock.js` deve ser incluído no `<head>` de todas as páginas públicas antes de qualquer outro script.

**Regras de Redirecionamento:**
- Se `plena_license` ou `ml_license_email` estiverem ausentes no `localStorage`, o sistema deve mostrar a `section#view-login`.
- O `lock.js` não deve redirecionar se o `window.location.pathname` já for a página de entrada, para evitar loops infinitos.

## 3. White-Label & Compliance
- **Nomes Sugeridos**: Usar "Gestão [Produto]" em vez de marcas proprietárias.
- **Cores**: Preferir tons de azul profundo, cinza ardósia e preto para um visual profissional e neutro.
- **Remover**: Links externos para sites do desenvolvedor, e-mails pessoais e logos proprietárias.
- **Recibo de Entrega**: Implementar o modal de confirmação de recebimento digital (`confirmReceipt`) que se comunica com `../api_licenca_ml.php`.

## 4. Integração com a API (V11.2+)
Todas as chamadas de ativação devem apontar para a raiz comum:
- URL: `../api_licenca_ml.php?action=activate`
- Payload: `{ license_key, email, device_id }`
- Chave Local: Sempre armazenar em `plena_license`.

## 5. Root Portal (Stealth Mode)
A `index.html` da raiz do domínio deve ser mantida no padrão "Furtivo":
- Fundo: Preto (#000)
- Informação: "Servidor Gestão de Sistemas" + Ponto Verde Pulsante.
- Gatilho Admin: Double-click oculto no canto superior direito para `admin/index.html`.

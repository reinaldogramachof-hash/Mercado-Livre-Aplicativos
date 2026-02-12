# Mercado Livre Factory (ML-F) 🏭

> **Repositório Oficial de Engenharia de Produto - Plena Soluções**

Este repositório contém o ecossistema de conversão e manutenção dos aplicativos "Vitalícios" (Standalone) destinados à venda em escala no Mercado Livre.

## 🎯 Missão
Transformar aplicações SaaS complexas do ecossistema Plena em produtos digitais **autônomos**, **seguros** e **isolados**, operando sem dependência de infraestrutura central (SaaS/CNPJ).

## 📜 As 3 Leis do Mercado Livre (Compliance)

1.  **Lei do White-Label:** O produto entregue **JAMAIS** deve conter links de suporte, logomarcas ou referências externas que desviem a venda. O cliente comprou um software, não um serviço.
2.  **Lei do Isolamento (No Cross-Over):** Uma aplicação ML nunca deve depender de arquivos fora de sua própria pasta local. Links como `../../` são proibidos na versão final.
3.  **Lei da Ativação Única:** O produto usa o modelo "Launcher" com validação local.
    *   `index.html`: Airlock (Validação de Licença).
    *   `app.html`: Aplicação Real (Só acessível após validação).
    *   `lock.js`: Guardião Local.

## 🏗 Arquitetura Técnica

*   **Backend:** PHP 7.4/8.0 (Leve, sem frameworks pesados).
*   **Banco de Dados:** JSON Files (`database_licenses_secure.json`). Zero SQL para facilitar backup e portabilidade pelo cliente final.
*   **Frontend:** Vue.js (CDN/Local), Bootstrap 5, Vanilla JS.
*   **Licenciamento:** Chave Vitalícia Única controlada por `api_licenca_ml.php`.

## 📂 Estrutura de Diretórios

```text
/Mercado Livre
  ├── api_licenca_ml.php          # Cérebro Central (Validador de Licenças)
  ├── database_licenses_secure.json # Banco de Dados de Licenças
  ├── [nome-do-app]/              # Pasta do Produto (Ex: plena-barbearia)
  │   ├── assets/                 # Dependências Locais (CSS/JS/IMG)
  │   ├── index.html              # Launcher (Tela de Ativação)
  │   ├── app.html                # Aplicação Principal (Sistema)
  │   └── lock.js                 # Script de Segurança Local
  └── ...
```

## 🏆 Gold Standard: Plena Barbearia

A pasta `Mercado Livre/plena-barbearia/` é a referência técnica (Gold Standard) de como um aplicativo deve ser estruturado. Ela implementa:
*   Ativação via `index.html`.
*   Redirecionamento seguro para `app.html`.
*   Isolamento total de assets (CSS/JS locais).
*   Bloqueio de segurança via `lock.js` sem dependências externas.

## 🛠 Agente & Automação

Este repositório é gerenciado com auxílio de Agente de IA, seguindo as regras definidas em `.agent/`.

*   **Manifesto:** `.agent/rules/MANIFESTO_OPERACIONAL.md`
*   **Skills:** `.agent/skills/ml_conversion.md` (Workflow de Conversão)

---
*Plena Soluções Digitais - 2026*

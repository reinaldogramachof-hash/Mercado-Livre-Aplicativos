
# Mercado Livre Factory (ML-F) 🏭

> **Repositório Oficial de Engenharia de Produto - Gestão Profissional**

Este repositório contém o ecossistema de conversão e manutenção dos aplicativos "Vitalícios" (Standalone) destinados à venda em escala no Mercado Livre.

## 🎯 Missão
Transformar aplicações complexas em produtos digitais **autônomos**, **seguros** e **isolados**, operando sem dependência de infraestrutura externa, otimizados para o modelo de pagamento único.

## 📜 As 3 Leis do Mercado Livre (Compliance)

1.  **Lei do White-Label:** O produto entregue **JAMAIS** deve conter links de suporte, logomarcas ou referências externas. O cliente adquire um software completo e independente.
2.  **Lei do Isolamento (No Cross-Over):** A aplicação ML deve conter todas as suas dependências localmente. Caminhos absolutos ou links externos para bibliotecas são proibidos.
3.  **Lei da Ativação Única:** O produto usa o modelo "Lock-Airlock" com validação de licença local via PHP/JSON.

## 🏗 Arquitetura Técnica

*   **Core:** HTML5, Tailwind CSS (Local), Vanilla JavaScript.
*   **Tema:** Premium Dark UI (Consistência total em tabelas, modais e relatórios).
*   **PWA:** Service Worker e Manifesto configurados para instalação offline.
*   **Segurança:** Bloqueio via `lock.js` e sistema de licenças standalone.
*   **Recibos:** Geração de recibos térmicos em duas vias (Profissional/Barbearia) com campos de assinatura.

## 📂 Estrutura de Diretórios

```text
/Mercado Livre
  ├── [nome-do-app]/              # Sistema Piloto (Ex: gestao-barbearia)
  │   ├── assets/                 # Dependências Locais (CSS/JS/IMG/Libs)
  │   ├── app.html                # Aplicação Principal (Sistema)
  │   ├── lock.js                 # Script de Segurança Local
  │   ├── sw.js                   # Service Worker (PWA)
  │   └── manifest.json           # Manifesto de Instalação
  ├── _matriz/                    # Repositório de fontes originais
  └── README.md                   # Este documento
```

## 🏆 Gold Standard: Gestão Barbearia

O diretório `Mercado Livre/gestao-barbearia/` é a atual referência técnica de excelência:
*   **Design Premium**: Interface 100% Dark Mode com alto contraste e legibilidade.
*   **PWA Ready**: Totalmente instalável em dispositivos móveis.
*   **Isolamento de Assets**: Tailwind e Lucide carregados localmente do diretório `assets/`.
*   **Evolução Funcional**: Sistema de comissão com impressão térmica duplicada.

## 🛠 Agente & Automação

Este repositório é gerenciado com auxílio de Agente de IA, seguindo padrões rigorosos de auditoria de código e sanitização de branding.

---
*Engenharia de Produto - 2026*

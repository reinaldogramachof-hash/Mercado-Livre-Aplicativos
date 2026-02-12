# Manifesto Operacional: Mercado Livre Factory (ML-F)

## 1. Identidade e Missão
* **Papel:** Engenheiro de Produto Digital & Arquiteto de Software.
* **Missão:** Transformar aplicações SaaS complexas em produtos digitais "Vitalícios" autônomos, seguros e prontos para venda em escala no Mercado Livre.
* **Ambiente:** Este repositório é isolado. Não há conexão com o banco de dados SaaS (CNPJ). Operamos em modo "Standalone" (CPF/Produto Único).

## 2. As 3 Leis do Mercado Livre (Compliance)
1.  **Lei do White-Label:** O produto entregue JAMAIS deve conter links de suporte, logomarcas ou referências à "Plena Soluções" que desviem a venda. O cliente comprou um software, não um serviço.
2.  **Lei do Isolamento (No Cross-Over):** Uma aplicação ML nunca deve depender de arquivos fora de sua própria pasta ou da pasta `assets/` local. Links como `../../` que sobem para níveis de sistema operacional são proibidos.
3.  **Lei da Ativação Única:** O produto usa o modelo "Launcher".
    * `index.html`: Apenas valida a licença (Airlock).
    * `app.html`: Contém o sistema real.
    * A API (`api_licenca_ml.php`) é a única autoridade.

## 3. Arquitetura Técnica
* **Backend:** PHP 7.4/8.0 (Sem Frameworks pesados).
* **Banco de Dados:** JSON Files (`database_licenses_secure.json`). Zero SQL para facilitar backup e portabilidade.
* **Frontend:** Vue.js (CDN ou Local), Bootstrap 5, Vanilla JS.
* **Licenciamento:** Chave Vitalícia Única. Validação via `lock.js` simplificado (apenas status e fingerprint).

## 4. Estrutura de Diretórios Padrão
```text
/Mercado Livre
  /api_licenca_ml.php      (Cérebro Central)
  /database_licenses_secure.json  (Memória)
  /[nome-do-app]/          (O Produto)
      /assets/             (Dependências Locais - CSS/JS)
      /index.html          (Launcher/Ativação)
      /app.html            (Aplicação Real)
      /lock.js             (Guardião Local)
```

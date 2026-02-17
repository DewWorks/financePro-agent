# Finance Expert Agent (Microsserviço)

Este projeto é um microsserviço inteligente construído com **NestJS** e **Google Agent Development Kit (ADK)**. Ele atua como o "cérebro financeiro" da aplicação FinanceApp, orquestrando agentes de IA (Geneini) para fornecer análises, insights e recomendações personalizadas.

## 🚀 Visão Geral

-   **Framework**: NestJS (Modular, Injeção de Dependência)
-   **IA Engine**: Google ADK + Google Gemini (Model: `gemini-1.5-pro`)
-   **Linguagem**: TypeScript
-   **Protocolo**: REST API

## 🛠️ Pré-requisitos

-   Node.js (v18 ou superior)
-   Uma chave de API válida do Google Gemini (Google AI Studio)

## ⚙️ Configuração

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto (copie o exemplo se houver) e adicione sua chave:
    ```env
    GEMINI_API_KEY=sua_chave_aqui_xyz
    PORT=3000
    ```

## ▶️ Como Rodar

### Modo de Desenvolvimento
```bash
npm run start:dev
```

### Modo de Produção
```bash
npm run build
npm run start:prod
```

## 🔌 API Endpoints

### 1. Chat Interativo (`POST /agent/chat`)
Conversa livre com o agente financeiro. O agente tem memória de curto prazo e acesso a ferramentas de cálculo.

**Request:**
```json
POST /agent/chat
Content-Type: application/json

{
  "sessionId": "sessao-usuario-1",
  "message": "Tenho R$ 500 sobrando, devo investir ou pagar dívida?",
  "contextSnapshot": { "dividaTotal": 2000, "jurosDivida": 0.12 }
}
```

**Response:**
```json
{
  "text": "Considerando os juros da sua dívida (12%), recomendo priorizar o pagamento..."
}
```

### 2. Análise Profunda (`POST /agent/analyze`)
Envia o contexto financeiro completo do usuário para uma análise detalhada, gerando insights estruturados.

**Request:**
```json
POST /agent/analyze
Content-Type: application/json

{
  "period": "current_month",
  "userProfile": {
    "name": "Maria",
    "riskProfile": "moderate"
  },
  "financialContext": {
    "monthlyIncome": 5000,
    "transactions": [],
    "activeGoals": []
  }
}
```

## 🏗️ Arquitetura

O projeto segue a arquitetura modular do NestJS:

-   `src/agent`: Módulo principal contendo a lógica do agente.
    -   `AgentService`: Inicializa o Google ADK (`InMemoryRunner`, `LlmAgent`) e gerencia o ciclo de vida do modelo Gemini.
    -   `AgentController`: Expõe os endpoints REST.
-   `src/tools`: Ferramentas que o agente pode usar.
    -   `CalculatorTool`: Garante precisão matemática nas respostas do agente.

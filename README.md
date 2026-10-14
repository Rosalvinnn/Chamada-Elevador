# Elevador Conectado

Sistema web de **monitoramento e atendimento de chamadas** originadas em botões
físicos instalados nos elevadores de uma universidade.

> **Importante:** esta é a **versão 0.1 — demonstração da interface**.
> Todas as chamadas são **simuladas** e o áudio **ainda não funciona de verdade**.

---

## 🎯 Objetivo

Quando uma pessoa pressiona o botão de emergência dentro de um elevador, o
sistema deve avisar a sala de atendimento da universidade. O operador vê de
qual elevador veio a chamada, decide se atende e, somente **depois do
atendimento**, a comunicação de áudio começaria.

Esta primeira etapa entrega apenas a **interface web completa**, com chamadas
simuladas, para que seja possível demonstrar o fluxo de atendimento antes de
integrar o hardware.

---

## ✅ Funcionalidades implementadas

| # | Funcionalidade |
|---|----------------|
| 1 | Três elevadores cadastrados: **Elevador 01, 02 e 03** |
| 2 | Status de cada elevador: **Disponível, Chamando, Em ligação, Desconectado** |
| 3 | **Botão de teste** para simular a chegada de uma chamada |
| 4 | Notificação destacada com o **número e a localização do elevador** |
| 5 | Botão **"Atender chamada"** → status muda para *Em ligação* e abre o painel de chamada ativa |
| 6 | Botão **"Recusar"** → encerra a solicitação e registra no histórico |
| 7 | Botão **"Encerrar chamada"** para finalizar uma ligação em andamento |
| 8 | Cards de resumo (elevadores online, chamadas em espera, chamadas em andamento) atualizados automaticamente |
| 9 | Registro de todas as chamadas no **histórico** (elevador, data, horário, espera, duração e status) |
| 10 | Mensagens de confirmação (avisos flutuantes) e **estados vazios** |
| 11 | Regras de segurança: **não é possível** atender uma chamada inexistente nem iniciar duas chamadas simultâneas |
| 12 | Interface **responsiva** (computador, tablet e celular) e acessível (navegação por teclado, leitores de tela) |

---

## 🛠️ Tecnologias utilizadas

- **Next.js 16** — framework React com rotas automáticas (App Router)
- **React 19** — construção da interface com componentes reutilizáveis
- **JavaScript** (sem TypeScript) — para facilitar o entendimento
- **CSS puro** — estilos responsivos sem bibliotecas extras

O único estado do sistema vive em um **Contexto React**
(`context/CallCenterContext.js`) com um `reducer`, que funciona como uma
máquina de estados centralizada e fácil de testar.

---

## 📁 Estrutura do projeto

```
├── app/
│   ├── layout.js              Layout geral (menu + estado global + avisos)
│   ├── globals.css            Todos os estilos do painel
│   ├── page.js                Dashboard (visão geral)
│   ├── elevadores/page.js     Lista de elevadores e conexões simuladas
│   ├── historico/page.js      Histórico completo de chamadas
│   └── configuracoes/page.js  Preferências do atendimento
├── components/
│   ├── Sidebar.js             Menu lateral de navegação
│   ├── PageHeader.js          Cabeçalho de cada página
│   ├── SummaryCards.js        Cards de resumo
│   ├── CallPanel.js           Chamada recebida / ativa / estado vazio
│   ├── ElevatorCard.js        Card individual de um elevador
│   ├── ElevatorList.js        Lista de todos os elevadores
│   ├── HistoryTable.js        Tabela do histórico
│   ├── StatusBadge.js         Etiqueta colorida de status
│   └── Toast.js               Avisos flutuantes
├── context/
│   └── CallCenterContext.js   Estado global e regras de negócio
└── lib/
    └── data.js                Dados simulados e funções de formatação
```

---

## ▶️ Como executar o projeto localmente

Requisitos: [Node.js](https://nodejs.org) 20 ou superior e npm.

```bash
# 1. Baixar as dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev
```

Depois, abra no navegador: <http://localhost:3000>

Outros comandos úteis:

```bash
npm run build   # gera a versão de produção
npm run start   # inicia a versão de produção
```

### Testando os fluxos

1. No **Dashboard**, clique em **"Simular chamada — Elevador 0X"**.
2. O painel escuro mostra a chamada recebida com o cronômetro de espera.
3. Clique em **"Atender chamada"** → o elevador passa a *Em ligação*.
4. Clique em **"Encerrar chamada"** → a chamada vai para o histórico.
5. Repita o passo 1 e clique em **"Recusar"** → a chamada também entra no
   histórico, com status *Recusada*.
6. Na página **Elevadores**, use "Simular desconexão" para ver o estado
   *Desconectado* (o botão de chamada fica bloqueado).

---

## 🔮 Funcionalidades futuras

- **Raspberry Pi em cada elevador** detectando o botão físico pressionado.
- **Sinalização pela rede** (API/WebSocket) para a chamada chegar ao painel.
- **Áudio bidirecional via WebRTC** somente após o atendimento.
- **Persistência** do histórico em banco de dados.
- **Autenticação** dos operadores e registro de quem atendeu cada chamada.
- **Múltiplos operadores** atendendo chamadas ao mesmo tempo.

---

## 🔒 Segurança

Este projeto **não contém senhas, tokens ou credenciais**. As configurações da
página *Configurações* são mantidas apenas em memória durante a demonstração.

---

## 📄 Licença

Distribuído sob a licença MIT — veja o arquivo [LICENSE](LICENSE).

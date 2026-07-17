# 🤖 AI Business Ops Manager

A **voice-controlled AI Operations Manager** that connects directly to your business's live data — customers, orders, support tickets, CRM leads, deals, emails, and task trackers — and answers questions out loud, in real time. Built with **n8n**, **MCP (Model Context Protocol)**, and a custom voice-first web interface.

Ask it "What are today's pending orders?" or "Any new leads in HubSpot?" — it fetches the real data and speaks the answer back to you.

---

## 📋 Overview

Most business owners juggle multiple tools — a database, a CRM, Gmail, spreadsheets, WhatsApp — just to get a simple status update. This project replaces all of that with **one voice interface**: ask a question, and an AI Agent pulls live data from every connected system and gives you a spoken, straight-to-the-point answer.

It's built as a **hub-and-spoke architecture**: a central AI Agent (the "brain") connects to independent MCP servers (Postgres, HubSpot) as external tool providers, plus direct tool integrations (Google Sheets, Gmail, WhatsApp) — all orchestrated through n8n.

---

## ⚙️ How It Works

```
[Voice Input (Browser)] → [Webhook] → [AI Agent]
                                          ↓
        ┌─────────────────────────────────────────────────────┐
        │                                                       │
   [Postgres MCP Server]                              [HubSpot MCP Server]
   - Get Customers                                     - Get Leads
   - Get Orders                                        - Get Deals
   - Get Support Tickets                                       │
        │                                                       │
        └─────────────────────────┬─────────────────────────────┘
                                   ↓
                    [Google Sheets Tool] — Task Tracker
                    [Gmail Tool] — Today's Emails
                    [WhatsApp Tool] — Send Summary/Notification
                                   ↓
                         [Respond to Webhook]
                                   ↓
                    [Browser: Text-to-Speech Output]
```

### 1️⃣ Frontend — Voice Interface (`index.html`, `script.js`, `styles.css`)
- A sci-fi-styled animated robot avatar (built in SVG) that reacts visually to **listening**, **thinking**, and **speaking** states
- Uses the **Web Speech API** for both voice input (speech-to-text) and voice output (text-to-speech)
- Sends the spoken question to an n8n webhook and speaks back the AI's response
- Strips markdown from responses before speaking, so the voice output sounds natural

### 2️⃣ Backend — n8n Workflow (`AI Business Ops Manager.json`)
- **Webhook** receives the question from the browser
- **Code node** normalizes the incoming payload (handles multiple possible input field names)
- **AI Agent** (GPT-4o-mini) is the central brain — configured to always respond in **PKR/Rs.** for monetary values
- **Simple Memory (Buffer Window)** maintains conversation context across turns
- The agent has access to multiple **tools**:
  - **Postgres MCP Tools** — customers, orders, support tickets
  - **HubSpot MCP Tools** — leads, deals/pipeline
  - **Google Sheets Tool** — business task tracker
  - **Gmail Tool** — today's inbox activity
  - **WhatsApp Tool** — send summaries/notifications directly to the business owner's phone

### 3️⃣ MCP Servers (Modular Tool Providers)
Two separate n8n workflows expose data sources as **MCP tools**, so they can be reused by any AI Agent (not just this one):
- **MCP Server – Postgres** (`MCP Server - Postgres.json`) → customers, orders, support tickets via SQL queries
- **MCP Server – HubSpot** (`MCP Server - HubSpot.json`) → CRM leads and deals

---

## 🧱 Tech Stack

| Component | Tool/Service |
|---|---|
| Workflow Engine | [n8n](https://n8n.io) |
| AI Agent | OpenAI GPT-4o-mini |
| Tool Protocol | MCP (Model Context Protocol) via n8n MCP Trigger/Client |
| Database | PostgreSQL |
| CRM | HubSpot |
| Task Tracking | Google Sheets |
| Email | Gmail API |
| Notifications | WhatsApp Business Cloud API |
| Frontend | HTML, CSS, Vanilla JS |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) |

---

## 🗂️ Repo Structure

```
├── AI Business Ops Manager.json    # Main n8n workflow (webhook + AI Agent + tools)
├── MCP Server - Postgres.json      # MCP server exposing Postgres data as tools
├── MCP Server - HubSpot.json       # MCP server exposing HubSpot data as tools
├── index.html                      # Voice interface UI
├── script.js                       # Voice input/output logic + webhook handling
└── styles.css                      # Sci-fi themed styling for the robot avatar
```

---

## 🚀 Setup Instructions

1. **Import all 3 workflow JSON files** into your n8n instance:
   - `AI Business Ops Manager.json`
   - `MCP Server - Postgres.json`
   - `MCP Server - HubSpot.json`
2. **Connect credentials:**
   - PostgreSQL (customers, orders, support_tickets tables)
   - HubSpot OAuth2
   - Google Sheets OAuth2
   - Gmail OAuth2
   - WhatsApp Business Cloud API
   - OpenAI API key
3. **Activate** all three workflows in n8n.
4. Update the `endpointUrl` fields in the main workflow's MCP Client Tool nodes to match your MCP server URLs.
5. Update `WEBHOOK_URL` in `script.js` to point to your main workflow's webhook.
6. Host `index.html`, `script.js`, and `styles.css` (any static hosting works — GitHub Pages, Netlify, etc.)
7. Open the page, tap the mic, and start asking about your business.

---

## 🎯 Key Features

- ✅ **Fully voice-driven** — no typing, ask and listen
- ✅ **Multi-source data access** — database, CRM, email, sheets, all from one question
- ✅ **Modular MCP architecture** — tool servers can be reused across multiple AI agents/projects
- ✅ **Conversation memory** — follow-up questions retain context
- ✅ **WhatsApp integration** — get summaries pushed directly to your phone
- ✅ **Localized currency handling** — always responds in PKR/Rs., never foreign symbols
- ✅ **Animated visual feedback** — robot avatar reflects listening/thinking/speaking states in real time

---

## 🔮 Future Improvements

- Add authentication so only the business owner can query sensitive data
- Support for more CRMs/data sources (Shopify, Stripe, Notion)
- Persistent conversation history across sessions (not just buffer memory)
- Mobile app wrapper for on-the-go voice queries
- Scheduled proactive summaries (e.g., automatic morning briefing via WhatsApp)

---

## 📄 License

This project is open for personal and commercial use. Attribution appreciated but not required.

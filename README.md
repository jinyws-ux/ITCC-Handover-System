# ITCC Handover System

A web-based handover and task aggregation platform for IT operations teams.

This system is designed for D1, D2, and E shift handovers. It does **not** replace Helix, Jira, Outlook, or AG systems. Instead, it provides one internal TASK entry point that can link related external information together.

## Core goals

- Provide a clear handover dashboard for D1, D2, and E shifts.
- Support non-face-to-face E → D1 handover.
- Track WO, INC, Hypercare, AG ticket, Jira task, Outlook mail, phone tasks, and verbal tasks.
- Allow one internal TASK to link Helix, Jira, Outlook, AG, and attachments.
- Keep task updates, handover records, acknowledgements, acceptance records, and closure history.
- Provide Timeline search for historical review.
- Provide calendar scheduling for D1, D2, E, and Hypercare.
- Provide admin management for users, groups, shifts, factories, systems, and schedule import.

## Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- lucide-react icons

### Backend

- Python Flask
- SQLAlchemy
- SQLite for MVP
- REST API
- Service layer reserved for Helix, Jira, and Outlook integration

## Repository structure

```text
ITCC-Handover-System/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
├── docs/
│   └── ROADMAP.md
└── README.md
```

## Run backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

Backend URL:

```text
http://127.0.0.1:5000
```

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173
```

## Current status

This repository currently contains the first scaffold. See `docs/ROADMAP.md` for the planned development order.

# AI-Powered Personal Expense Manager

A full-stack MERN expense tracker with JWT authentication, transaction CRUD, spending summaries, category breakdowns, and Gemini-powered transaction categorization and financial insights.

## Features
- Register and log in with hashed passwords and JWT authentication.
- Create, view, edit, and delete income and expense transactions.
- Dashboard with current-month income, expenses, balance, and category breakdown.
- Filter transactions by income or expense.
- Gemini AI suggests transaction categories and generates practical spending observations.
- Every transaction is scoped to its authenticated owner.
- Responsive React dashboard with charts.

## Tech stack
React + Vite, Node.js, Express, MongoDB/Mongoose, JWT, bcryptjs, Recharts, and Google Gemini API.

## Project structure
```
client/
  src/                 React dashboard, API client, styles
  package.json
server/
  src/
    config/            MongoDB connection
    middleware/        JWT authentication and error handling
    models/            User and transaction schemas
    routes/            Auth, transactions, AI endpoints
  package.json
README.md
```

## Run locally
Requirements: Node.js 20+, MongoDB (local or Atlas), and npm.

1. Configure and start the backend:
   ```bash
   cd server
   cp .env.example .env
   npm install
   npm run dev
   ```
2. Set `MONGO_URI` and a long random `JWT_SECRET` in `server/.env`. Add `GEMINI_API_KEY` to enable AI features.
3. In a second terminal, configure and start the frontend:
   ```bash
   cd client
   cp .env.example .env
   npm install
   npm run dev
   ```
4. Open http://localhost:5173. The API defaults to http://localhost:5000/api.

## Environment variables

Backend (`server/.env`):
- `PORT`: API port (default 5000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: long, random secret
- `JWT_EXPIRES_IN`: token lifetime (default 7d)
- `GEMINI_API_KEY`: optional Google AI Studio API key
- `GEMINI_MODEL`: optional model name (default gemini-2.0-flash)
- `CLIENT_URL`: allowed frontend origin (default http://localhost:5173)

Frontend (`client/.env`):
- `VITE_API_URL`: API base URL (default http://localhost:5000/api)

## API overview
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/transactions`, `POST /api/transactions`
- `GET /api/transactions/summary`
- `PATCH /api/transactions/:id`, `DELETE /api/transactions/:id`
- `POST /api/ai/categorize`, `POST /api/ai/insights`

Protected endpoints require `Authorization: Bearer <token>`.

## Security and limitations
Never commit real credentials. The Gemini key stays on the server. For production, configure HTTPS, a secure deployment environment, appropriate token storage/rotation, and a managed MongoDB deployment. AI outputs may be inaccurate and are informational rather than professional financial advice. The dashboard currently formats amounts as INR; update the formatter if you want another currency.

## Validation status
The source code has been published to GitHub. It has not yet been installed or executed in your local environment; follow the steps above to verify it with your MongoDB and Gemini configuration.

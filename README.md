# TaskFlow (Angular 20)

TaskFlow is a Team Tasks Management App built with Angular 20. It supports full workflow for login/register, teams, projects, tasks, and comments, with a clean turquoise/green UI and RTL/LTR awareness.

## Features

- Authentication (login/register) with JWT storage in localStorage.
- Teams → Projects → Tasks workflow.
- Task board with drag-and-drop (Angular CDK).
- Comments per task with auto-scroll and focus behavior.
- Automatic 401 handling via HTTP interceptor (logs out and redirects).
- RTL-first UI with LTR overrides for English inputs and labels.

## Tech Stack

- Angular 20 (standalone components + control flow `@if`/`@for`)
- RxJS
- Angular CDK Drag & Drop

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Install

```bash
npm install
```

### Run (Development)

```bash
npm start
```

Open the app at `http://localhost:4200/` (Angular will prompt if a different port is needed).

## API Configuration

The frontend expects the backend API at:

```
http://localhost:3000/api
```

You can change this in:

```
src/environments/environment.ts
```

### Auth Endpoints (expected)

- `POST /auth/login`
- `POST /auth/register`

Additional endpoints are used for teams, projects, tasks, and comments through the services layer in `src/app/services`.

## Scripts

- `npm start` — run dev server
- `npm run build` — production build
- `npm run watch` — build in watch mode
- `npm run test` — unit tests

## Project Structure

```
src/app/
  components/   # login, teams, projects, tasks, comments
  services/     # API services
  guards/       # auth guard
  interceptors/ # JWT + 401 handling
  models/       # data models
```

## UI Notes

- RTL layout by default; LTR classes (`ltr-text`, `ltr-input`) applied where English appears.
- Component styles are in `.css` files only (no inline styles or TS-embedded styles).


# EigoKit School Admin App

Web application for school administrators to manage teachers, students, classes, payments, and branding.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

3. Fill in your environment variables in `.env`:
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_PROJECT_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_key_here  # "Publishable key" in Project Settings > API keys
```

## Running Locally

```bash
npm run dev
```

## Building

```bash
npm run build
```

## Features

- User Management (Teachers, Students, Classes)
- Payment Management
- Custom Branding/Theming
- School Dashboard

## Deployment

Deploy to Vercel, Netlify, Render, or any static hosting service.

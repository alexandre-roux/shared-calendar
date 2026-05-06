# Shared Calendar

A simple collaborative calendar built with React, FullCalendar and Supabase.

The goal of this project is to provide a lightweight shared calendar that can be accessed and edited by anyone who has
the secret URL.

## Features

- Shared calendar with secret URL tokens
- Create events directly from the calendar
- Real-time persistence with Supabase
- Multiple independent calendars using URL tokens
- Month calendar view
- Monday as first day of the week
- Simple deployment with Vercel

## Tech Stack

- React
- Vite
- TypeScript
- FullCalendar
- Supabase

## Local Development

## Requirements

- Node.js
- Yarn

## Install dependencies

```bash
yarn
```

## Environment variables

Create a `.env` file at the root of the project:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Run the project

```bash
yarn dev
```

The application will be available at:

```txt
http://localhost:5173
```

## Shared calendars

Each URL token creates an independent calendar.

Example:

```txt
http://localhost:5173/?token=friends
```

```txt
http://localhost:5173/?token=vacation
```

## Database Setup

Run the following SQL in Supabase:

```sql
create table events
(
    id             uuid primary key default gen_random_uuid(),
    calendar_token text        not null,
    title          text        not null,
    location       text,
    start_at       timestamptz not null,
    end_at         timestamptz,
    notes          text,
    created_at     timestamptz      default now()
);

alter table events enable row level security;

create
policy "Public read events"
on events for
select
    using (true);

create
policy "Public insert events"
on events for insert
with check (true);

create
policy "Public update events"
on events for
update
    using (true);

create
policy "Public delete events"
on events for delete
using (true);
```

## Deployment

The easiest way to deploy the project is with Vercel.

1. Push the project to GitHub
2. Import the repository into Vercel
3. Add the environment variables
4. Deploy

## Important

Anyone with the calendar URL can:

- view events
- create events
- edit events
- delete events

Only share calendar URLs with trusted people.
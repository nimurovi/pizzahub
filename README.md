# PizzaHub — Frontend

## Project Description

**PizzaHub** is a full-stack online pizza and food ordering platform built with Next.js, React, and TypeScript. The platform connects customers with food vendors and provides dedicated dashboards for customers, vendors, and administrators.

This repository contains the frontend application, including the responsive user interface, authentication flows, menu browsing, order management, and role-based dashboards.

## Live Website and Repositories

- **Live Website:** https://pizzahub-dusky-rho.vercel.app
- **Client Repository:** https://github.com/nimurovi/pizzahub.git
- **Server Repository:** https://github.com/nimurovi/pizzahub-server.git

## Important Features

- Responsive website with a modern user interface.
- User registration and login using email/password and Google authentication.
- Role-based dashboards for Admin, Vendor, and Customer.
- Browse food items with category, location, sorting, and pagination filters.
- View individual menu item details, ratings, and reviews.
- Customer order placement and order history.
- Vendor dashboard for managing food items, availability, and incoming orders.
- Admin dashboard for managing users, moderating menu items, and viewing transactions.
- Premium subscription interface for vendors.
- Dark and light mode with saved theme preferences.
- Interactive animations and toast notifications.
- Protected navigation and authentication-aware pages.

## Technology Stack

| Technology / Package | Version / Purpose |
|---|---|
| Next.js | 16.4.6 — React framework |
| React | 19.3.0 — User interface |
| React DOM | 19.3.0 |
| TypeScript | ^5 |
| Tailwind CSS | 4.3.3 — Styling |
| @tailwindcss/turbopack | 4.3.3 |
| Better Auth | ^1.7.26 — Authentication client |
| Motion | ^14.14.0 — Animations |
| Sonner | ^2.0.8 — Notifications |
| ESLint | ^9 — Linting |
| eslint-config-next | 16.4.6 |
| Vercel | Frontend deployment |

## Installation Steps

**Prerequisites:** Node.js, npm, and access to the PizzaHub backend.

1. Clone the frontend repository:

```bash
git clone https://github.com/nimurovi/pizzahub.git
```

2. Navigate into the project directory:

```bash
cd pizzahub
```

3. Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env.local` file in the frontend project root:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000
```

For production deployment:

```dotenv
NEXT_PUBLIC_API_URL=https://pizzahub-server-tawny.vercel.app
```

**Environment Variable Description**

| Variable | Description |
|---|---|
| NEXT_PUBLIC_API_URL | Base URL of the PizzaHub backend API |

Do not place private API keys, passwords, or database credentials in variables prefixed with `NEXT_PUBLIC_`.

## How to Run Locally

Start the backend server first, then run:

```bash
npm run dev
```

Open:

http://localhost:3000

### Production Build

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## Project Structure

```text
pizzahub/
├── app/             # Routes and layouts
├── components/      # Reusable UI components
├── constants/       # Shared constants
├── lib/             # API and authentication utilities
├── public/          # Static assets
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Deployment

The frontend is deployed on Vercel.

Ensure that `NEXT_PUBLIC_API_URL` points to the backend's stable production domain and that the backend allows requests from the frontend's production origin.

**Live Website:** https://pizzahub-dusky-rho.vercel.app
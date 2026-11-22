PizzaHub — Frontend
Project description
PizzaHub is a food-ordering platform frontend. It provides public menu browsing, customer authentication and ordering pages, vendor workspace pages, and an administrator dashboard.
Important features
- Public home page and menu browsing with category/location filters
- Menu item detail pages
- Authentication-aware navigation and role-specific dashboard links
- Customer order pages
- Vendor dashboard, menu management, customer orders, and subscription pages
- Admin dashboard at /dashboard/admin
  - Overview statistics: users, vendors, customers, menu items, pending items, and transactions
  - User search, role filtering, and block/unblock controls
  - Menu moderation: approve, reject, activate, deactivate, and delete
  - Read-only transaction listing
- Shared dark/light mode toggle with saved browser preference
Technology stack
- Next.js 16.4.6
- React 19.3.0
- React DOM 19.3.0
- TypeScript ^5
- Tailwind CSS 4.3.3
- Better Auth ^1.7.26 client integration
- Motion ^14.14.0
- Sonner ^2.0.8 for notifications
- ESLint ^9 and eslint-config-next 16.4.6
Links
- Live website: https://YOUR-LIVE-FRONTEND-URL (replace with the deployed website URL)
- Client repository: https://YOUR-FRONTEND-REPOSITORY-URL (replace with the actual Git repository URL)
- Server repository: https://YOUR-BACKEND-REPOSITORY-URL (replace with the actual Git repository URL)
The actual production URL and repository URLs were not included in the supplied project files. Replace these placeholders before submission.
Installation
Requirements: Node.js and npm.
1. Open a terminal in the frontend directory (the directory containing this README and package.json).
2. Install dependencies:
npm ci
If npm ci reports that package.json and package-lock.json are out of sync, use npm install and review the resulting lockfile change.
Environment variables
Create .env.local in the frontend project root. Copy .env.example and set:
NEXT_PUBLIC_API_URL=http://localhost:5000
Variable	Description
NEXT_PUBLIC_API_URL	Base URL of the PizzaHub backend API


NEXT_PUBLIC_ variables are exposed to browser code. Do not store secrets, passwords, database credentials, or private API keys in this file.
Run locally
Start the development server:
npm run dev
Open http://localhost:3000.

The backend must also be running. See the backend README for its setup.
Available npm scripts
Command	Description
npm run dev	Start the Next.js development server
npm run build	Build the frontend for production
npm run start	Start the production server after building
npm run lint	Run ESLint


Dark/light mode
Use the theme toggle in the shared navigation. The preference is stored in browser localStorage using the key pizzahub-theme. If no saved preference exists, the browser's system color preference is used.
Notes
- Keep .env.local out of Git and shared ZIP files.
- Set NEXT_PUBLIC_API_URL to the deployed backend URL in production.
- Configure the backend CLIENT_URL to match the frontend's exact origin.
- Use HTTPS for production deployments.
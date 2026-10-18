# Library Management System

React (Vite) + Node/Express + MongoDB.

## Run it
Requires Node 18+ and a running MongoDB (local or Atlas).

```bash
# Terminal 1: API
cd server
cp .env.example .env     # edit MONGO_URI if needed
npm install
npm run dev              # http://localhost:5000

# Terminal 2: UI
cd client
npm install
npm run dev              # http://localhost:5173
```

## API
| Method | Route | Purpose |
|---|---|---|
| GET | /api/dashboard | Totals for the dashboard |
| GET/POST | /api/books | List and search (`?q=`), add |
| PUT/DELETE | /api/books/:id | Update, delete |
| GET/POST | /api/students | List and search (`?q=`), add |
| PUT/DELETE | /api/students/:id | Update, delete |
| GET | /api/students/:id/history | Borrowing history |
| GET/POST | /api/issues | List (`?status=open`), issue a book |
| PUT | /api/issues/:id/return | Return a book |

Rules enforced: no issuing when no copies are left, no deleting a book or student with open loans, and available copies update automatically on issue and return.

## Book covers
Covers are uploaded from the Books page (JPG, PNG, WebP or GIF, up to 2 MB) and saved in `server/uploads/`. Back this folder up along with the database.
"# Library_Management_System" 

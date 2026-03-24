# Student Collaboration App (Modular)

This project is now split into:

- `frontend/`: React + TypeScript (Vite)
- `backend/`: Node.js + TypeScript (Express)

## Project Structure

- `frontend/src/App.tsx`: UI app logic
- `frontend/src/api.ts`: API calls to backend
- `frontend/src/types.ts`: shared frontend types
- `backend/src/data.ts`: in-memory seeded data
- `backend/src/app.ts`: Express routes
- `backend/src/server.ts`: backend entrypoint

## Run Locally

1. Install backend dependencies:
   - `npm --prefix backend install`
2. Install frontend dependencies:
   - `npm --prefix frontend install`
3. Start backend:
   - `npm run dev:backend`
4. Start frontend in another terminal:
   - `npm run dev:frontend`

Frontend default URL: `http://localhost:5173`
Backend default URL: `http://localhost:4000`

## Demo Accounts

- Student: `ali@uni.edu` / `student123`
- Supervisor: `noman@uni.edu` / `super123`
- Admin: `admin@uni.edu` / `admin123`

## Notes

- Backend currently uses in-memory data (`backend/src/data.ts`), so restart resets changes.
- Frontend reads bootstrap data and login from backend APIs.
- You can override frontend API URL with `VITE_API_URL` in frontend env.

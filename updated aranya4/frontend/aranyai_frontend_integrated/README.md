# AranyaAI integrated frontend

This keeps the existing HTML/CSS design and connects authentication, recommendations and plantation calculation to the FastAPI backend.

## Run
1. Start the AranyaAI backend on `http://127.0.0.1:8000`.
2. Serve this frontend folder with a simple local HTTP server (do not double-click the HTML files).
3. Open `http://127.0.0.1:5500/index.html` if using VS Code Live Server.

The frontend stores only the JWT access token and current user profile in localStorage; passwords are handled by the backend.

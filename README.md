# NCHU_DRL_HW1

Flask-based Gridworld for HW1 (HW1-1 and HW1-2)

Run locally:

1. Create a virtualenv and install requirements:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

2. Run the app:

```bash
python app.py
```

3. Open http://127.0.0.1:5000 in your browser.

Features:
- Generate n x n grid (n between 5 and 9).
- Click cells to set Start (green), Goal (red), and toggle Obstacles (gray). Max obstacles is n-2.
- "Generate Policy & Evaluate" assigns a random action per cell (↑ ↓ ← →), sends the policy to the server, and returns the state-value V(s) computed by policy evaluation.

Policy / Value Iteration
- Two algorithms are implemented and exposed both in the UI and via endpoints:
	- **Run Policy Iteration**: performs Policy Iteration (Algorithm 1). It repeatedly runs policy evaluation and policy improvement until the policy is stable. The final state-value matrix `V` and deterministic policy `π` (one action per state) are returned and displayed: left is **Value Matrix**, right is **Policy Matrix** (arrows).
	- **Run Value Iteration**: performs Value Iteration (Algorithm 2). It iteratively updates V(s) using the Bellman optimality operator until convergence, then derives the greedy policy from the final V. The results are displayed in the same matrices.

UI Notes
- Workflow: set `n` (5–9) → press **Generate Square** → set Start / Goal / Obstacles with the mode buttons → press one of:
	- **Generate Policy & Evaluate** (random policy, single evaluation),
	- **Run Policy Iteration** (compute optimal policy via policy iteration), or
	- **Run Value Iteration** (compute optimal policy via value iteration).
- The left matrix shows numeric values `V(s)` rounded to 2 decimals; the right matrix shows arrows for the chosen action per state. Obstacles are gray; Start is green; Goal is red (Goal shows `0.00`).

API Endpoints
- `POST /evaluate` — evaluate a provided policy (payload: `{n, start, goal, obstacles, policy}`) and returns `{V}`.
- `POST /policy_iteration` — run policy iteration (payload: `{n, goal, obstacles, gamma?, tol?}`) and returns `{V, policy}`.
- `POST /value_iteration` — run value iteration (payload: `{n, goal, obstacles, gamma?, tol?}`) and returns `{V, policy}`.

Server parameters
- The code uses default step reward = -1 and gamma = 0.9. To change `gamma` or `tol` you can either modify the payload sent from the frontend or edit the defaults in `app.py` in the functions `policy_iteration` and `value_iteration`.

Example: run the app and compute optimal policy
```bash
python app.py
# open http://127.0.0.1:5000
# generate grid, set start/goal/obstacles, click "Run Policy Iteration"
```

If you want, I can also add:
- UI fields for `gamma` and `tol` so you can tune them without editing `app.py`.
- A button to export/import grid + policy as JSON.
<<<<<<< HEAD

Deploying frontend to GitHub Pages (static) while backend runs elsewhere
---------------------------------------------------------------
To have a GitHub Pages URL like `https://<username>.github.io/<repo>/` you need to host the static frontend on GitHub Pages and host the Flask backend on a separate service (e.g., Render, Cloud Run, Heroku). Steps:

1. Deploy the backend (Flask) to a hosting service. Example with Render:
	- Add `gunicorn` and `flask-cors` to `requirements.txt` (already included).
	- In Render create a new Web Service pointing to this repo. Use build command `pip install -r requirements.txt` and start command `gunicorn app:app --bind 0.0.0.0:$PORT`.
	- After deployment you'll get a backend URL like `https://my-backend.onrender.com`.

2. Prepare static frontend for GitHub Pages:
	- We provide `scripts/export_to_docs.py` which copies `templates/index.html` and the `static/` folder into `docs/`.
	- The HTML contains a placeholder `%%BACKEND_URL%%` that the script replaces with your backend URL.

	Example:
	```bash
	python -m venv venv
	venv\Scripts\activate
	pip install -r requirements.txt
	python scripts/export_to_docs.py --backend https://my-backend.onrender.com
	git add docs
	git commit -m "Prepare docs for GitHub Pages"
	git push origin main
	```

3. Enable GitHub Pages:
	- On GitHub, go to your repository Settings → Pages.
	- Set the source to `main` branch and `/docs` folder. Save.
	- The site will be available at `https://<username>.github.io/<repo>/` (may take a minute).

4. CORS: `app.py` enables CORS so the site served from `github.io` can call your backend. Ensure the backend URL used in `export_to_docs.py` is correct.

Notes and alternatives:
- If you prefer a single hosted app (no separate backend), deploy the full Flask app to Render or Cloud Run and use that URL directly (no GitHub Pages). The advantage of GitHub Pages is a free custom static URL under `github.io`.
- If you want, I can: add a GitHub Actions workflow to automatically run `export_to_docs.py` on push and commit the `docs/` changes, or create a CI that deploys the backend image to Cloud Run. Tell me which automation you'd like and I'll add it.

# NCHU_DRL_HW1
=======
>>>>>>> 05767b5e1536705035f6658c1ae92b1a4d0862c6

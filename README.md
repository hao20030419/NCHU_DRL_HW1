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

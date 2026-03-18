from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)


def in_bounds(n, r, c):
    return 0 <= r < n and 0 <= c < n


def next_state(n, r, c, action, obstacles):
    dr = {'up': -1, 'down': 1, 'left': 0, 'right': 0}
    dc = {'up': 0, 'down': 0, 'left': -1, 'right': 1}
    nr, nc = r + dr[action], c + dc[action]
    if not in_bounds(n, nr, nc) or (nr, nc) in obstacles:
        return r, c
    return nr, nc


def compute_distances(n, goal, obstacles):
    """Compute shortest number of steps from each cell to goal using BFS.
    Return matrix of distances (int) or None if unreachable or obstacle.
    """
    obstacle_set = set(tuple(x) for x in obstacles)
    dist = [[None for _ in range(n)] for _ in range(n)]
    if not goal:
        return dist
    gr, gc = tuple(goal)
    from collections import deque
    q = deque()
    if (gr, gc) in obstacle_set:
        return dist
    q.append((gr, gc))
    dist[gr][gc] = 0
    while q:
        r, c = q.popleft()
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in obstacle_set and dist[nr][nc] is None:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    return dist


def evaluate_policy(n, start, goal, obstacles, policy, gamma=0.9, tol=1e-4, max_iter=10000):
    # Initialize V for all states (None for obstacles)
    V = [[0.0 for _ in range(n)] for _ in range(n)]
    obstacle_set = set(tuple(x) for x in obstacles)

    for it in range(max_iter):
        delta = 0.0
        V_new = [row[:] for row in V]
        for r in range(n):
            for c in range(n):
                if (r, c) in obstacle_set:
                    continue
                if goal and (r, c) == tuple(goal):
                    V_new[r][c] = 0.0
                    continue
                key = f"{r},{c}"
                if key not in policy:
                    # treat missing policy as uniform random over 4 actions
                    actions = ['up', 'down', 'left', 'right']
                    val = 0.0
                    for a in actions:
                        nr, nc = next_state(n, r, c, a, obstacle_set)
                        reward = -1.0
                        val += (reward + gamma * V[nr][nc]) / len(actions)
                    V_new[r][c] = val
                else:
                    a = policy[key]
                    nr, nc = next_state(n, r, c, a, obstacle_set)
                    reward = -1.0
                    V_new[r][c] = reward + gamma * V[nr][nc]
                delta = max(delta, abs(V_new[r][c] - V[r][c]))
        V = V_new
        if delta < tol:
            break
    return V


def policy_iteration(n, goal, obstacles, gamma=0.9, tol=1e-4):
    actions = ['up', 'down', 'left', 'right']
    obstacle_set = set(tuple(x) for x in obstacles)
    # initialize policy arbitrarily for all non-obstacle, non-goal states
    policy = {}
    for r in range(n):
        for c in range(n):
            if (r, c) in obstacle_set:
                continue
            if goal and (r, c) == tuple(goal):
                continue
            policy[f"{r},{c}"] = actions[0]

    while True:
        # Policy Evaluation
        V = evaluate_policy(n, None, goal, obstacles, policy, gamma=gamma, tol=tol)

        # Policy Improvement
        policy_stable = True
        for r in range(n):
            for c in range(n):
                if (r, c) in obstacle_set:
                    continue
                if goal and (r, c) == tuple(goal):
                    continue
                key = f"{r},{c}"
                old_action = policy.get(key)
                best_a = old_action
                best_val = -float('inf')
                for a in actions:
                    nr, nc = next_state(n, r, c, a, obstacle_set)
                    reward = -1.0
                    val = reward + gamma * V[nr][nc]
                    if val > best_val:
                        best_val = val
                        best_a = a
                policy[key] = best_a
                if best_a != old_action:
                    policy_stable = False
        if policy_stable:
            break

    return V, policy


def value_iteration(n, goal, obstacles, gamma=0.9, tol=1e-4, max_iter=10000):
    actions = ['up', 'down', 'left', 'right']
    obstacle_set = set(tuple(x) for x in obstacles)
    V = [[0.0 for _ in range(n)] for _ in range(n)]

    for it in range(max_iter):
        delta = 0.0
        V_new = [row[:] for row in V]
        for r in range(n):
            for c in range(n):
                if (r, c) in obstacle_set:
                    continue
                if goal and (r, c) == tuple(goal):
                    V_new[r][c] = 0.0
                    continue
                best_val = -float('inf')
                for a in actions:
                    nr, nc = next_state(n, r, c, a, obstacle_set)
                    reward = -1.0
                    val = reward + gamma * V[nr][nc]
                    if val > best_val:
                        best_val = val
                V_new[r][c] = best_val
                delta = max(delta, abs(V_new[r][c] - V[r][c]))
        V = V_new
        if delta < tol:
            break

    # Derive policy
    policy = {}
    for r in range(n):
        for c in range(n):
            if (r, c) in obstacle_set:
                continue
            if goal and (r, c) == tuple(goal):
                continue
            best_a = None
            best_val = -float('inf')
            for a in actions:
                nr, nc = next_state(n, r, c, a, obstacle_set)
                reward = -1.0
                val = reward + gamma * V[nr][nc]
                if val > best_val:
                    best_val = val
                    best_a = a
            policy[f"{r},{c}"] = best_a

    return V, policy


def compute_optimal_path(n, start, goal, obstacles, policy):
    path = []
    if not start or not goal or not policy:
        return path
        
    r, c = start
    obstacle_set = set(tuple(x) for x in obstacles)
    
    # Preventing infinite loops with a visited set or max steps
    visited = set()
    steps = 0
    max_steps = n * n
    
    curr = (r, c)
    path.append(curr)
    
    while curr != tuple(goal) and steps < max_steps:
        if curr in visited:
            break
        visited.add(curr)
        
        key = f"{curr[0]},{curr[1]}"
        if key not in policy:
            break
            
        action = policy[key]
        nr, nc = next_state(n, curr[0], curr[1], action, obstacle_set)
        
        # If we hit an obstacle or go out of bounds (shouldn't happen with optimal policy but safe to check)
        # next_state returns same state if invalid move
        if (nr, nc) == curr: 
            break
            
        curr = (nr, nc)
        path.append(curr)
        steps += 1
        
    return path


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/evaluate', methods=['POST'])
def evaluate():
    data = request.get_json()
    n = int(data.get('n'))
    start = data.get('start')  # [r, c] or null
    goal = data.get('goal')
    obstacles = data.get('obstacles', [])
    policy = data.get('policy', {})
    gamma = float(data.get('gamma', 0.9))

    V = evaluate_policy(n, start, goal, obstacles, policy, gamma=gamma)
    dist = compute_distances(n, goal, obstacles)
    return jsonify({'V': V, 'dist': dist})


@app.route('/policy_iteration', methods=['POST'])
def policy_iteration_route():
    data = request.get_json()
    n = int(data.get('n'))
    goal = data.get('goal')
    start = data.get('start')
    obstacles = data.get('obstacles', [])
    gamma = float(data.get('gamma', 0.9))
    tol = float(data.get('tol', 1e-4))

    V, policy = policy_iteration(n, goal, obstacles, gamma=gamma, tol=tol)
    dist = compute_distances(n, goal, obstacles)
    path = compute_optimal_path(n, start, goal, obstacles, policy)
    return jsonify({'V': V, 'policy': policy, 'dist': dist, 'path': path})


@app.route('/value_iteration', methods=['POST'])
def value_iteration_route():
    data = request.get_json()
    n = int(data.get('n'))
    goal = data.get('goal')
    start = data.get('start')
    obstacles = data.get('obstacles', [])
    gamma = float(data.get('gamma', 0.9))
    tol = float(data.get('tol', 1e-4))

    V, policy = value_iteration(n, goal, obstacles, gamma=gamma, tol=tol)
    dist = compute_distances(n, goal, obstacles)
    path = compute_optimal_path(n, start, goal, obstacles, policy)
    return jsonify({'V': V, 'policy': policy, 'dist': dist, 'path': path})


if __name__ == '__main__':
    app.run(debug=True)

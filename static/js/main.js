// Backend URL can be configured by setting window.BACKEND_URL in the HTML.
const BACKEND_URL = (window && window.BACKEND_URL) ? window.BACKEND_URL.replace(/\/$/, '') : '';

let n = 5;
let mode = 'start'; // 'start' | 'goal' | 'obs'
let start = null;
let goal = null;
let obstacles = new Set();
let maxObstacles = 0;
let policy = {}; // key "r,c" -> action

const arrows = { up: '↑', down: '↓', left: '←', right: '→' };

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('generateBtn').addEventListener('click', () => {
    const val = parseInt(document.getElementById('nInput').value) || 5;
    if (val < 5 || val > 9) return alert('n must be between 5 and 9');
    n = val;
    start = null;
    goal = null;
    obstacles = new Set();
    maxObstacles = n - 2;
    document.getElementById('obstacleInfo').textContent = `Obstacles left: ${maxObstacles}`;
    createGrid(n);
  });

  document.getElementById('modeStart').addEventListener('click', () => setMode('start'));
  document.getElementById('modeGoal').addEventListener('click', () => setMode('goal'));
  document.getElementById('modeObs').addEventListener('click', () => setMode('obs'));
  document.getElementById('evalBtn').addEventListener('click', evaluatePolicy);
  document.getElementById('policyIterBtn').addEventListener('click', runPolicyIteration);
  document.getElementById('valueIterBtn').addEventListener('click', runValueIteration);

  // initial grid
  maxObstacles = n - 2;
  document.getElementById('obstacleInfo').textContent = `Obstacles left: ${maxObstacles}`;
  createGrid(n);
});


function setMode(m) {
  mode = m;
  document.querySelectorAll('.mode').forEach(b => b.classList.remove('active'));
  if (m === 'start') document.getElementById('modeStart').classList.add('active');
  if (m === 'goal') document.getElementById('modeGoal').classList.add('active');
  if (m === 'obs') document.getElementById('modeObs').classList.add('active');
}


function createGrid(n) {
  const gridWrap = document.getElementById('gridWrap');
  const valueWrap = document.getElementById('valueWrap');
  const policyWrap = document.getElementById('policyWrap');
  gridWrap.innerHTML = '';
  valueWrap.innerHTML = '';
  policyWrap.innerHTML = '';

  // create helper to build table
  function makeTable(idSuffix, cellClass) {
    const table = document.createElement('table');
    table.className = `grid ${cellClass}`;
    table.dataset.type = idSuffix;
    for (let r = 0; r < n; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < n; c++) {
        const td = document.createElement('td');
        td.dataset.r = r;
        td.dataset.c = c;
        td.className = 'cell';
        // for value table, show .val; for policy table, show .arrow
        if (idSuffix === 'value') td.innerHTML = `<div class="val"></div>`;
        else td.innerHTML = `<div class="arrow"></div>`;
        td.addEventListener('click', cellClick);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    return table;
  }

  // single invisible grid used for clicking info (keeps original placement)
  const table = makeTable('interactive', 'interactive-grid');
  gridWrap.appendChild(table);

  const vtable = makeTable('value', 'value-grid');
  valueWrap.appendChild(vtable);

  const ptable = makeTable('policy', 'policy-grid');
  policyWrap.appendChild(ptable);

  // apply existing markers if any
  applyMarkers();
}


function applyMarkers() {
  // clear all classes then apply start/goal/obstacle to all three tables' cells
  const allCells = document.querySelectorAll('td.cell');
  allCells.forEach(td => td.classList.remove('start', 'goal', 'obstacle'));
  obstacles.forEach(key => {
    const [r, c] = key.split(',');
    document.querySelectorAll(`td[data-r='${r}'][data-c='${c}']`).forEach(td => td.classList.add('obstacle'));
  });
  if (start) {
    document.querySelectorAll(`td[data-r='${start[0]}'][data-c='${start[1]}']`).forEach(td => td.classList.add('start'));
  }
  if (goal) {
    document.querySelectorAll(`td[data-r='${goal[0]}'][data-c='${goal[1]}']`).forEach(td => td.classList.add('goal'));
  }
}


function cellClick(e) {
  const td = e.currentTarget;
  const r = parseInt(td.dataset.r);
  const c = parseInt(td.dataset.c);
  const key = `${r},${c}`;
  if (mode === 'start') {
    // clear previous
    if (start) {
      document.querySelectorAll(`td[data-r='${start[0]}'][data-c='${start[1]}']`).forEach(el => el.classList.remove('start'));
    }
    start = [r, c];
    obstacles.delete(key);
    applyMarkers();
    updateObstacleInfo();
  } else if (mode === 'goal') {
    if (goal) {
      document.querySelectorAll(`td[data-r='${goal[0]}'][data-c='${goal[1]}']`).forEach(el => el.classList.remove('goal'));
    }
    goal = [r, c];
    obstacles.delete(key);
    applyMarkers();
    updateObstacleInfo();
  } else if (mode === 'obs') {
    // toggle obstacle
    const isObs = Array.from(document.querySelectorAll(`td[data-r='${r}'][data-c='${c}']`))[0].classList.contains('obstacle');
    if (isObs) {
      obstacles.delete(key);
    } else {
      if (obstacles.size >= maxObstacles) return alert(`最多 ${maxObstacles} 個障礙物`);
      obstacles.add(key);
      // if we placed obstacle on start/goal, clear them
      if (start && start[0] == r && start[1] == c) start = null;
      if (goal && goal[0] == r && goal[1] == c) goal = null;
    }
    applyMarkers();
    updateObstacleInfo();
  }
}


function updateObstacleInfo() {
  const left = Math.max(0, maxObstacles - obstacles.size);
  document.getElementById('obstacleInfo').textContent = `Obstacles left: ${left}`;
}


function generateRandomPolicy() {
  policy = {};
  const actions = ['up', 'down', 'left', 'right'];
  // use interactive grid to iterate available cells
  document.querySelectorAll('table.interactive-grid td.cell').forEach(td => {
    const r = parseInt(td.dataset.r);
    const c = parseInt(td.dataset.c);
    const key = `${r},${c}`;
    if (obstacles.has(key)) return;
    if (goal && goal[0] == r && goal[1] == c) return;
    const a = actions[Math.floor(Math.random() * actions.length)];
    policy[key] = a;
  });
}


async function evaluatePolicy() {
  generateRandomPolicy();
  // render arrows in policy table and clear values in value table
  document.querySelectorAll('table.policy-grid td.cell').forEach(td => {
    const r = parseInt(td.dataset.r);
    const c = parseInt(td.dataset.c);
    const key = `${r},${c}`;
    const arrowEl = td.querySelector('.arrow');
    arrowEl.textContent = '';
    if (obstacles.has(key)) return;
    if (goal && goal[0] == r && goal[1] == c) return;
    if (policy[key]) arrowEl.textContent = arrows[policy[key]];
  });

  // clear value cells while waiting
  document.querySelectorAll('table.value-grid td.cell').forEach(td => {
    const valEl = td.querySelector('.val');
    valEl.textContent = '';
  });

  const obsArray = Array.from(obstacles).map(s => s.split(',').map(x => parseInt(x)));
  const payload = { n, start, goal, obstacles: obsArray, policy };
  const res = await fetch(`${BACKEND_URL}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  const V = data.V;
  // draw values in value-grid
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const td = document.querySelector(`table.value-grid td[data-r='${r}'][data-c='${c}']`);
      if (!td) continue;
      const valEl = td.querySelector('.val');
      const key = `${r},${c}`;
      if (obstacles.has(key)) {
        valEl.textContent = '';
      } else if (goal && goal[0] == r && goal[1] == c) {
        valEl.textContent = '0.00';
      } else {
        valEl.textContent = Number.parseFloat(V[r][c]).toFixed(2);
      }
    }
  }


async function runPolicyIteration() {
  const obsArray = Array.from(obstacles).map(s => s.split(',').map(x => parseInt(x)));
  const payload = { n, goal, obstacles: obsArray };
  const res = await fetch(`${BACKEND_URL}/policy_iteration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  const V = data.V;
  const srvPolicy = data.policy || {};
  // render returned policy and values
  document.querySelectorAll('table.policy-grid td.cell').forEach(td => {
    const r = parseInt(td.dataset.r);
    const c = parseInt(td.dataset.c);
    const key = `${r},${c}`;
    const arrowEl = td.querySelector('.arrow');
    arrowEl.textContent = '';
    if (obstacles.has(key)) return;
    if (goal && goal[0] == r && goal[1] == c) return;
    if (srvPolicy[key]) arrowEl.textContent = arrows[srvPolicy[key]];
  });
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const td = document.querySelector(`table.value-grid td[data-r='${r}'][data-c='${c}']`);
      if (!td) continue;
      const valEl = td.querySelector('.val');
      const key = `${r},${c}`;
      if (obstacles.has(key)) {
        valEl.textContent = '';
      } else if (goal && goal[0] == r && goal[1] == c) {
        valEl.textContent = '0.00';
      } else {
        valEl.textContent = Number.parseFloat(V[r][c]).toFixed(2);
      }
    }
  }
}


async function runValueIteration() {
  const obsArray = Array.from(obstacles).map(s => s.split(',').map(x => parseInt(x)));
  const payload = { n, goal, obstacles: obsArray };
  const res = await fetch(`${BACKEND_URL}/value_iteration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  const V = data.V;
  const srvPolicy = data.policy || {};
  // render returned policy and values
  document.querySelectorAll('table.policy-grid td.cell').forEach(td => {
    const r = parseInt(td.dataset.r);
    const c = parseInt(td.dataset.c);
    const key = `${r},${c}`;
    const arrowEl = td.querySelector('.arrow');
    arrowEl.textContent = '';
    if (obstacles.has(key)) return;
    if (goal && goal[0] == r && goal[1] == c) return;
    if (srvPolicy[key]) arrowEl.textContent = arrows[srvPolicy[key]];
  });
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const td = document.querySelector(`table.value-grid td[data-r='${r}'][data-c='${c}']`);
      if (!td) continue;
      const valEl = td.querySelector('.val');
      const key = `${r},${c}`;
      if (obstacles.has(key)) {
        valEl.textContent = '';
      } else if (goal && goal[0] == r && goal[1] == c) {
        valEl.textContent = '0.00';
      } else {
        valEl.textContent = Number.parseFloat(V[r][c]).toFixed(2);
      }
    }
  }
}
}


import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FrontendPlayground, { SandboxResultPanel } from './FrontendPlayground'
import { useEnrollment, useEnroll, useCompleteTask, useOnboarding } from '../../shared/api/hooks'
import SimOnboarding from './SimOnboarding'
import enigmaLogoImg from '../../assets/enigma-logo.png'

// ── Enigma brand mark — wordmark image, sized by height only ───────────────
function EnigmaLogo({ size = 'md' }) {
  const h = { sm: 'h-5', md: 'h-7', lg: 'h-9' }[size]
  return <img src={enigmaLogoImg} alt="Enigma" className={`${h} w-auto object-contain shrink-0`} />
}

// ── Icon set (SVG, no emoji) ─────────────────────────────────────────────────
const iconProps = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

function MapPinIcon(props) {
  return <svg {...iconProps} {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
}
function UsersIcon(props) {
  return <svg {...iconProps} {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function ArrowLeftIcon(props) {
  return <svg {...iconProps} {...props}><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
}
function LayoutIcon(props) {
  return <svg {...iconProps} {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
}
function MenuIcon(props) {
  return <svg {...iconProps} {...props}><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/></svg>
}
function CloudIcon(props) {
  return <svg {...iconProps} {...props}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h.79a4.5 4.5 0 1 1 1 8.9z"/></svg>
}
function ComponentIcon(props) {
  return <svg {...iconProps} {...props}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
}
function ClipboardIcon(props) {
  return <svg {...iconProps} {...props}><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V2.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5V4"/><path d="M9 11h6M9 15h6"/></svg>
}
function CheckIcon(props) {
  return <svg {...iconProps} {...props}><path d="M20 6 9 17l-5-5"/></svg>
}
function ChevronDownIcon(props) {
  return <svg {...iconProps} {...props}><polyline points="6 9 12 15 18 9"/></svg>
}
function MinimizeIcon(props) {
  return <svg {...iconProps} {...props}><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
}
function RestoreIcon(props) {
  return <svg {...iconProps} {...props}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
}
function LockIcon(props) {
  return <svg {...iconProps} {...props}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
}

export const TASK_ICONS = { 1: LayoutIcon, 2: MenuIcon, 3: CloudIcon, 4: ComponentIcon, 5: ClipboardIcon }

export const TASK_COLORS = {
  1: { bg: 'bg-teal-600',   bgSoft: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200' },
  2: { bg: 'bg-indigo-600', bgSoft: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  3: { bg: 'bg-pink-600',   bgSoft: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200' },
  4: { bg: 'bg-cyan-600',   bgSoft: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200' },
  5: { bg: 'bg-orange-600', bgSoft: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
}

const SUBMISSION_FILENAME = { 1: 'submission.html', 2: 'submission.html', 3: 'submission.js', 4: 'submission.jsx', 5: 'submission.jsx' }
const MONACO_LANGUAGE     = { 1: 'html', 2: 'html', 3: 'javascript', 4: 'javascript', 5: 'javascript' }
const SHOWS_PREVIEW       = { 1: true, 2: true, 3: false, 4: false, 5: false }

// ── Starter code — one per task, a runnable skeleton with TODOs, not a solution ──
const TASK1_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Enigma</title>
  <style>
    /* TODO: style the hero section with Flexbox or Grid */
  </style>
</head>
<body>
  <header>
    <nav>
      <!-- TODO: add at least one link -->
    </nav>
  </header>

  <main>
    <section id="hero">
      <!-- TODO: add exactly one <h1> -->
    </section>
  </main>

  <footer>
    <!-- TODO -->
  </footer>
</body>
</html>
`

const TASK2_STARTER = `<!DOCTYPE html>
<html lang="en">
<head><title>Navigation</title></head>
<body>
  <header>
    <button id="nav-toggle" aria-expanded="false" aria-controls="nav-menu">☰ Menu</button>
    <ul id="nav-menu">
      <li><a href="#" class="nav-link">Home</a></li>
      <li><a href="#" class="nav-link">Docs</a></li>
      <li><a href="#" class="nav-link">Pricing</a></li>
    </ul>
  </header>

  <script>
    // TODO: on click, flip #nav-toggle's aria-expanded ("false" <-> "true")
    // and toggle a class on #nav-menu (e.g. "open")

    // TODO: on click of a .nav-link, add an "active" class to it and
    // remove "active" from the other links
  </script>
</body>
</html>
`

const TASK3_STARTER = `// renderDirectory(container, fetchFn) is called by the grader with a real
// DOM element and a mocked fetch-like function:
//   fetchFn(url) -> Promise<{ json: () => Promise<Array<{ name: string }>> }>

function renderDirectory(container, fetchFn) {
  // TODO: show a loading state immediately — an element with
  // data-testid="loading", set synchronously before you await anything

  // TODO: call fetchFn('/api/team'), then render a
  // <ul data-testid="team-list"> with one <li> per member on success

  // TODO: if the fetch rejects, show an element with data-testid="error"
}

module.exports = { renderDirectory };
`

const TASK4_STARTER = `import React from 'react';

export default function EmployeeList({ data, loading, error }) {
  // TODO: if loading is true, render an element with data-testid="loading"

  // TODO: if error is set, render an element with data-testid="error"
  // containing the error text

  // TODO: otherwise render <ul data-testid="employee-list"> with one
  // item per employee in data

  return null;
}
`

const TASK5_STARTER = `import React, { useState } from 'react';

export default function TaskManager() {
  // TODO: input[data-testid="task-input"] + button[data-testid="add-task"]
  // TODO: ul[data-testid="task-list"] of li[data-testid="task-item"]
  // TODO: each item needs button[data-testid="complete-task"] and
  //       button[data-testid="delete-task"]
  // TODO: persist the tasks array to localStorage under the key "tasks"
  //       (each task: { id, text, completed }) and rehydrate on mount

  return null;
}
`

const SANDBOX_STARTERS = { 1: TASK1_STARTER, 2: TASK2_STARTER, 3: TASK3_STARTER, 4: TASK4_STARTER, 5: TASK5_STARTER }

// ── Tasks ────────────────────────────────────────────────────────────────────
export const TASKS = [
  {
    id: 1,
    week: 1,
    title: 'Task 1 — Landing Hero Section',
    subject: 'New landing page — first impression matters',
    message: `Marketing's been waiting on this for weeks — we need a hero section for the new landing page before the launch newsletter goes out. Semantic HTML and solid CSS layout, nothing fancy yet. No JavaScript needed for this one — I just want a page that reads cleanly and holds together on any screen size.`,
    whatToDo: [
      'Build the page structure with real semantic tags: a <header> containing a <nav>, a <main> with a hero <section>, and a <footer>. No generic <div> soup.',
      'Your <nav> needs at least one visible, readable link — not an empty tag or an icon with no text.',
      'Inside <main>, your hero <section> needs exactly one <h1> — that\'s your headline.',
      'Lay out the hero with CSS Flexbox or Grid in an embedded <style> block (display: flex or display: grid somewhere in your CSS).',
    ],
    whatToSubmit: [
      'A single submission.html file — HTML, and CSS in an embedded <style> block. No separate files, no build step.',
    ],
    hints: [
      "The grader checks for real tags, not classes — it looks for <header>, <main>, <footer>, and a <nav> with at least one <a>. Div-with-a-className-of-\"header\" won't pass.",
      'Exactly one <h1> inside <main> — if you have zero, or more than one, that check fails. Everything else can be <h2> or lower.',
    ],
    modelSolution: {
      solutionSteps: [
        {
          title: 'Structure with real landmarks',
          detail: 'header > nav, main > section#hero, footer — not divs with matching class names. Screen readers and the grader both rely on the actual tag.',
          code: `<header>
  <nav>
    <a href="#hero">Home</a>
    <a href="#features">Features</a>
  </nav>
</header>
<main>
  <section id="hero">
    <h1>Build better, together.</h1>
    <p>Enigma is the workspace your team actually wants to use.</p>
  </section>
</main>
<footer>&copy; 2026 Enigma</footer>`,
        },
        {
          title: 'Lay out the hero with Flexbox or Grid',
          detail: 'Grid is a clean fit for centering a hero block; Flexbox works just as well for the header row. Either satisfies the check — use whichever fits your layout.',
          code: `header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}
#hero {
  display: grid;
  place-items: center;
  min-height: 60vh;
  text-align: center;
}`,
        },
        {
          title: 'Give the nav real, visible link text',
          detail: 'Icon-only or empty links fail accessibility in the real world and fail the automated check here for the same reason — the grader reads each link\'s trimmed text content.',
        },
      ],
      keyPrinciple: 'Semantic HTML is not a style preference — it\'s what makes a page navigable by screen readers, crawlable by search engines, and testable by tools like this one.',
      greatLooksLike: 'A page that reads correctly even with CSS turned off — the HTML structure alone tells you what everything is.',
      fullSolutionCode: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Enigma</title>
<style>
  header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; }
  .hero { display: grid; place-items: center; min-height: 60vh; text-align: center; }
</style>
</head>
<body>
<header>
  <nav>
    <a href="#hero">Home</a>
    <a href="#features">Features</a>
  </nav>
</header>
<main>
  <section id="hero" class="hero">
    <h1>Build better, together.</h1>
    <p>Enigma is the workspace your team actually wants to use.</p>
  </section>
</main>
<footer>&copy; 2026 Enigma</footer>
</body>
</html>`,
    },
    skills: ['Semantic HTML', 'CSS layout', 'Accessibility basics'],
  },
  {
    id: 2,
    week: 1,
    title: 'Task 2 — Interactive Navigation',
    subject: 'Nav needs to actually work on mobile',
    message: `QA flagged that our nav is just static markup right now — no mobile menu, no way to tell which page you're on. Can you wire it up? Standard pattern: a toggle button that opens/closes the menu and stays accessible, plus highlighting whichever link is active. This is vanilla JS — no framework needed yet.`,
    whatToDo: [
      'Your toggle button must have id="nav-toggle", start with aria-expanded="false", and reference aria-controls="nav-menu".',
      'Your menu container must have id="nav-menu" and contain at least two links with class="nav-link".',
      'Clicking the toggle must flip aria-expanded between "true" and "false", and add/remove a CSS class on #nav-menu (however you want to show/hide it).',
      'Clicking a .nav-link must mark that link "active" (add the class active) and remove active from every other link.',
    ],
    whatToSubmit: [
      'A single submission.html file — markup plus an inline <script> at the end of <body>.',
    ],
    hints: [
      'Attach your listeners after the elements exist in the DOM — put your <script> at the end of <body>, or wrap your logic in a DOMContentLoaded listener.',
      'The grader executes your real script in a real DOM and clicks the actual button — console.log-only "it should work" code won\'t pass. Test it by clicking it yourself in the live preview.',
    ],
    modelSolution: {
      solutionSteps: [
        {
          title: 'Wire the toggle button',
          detail: 'Read the current aria-expanded value, flip it, and write it back — don\'t hardcode "true", or a second click won\'t undo the first.',
          code: `var toggle = document.getElementById('nav-toggle');
var menu = document.getElementById('nav-menu');
toggle.addEventListener('click', function () {
  var expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!expanded));
  menu.classList.toggle('open');
});`,
        },
        {
          title: 'Highlight the active link',
          detail: 'Clear "active" from every link first, then add it to only the one that was clicked — otherwise old highlights stick around.',
          code: `var links = menu.querySelectorAll('.nav-link');
links.forEach(function (link) {
  link.addEventListener('click', function () {
    links.forEach(function (l) { l.classList.remove('active'); });
    link.classList.add('active');
  });
});`,
        },
      ],
      keyPrinciple: 'aria-expanded isn\'t decoration — assistive tech reads it to announce whether the menu is open. A visually-correct menu with the wrong aria-expanded value is still broken for screen-reader users.',
      greatLooksLike: 'Click the toggle in the live preview and watch it actually work — menu opens, aria-expanded flips, clicking a link highlights it and only it.',
      fullSolutionCode: `<!DOCTYPE html>
<html>
<head><title>Nav</title></head>
<body>
<header>
  <button id="nav-toggle" aria-expanded="false" aria-controls="nav-menu">Menu</button>
  <ul id="nav-menu">
    <li><a href="#" class="nav-link">Home</a></li>
    <li><a href="#" class="nav-link">Docs</a></li>
    <li><a href="#" class="nav-link">Pricing</a></li>
  </ul>
</header>
<script>
  var toggle = document.getElementById('nav-toggle');
  var menu = document.getElementById('nav-menu');
  toggle.addEventListener('click', function () {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('open');
  });
  var links = menu.querySelectorAll('.nav-link');
  links.forEach(function (link) {
    link.addEventListener('click', function () {
      links.forEach(function (l) { l.classList.remove('active'); });
      link.classList.add('active');
    });
  });
</script>
</body>
</html>`,
    },
    skills: ['DOM events', 'ARIA state', 'Vanilla JavaScript'],
  },
  {
    id: 3,
    week: 2,
    title: 'Task 3 — Fetch & Render Data',
    subject: 'Team directory page — needs to handle real network conditions',
    message: `Next up: the team directory. It pulls from our internal API, which means it can be slow or it can fail — and right now the page just shows a blank screen while it's loading and silently breaks if the request errors. Fix that. Users should always see something meaningful: loading, the data, or a clear error.`,
    whatToDo: [
      'Export a function renderDirectory(container, fetchFn) from submission.js — container is a real DOM element, fetchFn is an injectable fetch-like function so it can be tested without a real network.',
      'The moment renderDirectory is called — before awaiting anything — show a loading element with data-testid="loading".',
      'On success, replace it with a <ul data-testid="team-list"> containing one <li> per team member, showing their name.',
      'On failure (the fetch call rejects), replace the loading state with an element with data-testid="error" — never leave the loading state stuck or throw an uncaught error.',
    ],
    whatToSubmit: [
      'A single submission.js file exporting renderDirectory via module.exports.',
    ],
    hints: [
      'fetchFn behaves like the real fetch: fetchFn(url) returns a Promise that resolves to something with a .json() method (also async). Call .then / await on both steps.',
      'Wrap the fetch + render in a try/catch (or a .catch on the promise chain) — an unhandled rejection means the error state never shows.',
    ],
    modelSolution: {
      solutionSteps: [
        {
          title: 'Show loading synchronously',
          detail: 'Set the loading markup before you call fetchFn, not inside a .then() — the grader checks for it immediately after calling your function, before the fetch resolves.',
          code: `function renderDirectory(container, fetchFn) {
  container.innerHTML = '<p data-testid="loading">Loading...</p>';
  return fetchFn('/api/team')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var items = data.map(function (m) { return '<li>' + m.name + '</li>'; }).join('');
      container.innerHTML = '<ul data-testid="team-list">' + items + '</ul>';
    })
    .catch(function () {
      container.innerHTML = '<p data-testid="error">Failed to load team directory.</p>';
    });
}`,
        },
        {
          title: 'Return the promise',
          detail: 'Returning the chain lets the caller (and the grader) await completion instead of racing the render. Small detail, but it\'s the difference between a flaky test and a reliable one.',
        },
      ],
      keyPrinciple: 'Every async UI has three states: loading, success, and error. Shipping only the success state is the single most common frontend bug in real production code.',
      greatLooksLike: 'The function never leaves the user staring at a blank screen, no matter what the network does.',
      fullSolutionCode: `function renderDirectory(container, fetchFn) {
  container.innerHTML = '<p data-testid="loading">Loading...</p>';
  return fetchFn('/api/team')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var items = data.map(function (m) { return '<li>' + m.name + '</li>'; }).join('');
      container.innerHTML = '<ul data-testid="team-list">' + items + '</ul>';
    })
    .catch(function () {
      container.innerHTML = '<p data-testid="error">Failed to load team directory.</p>';
    });
}

module.exports = { renderDirectory };`,
    },
    skills: ['Async/await', 'Error handling', 'Loading states'],
  },
  {
    id: 4,
    week: 2,
    title: 'Task 4 — React Component',
    subject: 'Port the directory to React — we\'re migrating the whole app',
    message: `Good news: the vanilla-JS directory page works, and now we're porting it into the new React shell. Convert what you built into a proper component. Same three states as before — loading, error, data — but now driven by props instead of manual DOM writes.`,
    whatToDo: [
      'Default-export a functional component EmployeeList({ data, loading, error }) from submission.jsx.',
      'When loading is true, render an element with data-testid="loading".',
      'When error is set (a non-empty string), render an element with data-testid="error" whose text is the error message.',
      'Otherwise, render a <ul data-testid="employee-list"> with one entry per item in data, showing each person\'s name.',
    ],
    whatToSubmit: [
      'A single submission.jsx file, default-exporting EmployeeList.',
    ],
    hints: [
      'Check loading and error before falling through to the list — order matters, since data could theoretically be set alongside loading during a refetch.',
      'The grader renders your component directly with React Testing Library and checks for these three states independently — you don\'t need to fetch anything yourself, the parent owns that.',
    ],
    modelSolution: {
      solutionSteps: [
        {
          title: 'Branch on loading and error first',
          detail: 'A component with three possible outputs should make each one an explicit early return — much easier to reason about than nested ternaries.',
          code: `export default function EmployeeList({ data, loading, error }) {
  if (loading) {
    return <p data-testid="loading">Loading...</p>;
  }
  if (error) {
    return <p data-testid="error">{error}</p>;
  }
  return (
    <ul data-testid="employee-list">
      {(data || []).map(function (emp) {
        return <li key={emp.id}>{emp.name} — {emp.role}</li>;
      })}
    </ul>
  );
}`,
        },
        {
          title: 'Props, not state',
          detail: 'This component doesn\'t fetch anything itself — the loading/error/data values are handed to it. That\'s the whole point of the React conversion: separate "how do we get data" from "how do we display it."',
        },
      ],
      keyPrinciple: 'A component that receives loading/error/data as props instead of managing its own fetch is easier to test, easier to reuse, and easier to reason about — this is the props-vs-state distinction in practice.',
      greatLooksLike: 'The exact same three states as Task 3, now expressed declaratively instead of with manual innerHTML writes.',
      fullSolutionCode: `import React from 'react';

export default function EmployeeList({ data, loading, error }) {
  if (loading) {
    return <p data-testid="loading">Loading...</p>;
  }
  if (error) {
    return <p data-testid="error">{error}</p>;
  }
  return (
    <ul data-testid="employee-list">
      {(data || []).map(function (emp) {
        return <li key={emp.id}>{emp.name} — {emp.role}</li>;
      })}
    </ul>
  );
}`,
    },
    skills: ['React components', 'Props', 'Conditional rendering'],
  },
  {
    id: 5,
    week: 3,
    title: 'Task 5 — Task Manager App',
    subject: 'The capstone — a real stateful feature, start to finish',
    message: `Last one, and it's the real deal: a task manager. Add tasks, mark them complete, delete them — and it needs to survive a page reload, so whatever you build has to actually persist. This is the closest thing to a real feature ticket you'll get in this simulation. Take your time and build it properly.`,
    whatToDo: [
      'Default-export a functional component TaskManager from submission.jsx — no props needed, it\'s self-contained.',
      'Render an input[data-testid="task-input"] and a button[data-testid="add-task"] that adds a new task from the input\'s current value.',
      'Render a ul[data-testid="task-list"] of li[data-testid="task-item"] — one per task, showing its text.',
      'Each task item needs a button[data-testid="complete-task"] that toggles that task\'s completed state, and a button[data-testid="delete-task"] that removes it.',
      'Persist the tasks array to localStorage under the key "tasks" (as JSON: an array of { id, text, completed }) every time it changes, and rehydrate from localStorage on first mount.',
    ],
    whatToSubmit: [
      'A single submission.jsx file, default-exporting TaskManager.',
    ],
    hints: [
      'Initialize your useState from localStorage directly (a lazy initializer function), and use a useEffect that writes to localStorage whenever the tasks array changes — that combination covers both "persist" and "rehydrate."',
      'Give each task a stable, unique id when you create it — you\'ll need it to toggle/delete the right one later, and as a React key.',
    ],
    modelSolution: {
      solutionSteps: [
        {
          title: 'Load from localStorage on mount, save on every change',
          detail: 'A lazy useState initializer runs once, reading whatever was persisted last time. The useEffect keyed on [tasks] keeps localStorage in sync going forward.',
          code: `function loadTasks() {
  try {
    return JSON.parse(window.localStorage.getItem('tasks') || '[]');
  } catch (e) {
    return [];
  }
}

const [tasks, setTasks] = useState(loadTasks);

useEffect(function () {
  window.localStorage.setItem('tasks', JSON.stringify(tasks));
}, [tasks]);`,
        },
        {
          title: 'Add, toggle, and delete — always through setTasks with a function updater',
          detail: 'Using the functional form of setTasks (prev => ...) avoids stale-closure bugs when multiple updates happen in quick succession.',
          code: `function addTask() {
  if (!text.trim()) return;
  setTasks(function (prev) {
    return prev.concat([{ id: String(Date.now()), text: text, completed: false }]);
  });
  setText('');
}

function toggleTask(id) {
  setTasks(function (prev) {
    return prev.map(function (t) {
      return t.id === id ? Object.assign({}, t, { completed: !t.completed }) : t;
    });
  });
}

function deleteTask(id) {
  setTasks(function (prev) { return prev.filter(function (t) { return t.id !== id; }); });
}`,
        },
      ],
      keyPrinciple: 'State that needs to survive a reload has to be written somewhere outside of React\'s memory — localStorage is the simplest option, but the pattern (load once, save on every change) is the same one you\'d use for any persistence layer.',
      greatLooksLike: 'Add a few tasks, reload the live preview tab (or come back later), and they\'re still there — that round-trip is the actual test of "done."',
      fullSolutionCode: `import React, { useState, useEffect } from 'react';

function loadTasks() {
  try {
    return JSON.parse(window.localStorage.getItem('tasks') || '[]');
  } catch (e) {
    return [];
  }
}

export default function TaskManager() {
  const [tasks, setTasks] = useState(loadTasks);
  const [text, setText] = useState('');

  useEffect(function () {
    window.localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  function addTask() {
    if (!text.trim()) return;
    setTasks(function (prev) {
      return prev.concat([{ id: String(Date.now()) + Math.random(), text: text, completed: false }]);
    });
    setText('');
  }

  function toggleTask(id) {
    setTasks(function (prev) {
      return prev.map(function (t) {
        return t.id === id ? Object.assign({}, t, { completed: !t.completed }) : t;
      });
    });
  }

  function deleteTask(id) {
    setTasks(function (prev) { return prev.filter(function (t) { return t.id !== id; }); });
  }

  return (
    <div>
      <input data-testid="task-input" value={text} onChange={function (e) { setText(e.target.value); }} />
      <button data-testid="add-task" onClick={addTask}>Add</button>
      <ul data-testid="task-list">
        {tasks.map(function (t) {
          return (
            <li data-testid="task-item" key={t.id}>
              <span>{t.text}</span>
              <button data-testid="complete-task" onClick={function () { toggleTask(t.id); }}>Done</button>
              <button data-testid="delete-task" onClick={function () { deleteTask(t.id); }}>Delete</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}`,
    },
    skills: ['React hooks', 'State management', 'localStorage persistence'],
  },
]

// ── Final assessment — 5 cumulative questions across all 3 weeks, shown once ──
// after Task 5 instead of the certificate. A different flow from any per-task
// quiz (frontend-dev-sim has none — every task completes via the sandbox).
const FINAL_ASSESSMENT = [
  {
    q: 'Why use <header>, <nav>, <main>, and <footer> instead of <div> elements with matching class names?',
    options: [
      'They render faster in the browser',
      'They give the page meaningful structure for screen readers and search engines — divs carry no semantic meaning',
      'They are required by the HTML5 spec for a page to be valid',
      'They automatically apply default browser styling that looks better',
    ],
    correct: 1,
  },
  {
    q: 'What is the correct, accessible way to implement a toggle-able mobile menu button?',
    options: [
      'Just hide/show the menu with CSS — no JavaScript needed',
      'Toggle a CSS class on the menu, and keep the button\'s aria-expanded attribute in sync with the menu\'s open/closed state',
      'Use a <select> dropdown instead of a button',
      'Reload the page with a different URL when the button is clicked',
    ],
    correct: 1,
  },
  {
    q: 'A component fetches data from an API. Which of these is the most correct UI to build?',
    options: [
      'Only render the data once it arrives — showing nothing until then is simplest',
      'Show a loading state while the request is pending, the data on success, and a distinct error state on failure',
      'Show an error message immediately, in case the request fails',
      'Retry the request silently forever until it succeeds',
    ],
    correct: 1,
  },
  {
    q: 'A React component needs to display "loading" and "error" states, but doesn\'t fetch any data itself. How should those states reach it?',
    options: [
      'As props, passed down from whatever component owns the fetch',
      'As local state initialized to false',
      'Via a global variable set from outside React',
      'It should call fetch itself so it always has the freshest state',
    ],
    correct: 0,
  },
  {
    q: 'You need a piece of React state to survive a full page reload. What\'s the correct pattern?',
    options: [
      'Increase the component\'s re-render frequency so state updates propagate faster',
      'Store it only in a useRef, since refs persist between renders',
      'Initialize useState by reading from localStorage, and add a useEffect that writes back to localStorage whenever the state changes',
      'Nothing needed — React state persists across reloads automatically',
    ],
    correct: 2,
  },
]

function CertificateView({ onBack }) {
  const navigate = useNavigate()
  return (
    <div className="max-w-container mx-auto px-6 py-8 flex flex-col items-center">
      <div className="card max-w-2xl w-full text-center py-12 px-10">
        <div className="text-5xl mb-4">🏆</div>
        <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">Certificate of Completion</p>
        <h1 className="text-2xl font-bold text-on-surface mb-1">Frontend Developer</h1>
        <p className="text-sm text-on-surface-variant mb-6">Job Simulation · Enigma</p>
        <div className="w-16 h-px bg-border mx-auto mb-6" />
        <p className="text-sm text-on-surface leading-relaxed mb-8">
          This certifies completion of the Frontend Developer Job Simulation, demonstrating
          hands-on experience building semantic, accessible HTML/CSS layouts, adding vanilla
          JavaScript interactivity, handling async data with proper loading/error states, and
          building stateful React components with hooks and persistence.
        </p>
        <div className="bg-surface-low rounded-xl p-4 text-left mb-8">
          <p className="text-xs font-bold text-on-surface mb-2">LinkedIn shareable summary</p>
          <p className="text-xs text-on-surface-variant leading-relaxed italic">
            "Completed a virtual job simulation as a Frontend Developer: built a responsive
            landing page, wired up accessible interactive navigation, fetched and rendered
            live data with proper error handling, and shipped a stateful React task-manager
            app with localStorage persistence — all graded against real automated tests."
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button className="btn-primary px-6 py-2.5" onClick={() => navigate('/portfolio')}>
            Add to Portfolio
          </button>
          <button className="btn-secondary px-5 py-2.5" onClick={onBack}>
            Review Tasks
          </button>
        </div>
      </div>
      <button onClick={() => navigate('/simulations/frontend-dev-sim/overview')} className="mt-6 text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
        ← Back to Overview
      </button>
    </div>
  )
}

function FinalAssessmentView({ onComplete }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const correct = FINAL_ASSESSMENT.filter((q, i) => answers[i] === q.correct).length
  const pct = Math.round((correct / FINAL_ASSESSMENT.length) * 100)

  return (
    <div className="max-w-container mx-auto px-6 py-8 flex flex-col items-center">
      <div className="card max-w-2xl w-full py-8 px-8">
        <div className="text-center mb-6 pb-5 border-b border-border">
          <div className="text-3xl mb-2">📝</div>
          <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">Final Assessment</p>
          <h1 className="text-xl font-bold text-on-surface">Before your certificate — a quick check</h1>
          <p className="text-sm text-on-surface-variant mt-1.5">5 questions covering everything from Week 1 through Week 3.</p>
        </div>

        <div className="space-y-7">
          {FINAL_ASSESSMENT.map((q, qi) => {
            const chosen = answers[qi]
            return (
              <div key={qi}>
                <p className="text-sm font-semibold text-on-surface mb-3 leading-snug">
                  <span className="text-primary mr-1.5">{qi + 1}.</span>{q.q}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isChosen = chosen === oi
                    const isCorrect = oi === q.correct
                    let base = 'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-start gap-3 '
                    let dot = 'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold '
                    if (submitted) {
                      if (isCorrect) { base += 'bg-green-50 border-green-400 text-green-800'; dot += 'border-green-500 bg-green-500 text-white' }
                      else if (isChosen) { base += 'bg-red-50 border-red-300 text-red-700'; dot += 'border-red-400 bg-red-400 text-white' }
                      else { base += 'bg-surface-low border-border text-on-surface-variant opacity-60'; dot += 'border-border' }
                    } else {
                      if (isChosen) { base += 'bg-primary/8 border-primary text-on-surface'; dot += 'border-primary bg-primary text-white' }
                      else { base += 'bg-surface-low border-border hover:border-primary/40 text-on-surface-variant'; dot += 'border-border' }
                    }
                    return (
                      <button key={oi} disabled={submitted} onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))} className={base}>
                        <span className={dot}>{submitted && isCorrect ? '✓' : submitted && isChosen ? '✗' : String.fromCharCode(65 + oi)}</span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    )
                  })}
                </div>
                {submitted && chosen !== q.correct && (
                  <p className="text-xs text-green-700 mt-2 ml-1">✓ Correct answer: {q.options[q.correct]}</p>
                )}
              </div>
            )
          })}
        </div>

        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(answers).length < FINAL_ASSESSMENT.length}
            className="w-full btn-primary mt-7 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit Assessment
          </button>
        ) : (
          <div className="mt-7 space-y-3">
            <div className={`p-3 rounded-lg text-sm font-semibold ${pct === 100 ? 'bg-green-50 text-green-700 border border-green-200' : pct >= 60 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {correct}/{FINAL_ASSESSMENT.length} correct{pct === 100 ? ' — Perfect! 🎉' : pct >= 60 ? ' — Good work!' : ' — Review the correct answers above.'}
            </div>
            <button onClick={onComplete} className="w-full btn-primary py-3 text-sm cursor-pointer">
              Get Your Certificate →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FrontendSimulationWorkspace() {
  const navigate = useNavigate()
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0)
  const [completedTasks, setCompletedTasks] = useState(new Set())
  const [modelRevealed, setModelRevealed] = useState(false)
  const [showFinalAssessment, setShowFinalAssessment] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [onboardingGate, setOnboardingGate] = useState(null)
  const [leftTab, setLeftTab] = useState('Instructions')
  const [gradeResult, setGradeResult] = useState(null)
  const [instructionsWidth, setInstructionsWidth] = useState(34)
  const [progressOpen, setProgressOpen] = useState(false)
  const [solutionCopied, setSolutionCopied] = useState(false)
  const [sandboxMinimized, setSandboxMinimized] = useState(false)
  const paneRowRef = useRef(null)
  const progressRef = useRef(null)

  useEffect(() => {
    function handle(e) {
      if (progressRef.current && !progressRef.current.contains(e.target)) setProgressOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const startPaneResize = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = instructionsWidth
    const totalWidth = paneRowRef.current?.offsetWidth || window.innerWidth
    const onMove = (moveEvent) => {
      const deltaPct = ((moveEvent.clientX - startX) / totalWidth) * 100
      setInstructionsWidth(Math.min(55, Math.max(18, startWidth + deltaPct)))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const SIM_ID = 'frontend-dev-sim'
  const { data: enrollment, isError: notEnrolled } = useEnrollment(SIM_ID)
  const { data: onboarding, isLoading: onboardingLoading } = useOnboarding(SIM_ID)
  const enroll = useEnroll(SIM_ID)
  const completeTask = useCompleteTask(enrollment?.id)
  const seededRef = useRef(false)

  useEffect(() => {
    if (notEnrolled && !enroll.isPending && !enroll.isSuccess) {
      enroll.mutate()
    }
  }, [notEnrolled]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (onboarding && onboardingGate === null) {
      setOnboardingGate(!onboarding.accepted)
    }
  }, [onboarding, onboardingGate])

  useEffect(() => {
    if (!enrollment?.task_completions || seededRef.current) return
    seededRef.current = true
    const doneIds = enrollment.task_completions.map(tc => tc.task_id)
    if (doneIds.length === 0) return
    setCompletedTasks(new Set(doneIds))
    const allIds = TASKS.map(t => t.id)
    const nextWork = allIds.find(id => !doneIds.includes(id))
    const resumeIdx = nextWork != null ? TASKS.findIndex(t => t.id === nextWork) : TASKS.length - 1
    if (resumeIdx >= 0) setCurrentTaskIdx(resumeIdx)
  }, [enrollment])

  const task = TASKS[currentTaskIdx]
  const TaskIcon = TASK_ICONS[task.id]
  const taskColor = TASK_COLORS[task.id]
  const completedWorkTasks = [...completedTasks].filter(id => id > 0).length
  const isCurrentDone = completedTasks.has(task.id)

  const handleTaskSelect = (idx) => {
    setCurrentTaskIdx(idx)
    setModelRevealed(false)
    setLeftTab('Instructions')
    setGradeResult(null)
    setSandboxMinimized(false)
  }

  // The sandbox endpoint already calls award_task_completion server-side —
  // this just displays the result and advances local UI state. "Run"
  // (isSubmit: false) only previews; only "Submit for Grading" marks it done.
  const handleSandboxGraded = (result, { isSubmit = true } = {}) => {
    setGradeResult(result)
    if (!isSubmit) return
    const updated = new Set(completedTasks)
    updated.add(task.id)
    setCompletedTasks(updated)
    const workDone = [...updated].filter(id => id > 0).length
    if (workDone >= TASKS.length) {
      setShowFinalAssessment(true)
    }
  }

  const goToNextTask = () => {
    const workDone = completedWorkTasks
    if (workDone >= TASKS.length) {
      setShowFinalAssessment(true)
    } else if (currentTaskIdx < TASKS.length - 1) {
      handleTaskSelect(currentTaskIdx + 1)
    }
  }

  if (showCertificate) {
    return <CertificateView onBack={() => setShowCertificate(false)} />
  }
  if (showFinalAssessment) {
    return <FinalAssessmentView onComplete={() => { setShowFinalAssessment(false); setShowCertificate(true) }} />
  }

  if (onboardingLoading || onboardingGate === null) {
    return (
      <div className="max-w-container mx-auto px-6 py-24 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (onboardingGate) {
    return <SimOnboarding sim={SIM_ID} onAccept={() => setOnboardingGate(false)} />
  }

  // ── Group tasks by week — a week unlocks once the prior week is fully done ──
  const weekNumbers = [...new Set(TASKS.map(t => t.week))].sort((a, b) => a - b)
  const weekDone = {}
  weekNumbers.forEach(w => {
    weekDone[w] = TASKS.filter(t => t.week === w).every(t => completedTasks.has(t.id))
  })
  const unlockedWeeks = new Set()
  let allPriorDone = true
  weekNumbers.forEach(w => {
    if (allPriorDone) unlockedWeeks.add(w)
    if (!weekDone[w]) allPriorDone = false
  })
  const weekGroups = weekNumbers
    .filter(w => unlockedWeeks.has(w))
    .map(w => ({ label: `Week ${w}`, tasks: TASKS.filter(t => t.week === w) }))
  const nextLockedWeek = weekNumbers.find(w => !unlockedWeeks.has(w))

  return (
    <div className="w-full px-6 py-6">

      {/* ── Company header ── */}
      <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
        <EnigmaLogo size="md" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface text-base leading-tight">Enigma</span>
            <span className="chip bg-orange-100 text-orange-700 text-[10px]">B2B SaaS</span>
          </div>
          <p className="text-xs text-on-surface-variant">Web Platform · Frontend Developer Job Simulation</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1.5"><MapPinIcon width={13} height={13} className="text-on-surface-variant/60" /> Remote-first · US/EU</span>
          <span className="hidden sm:flex items-center gap-1.5"><UsersIcon width={13} height={13} className="text-on-surface-variant/60" /> ~85 employees</span>
          <button className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/simulations/frontend-dev-sim/overview')}>
            <ArrowLeftIcon width={12} height={12} /> Overview
          </button>
        </div>
      </div>

      {/* ── Breadcrumb + Progress ── */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant min-w-0">
          <button className="hover:text-primary transition-colors cursor-pointer shrink-0" onClick={() => navigate('/simulations/frontend-dev-sim/overview')}>Frontend Developer — Job Simulation</button>
          <span className="text-border shrink-0">/</span>
          <span className="text-on-surface font-medium truncate">{task.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSandboxMinimized(m => !m)}
            className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer"
          >
            {sandboxMinimized ? <><RestoreIcon width={12} height={12} /> Restore Sandbox</> : <><MinimizeIcon width={12} height={12} /> Minimize Sandbox</>}
          </button>

          <div className="relative" ref={progressRef}>
          <button
            onClick={() => setProgressOpen(o => !o)}
            className="flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer"
          >
            <div className="w-16 h-1.5 bg-surface-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completedWorkTasks / TASKS.length) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-on-surface whitespace-nowrap">{completedWorkTasks} of {TASKS.length} tasks</span>
            <ChevronDownIcon width={12} height={12} className={`text-on-surface-variant transition-transform duration-150 ${progressOpen ? 'rotate-180' : ''}`} />
          </button>

          {progressOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-xl z-50 py-3 px-3 animate-[fadeIn_0.15s_ease]">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest px-1 mb-2">Progress &amp; Completion</p>
              <div className="space-y-3">
                {weekGroups.map(({ label, tasks: wTasks }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1 mb-1">{label}</p>
                    <div className="space-y-1">
                      {wTasks.map(t => {
                        const idx = TASKS.indexOf(t)
                        const isDone = completedTasks.has(t.id)
                        const isActive = currentTaskIdx === idx
                        const Icon = TASK_ICONS[t.id]
                        const color = TASK_COLORS[t.id]
                        return (
                          <button
                            key={t.id}
                            onClick={() => { handleTaskSelect(idx); setProgressOpen(false) }}
                            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${isActive ? 'bg-primary/8' : 'hover:bg-surface-low'}`}
                          >
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isDone ? 'bg-green-500 text-white' : `${color.bgSoft} ${color.text}`}`}>
                              {isDone ? <CheckIcon width={12} height={12} /> : <Icon width={12} height={12} />}
                            </span>
                            <span className={isActive ? 'text-primary font-semibold' : 'text-on-surface'}>{t.title}</span>
                            {isDone && <span className="ml-auto text-[10px] font-semibold text-green-600 shrink-0">Done</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {nextLockedWeek && (
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1 mb-1">Week {nextLockedWeek}</p>
                    <div className="flex items-center gap-2 px-2 py-2 text-xs text-on-surface-variant opacity-60">
                      <LockIcon width={13} height={13} /> Unlocks after Week {nextLockedWeek - 1}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      <div ref={paneRowRef} className="flex items-stretch" style={{ height: 'calc(100vh - 260px)', minHeight: 640 }}>

        {/* ── Column 1: Instructions / Hints / Solution ── */}
        <div style={{ width: sandboxMinimized ? '100%' : `calc(${instructionsWidth}% - 9px)` }} className="shrink-0 flex flex-col min-h-0 transition-all duration-200">
          <div className="card overflow-hidden p-0 flex flex-col flex-1 min-h-0">
            <div className={`flex items-center gap-2.5 px-5 py-3 border-b border-border shrink-0 ${taskColor.bgSoft}`}>
              <div className={`w-8 h-8 rounded-lg ${taskColor.bg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                <TaskIcon width={16} height={16} />
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${taskColor.text}`}>Task {task.id} of {TASKS.length} · Week {task.week}</p>
                <p className="text-sm font-bold text-on-surface truncate">{task.title.replace(/^Task \d+ — /, '')}</p>
              </div>
            </div>

            <div className="flex items-center gap-5 px-5 pt-4 border-b border-border shrink-0">
              {['Instructions', 'Hints', 'Solution'].map(tabName => {
                const disabled = (tabName === 'Hints' && !task.hints) || (tabName === 'Solution' && !task.modelSolution)
                if (disabled) return null
                return (
                  <button
                    key={tabName}
                    onClick={() => setLeftTab(tabName)}
                    className={`text-sm font-semibold pb-3 -mb-px border-b-2 transition-colors cursor-pointer ${leftTab === tabName ? 'border-primary text-on-surface' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
                  >
                    {tabName}
                  </button>
                )
              })}
            </div>

            <div className="p-5 space-y-4 flex-1 min-h-0 overflow-y-auto">
              {leftTab === 'Instructions' && (
                <>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-50 to-transparent border-b border-border">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm ring-2 ring-white">
                        MC
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-on-surface">Maya Chen</p>
                          <span className="chip bg-orange-100 text-orange-700 text-[10px] shrink-0">Manager</span>
                        </div>
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">{task.subject}</p>
                      </div>
                    </div>
                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line px-4 py-3">{task.message}</p>
                  </div>

                  {task.whatToDo && (
                    <div>
                      <h3 className="font-bold text-on-surface text-sm mb-2">What to do</h3>
                      <ol className="space-y-2.5">
                        {task.whatToDo.map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-white text-[10px] font-bold">{i + 1}</span>
                            </div>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {task.whatToSubmit && (
                    <div className="bg-surface-low rounded-lg p-3.5">
                      <h3 className="font-bold text-on-surface text-sm mb-2">What to submit</h3>
                      <ul className="space-y-1.5">
                        {task.whatToSubmit.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                            <span className="text-primary font-bold mt-0.5 shrink-0">→</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {leftTab === 'Hints' && task.hints && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span>💡</span>
                    <h3 className="font-bold text-amber-800 text-sm">Hints from Maya</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {task.hints.map((hint, i) => (
                      <li key={i} className="text-sm text-on-surface-variant leading-relaxed flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <span className="shrink-0 mt-0.5 text-amber-600">•</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {leftTab === 'Solution' && task.modelSolution && (
                !modelRevealed ? (
                  <button
                    onClick={() => setModelRevealed(true)}
                    className="w-full flex items-center justify-between p-4 bg-surface-low rounded-lg hover:bg-primary/5 transition-colors border border-dashed border-border group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-primary group-hover:translate-x-0.5 transition-transform">▶</span>
                      <span className="font-semibold text-on-surface text-sm">Reveal Maya's model approach</span>
                    </div>
                    <span className="text-xs text-on-surface-variant">Open only after your own attempt</span>
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                      <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">MC</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">Maya's model approach</p>
                        <p className="text-xs text-on-surface-variant">Walked through step by step, with the full working solution at the end</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-5">
                      {task.modelSolution.solutionSteps.map((step, i) => (
                        <div key={i} className="border border-border rounded-lg overflow-hidden">
                          <div className="flex items-start gap-2.5 p-3 bg-surface-low">
                            <span className={`w-5 h-5 rounded-full ${TASK_COLORS[task.id].bg} text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5`}>
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-on-surface">{step.title}</p>
                              <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">{step.detail}</p>
                            </div>
                          </div>
                          {step.code && (
                            <pre className="text-[11px] font-mono leading-relaxed text-on-surface bg-white p-3 overflow-x-auto whitespace-pre">{step.code}</pre>
                          )}
                        </div>
                      ))}
                    </div>

                    {task.modelSolution.keyPrinciple && (
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mb-3">
                        <p className="text-xs font-semibold text-primary mb-1">Key principle</p>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{task.modelSolution.keyPrinciple}</p>
                      </div>
                    )}
                    {task.modelSolution.greatLooksLike && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-3">
                        <p className="text-xs font-semibold text-green-700 mb-1">What "great" looks like</p>
                        <p className="text-xs text-green-700 leading-relaxed">{task.modelSolution.greatLooksLike}</p>
                      </div>
                    )}

                    {task.modelSolution.fullSolutionCode && (
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-surface-low border-b border-border">
                          <p className="text-xs font-bold text-on-surface">Full Solution Code</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(task.modelSolution.fullSolutionCode)
                              setSolutionCopied(true)
                              setTimeout(() => setSolutionCopied(false), 1500)
                            }}
                            className="text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors cursor-pointer"
                          >
                            {solutionCopied ? 'Copied ✓' : 'Copy code'}
                          </button>
                        </div>
                        <pre className="text-[11px] font-mono leading-relaxed text-on-surface bg-white p-3 overflow-x-auto whitespace-pre max-h-96 overflow-y-auto">{task.modelSolution.fullSolutionCode}</pre>
                      </div>
                    )}
                  </div>
                )
              )}

              {leftTab === 'Instructions' && isCurrentDone && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 font-semibold">
                  <CheckIcon width={14} height={14} /> Task complete
                </div>
              )}
            </div>
          </div>
        </div>

        {!sandboxMinimized && (
          <>
            <div
              onMouseDown={startPaneResize}
              title="Drag to resize"
              className="w-1.5 shrink-0 mx-1.5 rounded-full cursor-col-resize bg-transparent hover:bg-primary/30 active:bg-primary/50 transition-colors"
            />

            <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-y-auto">
              {isCurrentDone && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 font-semibold mb-3 shrink-0">
                  <CheckIcon width={13} height={13} /> Submitted &amp; graded — resubmitting will re-grade
                </div>
              )}

              <FrontendPlayground
                key={task.id}
                starterCode={SANDBOX_STARTERS[task.id]}
                enrollmentId={enrollment?.id}
                taskId={task.id}
                submissionFilename={SUBMISSION_FILENAME[task.id]}
                language={MONACO_LANGUAGE[task.id]}
                showPreview={SHOWS_PREVIEW[task.id]}
                onGraded={handleSandboxGraded}
              />
            </div>
          </>
        )}
      </div>

      {gradeResult && (
        <div className="mt-6 animate-[fadeIn_0.3s_ease]">
          <SandboxResultPanel
            gradeResult={gradeResult}
            accentBorderClass={taskColor.border}
            onNext={goToNextTask}
            hasNext={isCurrentDone}
          />
        </div>
      )}

      <footer className="mt-8 border-t border-border pt-4 flex items-center justify-between text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <EnigmaLogo size="sm" />
          <span>Enigma · Frontend Developer Job Simulation</span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Help Center</a>
          <a href="#" className="hover:text-primary">Support</a>
        </div>
        <span>© 2025 WorkLearn AI. All rights reserved.</span>
      </footer>
    </div>
  )
}

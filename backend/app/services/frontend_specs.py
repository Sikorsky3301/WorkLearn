"""Hidden Jest test specs for the Frontend Developer job simulation —
server-side only, never sent to the student. Each entry is the full source
of a submission.test.js that the sandbox writes alongside the student's
submission file before running Jest (see app/api/v1/simulations/sandbox.py's
_submit_frontend_dev_sim). This is the frontend sim's equivalent of the DA
sim's computed reference solution in app/services/dataset.py: the actual
"answer key" that the student's code is graded against.

Every element id / data-testid / function signature referenced below is
part of the task's public contract and must match what's shown to the
student in the task brief (see SIM_TASK_BRIEFS["frontend-dev-sim"] in
app/api/v1/simulations/enrollments.py) — the hidden test can only assert on names the
student was actually told to use.
"""

FRONTEND_TEST_SPECS: dict[int, str] = {
    # Task 1 — Landing Hero Section (submission.html, HTML/CSS only, no JS
    # execution needed so this loads the markup via plain innerHTML).
    1: r'''
const fs = require('fs');

beforeAll(() => {
  document.documentElement.innerHTML = fs.readFileSync('/workspace/submission.html', 'utf-8');
});

test('has header, main, and footer landmarks', () => {
  expect(document.querySelector('header')).not.toBeNull();
  expect(document.querySelector('main')).not.toBeNull();
  expect(document.querySelector('footer')).not.toBeNull();
});

test('hero section has exactly one h1', () => {
  const h1s = document.querySelectorAll('main h1');
  expect(h1s.length).toBe(1);
});

test('nav contains at least one link', () => {
  const links = document.querySelectorAll('nav a');
  expect(links.length).toBeGreaterThanOrEqual(1);
});

test('CSS uses flexbox or grid for layout', () => {
  const styleEls = Array.from(document.querySelectorAll('style'));
  const css = styleEls.map((s) => s.textContent).join('\n');
  expect(/display\s*:\s*(flex|grid)/i.test(css)).toBe(true);
});

test('nav links have visible, non-empty text', () => {
  const links = Array.from(document.querySelectorAll('nav a'));
  expect(links.length).toBeGreaterThan(0);
  expect(links.every((a) => a.textContent.trim().length > 0)).toBe(true);
});
''',

    # Task 2 — Interactive Navigation (submission.html with an inline
    # <script>). Loaded through jsdom directly with runScripts: 'dangerously'
    # so the student's actual script executes, instead of jest's default
    # jsdom global (innerHTML-inserted <script> tags are inert per spec).
    2: r'''
const fs = require('fs');
const { JSDOM } = require('jsdom');

function load() {
  const html = fs.readFileSync('/workspace/submission.html', 'utf-8');
  return new JSDOM(html, { runScripts: 'dangerously' });
}

test('menu toggle button exists with aria-expanded="false"', () => {
  const dom = load();
  const toggle = dom.window.document.getElementById('nav-toggle');
  expect(toggle).not.toBeNull();
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
});

test('clicking toggle flips aria-expanded and opens the menu', () => {
  const dom = load();
  const { document, Event } = dom.window;
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  toggle.dispatchEvent(new Event('click', { bubbles: true }));
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect(menu.classList.length).toBeGreaterThan(0);
});

test('clicking a nav link marks it active', () => {
  const dom = load();
  const { document, Event } = dom.window;
  const links = document.querySelectorAll('#nav-menu .nav-link');
  expect(links.length).toBeGreaterThanOrEqual(2);
  links[1].dispatchEvent(new Event('click', { bubbles: true }));
  expect(links[1].classList.contains('active')).toBe(true);
  expect(links[0].classList.contains('active')).toBe(false);
});
''',

    # Task 3 — Fetch and Render Live Data (submission.js, plain JS module
    # exporting renderDirectory(container, fetchFn) so the hidden test can
    # inject a mocked fetchFn and control timing/success/failure).
    3: r'''
const { renderDirectory } = require('/workspace/submission.js');

function makeContainer() {
  const div = document.createElement('div');
  document.body.appendChild(div);
  return div;
}

test('shows a loading state before data resolves', async () => {
  const container = makeContainer();
  let resolveFetch;
  const fetchFn = () => new Promise((resolve) => { resolveFetch = resolve; });
  const promise = renderDirectory(container, fetchFn);
  expect(container.querySelector('[data-testid="loading"]')).not.toBeNull();
  resolveFetch({ json: async () => ([{ name: 'Ada Lovelace' }, { name: 'Grace Hopper' }]) });
  await promise;
});

test('renders the team list on success', async () => {
  const container = makeContainer();
  const fetchFn = async () => ({ json: async () => ([{ name: 'Ada Lovelace' }, { name: 'Grace Hopper' }]) });
  await renderDirectory(container, fetchFn);
  const list = container.querySelector('[data-testid="team-list"]');
  expect(list).not.toBeNull();
  expect(list.querySelectorAll('li').length).toBe(2);
  expect(list.textContent).toContain('Ada Lovelace');
});

test('renders an error state when the fetch rejects', async () => {
  const container = makeContainer();
  const fetchFn = async () => { throw new Error('network down'); };
  await renderDirectory(container, fetchFn);
  expect(container.querySelector('[data-testid="error"]')).not.toBeNull();
});
''',

    # Task 4 — React Component (submission.jsx, default-exports
    # EmployeeList({ data, loading, error })).
    4: r'''
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmployeeList from '/workspace/submission.jsx';

test('shows loading state', () => {
  render(<EmployeeList data={null} loading={true} error={null} />);
  expect(screen.getByTestId('loading')).toBeInTheDocument();
});

test('shows error state', () => {
  render(<EmployeeList data={null} loading={false} error="Failed to load" />);
  expect(screen.getByTestId('error')).toHaveTextContent('Failed to load');
});

test('renders employee list', () => {
  const data = [
    { id: 1, name: 'Ada Lovelace', role: 'Engineer' },
    { id: 2, name: 'Grace Hopper', role: 'Admiral' },
  ];
  render(<EmployeeList data={data} loading={false} error={null} />);
  const list = screen.getByTestId('employee-list');
  expect(list).toBeInTheDocument();
  expect(list.textContent).toContain('Ada Lovelace');
  expect(list.textContent).toContain('Grace Hopper');
});
''',

    # Task 5 — Task Manager App (submission.jsx, default-exports
    # TaskManager with add/complete/delete + localStorage persistence).
    5: r'''
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskManager from '/workspace/submission.jsx';

beforeEach(() => {
  window.localStorage.clear();
});

test('adds a new task', () => {
  render(<TaskManager />);
  const input = screen.getByTestId('task-input');
  fireEvent.change(input, { target: { value: 'Write onboarding docs' } });
  fireEvent.click(screen.getByTestId('add-task'));
  expect(screen.getByText('Write onboarding docs')).toBeInTheDocument();
});

test('completes and deletes a task, and persists to localStorage', () => {
  render(<TaskManager />);
  const input = screen.getByTestId('task-input');
  fireEvent.change(input, { target: { value: 'Ship the feature' } });
  fireEvent.click(screen.getByTestId('add-task'));

  const completeBtns = screen.getAllByTestId('complete-task');
  fireEvent.click(completeBtns[completeBtns.length - 1]);

  const stored = JSON.parse(window.localStorage.getItem('tasks') || '[]');
  expect(stored.some((t) => t.text === 'Ship the feature' && t.completed)).toBe(true);

  const deleteBtns = screen.getAllByTestId('delete-task');
  fireEvent.click(deleteBtns[deleteBtns.length - 1]);
  expect(screen.queryByText('Ship the feature')).not.toBeInTheDocument();
});

test('rehydrates tasks from localStorage on mount', () => {
  window.localStorage.setItem('tasks', JSON.stringify([{ id: 'x1', text: 'Persisted task', completed: false }]));
  render(<TaskManager />);
  expect(screen.getByText('Persisted task')).toBeInTheDocument();
});
''',
}

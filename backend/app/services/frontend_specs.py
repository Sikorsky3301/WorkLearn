"""Hidden Jest test specs for the Frontend Developer job simulation —
server-side only, never sent to the student.

Each entry is the full source of a submission.test.js that the sandbox writes
alongside the student's submission file before running Jest (see
_submit_frontend_dev_sim_family in app/api/v1/simulations/sandbox.py). This is
the frontend sim's equivalent of the DA sim's computed reference solution: the
actual answer key.

WHY SPEC AND POINTS LIVE TOGETHER
---------------------------------
Grading maps each Jest assertion's **title string** to a point value. That
mapping used to live in five separate grader modules, far away from the specs
themselves, which made a silent failure mode: rename a test title (or typo a
key) and that test still runs, still passes — and silently scores 0, capping a
perfect submission below 100 with nothing anywhere reporting a problem.

Pairing them in one `FrontendTaskSpec` removes the distance, and
`validate_specs()` closes the gap for good: it parses the titles back out of
the spec source and asserts they match the point map exactly and sum to 100.
tests/unit/test_frontend_specs.py runs it over every task, so a desynced title
fails CI instead of quietly under-grading a student.

CONTRACT DISCIPLINE
-------------------
Every element id / data-testid / function signature asserted below is part of
the task's public contract and MUST match what the student is told in
app/cms_templates/engineering/ — a hidden test may only assert on names the
student was actually given.

TASK INDICES ARE LOAD-BEARING. Specs are keyed by `task_index`, and the
template's `config.grader_key` must agree. Reordering tasks in the CMS builder
without moving the specs will grade submissions against the wrong answer key.
"""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class FrontendTaskSpec:
    """One task's hidden test suite plus what each assertion is worth."""
    title: str
    source: str
    points: dict[str, int]


# ─────────────────────────────────────────────────────────────────────────────
# WEEK 1 — Structure, style, and the first interaction
# ─────────────────────────────────────────────────────────────────────────────

_TASK1 = FrontendTaskSpec(
    title="Landing Hero Section",
    # HTML/CSS only — no script execution needed, so the markup can be loaded
    # straight into jest's own jsdom global via innerHTML.
    source=r'''
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
    points={
        "has header, main, and footer landmarks": 20,
        "hero section has exactly one h1": 20,
        "nav contains at least one link": 15,
        "CSS uses flexbox or grid for layout": 25,
        "nav links have visible, non-empty text": 20,
    },
)

_TASK2 = FrontendTaskSpec(
    title="Responsive Feature Grid",
    source=r'''
const fs = require('fs');

let css = '';

beforeAll(() => {
  document.documentElement.innerHTML = fs.readFileSync('/workspace/submission.html', 'utf-8');
  css = Array.from(document.querySelectorAll('style')).map((s) => s.textContent).join('\n');
});

test('renders at least three cards as article elements', () => {
  const cards = document.querySelectorAll('.card');
  expect(cards.length).toBeGreaterThanOrEqual(3);
  expect(Array.from(cards).every((c) => c.tagName.toLowerCase() === 'article')).toBe(true);
});

test('every card has a heading and a paragraph of body text', () => {
  const cards = Array.from(document.querySelectorAll('.card'));
  expect(cards.length).toBeGreaterThan(0);
  expect(cards.every((c) => c.querySelector('h2, h3'))).toBe(true);
  expect(cards.every((c) => {
    const p = c.querySelector('p');
    return p !== null && p.textContent.trim().length > 0;
  })).toBe(true);
});

test('every card image has descriptive alt text', () => {
  const images = Array.from(document.querySelectorAll('.card img'));
  expect(images.length).toBeGreaterThanOrEqual(3);
  expect(images.every((img) => (img.getAttribute('alt') || '').trim().length > 0)).toBe(true);
});

test('the grid container uses a responsive auto-fit or auto-fill track', () => {
  const container = document.querySelector('.card-grid');
  expect(container).not.toBeNull();
  expect(/\.card-grid[^{]*\{[^}]*display\s*:\s*grid/is.test(css)).toBe(true);
  expect(/repeat\(\s*auto-(fit|fill)\s*,\s*minmax\(/i.test(css)).toBe(true);
});

test('CSS includes a media query for narrow screens', () => {
  expect(/@media[^{]*\((max|min)-width\s*:/i.test(css)).toBe(true);
});
''',
    points={
        "renders at least three cards as article elements": 20,
        "every card has a heading and a paragraph of body text": 20,
        "every card image has descriptive alt text": 20,
        "the grid container uses a responsive auto-fit or auto-fill track": 25,
        "CSS includes a media query for narrow screens": 15,
    },
)

_TASK3 = FrontendTaskSpec(
    title="Interactive Navigation",
    # Loaded through jsdom directly with runScripts: 'dangerously' so the
    # student's inline <script> actually executes — innerHTML-inserted <script>
    # tags are inert per the HTML spec, so jest's own jsdom global cannot be
    # used for any task that requires the submission's JS to run.
    source=r'''
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

test('clicking the toggle a second time closes the menu again', () => {
  const dom = load();
  const { document, Event } = dom.window;
  const toggle = document.getElementById('nav-toggle');
  toggle.dispatchEvent(new Event('click', { bubbles: true }));
  toggle.dispatchEvent(new Event('click', { bubbles: true }));
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
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
    points={
        'menu toggle button exists with aria-expanded="false"': 20,
        "clicking toggle flips aria-expanded and opens the menu": 30,
        "clicking the toggle a second time closes the menu again": 20,
        "clicking a nav link marks it active": 30,
    },
)


# ─────────────────────────────────────────────────────────────────────────────
# WEEK 2 — Real browser behaviour: forms, async data, filtering
# ─────────────────────────────────────────────────────────────────────────────

_TASK4 = FrontendTaskSpec(
    title="Accessible Signup Form",
    source=r'''
const fs = require('fs');
const { JSDOM } = require('jsdom');

function load() {
  const html = fs.readFileSync('/workspace/submission.html', 'utf-8');
  return new JSDOM(html, { runScripts: 'dangerously' });
}

function submit(dom) {
  const { document, Event } = dom.window;
  const form = document.getElementById('signup-form');
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return form;
}

function fill(dom, email, password) {
  const { document } = dom.window;
  document.getElementById('email').value = email;
  document.getElementById('password').value = password;
}

test('email and password inputs are labelled', () => {
  const { document } = load().window;
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  expect(email).not.toBeNull();
  expect(password).not.toBeNull();
  const labels = Array.from(document.querySelectorAll('label'));
  const labelled = (id) => labels.some((l) => l.getAttribute('for') === id && l.textContent.trim().length > 0);
  expect(labelled('email')).toBe(true);
  expect(labelled('password')).toBe(true);
});

test('the error region is announced to screen readers', () => {
  const { document } = load().window;
  const error = document.getElementById('form-error');
  expect(error).not.toBeNull();
  expect(error.getAttribute('role')).toBe('alert');
});

test('submitting an empty form shows an error and does not submit', () => {
  const dom = load();
  const form = submit(dom);
  const error = dom.window.document.getElementById('form-error');
  expect(error.textContent.trim().length).toBeGreaterThan(0);
  expect(form.dataset.submitted).not.toBe('true');
});

test('an invalid email address is rejected', () => {
  const dom = load();
  fill(dom, 'not-an-email', 'hunter2secret');
  const form = submit(dom);
  const error = dom.window.document.getElementById('form-error');
  expect(error.textContent.trim().length).toBeGreaterThan(0);
  expect(form.dataset.submitted).not.toBe('true');
});

test('a password under 8 characters is rejected', () => {
  const dom = load();
  fill(dom, 'maya@enigma.dev', 'short');
  const form = submit(dom);
  const error = dom.window.document.getElementById('form-error');
  expect(error.textContent.trim().length).toBeGreaterThan(0);
  expect(form.dataset.submitted).not.toBe('true');
});

test('a valid submission clears the error and marks the form submitted', () => {
  const dom = load();
  fill(dom, 'maya@enigma.dev', 'hunter2secret');
  const form = submit(dom);
  const error = dom.window.document.getElementById('form-error');
  expect(error.textContent.trim()).toBe('');
  expect(form.dataset.submitted).toBe('true');
});
''',
    points={
        "email and password inputs are labelled": 15,
        "the error region is announced to screen readers": 15,
        "submitting an empty form shows an error and does not submit": 20,
        "an invalid email address is rejected": 20,
        "a password under 8 characters is rejected": 15,
        "a valid submission clears the error and marks the form submitted": 15,
    },
)

_TASK5 = FrontendTaskSpec(
    title="Fetch and Render Live Data",
    source=r'''
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

test('clears the loading state once the data has arrived', async () => {
  const container = makeContainer();
  const fetchFn = async () => ({ json: async () => ([{ name: 'Ada Lovelace' }]) });
  await renderDirectory(container, fetchFn);
  expect(container.querySelector('[data-testid="loading"]')).toBeNull();
});

test('renders an error state when the fetch rejects', async () => {
  const container = makeContainer();
  const fetchFn = async () => { throw new Error('network down'); };
  await renderDirectory(container, fetchFn);
  expect(container.querySelector('[data-testid="error"]')).not.toBeNull();
});
''',
    points={
        "shows a loading state before data resolves": 25,
        "renders the team list on success": 35,
        "clears the loading state once the data has arrived": 15,
        "renders an error state when the fetch rejects": 25,
    },
)

_TASK6 = FrontendTaskSpec(
    title="Search and Filter",
    source=r'''
const { filterMembers, renderList } = require('/workspace/submission.js');

const MEMBERS = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer' },
  { id: 2, name: 'Grace Hopper', role: 'Admiral' },
  { id: 3, name: 'Alan Turing', role: 'Engineer' },
];

function makeContainer() {
  const div = document.createElement('div');
  document.body.appendChild(div);
  return div;
}

test('filterMembers matches names case-insensitively', () => {
  const result = filterMembers(MEMBERS, 'ADA');
  expect(result.map((m) => m.name)).toEqual(['Ada Lovelace']);
});

test('filterMembers matches a partial name anywhere in the string', () => {
  const result = filterMembers(MEMBERS, 'ing');
  expect(result.map((m) => m.name)).toEqual(['Alan Turing']);
});

test('filterMembers returns every member for an empty query', () => {
  expect(filterMembers(MEMBERS, '')).toHaveLength(3);
  expect(filterMembers(MEMBERS, '   ')).toHaveLength(3);
});

test('filterMembers does not modify the array it was given', () => {
  const original = MEMBERS.slice();
  filterMembers(MEMBERS, 'ada');
  expect(MEMBERS).toEqual(original);
});

test('renderList renders one item per member', () => {
  const container = makeContainer();
  renderList(container, MEMBERS);
  const items = container.querySelectorAll('[data-testid="member-item"]');
  expect(items.length).toBe(3);
  expect(container.textContent).toContain('Grace Hopper');
});

test('renderList shows an empty state when there are no matches', () => {
  const container = makeContainer();
  renderList(container, []);
  expect(container.querySelectorAll('[data-testid="member-item"]').length).toBe(0);
  expect(container.querySelector('[data-testid="empty"]')).not.toBeNull();
});
''',
    points={
        "filterMembers matches names case-insensitively": 20,
        "filterMembers matches a partial name anywhere in the string": 15,
        "filterMembers returns every member for an empty query": 15,
        "filterMembers does not modify the array it was given": 15,
        "renderList renders one item per member": 20,
        "renderList shows an empty state when there are no matches": 15,
    },
)


# ─────────────────────────────────────────────────────────────────────────────
# WEEK 3 — React: props, state, and a whole small app
# ─────────────────────────────────────────────────────────────────────────────

_TASK7 = FrontendTaskSpec(
    title="React Component",
    source=r'''
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

test('loading takes priority over an empty data array', () => {
  render(<EmployeeList data={[]} loading={true} error={null} />);
  expect(screen.getByTestId('loading')).toBeInTheDocument();
  expect(screen.queryByTestId('employee-list')).not.toBeInTheDocument();
});
''',
    points={
        "shows loading state": 25,
        "shows error state": 25,
        "renders employee list": 35,
        "loading takes priority over an empty data array": 15,
    },
)

_TASK8 = FrontendTaskSpec(
    title="Controlled Form Component",
    # fireEvent, not userEvent — @testing-library/user-event is deliberately
    # not in the sandbox image's dependency list.
    source=r'''
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignupForm from '/workspace/submission.jsx';

function type(value) {
  fireEvent.change(screen.getByTestId('email-input'), { target: { value } });
}

test('the email input is controlled by React state', () => {
  render(<SignupForm onSubmit={() => {}} />);
  type('maya@enigma.dev');
  expect(screen.getByTestId('email-input')).toHaveValue('maya@enigma.dev');
});

test('an invalid email shows an error and does not call onSubmit', () => {
  const onSubmit = jest.fn();
  render(<SignupForm onSubmit={onSubmit} />);
  type('nope');
  fireEvent.click(screen.getByTestId('submit-button'));
  expect(screen.getByTestId('error')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('a valid email calls onSubmit with the address', () => {
  const onSubmit = jest.fn();
  render(<SignupForm onSubmit={onSubmit} />);
  type('maya@enigma.dev');
  fireEvent.click(screen.getByTestId('submit-button'));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit).toHaveBeenCalledWith('maya@enigma.dev');
});

test('the input is cleared after a successful submit', () => {
  render(<SignupForm onSubmit={() => {}} />);
  type('maya@enigma.dev');
  fireEvent.click(screen.getByTestId('submit-button'));
  expect(screen.getByTestId('email-input')).toHaveValue('');
});

test('fixing an invalid email clears the error', () => {
  render(<SignupForm onSubmit={() => {}} />);
  type('nope');
  fireEvent.click(screen.getByTestId('submit-button'));
  expect(screen.getByTestId('error')).toBeInTheDocument();
  type('maya@enigma.dev');
  fireEvent.click(screen.getByTestId('submit-button'));
  expect(screen.queryByTestId('error')).not.toBeInTheDocument();
});
''',
    points={
        "the email input is controlled by React state": 20,
        "an invalid email shows an error and does not call onSubmit": 25,
        "a valid email calls onSubmit with the address": 25,
        "the input is cleared after a successful submit": 15,
        "fixing an invalid email clears the error": 15,
    },
)

_TASK9 = FrontendTaskSpec(
    title="Task Manager App",
    source=r'''
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskManager from '/workspace/submission.jsx';

beforeEach(() => {
  window.localStorage.clear();
});

function addTask(text) {
  fireEvent.change(screen.getByTestId('task-input'), { target: { value: text } });
  fireEvent.click(screen.getByTestId('add-task'));
}

test('adds a new task', () => {
  render(<TaskManager />);
  addTask('Write onboarding docs');
  expect(screen.getByText('Write onboarding docs')).toBeInTheDocument();
});

test('renders the tasks inside a task-list container', () => {
  render(<TaskManager />);
  addTask('Write onboarding docs');
  const list = screen.getByTestId('task-list');
  expect(list).toBeInTheDocument();
  expect(within(list).getAllByTestId('task-item')).toHaveLength(1);
});

test('completes and deletes a task, and persists to localStorage', () => {
  render(<TaskManager />);
  addTask('Ship the feature');

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

test('ignores an empty submission', () => {
  render(<TaskManager />);
  addTask('   ');
  expect(screen.queryAllByTestId('task-item')).toHaveLength(0);
});
''',
    points={
        "adds a new task": 20,
        "renders the tasks inside a task-list container": 10,
        "completes and deletes a task, and persists to localStorage": 35,
        "rehydrates tasks from localStorage on mount": 20,
        "ignores an empty submission": 15,
    },
)


FRONTEND_TASK_SPECS: dict[int, FrontendTaskSpec] = {
    1: _TASK1, 2: _TASK2, 3: _TASK3,
    4: _TASK4, 5: _TASK5, 6: _TASK6,
    7: _TASK7, 8: _TASK8, 9: _TASK9,
}

# The sandbox route only ever wants the source. Kept as a mapping of the same
# shape the route already consumed, so that call site is unchanged.
FRONTEND_TEST_SPECS: dict[int, str] = {i: s.source for i, s in FRONTEND_TASK_SPECS.items()}


# Matches `test('title', ...)` and `test("title", ...)`. Titles here are plain
# literals by construction — no template strings, no `test.each` — which
# validate_specs() also enforces by counting.
_TEST_TITLE_RE = re.compile(r"""^\s*test\(\s*(['"])(?P<title>.+?)\1\s*,""", re.MULTILINE)


def titles_in(spec: FrontendTaskSpec) -> list[str]:
    """Every assertion title Jest will report for this spec, in file order."""
    return [m.group("title") for m in _TEST_TITLE_RE.finditer(spec.source)]


def validate_specs() -> list[str]:
    """Returns a list of problems — empty means every task grades to a clean 100.

    Checks, per task:
      • every test in the spec has a point value (else it silently scores 0)
      • every point key corresponds to a real test (else it's dead weight, and
        usually means a title was edited on one side only)
      • the point values total exactly 100
      • no duplicate titles (Jest allows them; the title→points map cannot
        distinguish them, so the second would be graded as the first)
    """
    problems: list[str] = []
    for index, spec in sorted(FRONTEND_TASK_SPECS.items()):
        where = f"task {index} ({spec.title})"
        titles = titles_in(spec)

        if not titles:
            problems.append(f"{where}: no test titles could be parsed out of the spec")
            continue

        duplicates = {t for t in titles if titles.count(t) > 1}
        for title in sorted(duplicates):
            problems.append(f"{where}: duplicate test title {title!r}")

        for title in titles:
            if title not in spec.points:
                problems.append(f"{where}: test {title!r} has no point value — it would score 0")
        for title in spec.points:
            if title not in titles:
                problems.append(f"{where}: point value for {title!r} matches no test in the spec")

        total = sum(spec.points.values())
        if total != 100:
            problems.append(f"{where}: points total {total}, expected 100")

    return problems

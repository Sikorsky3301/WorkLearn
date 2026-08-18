"""Starter files and worked solutions for the nine Frontend Developer tasks.

Split out from the task definitions because these are long verbatim blobs and
mixing them into the prose made both harder to read or edit. Nothing here is
logic — every string is either what the student opens the sandbox to, or the
worked answer they can reveal once they've had a real attempt.

Every id, class and data-testid below is part of the task's public contract and
must match app/services/frontend_specs.py exactly. A hidden test may only
assert on a name the student was actually given.
"""

# ─────────────────────────────────────────────────────────────────────────────
# WEEK 1
# ─────────────────────────────────────────────────────────────────────────────

TASK1_STARTER = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Enigma</title>
  <style>
    /* Your CSS goes here. You need `display: flex` or `display: grid`
       somewhere — that's how you lay the hero out. */
  </style>
</head>
<body>

  <header>
    <nav>
      <!-- TODO: at least one <a> with real, readable text inside -->
    </nav>
  </header>

  <main>
    <section id="hero">
      <!-- TODO: exactly one <h1>, plus a sentence of supporting text -->
    </section>
  </main>

  <footer>
    <!-- TODO: anything sensible — a copyright line is fine -->
  </footer>

</body>
</html>
"""

TASK1_SOLUTION = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Enigma</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; color: #12172b; }

  /* Flexbox: one row, logo pushed left, nav pushed right. */
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    border-bottom: 1px solid #e6e8f0;
  }
  nav a { margin-left: 1.5rem; color: #12172b; text-decoration: none; }
  nav a:hover { text-decoration: underline; }

  /* Grid: one centred block, vertically and horizontally. */
  #hero {
    display: grid;
    place-items: center;
    min-height: 60vh;
    padding: 2rem;
    text-align: center;
  }
  #hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); margin: 0 0 1rem; }
  #hero p { max-width: 34rem; margin: 0; color: #5a6178; line-height: 1.6; }

  footer { padding: 2rem; text-align: center; color: #5a6178; }
</style>
</head>
<body>

  <header>
    <strong>Enigma</strong>
    <nav>
      <a href="#hero">Home</a>
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
    </nav>
  </header>

  <main>
    <section id="hero">
      <h1>Build better, together.</h1>
      <p>Enigma is the workspace your team actually wants to use — plan, track and ship in one place.</p>
    </section>
  </main>

  <footer>&copy; 2026 Enigma</footer>

</body>
</html>
"""

TASK2_STARTER = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Enigma — Features</title>
  <style>
    /* TODO: .card-grid needs `display: grid` and a
       `grid-template-columns: repeat(auto-fit, minmax(...))` track.
       TODO: add a @media query for narrow screens. */
  </style>
</head>
<body>

  <main>
    <h1>Why teams choose Enigma</h1>

    <div class="card-grid">
      <!-- TODO: three or more <article class="card">, each containing:
             an <img> with real alt text, an <h2> or <h3>, and a <p> -->
    </div>
  </main>

</body>
</html>
"""

TASK2_SOLUTION = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Enigma — Features</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; color: #12172b; }
  main { max-width: 72rem; margin: 0 auto; padding: 3rem 1.5rem; }
  h1 { font-size: 2rem; margin-bottom: 2rem; }

  /* auto-fit + minmax is the whole trick: the browser fits as many
     >=16rem columns as it can, then stretches them to fill the row.
     No breakpoint needed for the columns themselves. */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: 1.5rem;
  }

  .card {
    border: 1px solid #e6e8f0;
    border-radius: 12px;
    padding: 1.25rem;
    background: #fff;
  }
  .card img { width: 100%; height: 9rem; object-fit: cover; border-radius: 8px; }
  .card h3 { margin: 1rem 0 0.5rem; font-size: 1.125rem; }
  .card p { margin: 0; color: #5a6178; line-height: 1.6; }

  /* The media query handles what auto-fit can't: spacing and type size
     on genuinely small screens. */
  @media (max-width: 40rem) {
    main { padding: 2rem 1rem; }
    h1 { font-size: 1.5rem; }
    .card-grid { gap: 1rem; }
  }
</style>
</head>
<body>

  <main>
    <h1>Why teams choose Enigma</h1>

    <div class="card-grid">
      <article class="card">
        <img src="plan.png" alt="A sprint board with tasks arranged in three columns" />
        <h3>Plan together</h3>
        <p>Shared boards that stay in sync, so nobody plans against a stale copy.</p>
      </article>

      <article class="card">
        <img src="track.png" alt="A burndown chart trending towards zero remaining work" />
        <h3>Track honestly</h3>
        <p>Progress that reflects what shipped, not what somebody remembered to update.</p>
      </article>

      <article class="card">
        <img src="ship.png" alt="A release checklist with every item marked complete" />
        <h3>Ship calmly</h3>
        <p>Release checklists your whole team can see, days before the deadline.</p>
      </article>
    </div>
  </main>

</body>
</html>
"""

TASK3_STARTER = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Navigation</title>
  <style>
    /* Optional: style .open however you like. The test only checks that
       clicking the toggle puts SOME class on #nav-menu. */
    #nav-menu { display: none; }
    #nav-menu.open { display: block; }
    .nav-link.active { font-weight: bold; }
  </style>
</head>
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
    // TODO 1: clicking #nav-toggle flips aria-expanded between "false"
    //         and "true", and toggles a class on #nav-menu.
    //         Clicking it again must put it back to "false".

    // TODO 2: clicking a .nav-link adds class "active" to that link and
    //         removes "active" from all the others.
  </script>

</body>
</html>
"""

TASK3_SOLUTION = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Navigation</title>
<style>
  #nav-menu { display: none; list-style: none; padding: 0; }
  #nav-menu.open { display: block; }
  .nav-link { text-decoration: none; color: #12172b; }
  .nav-link.active { font-weight: 700; text-decoration: underline; }
</style>
</head>
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
      // Read the truth off the DOM rather than keeping a separate `isOpen`
      // variable — one source of truth can't drift out of sync with itself.
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      menu.classList.toggle('open', !isOpen);
    });

    var links = document.querySelectorAll('.nav-link');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        links.forEach(function (other) { other.classList.remove('active'); });
        link.classList.add('active');
      });
    });
  </script>

</body>
</html>
"""


# ─────────────────────────────────────────────────────────────────────────────
# WEEK 2
# ─────────────────────────────────────────────────────────────────────────────

TASK4_STARTER = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Sign up</title>
</head>
<body>

  <form id="signup-form" novalidate>
    <div>
      <label for="email">Email address</label>
      <input id="email" name="email" type="email" />
    </div>

    <div>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" />
    </div>

    <!-- Screen readers announce anything that appears in here, because of
         role="alert". Leave it empty until there is something to say. -->
    <p id="form-error" role="alert"></p>

    <button type="submit">Create account</button>
  </form>

  <script>
    // TODO: on submit —
    //   1. call event.preventDefault() ALWAYS (this page never really submits)
    //   2. if email is empty/invalid or password is under 8 characters,
    //      put a message in #form-error and stop
    //   3. if everything is valid, clear #form-error and set
    //      form.dataset.submitted = 'true'
  </script>

</body>
</html>
"""

TASK4_SOLUTION = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Sign up</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 24rem; margin: 3rem auto; }
  div { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.25rem; }
  input { padding: 0.5rem; border: 1px solid #c9cddb; border-radius: 6px; }
  input[aria-invalid="true"] { border-color: #c0392b; }
  #form-error { color: #c0392b; min-height: 1.25rem; margin: 0 0 1rem; }
</style>
</head>
<body>

  <form id="signup-form" novalidate>
    <div>
      <label for="email">Email address</label>
      <input id="email" name="email" type="email" />
    </div>

    <div>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" />
    </div>

    <p id="form-error" role="alert"></p>

    <button type="submit">Create account</button>
  </form>

  <script>
    var form = document.getElementById('signup-form');
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    var error = document.getElementById('form-error');

    function validate() {
      var address = email.value.trim();
      // Deliberately loose: something, an @, something, a dot, something.
      // Real email validation is famously not worth attempting by regex —
      // the only true test is sending a message to it.
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(address)) {
        return { field: email, message: 'Enter a valid email address.' };
      }
      if (password.value.length < 8) {
        return { field: password, message: 'Password must be at least 8 characters.' };
      }
      return null;
    }

    form.addEventListener('submit', function (event) {
      // Always first: a form that reloads the page loses everything the
      // user typed, and none of the code below would ever be seen.
      event.preventDefault();

      email.setAttribute('aria-invalid', 'false');
      password.setAttribute('aria-invalid', 'false');

      var problem = validate();
      if (problem) {
        error.textContent = problem.message;
        problem.field.setAttribute('aria-invalid', 'true');
        problem.field.focus();
        return;
      }

      error.textContent = '';
      form.dataset.submitted = 'true';
    });
  </script>

</body>
</html>
"""

TASK5_STARTER = """// renderDirectory(container, fetchFn) is called by the grader with a real
// DOM element and a mocked fetch-like function:
//
//   fetchFn(url) -> Promise<{ json: () => Promise<Array<{ name: string }>> }>
//
// It is async. Everything before your first `await` runs immediately — which
// is exactly why the loading state has to be set there.

async function renderDirectory(container, fetchFn) {
  // TODO 1: synchronously (before any await) put a loading element in the
  //         container: something with data-testid="loading"

  // TODO 2: await fetchFn('/api/team'), then response.json(), then replace
  //         the container's contents with
  //         <ul data-testid="team-list"> and one <li> per member

  // TODO 3: if anything throws, replace the contents with an element
  //         carrying data-testid="error"
}

module.exports = { renderDirectory };
"""

TASK5_SOLUTION = """async function renderDirectory(container, fetchFn) {
  // Runs before the first await, so it is on screen the instant the
  // function is called — not after the network settles.
  container.innerHTML = '<p data-testid="loading">Loading the team…</p>';

  try {
    const response = await fetchFn('/api/team');
    const members = await response.json();

    const list = document.createElement('ul');
    list.setAttribute('data-testid', 'team-list');

    members.forEach((member) => {
      const item = document.createElement('li');
      // textContent, not innerHTML: if a name ever contained markup,
      // innerHTML would execute it. This is the whole of XSS in one line.
      item.textContent = member.name;
      list.appendChild(item);
    });

    // Clear the loading state and swap in the result together, so there is
    // never a frame showing both or neither.
    container.innerHTML = '';
    container.appendChild(list);
  } catch (err) {
    container.innerHTML = '<p data-testid="error">Sorry — we couldn\\'t load the team.</p>';
  }
}

module.exports = { renderDirectory };
"""

TASK6_STARTER = """// Two functions, deliberately separate:
//
//   filterMembers(members, query) -> a NEW array of the matching members
//   renderList(container, members) -> puts those members on the page
//
// Keeping "work out the answer" apart from "draw the answer" is why the
// first one is trivial to test.

function filterMembers(members, query) {
  // TODO: return every member whose name contains `query`, ignoring case.
  //       An empty or whitespace-only query returns everyone.
  //       Do not modify or reorder the array you were given.
}

function renderList(container, members) {
  // TODO: if members is empty, render an element with data-testid="empty".
  //       Otherwise render one element per member with
  //       data-testid="member-item", showing the member's name.
}

module.exports = { filterMembers, renderList };
"""

TASK6_SOLUTION = """function filterMembers(members, query) {
  const needle = (query || '').trim().toLowerCase();

  // .filter() already returns a new array, so the caller's array is never
  // touched. (.sort() and .reverse() would mutate in place — that's the
  // distinction the test is checking for.)
  if (!needle) return members.slice();

  return members.filter((member) => member.name.toLowerCase().includes(needle));
}

function renderList(container, members) {
  container.innerHTML = '';

  if (members.length === 0) {
    const empty = document.createElement('p');
    empty.setAttribute('data-testid', 'empty');
    empty.textContent = 'No one matches that search.';
    container.appendChild(empty);
    return;
  }

  const list = document.createElement('ul');
  members.forEach((member) => {
    const item = document.createElement('li');
    item.setAttribute('data-testid', 'member-item');
    item.textContent = member.name;
    list.appendChild(item);
  });
  container.appendChild(list);
}

module.exports = { filterMembers, renderList };
"""


# ─────────────────────────────────────────────────────────────────────────────
# WEEK 3
# ─────────────────────────────────────────────────────────────────────────────

TASK7_STARTER = """import React from 'react';

// This component receives everything it needs. It does not fetch, and it
// does not hold state — it is handed `data`, `loading` and `error` and its
// only job is to decide what to draw.

export default function EmployeeList({ data, loading, error }) {
  // TODO 1: if loading is true, return an element with data-testid="loading"
  //         (check this FIRST — before you look at data)

  // TODO 2: if error is set, return an element with data-testid="error"
  //         containing the error text

  // TODO 3: otherwise return <ul data-testid="employee-list"> with one <li>
  //         per employee in data

  return null;
}
"""

TASK7_SOLUTION = """import React from 'react';

export default function EmployeeList({ data, loading, error }) {
  // Order matters. `loading` is checked first because an empty `data` array
  // during a load is not "no employees" — it's "we don't know yet", and
  // showing an empty list would be a lie the user acts on.
  if (loading) {
    return <p data-testid="loading">Loading employees…</p>;
  }

  if (error) {
    return <p data-testid="error">{error}</p>;
  }

  const employees = data || [];

  if (employees.length === 0) {
    return <p data-testid="empty">No employees found.</p>;
  }

  return (
    <ul data-testid="employee-list">
      {employees.map((employee) => (
        // key tells React which item is which across re-renders. Use the
        // stable id, never the array index — with an index, deleting the
        // first row makes React reuse the wrong DOM node for every row after it.
        <li key={employee.id}>
          {employee.name} — {employee.role}
        </li>
      ))}
    </ul>
  );
}
"""

TASK8_STARTER = """import React, { useState } from 'react';

// A CONTROLLED input: React state holds the value, the input displays it,
// and typing calls back into React. The input never remembers anything by
// itself — which is what makes the value available to your submit handler.

export default function SignupForm({ onSubmit }) {
  // TODO 1: hold the email in state, and give the input
  //         data-testid="email-input" with value + onChange wired up

  // TODO 2: a button with data-testid="submit-button"

  // TODO 3: on submit, if the email is invalid, render an element with
  //         data-testid="error" and do NOT call onSubmit

  // TODO 4: if it is valid, call onSubmit(email) and clear the input.
  //         Fixing a bad address and resubmitting must clear the error.

  return null;
}
"""

TASK8_SOLUTION = """import React, { useState } from 'react';

const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

export default function SignupForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    // The form still fires a submit event even when the button is clicked,
    // so this stops the page reloading.
    event.preventDefault();

    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    // Clearing the error on the success path is what makes a second,
    // corrected attempt actually recover — forgetting this leaves a stale
    // error on screen next to a form that just worked.
    setError('');
    onSubmit(email.trim());
    setEmail('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        data-testid="email-input"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      {error && <p data-testid="error">{error}</p>}

      <button type="submit" data-testid="submit-button">Sign up</button>
    </form>
  );
}
"""

TASK9_STARTER = """import React, { useState, useEffect } from 'react';

// The whole feature, end to end. Everything you've built so far —
// controlled inputs, lists with keys, conditional rendering — plus one new
// idea: state that outlives the page.

export default function TaskManager() {
  // TODO 1: input[data-testid="task-input"] + button[data-testid="add-task"]
  // TODO 2: ul[data-testid="task-list"] of li[data-testid="task-item"]
  // TODO 3: each item needs button[data-testid="complete-task"] and
  //         button[data-testid="delete-task"]
  // TODO 4: ignore an empty or whitespace-only submission
  // TODO 5: persist the array to localStorage under the key "tasks"
  //         (each task: { id, text, completed }) and read it back on mount

  return null;
}
"""

TASK9_SOLUTION = """import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'tasks';

function loadTasks() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || [];
  } catch (err) {
    // Corrupt or hand-edited storage should degrade to an empty list, not
    // crash the whole app on mount.
    return [];
  }
}

export default function TaskManager() {
  const [text, setText] = useState('');
  // The function form runs ONCE, on mount. Passing loadTasks() directly
  // would re-read localStorage on every single render.
  const [tasks, setTasks] = useState(loadTasks);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  function addTask() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTasks((current) => [...current, { id: Date.now() + Math.random(), text: trimmed, completed: false }]);
    setText('');
  }

  function toggleTask(id) {
    // Build a new array with a new object for the one that changed. Mutating
    // `task.completed` in place would not change the array's identity, and
    // React would see no reason to re-render.
    setTasks((current) => current.map((task) => (
      task.id === id ? { ...task, completed: !task.completed } : task
    )));
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  return (
    <div>
      <input
        data-testid="task-input"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <button data-testid="add-task" onClick={addTask}>Add</button>

      <ul data-testid="task-list">
        {tasks.map((task) => (
          <li data-testid="task-item" key={task.id}>
            <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
              {task.text}
            </span>
            <button data-testid="complete-task" onClick={() => toggleTask(task.id)}>Done</button>
            <button data-testid="delete-task" onClick={() => deleteTask(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
"""

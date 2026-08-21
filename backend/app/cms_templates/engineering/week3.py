"""Week 3 — React: props, state, and a whole small app.

The same three problems the student has already solved by hand — render a
list, control an input, keep some state — now expressed in React, so the
framework's value is something they feel rather than something they're told.

See week1.py for the `explainer` content contract.
"""
from app.cms_templates.engineering import starters
from app.cms_templates.engineering.assessments import assessment_for

_COMMON = dict(submission_mode="code", grading_strategy="registered_grader")


TASK_7 = dict(
    task_index=7, title="Your First React Component", type="code_sandbox", week=3,
    objective="Rebuild the directory list as a React component that takes everything as props.",
    briefing=(
        "We're moving the internal tools over to React, starting with the employee directory. I want "
        "this component to do one job: given data, loading and error, decide what to draw. It doesn't "
        "fetch anything — whatever renders it owns that. Components that fetch their own data are the "
        "hardest thing in the codebase to test or reuse, and I'd rather we didn't start there."
    ),
    what_to_do=[
        "Check loading first and render data-testid=\"loading\".",
        "Then check error and render data-testid=\"error\" containing the message.",
        "Otherwise render <ul data-testid=\"employee-list\"> with one item per employee.",
        "Loading must win over an empty data array.",
    ],
    what_to_submit=["A single submission.jsx with a default-exported EmployeeList component."],
    hints=[
        "The order of your checks IS the behaviour. loading first, then error, then the data — that "
        "order is what the fourth check verifies.",
        "Give each <li> a `key` from the employee's id. React warns without it, and index keys break "
        "as soon as the list can change.",
        "This component never calls fetch. Everything it needs arrives as props.",
    ],
    success_criteria=[
        "Renders a loading element when loading is true",
        "Renders an error element containing the error text",
        "Renders a list with one entry per employee",
        "Loading takes priority over an empty data array",
    ],
    config={
        **_COMMON,
        "language": "jsx",
        "grader_key": "frontend_dev_sim.task7",
        "starter_code": starters.TASK7_STARTER,
        "input_filename": "submission.jsx",
        "output_filename": "output.json",
        "assessment": assessment_for(7),
        "explainer": {
            "situation": (
                "You already built this in Task 5 with createElement and appendChild. React's pitch is "
                "that you stop describing the steps to get to a screen and start describing what the "
                "screen should look like for a given set of data — then it works out the DOM "
                "operations. This task is that same problem, so the difference is visible rather than "
                "theoretical."
            ),
            "outcome": (
                "A component that is a pure function of its props: hand it the same three values and "
                "you get the same output, every time. No fetching, no state, no surprises — which is "
                "why its tests are three lines each."
            ),
            "preview": (
                "<EmployeeList loading={true} />           →  <p data-testid=\"loading\">…\n"
                "<EmployeeList error=\"Failed to load\" />   →  <p data-testid=\"error\">Failed to load\n"
                "<EmployeeList data={[ada, grace]} />     →  <ul data-testid=\"employee-list\">\n"
                "                                              <li>Ada Lovelace — Engineer</li>\n"
                "                                              <li>Grace Hopper — Admiral</li>\n"
                "\n"
                "<EmployeeList data={[]} loading={true} /> →  loading wins. An empty list during a\n"
                "                                             load is 'we don't know yet', not 'none'."
            ),
            "concepts": [
                {"term": "Component",
                 "plain": "A JavaScript function that returns a description of some UI. Call it with "
                          "props and it tells you what should be on screen. React does the rest.",
                 "why": "The mental shift: you stop writing 'create an li, set its text, append it' and "
                        "start writing 'for this data, here is the markup'."},
                {"term": "Props",
                 "plain": "The arguments a component is called with, arriving as one object. "
                          "`{ data, loading, error }` in the signature is destructuring that object.",
                 "why": "Props are read-only — a component never modifies its own props. Data flows "
                        "down from the parent; that one-way flow is what makes a React app traceable."},
                {"term": "JSX",
                 "plain": "The HTML-looking syntax inside your JavaScript. It is not HTML and not a "
                          "string — a build step compiles it into function calls.",
                 "why": "It is why attributes differ slightly: `className` instead of `class`, `htmlFor` "
                        "instead of `for`, because `class` and `for` are reserved words in JavaScript."},
                {"term": "Conditional rendering",
                 "plain": "Returning different markup depending on the props — with a plain if, an "
                          "early return, a ternary, or `&&`.",
                 "why": "There is no special React syntax for this. It is ordinary JavaScript control "
                        "flow inside a function that happens to return UI."},
                {"term": "key",
                 "plain": "A stable identifier on each item of a rendered list, so React can tell which "
                          "one is which between renders.",
                 "why": "Without keys React re-renders more than it needs to. With index keys it does "
                        "something worse: it reuses the wrong DOM node when the list changes, so "
                        "focus, scroll position and half-typed input land on the wrong row."},
            ],
            "steps": [
                {"title": "Check loading first, and return early",
                 "plain": "The first branch of the component. If loading is true, return the loading "
                          "element and stop — nothing below runs.",
                 "code": "if (loading) {\n"
                         "  return <p data-testid=\"loading\">Loading employees…</p>;\n"
                         "}",
                 "deeper": "This order is a product decision encoded in code. If you checked data "
                           "first, an empty array during a load would render 'No employees found' — "
                           "stated as a fact, to a user who then acts on it. Priority order is how you "
                           "stop the UI asserting things it does not know."},

                {"title": "Then the error",
                 "plain": "If an error was passed, show it. Render the message you were given rather "
                          "than a generic one.",
                 "code": "if (error) {\n"
                         "  return <p data-testid=\"error\">{error}</p>;\n"
                         "}",
                 "deeper": "The curly braces drop out of JSX back into JavaScript — `{error}` inserts "
                           "the variable's value. React escapes anything you interpolate this way, "
                           "which is why React apps are XSS-resistant by default and why the opt-out "
                           "is named dangerouslySetInnerHTML."},

                {"title": "Render the list with map",
                 "plain": "`.map()` turns an array of data into an array of elements. React renders "
                          "arrays of elements directly.",
                 "code": "return (\n"
                         "  <ul data-testid=\"employee-list\">\n"
                         "    {employees.map((employee) => (\n"
                         "      <li key={employee.id}>\n"
                         "        {employee.name} — {employee.role}\n"
                         "      </li>\n"
                         "    ))}\n"
                         "  </ul>\n"
                         ");",
                 "deeper": "Use the stable id for the key, never the array index. With index keys, "
                           "deleting the first row shifts every subsequent key by one, so React "
                           "concludes that every row changed and reuses DOM nodes for the wrong data. "
                           "On a static list you will never notice; on an interactive one it is a bug "
                           "report you will struggle to reproduce."},

                {"title": "Guard against a null data prop",
                 "plain": "`data` can arrive as null before anything has loaded. Calling .map on null "
                          "throws, so default it to an empty array.",
                 "code": "const employees = data || [];",
                 "deeper": "A component crashing on a prop shape it was always going to receive is one "
                           "of the most common React runtime errors. Decide what null means to you at "
                           "the top of the component, once."},
            ],
            "contract": [
                {"name": "export default function EmployeeList", "must": "Default export, accepting { data, loading, error }."},
                {"name": "data-testid=\"loading\"", "must": "Rendered whenever loading is true — checked first."},
                {"name": "data-testid=\"error\"", "must": "Contains the error text passed in."},
                {"name": "data-testid=\"employee-list\"", "must": "A <ul> with one entry per employee."},
            ],
            "mistakes": [
                "Checking `data` before `loading`, so an empty array during a load renders as 'no "
                "employees'.",
                "`key={index}` instead of `key={employee.id}` — invisible now, painful later.",
                "Returning several elements without a wrapper. A component returns one root; use a "
                "fragment (<>…</>) if you have no natural container.",
                "Writing `class=` instead of `className=` in JSX.",
                "Calling .map on a null `data` prop without a default.",
            ],
            "further": [
                "Add a fourth branch: loaded successfully, but zero employees. That is an empty state, "
                "not an error — same distinction as Task 6.",
                "Read about React.memo and why wrapping this component in it would change nothing "
                "unless the parent passes stable props.",
                "Look at how React Query or SWR own loading/error/data for you, and notice that the "
                "component you just wrote is exactly the shape they expect to render.",
            ],
        },
    },
    model_solution={
        "steps": [
            dict(title="Priority order is the behaviour",
                 detail="loading, then error, then data. An empty array while loading is 'unknown', "
                        "not 'none'.",
                 example="if (loading) return <p data-testid=\"loading\">Loading…</p>;\n"
                         "if (error) return <p data-testid=\"error\">{error}</p>;"),
            dict(title="Stable keys",
                 detail="React matches elements across renders by key. Index keys break the moment the "
                        "list can change.",
                 example="{employees.map((e) => (\n  <li key={e.id}>{e.name} — {e.role}</li>\n))}"),
        ],
        "key_principle": "A component that takes everything it needs as props is a pure function of "
                         "those props — trivial to test, and reusable with any data source.",
        "great_looks_like": "Three tests, three lines each, no mocking of anything.",
        "example_solution": starters.TASK7_SOLUTION,
    },
    xp_award=100, skill_awards={"react": 14, "component_design": 15},
)


TASK_8 = dict(
    task_index=8, title="Controlled Form Component", type="code_sandbox", week=3,
    objective="Rebuild the signup form in React, with state holding the value.",
    briefing=(
        "Same signup form as before, now in React. The bit worth getting right is that React holds the "
        "value, not the input — that's what makes the value available when you submit, and what lets "
        "you clear the field afterwards. Watch the recovery path too: fixing a bad address and "
        "submitting again has to clear the error. We shipped that bug last quarter and it took a week "
        "for anyone to report it."
    ),
    what_to_do=[
        "Hold the email in state; wire value and onChange on data-testid=\"email-input\".",
        "Add a submit button with data-testid=\"submit-button\".",
        "On an invalid email, render data-testid=\"error\" and do not call onSubmit.",
        "On a valid email, call onSubmit(email) and clear the input.",
        "Resubmitting a corrected address must clear the error.",
    ],
    what_to_submit=["A single submission.jsx with a default-exported SignupForm component."],
    hints=[
        "If you give the input `type=\"email\"`, put `noValidate` on the <form>. Otherwise the browser "
        "blocks submission of an invalid address before your handler ever runs, and the form appears "
        "to do nothing at all.",
        "`value={email}` with no `onChange` gives you a field that will not accept typing — React pins "
        "it to state, and state never changes. Both, always.",
        "Call setError('') on the success path, even when nothing is showing. That is what the fifth "
        "check is looking for.",
        "event.preventDefault() is still required in React — the synthetic event wraps the real one, "
        "it does not change the browser's default.",
    ],
    success_criteria=[
        "The input is controlled by React state",
        "An invalid email shows an error and does not call onSubmit",
        "A valid email calls onSubmit with the address",
        "The input clears after a successful submit",
        "Correcting an invalid address clears the error",
    ],
    config={
        **_COMMON,
        "language": "jsx",
        "grader_key": "frontend_dev_sim.task8",
        "starter_code": starters.TASK8_STARTER,
        "input_filename": "submission.jsx",
        "output_filename": "output.json",
        "assessment": assessment_for(8),
        "explainer": {
            "situation": (
                "In Task 4 the input held its own value and you read it out of the DOM on submit. In "
                "React that relationship is inverted: state holds the value, the input displays it, "
                "and typing calls back into state. It feels like extra ceremony for about a day, and "
                "then you notice that the value is simply available wherever you need it, and that "
                "clearing the field is one assignment."
            ),
            "outcome": (
                "A form where React is the single source of truth for what has been typed, validation "
                "runs on submit, and both the failure and the recovery from failure behave correctly."
            ),
            "preview": (
                "type 'nope' → submit          type 'maya@enigma.dev' → submit\n"
                "┌────────────────────────┐    ┌────────────────────────┐\n"
                "│ [ nope              ]  │    │ [                   ]  │  ← cleared\n"
                "│ ⚠ Enter a valid email  │    │                        │  ← error gone\n"
                "│ [ Sign up ]            │    │ [ Sign up ]            │\n"
                "└────────────────────────┘    └────────────────────────┘\n"
                "onSubmit NOT called            onSubmit('maya@enigma.dev')"
            ),
            "concepts": [
                {"term": "useState",
                 "plain": "`const [email, setEmail] = useState('')` gives you a value and a function "
                          "to change it. Calling the setter tells React to re-render with the new "
                          "value.",
                 "why": "It is how a function component remembers anything between renders. Plain "
                        "variables reset on every render; state survives."},
                {"term": "Controlled input",
                 "plain": "An input whose `value` comes from state and whose `onChange` writes back to "
                          "state. React holds the truth; the input only displays it.",
                 "why": "The value is then already in a variable when you submit, you can clear the "
                        "field by setting state, and you can transform input as it is typed."},
                {"term": "Re-render",
                 "plain": "When state changes, React calls your component function again and compares "
                          "the result with what is on screen, updating only the differences.",
                 "why": "Your component body runs many times. Anything expensive or side-effecting in "
                        "it runs many times too — which is what useEffect and useMemo exist for."},
                {"term": "Stale state",
                 "plain": "Setting state does not change the variable you are currently holding. "
                          "`setEmail('x'); console.log(email)` logs the OLD value.",
                 "why": "It is not a bug, it is the render model: `email` is a constant belonging to "
                        "this render. The next render gets the new one."},
                {"term": "Synthetic events",
                 "plain": "React wraps native browser events in its own object with a consistent API "
                          "across browsers. `event.preventDefault()` works exactly as you would "
                          "expect.",
                 "why": "React normalises the event object, not the browser's behaviour. Submit still "
                        "reloads the page unless you prevent it — and in a React app, a reload means a "
                        "full remount."},
            ],
            "steps": [
                {"title": "Put the value in state",
                 "plain": "Two pieces of state: what has been typed, and what error to show. Both start "
                          "as empty strings.",
                 "code": "const [email, setEmail] = useState('');\n"
                         "const [error, setError] = useState('');",
                 "deeper": "An empty string for error, rather than null, means you can render "
                           "`{error && …}` safely and never accidentally render a stray value. Picking "
                           "one falsy empty representation and sticking to it saves a category of bug."},

                {"title": "Wire the input both ways",
                 "plain": "`value` displays the state; `onChange` writes back into it. You need both — "
                          "one without the other gives you a broken field.",
                 "code": "<input\n"
                         "  data-testid=\"email-input\"\n"
                         "  value={email}\n"
                         "  onChange={(event) => setEmail(event.target.value)}\n"
                         "/>",
                 "deeper": "`value` with no `onChange` produces a field that visibly refuses to accept "
                           "typing, and a console warning telling you exactly this. `onChange` with no "
                           "`value` gives an uncontrolled input that works but whose value React does "
                           "not know. Both together, or neither and use a ref — those are the two "
                           "coherent positions."},

                {"title": "Validate on submit, and refuse to proceed",
                 "plain": "Prevent the default, test the address, and if it fails set the error and "
                          "return without calling onSubmit.",
                 "code": "function handleSubmit(event) {\n"
                         "  event.preventDefault();\n\n"
                         "  if (!EMAIL_RE.test(email.trim())) {\n"
                         "    setError('Enter a valid email address.');\n"
                         "    return;\n"
                         "  }\n"
                         "  // …success path\n"
                         "}",
                 "deeper": "Put the handler on the <form>'s onSubmit rather than the button's onClick. "
                           "Pressing Enter inside a text field submits the form, and a click handler on "
                           "the button never sees it — the same trap as Task 4, one framework later."},

                {"title": "Handle success, and clear up after failure",
                 "plain": "Clear the error, call onSubmit with the address, and empty the input by "
                          "setting state back to an empty string.",
                 "code": "setError('');\n"
                         "onSubmit(email.trim());\n"
                         "setEmail('');",
                 "deeper": "`setError('')` here is the line people leave out, and it is checked "
                           "explicitly. Without it, someone who mistypes, sees the error, fixes it and "
                           "succeeds is left staring at a red message beside a form that worked. "
                           "Recovery paths are where validation UIs actually fail."},
            ],
            "contract": [
                {"name": "export default function SignupForm({ onSubmit })", "must": "Default export, taking an onSubmit prop."},
                {"name": "data-testid=\"email-input\"", "must": "Controlled: value + onChange."},
                {"name": "data-testid=\"submit-button\"", "must": "Submits the form."},
                {"name": "data-testid=\"error\"", "must": "Present only while there is a validation error."},
                {"name": "onSubmit(email)", "must": "Called with the address, and only when valid."},
            ],
            "mistakes": [
                "Giving the input `type=\"email\"` without putting `noValidate` on the <form>. The "
                "browser's own constraint validation then refuses to fire the submit event at all "
                "for an invalid address — so your handler never runs, no error appears, and the form "
                "looks completely dead. You are handling validation yourself here; turn the "
                "browser's off, exactly as Task 4 did.",
                "`value` without `onChange` — the field appears frozen and React warns in the console.",
                "Forgetting preventDefault, so the page reloads and the whole app remounts.",
                "Not clearing the error on success, leaving it beside a form that just worked.",
                "Reading `email` immediately after `setEmail` and getting the old value — that is the "
                "render model, not a bug.",
                "Putting the handler on the button's onClick, so submitting with Enter skips validation.",
            ],
            "further": [
                "Validate on blur as well as submit, and notice how much state that needs — this is "
                "the point where people reach for React Hook Form.",
                "Add aria-invalid and aria-describedby, as in Task 4. Accessibility does not become "
                "someone else's job because a framework is involved.",
                "Extract the email/error pair into a custom hook, `useEmailField()`, and see how "
                "hooks let you reuse stateful logic without touching the markup.",
            ],
        },
    },
    model_solution={
        "steps": [
            dict(title="React owns the value",
                 detail="value displays state, onChange writes it. Both, or the field does not work.",
                 example="<input data-testid=\"email-input\" value={email}\n"
                         "  onChange={(e) => setEmail(e.target.value)} />"),
            dict(title="Refuse, then recover",
                 detail="Set the error and return on failure; clear it on success so a corrected "
                        "attempt visibly works.",
                 example="if (!EMAIL_RE.test(email.trim())) { setError('…'); return; }\n"
                         "setError('');\nonSubmit(email.trim());\nsetEmail('');"),
        ],
        "key_principle": "One source of truth for the value. Everything else — clearing, validating, "
                         "submitting — falls out of that for free.",
        "great_looks_like": "The failure path and the recovery path are both handled, and the second "
                            "attempt feels like it worked because it visibly did.",
        "example_solution": starters.TASK8_SOLUTION,
    },
    xp_award=110, skill_awards={"react": 14, "component_design": 10, "state_management": 13},
)


TASK_9 = dict(
    task_index=9, title="Task Manager App", type="code_sandbox", week=3,
    objective="Ship a complete feature: add, complete, delete, and survive a page reload.",
    briefing=(
        "Last one, and it's the whole thing end to end — a task list people can actually use. Add, "
        "mark done, delete, and it has to still be there after a refresh. This is where everything "
        "you've built this month comes together, and it's the piece I'd put in front of someone asking "
        "what you can do. Take your time with the persistence; it's the part that's easy to get "
        "subtly wrong."
    ),
    what_to_do=[
        "An input (task-input) and an Add button (add-task).",
        "A <ul data-testid=\"task-list\"> of <li data-testid=\"task-item\">.",
        "Each item gets a complete-task and a delete-task button.",
        "Ignore empty or whitespace-only submissions.",
        "Persist to localStorage under the key \"tasks\", and read it back on mount.",
    ],
    what_to_submit=["A single submission.jsx with a default-exported TaskManager component."],
    hints=[
        "Each task is { id, text, completed }. The stored value must match that shape — the check "
        "reads it back out of localStorage directly.",
        "`useState(loadTasks)` passes the function; `useState(loadTasks())` calls it on every render "
        "and throws the result away. Pass the function.",
        "Toggling completion must build a NEW object for the changed task. Mutating task.completed "
        "leaves the array identical as far as React is concerned, and nothing re-renders.",
    ],
    success_criteria=[
        "A new task appears in the list",
        "Completing a task persists to localStorage; deleting removes it",
        "Tasks in localStorage are restored on mount",
        "Empty submissions are ignored",
    ],
    config={
        **_COMMON,
        "language": "jsx",
        "grader_key": "frontend_dev_sim.task9",
        "starter_code": starters.TASK9_STARTER,
        "input_filename": "submission.jsx",
        "output_filename": "output.json",
        "assessment": assessment_for(9),
        "explainer": {
            "situation": (
                "The capstone. Everything so far has been a piece of something; this is a small "
                "complete feature that a person could genuinely use. The new idea is persistence — "
                "state that outlives the page — and it brings with it two of React's most instructive "
                "traps: lazy initial state, and immutable updates."
            ),
            "outcome": (
                "A task list you can add to, tick off and delete from, which is exactly as you left it "
                "after a refresh."
            ),
            "preview": (
                "┌──────────────────────────────────────────┐\n"
                "│ [ Write onboarding docs      ] [ Add ]   │\n"
                "├──────────────────────────────────────────┤\n"
                "│ Ship the feature        [Done] [Delete]  │  ← task-item\n"
                "│ ~~Fix the nav bug~~     [Done] [Delete]  │  ← completed: true\n"
                "└──────────────────────────────────────────┘\n"
                "\n"
                "localStorage['tasks'] =\n"
                "  [{\"id\":1,\"text\":\"Ship the feature\",\"completed\":false},\n"
                "   {\"id\":2,\"text\":\"Fix the nav bug\",\"completed\":true}]\n"
                "\n"
                "  …and it is all still there after F5."
            ),
            "concepts": [
                {"term": "localStorage",
                 "plain": "A small key-value store the browser keeps per site, surviving reloads and "
                          "restarts. Strings only — objects go in via JSON.stringify and come out via "
                          "JSON.parse.",
                 "why": "It is the simplest possible persistence, with real limits: synchronous (it "
                        "blocks the main thread), around 5MB, and readable by any script on the page. "
                        "Fine for preferences and drafts; never for tokens."},
                {"term": "useEffect",
                 "plain": "Runs a function AFTER React has rendered. The dependency array controls "
                          "when: `[tasks]` means 'after any render where tasks changed'.",
                 "why": "Writing to localStorage during render would be a side effect in the middle of "
                        "React's own work. Effects are where you reach outside React."},
                {"term": "Lazy initial state",
                 "plain": "`useState(loadTasks)` hands React the function to call once. "
                          "`useState(loadTasks())` calls it yourself, on every single render, and "
                          "React discards every result after the first.",
                 "why": "React only uses the initial value once, but the expression you write is "
                        "evaluated every render. With a localStorage read and a JSON.parse inside, "
                        "that is real, invisible waste."},
                {"term": "Immutable updates",
                 "plain": "Never change an object or array in place. Build a new one: spread into a new "
                          "array to add, .map to a new object to change, .filter to a new array to "
                          "remove.",
                 "why": "React decides whether to re-render by comparing references. Mutating "
                        "`task.completed` leaves the same object in the same array — React sees "
                        "nothing changed and skips the render. The data updated and the screen did "
                        "not."},
                {"term": "Functional updates",
                 "plain": "`setTasks(current => …)` hands you the latest state instead of whatever the "
                          "closure captured.",
                 "why": "It stays correct when several updates are batched together, or when the "
                        "callback was created a render or two ago."},
            ],
            "steps": [
                {"title": "Read localStorage once, safely",
                 "plain": "Write a function that reads and parses the stored tasks, returning an empty "
                          "array if there is nothing or if it cannot be parsed. Pass that function to "
                          "useState — do not call it.",
                 "code": "function loadTasks() {\n"
                         "  try {\n"
                         "    return JSON.parse(window.localStorage.getItem('tasks')) || [];\n"
                         "  } catch (err) {\n"
                         "    return [];\n"
                         "  }\n"
                         "}\n\n"
                         "const [tasks, setTasks] = useState(loadTasks);  // no parentheses",
                 "deeper": "The try/catch is not defensive padding. Storage is shared across every "
                           "script on the origin, persists indefinitely, and may hold something an "
                           "older version of your own app wrote. A throw during initial state means "
                           "the component never mounts — one corrupt key bricks the app until the "
                           "user clears storage they do not know exists."},

                {"title": "Write back whenever the tasks change",
                 "plain": "One effect, depending on `tasks`. It runs after any render where the array "
                          "changed, and saves it.",
                 "code": "useEffect(() => {\n"
                         "  window.localStorage.setItem('tasks', JSON.stringify(tasks));\n"
                         "}, [tasks]);",
                 "deeper": "The dependency array is the whole behaviour. No array → runs after every "
                           "render, wasteful. `[]` → runs once on mount, so nothing you do afterwards "
                           "is ever saved. `[tasks]` → exactly when the data changed. Getting this "
                           "wrong produces persistence that appears to work until you reload."},

                {"title": "Add, ignoring empty input",
                 "plain": "Trim the text. If nothing is left, return without doing anything. Otherwise "
                          "append a new task and clear the input.",
                 "code": "function addTask() {\n"
                         "  const trimmed = text.trim();\n"
                         "  if (!trimmed) return;\n\n"
                         "  setTasks((current) => [\n"
                         "    ...current,\n"
                         "    { id: Date.now() + Math.random(), text: trimmed, completed: false },\n"
                         "  ]);\n"
                         "  setText('');\n"
                         "}",
                 "deeper": "`Date.now()` alone is not a safe id — two tasks added in the same "
                           "millisecond collide, and duplicate keys make React reuse the wrong node. "
                           "In production, crypto.randomUUID(). Also note the spread builds a NEW "
                           "array; `current.push(…)` would mutate and render nothing."},

                {"title": "Toggle by building a new object",
                 "plain": "`.map` over the tasks. For the one that matches, return a copy with "
                          "completed flipped; return the others unchanged.",
                 "code": "function toggleTask(id) {\n"
                         "  setTasks((current) => current.map((task) => (\n"
                         "    task.id === id ? { ...task, completed: !task.completed } : task\n"
                         "  )));\n"
                         "}",
                 "deeper": "This is the single most important line in the task. `task.completed = "
                           "!task.completed` would update the data perfectly and change nothing on "
                           "screen, because the array and every object in it still have the same "
                           "identity. Returning the untouched tasks by reference is deliberate too — "
                           "only what changed gets a new identity, so React re-renders only that row."},

                {"title": "Delete by filtering",
                 "plain": "`.filter` returns a new array without the matching task.",
                 "code": "function deleteTask(id) {\n"
                         "  setTasks((current) => current.filter((task) => task.id !== id));\n"
                         "}",
                 "deeper": "Same principle as toggling: a new array, so React sees a change. It is also "
                           "the clearest demonstration of why keys must be stable — with index keys, "
                           "deleting the first row makes React believe every row below it changed."},
            ],
            "contract": [
                {"name": "data-testid=\"task-input\"", "must": "A controlled text input."},
                {"name": "data-testid=\"add-task\"", "must": "Adds the current text as a task."},
                {"name": "data-testid=\"task-list\"", "must": "A <ul> containing the task items."},
                {"name": "data-testid=\"task-item\"", "must": "One <li> per task."},
                {"name": "data-testid=\"complete-task\"", "must": "One per item; toggles completed."},
                {"name": "data-testid=\"delete-task\"", "must": "One per item; removes the task."},
                {"name": "localStorage key \"tasks\"", "must": "An array of { id, text, completed }."},
            ],
            "mistakes": [
                "`useState(loadTasks())` instead of `useState(loadTasks)` — re-reads and re-parses "
                "storage on every render.",
                "Mutating `task.completed` in place: the data changes and the screen does not.",
                "`useEffect(…, [])` for the save, so only the initial empty array is ever written.",
                "Storing the array without JSON.stringify — localStorage coerces it to the string "
                "\"[object Object]\".",
                "Not trimming before the empty check, so a task made of spaces gets added.",
                "`key={index}` on the list, which breaks visibly as soon as you delete from the middle.",
            ],
            "further": [
                "Add filters — all / active / completed — and derive the visible list during render "
                "rather than storing it as a fourth piece of state.",
                "Try useReducer instead of three separate setTasks calls. This is the size of feature "
                "where a reducer starts to pay for itself.",
                "Listen for the `storage` event and watch two tabs stay in sync — it is about five "
                "lines and genuinely satisfying.",
                "Read about optimistic updates: render the change immediately, then reconcile with the "
                "server, and roll back if it fails. It is what makes good apps feel instant.",
            ],
        },
    },
    model_solution={
        "steps": [
            dict(title="Lazy initial state",
                 detail="Pass the function so React calls it once, rather than calling it yourself on "
                        "every render.",
                 example="const [tasks, setTasks] = useState(loadTasks);  // not loadTasks()"),
            dict(title="Persist on change",
                 detail="[tasks] means the effect runs exactly when the data changed — not every "
                        "render, not only on mount.",
                 example="useEffect(() => {\n  localStorage.setItem('tasks', JSON.stringify(tasks));\n}, [tasks]);"),
            dict(title="New objects, not mutations",
                 detail="React compares identities. Mutating in place updates the data and leaves the "
                        "screen alone.",
                 example="current.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))"),
        ],
        "key_principle": "In React, immutability is not a style choice — it is the mechanism by which "
                         "change is detected.",
        "great_looks_like": "Add three tasks, tick one, delete another, hit refresh, and the screen is "
                            "exactly as you left it.",
        "example_solution": starters.TASK9_SOLUTION,
    },
    xp_award=130, skill_awards={"react": 17, "component_design": 15, "state_management": 22},
)


TASKS = [TASK_7, TASK_8, TASK_9]

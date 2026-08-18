"""Assessment banks for the Frontend Developer simulation.

Two kinds:

  MINI_ASSESSMENTS — one 5-question check per task, taken immediately after
  that task is graded. Scoped tightly to what the student just built, and
  written so that someone who genuinely did the work can answer from what they
  just did rather than from memorised trivia.

  FINAL_ASSESSMENT — 50 questions after all nine tasks, mixing beginner recall
  with senior-level judgement, and drawing on both the domain (HTML, CSS,
  JavaScript, React, accessibility, the browser) and the specific
  implementations built during the simulation.

Every question carries an `explanation`, shown only after the attempt is
graded. It's the difference between a score and a lesson.

THESE ANSWERS NEVER REACH THE BROWSER. The whole block is stripped from the
public simulation payload (see `assessment` in app/services/task_types.py's
secret_config_keys) and graded server-side by
app/api/v1/simulations/assessments.py. Do not move this into a config key the
student's client can read.
"""

# ─────────────────────────────────────────────────────────────────────────────
# Mini assessments — keyed by task_index
# ─────────────────────────────────────────────────────────────────────────────

# Passing a task's mini assessment is what unlocks the next task.
#
# Carried on every bank so the SERVER decides whether an attempt passed. It
# previously wasn't set at all, so the API reported `pass_mark: 0` and
# `passed: null` — and the client, which enforces 80 itself, then showed a
# green "well done" banner and an amber "you need 80% to move on" beside each
# other on the same failed attempt. Two authorities, one screen, opposite
# answers. There is one now, and this is it.
#
# Mirrors ASSESSMENT_PASS_MARK in
# frontend/src/features/simulations/engineering/lib/assessment.js, which is the
# gate's default before this value has been fetched.
MINI_PASS_MARK = 80

MINI_ASSESSMENTS: dict[int, dict] = {
    1: {
        "title": "Semantic structure & layout",
        "pass_mark": MINI_PASS_MARK,
        "questions": [
            {"question": "You replace every <div> on a page with <header>, <nav>, <main> and <footer>, changing nothing else. What actually improves?",
             "options": [
                 "The page renders measurably faster",
                 "Assistive technology and search crawlers can now identify the regions of the page, and users of screen readers can jump straight to them",
                 "The CSS becomes smaller because semantic tags carry their own styling",
                 "Nothing — the tags are an author convention with no runtime effect"],
             "correct": 1,
             "explanation": "Semantic elements map to ARIA landmark roles. A screen reader user can list the landmarks and jump to <main> directly; with divs there is nothing to jump to. Rendering speed is unaffected."},

            {"question": "Why does the check insist on exactly one <h1> inside <main>?",
             "options": [
                 "More than one <h1> is invalid HTML and the page will not parse",
                 "Browsers only apply their default styling to the first <h1>",
                 "The heading outline is how non-visual users navigate a page — one <h1> states what this page is, and everything else nests beneath it",
                 "Search engines ignore any page with multiple <h1> elements"],
             "correct": 2,
             "explanation": "Multiple <h1>s are valid HTML5, but a document with several 'top' headings has no clear outline. One <h1> per page, with <h2>/<h3> nesting under it, is what makes the structure navigable."},

            {"question": "You need a header with a logo hard left and nav links hard right, on one row. Which is the natural tool?",
             "options": [
                 "Flexbox with justify-content: space-between",
                 "CSS Grid with grid-template-areas",
                 "float: left and float: right",
                 "position: absolute on both children"],
             "correct": 0,
             "explanation": "Flexbox is built for distributing items along a single axis; space-between pushes the first and last children to the edges. Grid shines for two-dimensional layouts — it works here, but it's more machinery than the job needs."},

            {"question": "`place-items: center` on a grid container does what?",
             "options": [
                 "Centres the container itself within its parent",
                 "Sets align-items and justify-items together, centring each item in its own grid cell",
                 "Centres only the first grid item",
                 "Is a Flexbox property with no meaning in Grid"],
             "correct": 1,
             "explanation": "It is the shorthand for align-items + justify-items — the block axis and the inline axis at once. It centres content inside cells, not the container inside its parent."},

            {"question": "A designer asks you to make a <div> behave as the page's main region by giving it class=\"main\". What's the correct response?",
             "options": [
                 "Add class=\"main\" — the class name conveys the meaning",
                 "Use <main>, or if the div must stay, add role=\"main\" — a class name is invisible to assistive technology",
                 "Add an id=\"main\" instead, since ids carry more weight than classes",
                 "Add a comment above the div explaining its role"],
             "correct": 1,
             "explanation": "Class names are for styling and are entirely invisible to the accessibility tree. Meaning is carried by the element itself, or failing that, an explicit ARIA role."},
        ],
    },

    2: {
        "title": "Responsive layout & images",
        "pass_mark": MINI_PASS_MARK,
        "questions": [
            {"question": "What does `repeat(auto-fit, minmax(16rem, 1fr))` actually do?",
             "options": [
                 "Creates exactly 16 columns of equal width",
                 "Fits as many columns of at least 16rem as the container allows, then stretches them to share the space evenly",
                 "Creates one column that is 16rem wide on small screens and 1fr on large ones",
                 "Repeats the grid 16 times down the page"],
             "correct": 1,
             "explanation": "auto-fit asks the browser to work out the column count from the available width; minmax sets the floor (16rem) and lets each column grow to an equal share (1fr). The layout responds without a single media query."},

            {"question": "What is the practical difference between `auto-fit` and `auto-fill`?",
             "options": [
                 "They are aliases for the same behaviour",
                 "auto-fill keeps empty tracks in the row; auto-fit collapses them, so the real items stretch to fill the space",
                 "auto-fit works only with fr units; auto-fill works only with fixed widths",
                 "auto-fill is the modern replacement — auto-fit is deprecated"],
             "correct": 1,
             "explanation": "With three cards in a container wide enough for five, auto-fill leaves two empty tracks and your cards stay narrow; auto-fit collapses them so the three cards expand. Neither is deprecated."},

            {"question": "Which alt text is correct for a decorative background flourish that carries no information?",
             "options": [
                 'alt="decorative flourish"',
                 'alt=""',
                 "Omit the alt attribute entirely",
                 'alt="image"'],
             "correct": 1,
             "explanation": "An empty alt tells a screen reader to skip the image — exactly right for decoration. Omitting alt entirely is different and worse: many screen readers then read out the filename."},

            {"question": "Your cards look right on desktop but the text is cramped at 360px, even though the grid columns already reflow. What is the media query for?",
             "options": [
                 "Changing the column count — that is the only thing media queries can do",
                 "Adjusting what auto-fit cannot: padding, gaps, and font sizes at genuinely small sizes",
                 "It is redundant — auto-fit handles every responsive concern",
                 "Loading a separate mobile stylesheet"],
             "correct": 1,
             "explanation": "auto-fit solves column count only. Spacing and type scale are independent decisions, and those are what breakpoints are still genuinely for."},

            {"question": "Why wrap each card in <article> rather than <div>?",
             "options": [
                 "<article> has a default border in most browsers",
                 "It is required for CSS Grid children",
                 "An <article> is a self-contained piece of content that would still make sense on its own — which describes a feature card, and gives assistive tech a meaningful boundary",
                 "<div> cannot contain headings"],
             "correct": 2,
             "explanation": "That self-containment test is the actual definition in the HTML spec. It also gives screen readers a navigable unit rather than an anonymous box."},
        ],
    },

    3: {
        "title": "DOM events & accessible state",
        "pass_mark": MINI_PASS_MARK,
        "questions": [
            {"question": "Why must aria-expanded be updated in JavaScript rather than just styled in CSS?",
             "options": [
                 "CSS cannot change attributes at all, and screen readers read the attribute, not the appearance",
                 "It is only needed for keyboard users, who don't load CSS",
                 "Browsers update it automatically when the menu's display changes",
                 "aria-expanded is purely documentation for other developers"],
             "correct": 0,
             "explanation": "A sighted user infers 'open' from what they see. A screen reader user has only the attribute. CSS can react to state but cannot write it, so JS has to keep the attribute honest."},

            {"question": "The solution reads `toggle.getAttribute('aria-expanded') === 'true'` instead of keeping a separate `let isOpen` variable. Why is that better?",
             "options": [
                 "It is faster than reading a JavaScript variable",
                 "The DOM attribute has to be correct anyway, so making it the single source of truth removes any chance of the two drifting apart",
                 "Local variables are not allowed inside event listeners",
                 "It avoids a memory leak"],
             "correct": 1,
             "explanation": "Two copies of one fact will eventually disagree — usually via a code path that updates one and forgets the other. Reading state from the place that must already be right removes the whole class of bug. (It is marginally slower, and worth it.)"},

            {"question": "You attach a click listener with `document.querySelector('.nav-link')` and only the first link responds. Why?",
             "options": [
                 "The other links need the same class added twice",
                 "querySelector returns the first match only — querySelectorAll returns all of them, and you then loop",
                 "Click listeners can only be attached to one element per page",
                 "The other links are missing an href"],
             "correct": 1,
             "explanation": "querySelector → first match, querySelectorAll → a NodeList of every match. It is one of the most common early DOM mistakes and produces exactly this symptom."},

            {"question": "Your <script> is in <head> and `document.getElementById('nav-toggle')` returns null. What is wrong?",
             "options": [
                 "The id is misspelled somewhere",
                 "The script runs before the parser has reached that element — move it to the end of <body>, or use defer, or wait for DOMContentLoaded",
                 "getElementById only works on elements with a class as well",
                 "You must call document.open() first"],
             "correct": 1,
             "explanation": "A classic ordering bug. HTML is parsed top to bottom; a script in <head> runs when the body does not exist yet. Any of the three fixes works."},

            {"question": "Marking a nav link active means removing 'active' from every other link first. What's the underlying principle?",
             "options": [
                 "CSS can only style one element with a given class",
                 "Exactly one item may hold the state, so the update must clear the old holder as well as set the new one — otherwise state accumulates",
                 "classList.add automatically removes the class from siblings",
                 "It is a browser requirement for anchor elements"],
             "correct": 1,
             "explanation": "'Exactly one of these is selected' is a constraint your code has to actively maintain. Only ever adding is how you end up with four simultaneously active links."},
        ],
    },

    4: {
        "title": "Forms, validation & announcements",
        "pass_mark": MINI_PASS_MARK,
        "questions": [
            {"question": "Why is event.preventDefault() the first line of the submit handler?",
             "options": [
                 "It stops the browser navigating away and reloading the page, which would discard everything typed and everything your handler was about to do",
                 "It prevents the user from clicking submit twice",
                 "It is required before you can read input values",
                 "It disables the browser's built-in validation"],
             "correct": 0,
             "explanation": "A form's default action is a full page navigation. Without preventDefault the page reloads, the inputs reset, and none of your validation is ever seen."},

            {"question": "What does role=\"alert\" add to the error paragraph?",
             "options": [
                 "It styles the text red automatically",
                 "It makes the element a live region — screen readers announce its content as soon as it changes, without the user having to hunt for it",
                 "It prevents the form from submitting while the element has text",
                 "It logs the error to the browser console"],
             "correct": 1,
             "explanation": "Without a live region, a sighted user sees the error instantly and a screen reader user hears nothing at all. role=\"alert\" is an assertive live region — the announcement interrupts."},

            {"question": "Which is the most defensible email validation strategy in production?",
             "options": [
                 "A single exhaustive regex implementing RFC 5322 in full",
                 "A deliberately loose format check for typos, plus a confirmation email — delivery is the only real proof an address exists",
                 "Checking that the string ends in .com, .org or .net",
                 "Querying the domain's MX records from the browser before allowing submission"],
             "correct": 1,
             "explanation": "The RFC-complete regex is famously thousands of characters and still cannot tell you whether an inbox exists. Catch typos cheaply, then prove deliverability by delivering."},

            {"question": "Why does the solution set aria-invalid on the offending field as well as writing the message?",
             "options": [
                 "aria-invalid is what actually blocks submission",
                 "It marks WHICH field is wrong — the alert says what went wrong, the attribute says where, and CSS can hook onto it for a red border",
                 "Screen readers ignore role=\"alert\" unless aria-invalid is also present",
                 "It is required for the form to be valid HTML"],
             "correct": 1,
             "explanation": "Two different questions: what is wrong, and where. An error message with no indication of which of five fields to fix is a poor experience for everyone."},

            {"question": "The form carries the `novalidate` attribute. What does that change?",
             "options": [
                 "It disables your JavaScript validation",
                 "It turns off the browser's own native validation UI so your consistent, styled, announceable messages are the only ones the user sees",
                 "It makes every field optional",
                 "It prevents the form from being submitted at all"],
             "correct": 1,
             "explanation": "Native bubbles cannot be styled, differ per browser, and vanish quickly. Once you own validation, you want to own all of it — but only once you actually have."},
        ],
    },

    5: {
        "title": "Async data & UI states",
        "pass_mark": MINI_PASS_MARK,
        "questions": [
            {"question": "Why must the loading state be set BEFORE the first `await`?",
             "options": [
                 "await is not allowed after a DOM write",
                 "Everything before the first await runs synchronously; after it, control returns to the browser and nothing more happens until the promise settles — so a loading state set afterwards would appear only once the data had already arrived",
                 "The container is read-only while a request is in flight",
                 "It makes the request itself faster"],
             "correct": 1,
             "explanation": "This is the single most useful thing to understand about async functions. The body runs immediately up to the first await, then suspends. Set the loading state in that synchronous window or it is pointless."},

            {"question": "The three states a data-fetching UI must handle are:",
             "options": [
                 "Loading, success, error",
                 "Empty, full, overflowing",
                 "Mounted, updated, unmounted",
                 "Idle, pending, cancelled"],
             "correct": 0,
             "explanation": "Every fetch is one of: still waiting, worked, or failed. Skipping the error state is what produces a screen that hangs on a spinner forever when the network drops."},

            {"question": "Why does the solution build <li>s with `textContent = member.name` rather than `innerHTML`?",
             "options": [
                 "textContent is significantly faster to parse",
                 "innerHTML parses its input as markup — a name containing a tag would be executed as HTML, which is the entire mechanism of cross-site scripting",
                 "innerHTML cannot be used on <li> elements",
                 "textContent preserves whitespace and innerHTML does not"],
             "correct": 1,
             "explanation": "Any value that came from a server or a user is untrusted. textContent writes it as text, always. Reaching for innerHTML with interpolated data is how XSS gets shipped."},

            {"question": "The grader injects a `fetchFn` rather than letting your code call the global `fetch`. Why is that a better design?",
             "options": [
                 "The global fetch is not available in browsers any more",
                 "Passing the dependency in lets the test control timing, success and failure precisely, with no network and no mocking of globals — the function becomes testable by construction",
                 "It makes the request faster",
                 "fetch cannot return JSON without a wrapper"],
             "correct": 1,
             "explanation": "Dependency injection, and the reason the loading-state test can freeze the promise mid-flight. Code that reaches for globals is code you can only test by patching the world around it."},

            {"question": "Your catch block runs, but the user still sees the spinner alongside the error. What went wrong?",
             "options": [
                 "The catch block ran before the loading element was created",
                 "The error path added an error element without clearing the loading one — each branch must leave the container in one coherent state",
                 "You cannot remove elements inside a catch block",
                 "The error needs its own container element"],
             "correct": 1,
             "explanation": "Every terminal branch owns the whole container. Appending without clearing accumulates states, and the user sees two contradictory answers at once."},
        ],
    },

    6: {
        "title": "Pure functions & rendering",
        "pass_mark": MINI_PASS_MARK,
        "questions": [
            {"question": "Why split filterMembers (works out the answer) from renderList (draws it)?",
             "options": [
                 "It produces less code overall",
                 "The pure function can be tested with plain values and no DOM, and can be reused anywhere — the moment the two are tangled, testing the logic requires building a page",
                 "React requires this split",
                 "It makes filtering faster"],
             "correct": 1,
             "explanation": "Separating decision from presentation is the reason four of this task's six tests need no DOM at all. It is the same instinct behind pure components and selectors."},

            {"question": "Which of these pairs is safe to call on an array you were handed by a caller?",
             "options": [
                 ".sort() and .reverse()",
                 ".filter() and .map()",
                 ".push() and .splice()",
                 ".sort() and .map()"],
             "correct": 1,
             "explanation": "filter and map return new arrays. sort, reverse, push and splice all mutate in place — sort() surprising people by mutating is a genuinely common production bug."},

            {"question": "Why lowercase BOTH the query and the name before comparing?",
             "options": [
                 "String comparison in JavaScript fails on mixed case",
                 "Comparison is case-sensitive, so normalising both sides is what makes 'ada' match 'Ada Lovelace'",
                 "includes() only accepts lowercase arguments",
                 "It makes the comparison faster"],
             "correct": 1,
             "explanation": "Normalise both sides of any comparison you want to be insensitive to. Doing one side only is a bug that passes whichever test you happened to write first."},

            {"question": "Why does an empty query return everyone rather than nobody?",
             "options": [
                 "''.includes() throws an error",
                 "'No filter applied' should mean 'show everything' — an empty box wiping the list is a UI that punishes the user for clearing their search",
                 "It is faster to return the original array",
                 "The test requires it and there is no deeper reason"],
             "correct": 1,
             "explanation": "Technically every string contains '', so a naive implementation gets this right by accident — but only until someone 'fixes' it. The intent is a product decision worth stating."},

            {"question": "Why does an empty result need its own element rather than just rendering nothing?",
             "options": [
                 "An empty container would collapse and break the layout",
                 "Nothing on screen is ambiguous — the user cannot tell 'no matches' from 'still loading' or 'something broke'; an explicit empty state answers the question",
                 "Screen readers cannot handle empty containers",
                 "It is needed for the CSS to apply"],
             "correct": 1,
             "explanation": "The empty state is a real state, not the absence of one. Silence makes the user wonder whether the feature is broken."},
        ],
    },

    7: {
        "title": "React props & conditional rendering",
        "pass_mark": MINI_PASS_MARK,
        "questions": [
            {"question": "Why is `loading` checked before `data` in the component?",
             "options": [
                 "React evaluates props in declaration order",
                 "An empty data array while loading means 'we don't know yet', not 'there are none' — checking data first would show 'no employees' as a fact, and users act on it",
                 "It is faster to check booleans first",
                 "data is undefined until loading is false, so the other order would throw"],
             "correct": 1,
             "explanation": "The priority order encodes what is actually true. Showing an authoritative empty state during a load is a small lie with real consequences."},

            {"question": "Why must a list's `key` be a stable id rather than the array index?",
             "options": [
                 "Indexes are strings and keys must be numbers",
                 "Keys identify items across renders; with indexes, removing the first item shifts every key, so React reuses the wrong DOM nodes and any internal state (focus, input text) lands on the wrong row",
                 "React throws an error when keys are numbers",
                 "Index keys make rendering slower"],
             "correct": 1,
             "explanation": "The bug is invisible on static lists and vicious on interactive ones — half-typed input jumping rows after a delete is the classic symptom."},

            {"question": "This component takes data/loading/error as props instead of fetching. What is the benefit?",
             "options": [
                 "It renders faster because there is no network call",
                 "It becomes a pure function of its props — trivial to test, reusable with any data source, and it can be dropped into a page that already loaded the data",
                 "It is required by React's rules of hooks",
                 "Props are more secure than internal state"],
             "correct": 1,
             "explanation": "Presentational components with data pushed in from above are testable with three lines and reusable everywhere. Note how the tests just call render() with values."},

            {"question": "What does `data-testid` actually do at runtime?",
             "options": [
                 "React strips it in production builds",
                 "Nothing — it is a plain HTML data attribute that gives tests a stable hook that will not change when copy or styling does",
                 "It registers the element with React DevTools",
                 "It acts as the element's key"],
             "correct": 1,
             "explanation": "Its whole value is stability. Selecting by class breaks on a restyle; selecting by text breaks on a copy edit; a testid changes only when someone means it to."},

            {"question": "`{error && <p>{error}</p>}` renders nothing when error is `''`. What breaks if you write `{error.length && …}` instead?",
             "options": [
                 "Nothing — the two are equivalent",
                 "0 is falsy but is not skipped by React the way false is, so a literal '0' appears on screen",
                 "It throws when error is a string",
                 "React renders the number as a key"],
             "correct": 1,
             "explanation": "React skips false, null and undefined but renders the number 0. A stray '0' on the page almost always traces back to `&&` on a length or count."},
        ],
    },

    8: {
        "title": "Controlled components & state",
        "pass_mark": MINI_PASS_MARK,
        "questions": [
            {"question": "What makes an input 'controlled'?",
             "options": [
                 "It has a required attribute",
                 "Its value comes from React state and every keystroke goes through onChange back into that state — React holds the truth, the input just displays it",
                 "It is wrapped in a <form> element",
                 "It uses a ref instead of state"],
             "correct": 1,
             "explanation": "One source of truth. It is why your submit handler already has the value, and why you can clear the field by setting state to ''."},

            {"question": "You pass `value={email}` but no onChange. What happens?",
             "options": [
                 "Typing works normally",
                 "The field appears frozen — every keystroke re-renders from unchanged state — and React warns you provided value without onChange",
                 "React throws and the component unmounts",
                 "The input becomes uncontrolled"],
             "correct": 1,
             "explanation": "The value prop pins the field to state. Without onChange, state never changes, so the field can never change. It is the single most common controlled-input bug."},

            {"question": "Why does the successful path call setError('') even when no error is showing?",
             "options": [
                 "React requires every state setter to be called each render",
                 "It clears an error left over from a previous failed attempt — without it, fixing the address and resubmitting leaves a stale error next to a form that just worked",
                 "It forces a re-render that would not otherwise happen",
                 "It prevents a memory leak"],
             "correct": 1,
             "explanation": "Recovery paths are where validation UIs actually fail. Clearing on success is what makes the second attempt feel like it worked."},

            {"question": "Why `setTasks(current => [...current, item])` rather than `setTasks([...tasks, item])`?",
             "options": [
                 "It is shorter",
                 "The updater form receives the latest state, so it stays correct when several updates are batched or when the closure captured a stale value",
                 "The array literal form is deprecated",
                 "Only the updater form triggers a re-render"],
             "correct": 1,
             "explanation": "The closure form reads whatever `tasks` was when that render happened. Under batching or async gaps, that can be stale, and updates silently overwrite each other."},

            {"question": "`event.preventDefault()` in a React submit handler — still needed?",
             "options": [
                 "No, React handles it automatically",
                 "Yes — React's synthetic event wraps the real DOM event, and the browser will still navigate away on submit unless you prevent it",
                 "Only when the form has a method attribute",
                 "Only in class components"],
             "correct": 1,
             "explanation": "React normalises the event object, not the browser's default behaviour. A form submit still reloads the page — with a React app, that means a full remount."},
        ],
    },

    9: {
        "title": "Persistent state & shipping",
        "pass_mark": MINI_PASS_MARK,
        "questions": [
            {"question": "`useState(loadTasks)` vs `useState(loadTasks())` — what's the difference?",
             "options": [
                 "Nothing, they are equivalent",
                 "Passing the function defers the call to the first render only; calling it inline re-reads and re-parses localStorage on every single render, and only the first result is ever used",
                 "The function form is asynchronous",
                 "The function form is only valid inside useEffect"],
             "correct": 1,
             "explanation": "Lazy initial state. React only uses the initial value once, but the expression you pass is evaluated every render — an easy, invisible performance leak."},

            {"question": "Why does the effect that writes to localStorage list `[tasks]` as its dependency?",
             "options": [
                 "So it runs after every render, which is what persistence needs",
                 "So it runs only when tasks actually changed — an empty array would write once and never again; omitting the array writes on every render",
                 "Dependency arrays are required by React and the contents are ignored",
                 "So it runs before the component mounts"],
             "correct": 1,
             "explanation": "No array → every render. Empty array → mount only, so nothing after the first change is ever saved. [tasks] → exactly when the data changed."},

            {"question": "Why does toggling build a new object with `{ ...task, completed: !task.completed }` instead of assigning `task.completed = true`?",
             "options": [
                 "Direct assignment is a syntax error in strict mode",
                 "React compares by identity — mutating in place leaves the same object and array references, so React sees nothing changed and skips the re-render",
                 "Spread syntax is faster",
                 "It prevents the object being garbage collected"],
             "correct": 1,
             "explanation": "Immutability is not stylistic here; it is the mechanism by which React detects change. Mutation produces the maddening 'the data updated but the screen didn't' bug."},

            {"question": "localStorage.getItem returns a string that isn't valid JSON. The solution wraps JSON.parse in try/catch. Why does that matter?",
             "options": [
                 "JSON.parse is asynchronous and can reject",
                 "A throw during initial state means the component never mounts — the whole app is bricked by one corrupt key until the user clears storage they don't know exists",
                 "try/catch makes parsing faster",
                 "localStorage requires exception handling by specification"],
             "correct": 1,
             "explanation": "Storage is shared, persistent, and editable by anything on the origin — including an older version of your own app. Treat it as untrusted input."},

            {"question": "Which best describes the limits of localStorage for real applications?",
             "options": [
                 "It is encrypted and safe for auth tokens and personal data",
                 "It is synchronous (so it blocks the main thread), per-origin, capped at roughly 5MB, string-only, and readable by any script on the page — fine for preferences and drafts, wrong for secrets",
                 "It is shared across every site the user visits",
                 "It expires automatically after 24 hours"],
             "correct": 1,
             "explanation": "The 'readable by any script' part is the one that matters: any XSS or third-party tag can read it. Great for UI state, not a place for tokens."},
        ],
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# Final assessment — 50 questions, beginner through advanced
# ─────────────────────────────────────────────────────────────────────────────

def _q(question, options, correct, explanation):
    return {"question": question, "options": options, "correct": correct, "explanation": explanation}


FINAL_ASSESSMENT: dict = {
    "title": "Frontend Developer — Final Assessment",
    "description": (
        "Fifty questions across everything the simulation covered: semantic HTML, CSS layout, "
        "the DOM and events, asynchronous JavaScript, React, accessibility, and the judgement "
        "calls behind the code you wrote. Difficulty ramps from fundamentals to senior-level "
        "trade-offs."
    ),
    "pass_mark": 70,
    "questions": [
        # ── HTML & semantics (1-7) ──
        _q("Which element correctly wraps the primary content of a page, excluding site-wide headers and footers?",
           ["<section>", "<main>", "<article>", "<div class=\"content\">"], 1,
           "<main> is the landmark for the page's primary content, and there should be exactly one per page."),
        _q("What is the difference between <section> and <div>?",
           ["<section> centres its content by default",
            "<section> is a thematic grouping that normally has a heading; <div> carries no meaning and exists purely for styling or scripting hooks",
            "<div> is deprecated in HTML5",
            "<section> can only be used once per page"], 1,
           "If you cannot name the section with a heading, a <div> is usually the honest choice."),
        _q("Which attribute pairs a <label> with its input?",
           ["name", "for, matching the input's id", "aria-label", "data-for"], 1,
           "<label for=\"email\"> binds to <input id=\"email\">. Clicking the label then focuses the field — and screen readers announce the label with it."),
        _q("A button that only shows an icon needs which of the following?",
           ["Nothing — icons are universally understood",
            "An accessible name, via visually-hidden text or aria-label — otherwise it is announced as just 'button'",
            "A title attribute, which is sufficient on its own",
            "A tooltip"], 1,
           "title is inconsistently announced and invisible to touch users. Visually-hidden text or aria-label is the reliable fix."),
        _q("What does the `alt` attribute do when an image fails to load?",
           ["Nothing, it is only for screen readers",
            "The browser displays the alt text in place of the image, so the meaning survives a broken URL",
            "It retries the request",
            "It loads a fallback image"], 1,
           "It serves both assistive technology and every user on a flaky connection."),
        _q("Which is the correct heading structure for a page?",
           ["h1, then h3, then h2, ordered by visual size",
            "One h1, with h2s beneath it and h3s beneath those — the levels describe nesting, not size",
            "Multiple h1s, one per section",
            "Headings in any order, since CSS controls appearance"], 1,
           "Heading level is document structure. Style it however you like; do not skip levels to get a font size."),
        _q("What is the accessibility tree?",
           ["A visualisation of your component hierarchy in DevTools",
            "A parallel structure the browser derives from the DOM, exposing roles, names and states to assistive technology",
            "The CSS cascade order",
            "The list of focusable elements only"], 1,
           "It is what a screen reader actually reads. Semantic HTML populates it correctly for free; divs populate it with nothing."),

        # ── CSS & layout (8-16) ──
        _q("Which layout method is designed for one-dimensional distribution along a single axis?",
           ["CSS Grid", "Flexbox", "float", "position: absolute"], 1,
           "Flexbox: one axis. Grid: two. Reaching for the right one first saves a lot of fighting."),
        _q("`justify-content` in a default flex row controls what?",
           ["Vertical alignment", "Distribution along the horizontal (main) axis", "Text alignment inside each item", "The order of items"], 1,
           "In a row, justify-content is the main (horizontal) axis and align-items is the cross (vertical) axis. They swap with flex-direction: column."),
        _q("`box-sizing: border-box` changes what?",
           ["Adds a border to every element",
            "Makes width include padding and border, so a 200px box stays 200px once you add padding",
            "Removes the default margin on body",
            "Forces block display"], 1,
           "The default content-box makes padding push the total size outwards — the reason `* { box-sizing: border-box }` opens most stylesheets."),
        _q("Which selector has the highest specificity?",
           [".card .title", "#hero h1", "h1", "article > h1"], 1,
           "An id contributes far more specificity than any number of classes or elements. It is also why over-using ids makes stylesheets hard to override."),
        _q("What does `1fr` mean in a grid track definition?",
           ["One pixel", "One fraction of the leftover free space in the container", "One full row", "One rem"], 1,
           "fr distributes what's left after fixed sizes and gaps are accounted for."),
        _q("Why prefer `rem` over `px` for font sizes?",
           ["rem renders more sharply",
            "rem scales with the user's root font size, so someone who has enlarged their browser text gets larger text; px ignores that preference",
            "px is deprecated in CSS3",
            "rem is faster to compute"], 1,
           "It is an accessibility default, not a stylistic one."),
        _q("A `position: absolute` element positions itself relative to what?",
           ["The viewport, always",
            "Its nearest ancestor with a position other than static — or the initial containing block if there is none",
            "Its immediate parent, always",
            "The <body> element"], 1,
           "Forgetting `position: relative` on the intended parent is why absolutely positioned elements so often fly to the corner of the page."),
        _q("What does `gap` do that margins on children do not?",
           ["Nothing, they are interchangeable",
            "It spaces items only between each other, with no leading or trailing space to strip off, and it never collapses",
            "It works only in Flexbox",
            "It adds padding inside each item"], 1,
           "No more :last-child { margin-right: 0 }."),
        _q("Which media feature respects a user who has asked their OS to reduce animation?",
           ["@media (max-width: 600px)", "@media (prefers-reduced-motion: reduce)", "@media (hover: none)", "@media print"], 1,
           "Honouring it is not optional for users with vestibular disorders — motion can cause real nausea."),

        # ── JavaScript fundamentals (17-27) ──
        _q("What does `querySelectorAll` return?",
           ["An array", "A static NodeList — array-like, with forEach, but without map or filter until you spread it", "A single element", "An HTMLCollection that updates live"], 1,
           "`Array.from(nodes)` or `[...nodes]` when you need real array methods."),
        _q("What is the difference between `==` and `===`?",
           ["None in modern JavaScript",
            "== coerces types before comparing ('1' == 1 is true); === requires the types to match",
            "=== is slower",
            "== only works on numbers"], 1,
           "Default to ===. The coercion table for == has genuine surprises in it."),
        _q("Which values are falsy in JavaScript?",
           ["Only false and null",
            "false, 0, -0, 0n, '', null, undefined and NaN",
            "Everything except true",
            "Empty arrays and empty objects as well"], 1,
           "Note what is NOT there: [] and {} are both truthy, which surprises people checking for 'empty'."),
        _q("`const team = []; team.push('Ada');` — why is this allowed?",
           ["It is a bug in the specification",
            "const binds the variable to a value; it does not freeze the object. The binding cannot be reassigned, but the array's contents can change",
            "Arrays are exempt from const",
            "push is a special case"], 1,
           "Use Object.freeze if you actually need immutability."),
        _q("What is a closure?",
           ["A function that has been garbage collected",
            "A function that keeps access to the variables of the scope it was created in, even after that scope has finished executing",
            "A way of closing a browser tab from script",
            "A CSS concept"], 1,
           "It is why an event listener can still read a variable defined around it — and why stale values in React callbacks happen."),
        _q("`setTimeout(fn, 0)` runs `fn` when?",
           ["Immediately, synchronously",
            "After the current synchronous work finishes and the call stack clears — 0 is a minimum delay, not a promise of immediacy",
            "Exactly 0 milliseconds later, guaranteed",
            "Never"], 1,
           "The event loop in one question: the timer is queued, not run."),
        _q("What is the difference between `null` and `undefined`?",
           ["They are identical",
            "undefined means a value was never assigned; null is an explicit, deliberate 'no value'",
            "null is a syntax error in strict mode",
            "undefined can only appear in function parameters"], 1,
           "typeof null === 'object' is a famous, unfixable historical bug in the language."),
        _q("What does `async` in front of a function do?",
           ["Runs the function on a background thread",
            "Makes it return a promise and permits `await` inside it — the work still runs on the single main thread",
            "Makes the function faster",
            "Prevents the function from throwing"], 1,
           "JavaScript remains single-threaded. async is about scheduling, not parallelism."),
        _q("Two independent API calls, and you need both before rendering. What is the efficient approach?",
           ["await them one after another",
            "Start both, then `await Promise.all([a, b])` so they overlap",
            "Use two separate useEffect hooks",
            "Call them inside a for loop"], 1,
           "Sequential awaits on independent work turns 200ms + 200ms into 400ms for no reason."),
        _q("What does the optional chaining operator `?.` do?",
           ["Declares an optional function parameter",
            "Short-circuits to undefined if the value before it is null or undefined, instead of throwing",
            "Marks a property as nullable in TypeScript only",
            "Provides a default value"], 1,
           "`user?.profile?.name` — pair it with `??` when you also want a fallback."),
        _q("Event delegation means:",
           ["Passing events between components as props",
            "Attaching one listener to a common ancestor and using event.target to work out which descendant was hit — so dynamically added children work without new listeners",
            "Using addEventListener instead of onclick",
            "Delegating events to a web worker"], 1,
           "One listener on a list beats one per row, and it keeps working when rows are added later."),

        # ── React (28-40) ──
        _q("What does `useState` return?",
           ["The current value only",
            "A pair: the current value and a setter function",
            "A promise resolving to the value",
            "A ref object"], 1,
           "`const [value, setValue] = useState(initial)` — array destructuring, which is why you can name them anything."),
        _q("Calling a state setter does what?",
           ["Updates the variable immediately, in place",
            "Schedules a re-render; the variable in the current scope keeps its old value until the next render",
            "Forces a synchronous DOM update",
            "Mutates the component instance"], 1,
           "Reading state right after setting it and seeing the old value is not a bug — it's the render model."),
        _q("When does `useEffect(fn, [])` run?",
           ["After every render", "Once, after the first render", "Before the first render", "Only on unmount"], 1,
           "Empty deps → mount only. The returned cleanup then runs on unmount."),
        _q("What does the function returned from useEffect do?",
           ["Nothing, it is ignored",
            "It is the cleanup — React runs it before the next effect and on unmount, which is where you remove listeners, clear timers and abort requests",
            "It re-runs the effect",
            "It provides the effect's return value to the component"], 1,
           "Missing cleanup is how you get listeners stacking up and setState-after-unmount warnings."),
        _q("Why must hooks not be called inside conditions or loops?",
           ["It is a style preference",
            "React matches hooks to their state by call order; a hook that is sometimes skipped shifts every subsequent hook onto the wrong state",
            "It causes a memory leak",
            "Conditions are not allowed in function components at all"], 1,
           "The order is the identity. This is exactly what the rules-of-hooks lint rule protects."),
        _q("What is 'lifting state up'?",
           ["Using a global store",
            "Moving state to the closest common ancestor when two components need to share it, and passing it down as props",
            "Moving state from a child to the browser URL",
            "Using useRef instead of useState"], 1,
           "It is the standard first answer to 'these two components need the same data', before reaching for any library."),
        _q("Which is a valid reason to use `useRef`?",
           ["Storing state that should trigger a re-render",
            "Holding a mutable value that must survive renders WITHOUT causing one — a DOM node, a timer id, a previous value",
            "Replacing useState for performance",
            "Sharing state between components"], 1,
           "Changing .current never re-renders. That is the point, and also the trap if you expected UI to update."),
        _q("A controlled component is one where:",
           ["It has PropTypes defined",
            "React state is the single source of truth for the input's value",
            "It cannot be edited",
            "It uses a ref to read the value on submit"], 1,
           "The uncontrolled alternative — reading a ref on submit — is legitimate, just a different trade-off."),
        _q("Why does React need `key` on list items?",
           ["To sort the list",
            "To match elements to their previous instances across renders, so it can move rather than rebuild them and keep internal state on the right row",
            "It is only required in development",
            "To generate CSS class names"], 1,
           "Reconciliation. Index keys break as soon as the list can be reordered or filtered."),
        _q("`{count && <Badge />}` renders '0' when count is 0. What is the fix?",
           ["Wrap it in a fragment",
            "Use an explicit boolean: `{count > 0 && <Badge />}`",
            "Use a ternary returning null",
            "Both the explicit boolean and the ternary work"], 3,
           "React skips false/null/undefined but renders the number 0. Either fix is fine; the explicit comparison reads better."),
        _q("What problem does `React.memo` address?",
           ["Memory leaks",
            "A component re-rendering when its props have not actually changed — it skips the render if a shallow prop comparison finds them equal",
            "Caching network responses",
            "Persisting state to localStorage"], 1,
           "Measure first. Wrapping everything in memo has its own cost and often hides the real problem — an unstable prop identity."),
        _q("Why can passing an inline arrow function as a prop defeat React.memo?",
           ["Arrow functions are slower",
            "A new function object is created on every render, so the shallow prop comparison always sees a change",
            "memo does not compare function props",
            "Arrow functions cannot be passed as props"], 1,
           "This is the problem useCallback exists to solve — and the reason memo without stable props achieves nothing."),
        _q("Fetching in useEffect, the component unmounts before the response arrives. What is the correct handling?",
           ["Nothing — React handles it",
            "Abort the request or set a cancelled flag in the cleanup, so you do not update state on an unmounted component",
            "Use a longer timeout",
            "Move the fetch into the render body"], 1,
           "AbortController in the cleanup is the modern answer, and it also stops a stale response overwriting a fresh one."),

        # ── Accessibility, performance, judgement (41-50) ──
        _q("A <div> with an onClick handler is not usable by keyboard. What does making it a real <button> give you?",
           ["Only default styling",
            "Focusability, Enter/Space activation, the correct announced role, and disabled semantics — all of which you would otherwise have to rebuild by hand",
            "Nothing, they are equivalent with role=\"button\"",
            "Faster event handling"], 1,
           "role=\"button\" plus tabindex plus key handlers gets you most of the way — using the element gets you all of it for free."),
        _q("What does `aria-live=\"polite\"` do?",
           ["Announces content immediately, interrupting",
            "Queues the announcement for when the screen reader next pauses — right for status updates, whereas role=\"alert\" interrupts",
            "Prevents any announcement",
            "Applies only to form fields"], 1,
           "Polite for 'saved', 'filtered to 12 results'. Assertive/alert for errors that block progress."),
        _q("Minimum contrast ratio for normal-size body text under WCAG AA?",
           ["2:1", "4.5:1", "7:1", "3:1"], 1,
           "4.5:1 for normal text, 3:1 for large text. AAA raises it to 7:1."),
        _q("Why should focus be visible?",
           ["It is a design preference",
            "Keyboard users navigate by focus — removing the outline without replacing it makes the interface impossible to use without a mouse",
            "It is only needed for form fields",
            "It improves performance"], 1,
           "`outline: none` with no replacement is one of the most damaging one-liners in CSS. Use :focus-visible for a considered style."),
        _q("Which most directly improves Largest Contentful Paint?",
           ["Adding more CSS animations",
            "Optimising and correctly sizing the largest above-the-fold image, and not blocking its discovery behind JavaScript",
            "Moving all CSS into inline style attributes",
            "Using more web fonts"], 1,
           "LCP is usually a hero image or a heading. Find what the element actually is before optimising anything."),
        _q("What does `loading=\"lazy\"` on an <img> do?",
           ["Fades the image in",
            "Tells the browser it may defer loading until the image is near the viewport, saving bandwidth on long pages",
            "Loads a low-resolution version first",
            "Delays the load by a fixed 500ms"], 1,
           "Do not use it on your LCP image — deferring the thing the user came to see makes the metric worse."),
        _q("Debouncing a search input means:",
           ["Sending a request per keystroke",
            "Waiting until typing pauses for a set interval before firing, so ten keystrokes cause one request rather than ten",
            "Caching the results",
            "Cancelling the request if it takes too long"], 1,
           "Throttling is the neighbouring idea: at most one call per interval, for things like scroll handlers."),
        _q("Why is user-supplied content unsafe to write with innerHTML?",
           ["It is slower than textContent",
            "It parses as markup, so embedded HTML and event-handler attributes execute — the core mechanism of cross-site scripting",
            "It strips whitespace",
            "It only accepts strings"], 1,
           "React escapes by default, which is why dangerouslySetInnerHTML is named the way it is."),
        _q("A colleague's PR adds a 400KB date library to format one timestamp. What is the most useful review comment?",
           ["Approve — readability matters more than bundle size",
            "Ask whether Intl.DateTimeFormat, already in every browser, covers the case — and if not, whether a modular import would pull in only what is used",
            "Reject the PR outright",
            "Ask them to lazy-load the whole library"], 1,
           "Lead with the question, not the verdict. The platform often already has it, and the answer is a two-line diff."),
        _q("You inherit a page where every interactive element is a styled <div>. What is the highest-value first fix?",
           ["Rewrite it in a framework",
            "Convert them to real <button> and <a> elements — that single change restores keyboard access, focus order and correct announcements across the whole page",
            "Add a skip-to-content link",
            "Increase the colour contrast"], 1,
           "All four are worth doing. Element semantics is the one that fixes the largest number of failures per line changed."),
    ],
}


def assessment_for(task_index: int) -> dict:
    """Mini assessment payload for one task, ready to drop into config."""
    return MINI_ASSESSMENTS[task_index]

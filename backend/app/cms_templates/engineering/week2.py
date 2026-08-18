"""Week 2 — Real browser behaviour: forms, async data, and filtering.

Where Week 1 was about what the page IS, this week is about what it DOES when
a person and a network get involved: validating input and announcing failure,
handling a request that takes time and might not work, and separating the
decision from the drawing.

See week1.py for the `explainer` content contract.
"""
from app.cms_templates.engineering import starters
from app.cms_templates.engineering.assessments import assessment_for

_COMMON = dict(submission_mode="code", grading_strategy="registered_grader")


TASK_4 = dict(
    task_index=4, title="Accessible Signup Form", type="code_sandbox", week=2,
    objective="Validate the signup form — and make sure everyone finds out what went wrong.",
    briefing=(
        "Support are getting tickets from people who can't complete signup and don't know why. Turns "
        "out we're relying on the browser's default validation, which looks different in every browser "
        "and disappears after a couple of seconds. Own it properly: check the input yourself, put the "
        "message somewhere it stays put, and make sure a screen reader actually announces it. This is "
        "the kind of thing that quietly costs us signups."
    ),
    what_to_do=[
        "Call event.preventDefault() first thing in the submit handler.",
        "Reject an empty or malformed email, and a password under 8 characters.",
        "Put the message in #form-error, which already carries role=\"alert\".",
        "On a valid submission, clear the error and set form.dataset.submitted = 'true'.",
    ],
    what_to_submit=["A single submission.html file with an inline <script>."],
    hints=[
        "form.dataset.submitted = 'true' sets a data-submitted=\"true\" attribute on the form. That is "
        "how the check knows a valid submission was accepted — there is no real server here.",
        "Clear #form-error on the success path too. A leftover message next to a form that just worked "
        "is its own bug, and one of the checks looks for exactly that.",
        "A loose email check is fine and correct: something, an @, something, a dot, something.",
    ],
    success_criteria=[
        "Both inputs have <label for=…> with real text",
        "#form-error exists and has role=\"alert\"",
        "An empty submission shows a message and is not accepted",
        "An invalid email shows a message and is not accepted",
        "A password under 8 characters is rejected",
        "A valid submission clears the message and sets data-submitted=\"true\"",
    ],
    config={
        **_COMMON,
        "language": "html",
        "grader_key": "frontend_dev_sim.task4",
        "starter_code": starters.TASK4_STARTER,
        "input_filename": "submission.html",
        "output_filename": "output.json",
        "assessment": assessment_for(4),
        "explainer": {
            "situation": (
                "The signup form currently leans on the browser's built-in validation — those little "
                "bubbles that pop up next to a field. They cannot be styled, they look different in "
                "every browser, they vanish on their own, and on some setups they are not announced at "
                "all. So users get stuck, don't know why, and leave. Support sees it as tickets; the "
                "business sees it as a drop in signups."
            ),
            "outcome": (
                "A form that checks its own input, refuses to proceed when something is wrong, shows a "
                "message that stays on screen, and announces that message to a screen reader the "
                "moment it appears. When everything is valid it clears the error and records that the "
                "submission was accepted."
            ),
            "preview": (
                "EMPTY SUBMIT                          VALID SUBMIT\n"
                "┌────────────────────────────┐        ┌────────────────────────────┐\n"
                "│ Email address              │        │ Email address              │\n"
                "│ [                        ] │        │ [ maya@enigma.dev        ] │\n"
                "│ Password                   │        │ Password                   │\n"
                "│ [                        ] │        │ [ ••••••••••             ] │\n"
                "│ ⚠ Enter a valid email      │ ←alert │                            │\n"
                "│ [ Create account ]         │        │ [ Create account ]         │\n"
                "└────────────────────────────┘        └────────────────────────────┘\n"
                "form has no data-submitted             form.dataset.submitted = 'true'"
            ),
            "concepts": [
                {"term": "The submit event",
                 "plain": "Forms fire a `submit` event when the user presses the submit button or hits "
                          "Enter in a field. You listen on the FORM, not on the button — that way both "
                          "routes are covered.",
                 "why": "Listening on the button's click misses the Enter key, which is how a large "
                        "number of people actually submit forms."},
                {"term": "preventDefault()",
                 "plain": "Every event has a default browser behaviour. A form's default is to navigate "
                          "away and reload. `event.preventDefault()` cancels that so your code can run "
                          "instead.",
                 "why": "Without it the page reloads instantly, the fields empty, and none of your "
                        "validation is ever seen. It is the first line for a reason."},
                {"term": "role=\"alert\" (a live region)",
                 "plain": "An element marked role=\"alert\" is watched by screen readers. The instant "
                          "its text changes, that text is announced — the user does not have to go "
                          "looking for it.",
                 "why": "Without it, a sighted user sees the error immediately and a screen reader user "
                        "gets absolutely nothing. The form appears to simply not respond."},
                {"term": "dataset",
                 "plain": "`element.dataset.foo = 'bar'` sets a `data-foo=\"bar\"` attribute. It is the "
                          "standard way to attach your own data to an element.",
                 "why": "Here it stands in for a real server: there is nowhere to POST to, so "
                        "'accepted' is recorded on the form itself where the check can see it."},
                {"term": "novalidate",
                 "plain": "An attribute on the <form> that turns OFF the browser's own validation UI.",
                 "why": "Once you are handling validation yourself you want one consistent message, not "
                        "yours plus a browser bubble arguing with it."},
            ],
            "steps": [
                {"title": "Stop the page reloading",
                 "plain": "Listen for submit on the form, and cancel the default behaviour before you "
                          "do anything else. Every path through the handler — valid or invalid — needs "
                          "this, so it goes at the top.",
                 "code": "var form = document.getElementById('signup-form');\n\n"
                         "form.addEventListener('submit', function (event) {\n"
                         "  event.preventDefault();\n"
                         "  // …everything else goes here\n"
                         "});",
                 "deeper": "In a real app this handler would end with a fetch() to your API. The "
                           "preventDefault stays exactly where it is — you are replacing the browser's "
                           "navigation with your own request, not adding to it."},

                {"title": "Check the input, and say what is wrong",
                 "plain": "Read the values, decide whether they are acceptable, and if not, put a "
                          "specific message into #form-error and return early. 'Enter a valid email "
                          "address' — not 'Invalid input'.",
                 "code": "var email = document.getElementById('email');\n"
                         "var error = document.getElementById('form-error');\n\n"
                         "if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.value.trim())) {\n"
                         "  error.textContent = 'Enter a valid email address.';\n"
                         "  return;\n"
                         "}",
                 "deeper": "That regex is deliberately loose, and that is the right call. A fully "
                           "RFC-5322-compliant email regex is thousands of characters long, still "
                           "rejects valid addresses, and cannot tell you whether the mailbox exists. "
                           "Catch obvious typos cheaply; prove deliverability by sending a confirmation "
                           "email. Anyone who tells you to validate email properly with a regex has "
                           "not read the RFC."},

                {"title": "Point at the field that is wrong",
                 "plain": "The message says what is wrong. `aria-invalid=\"true\"` on the offending "
                          "input says where. Moving focus there as well saves the user hunting.",
                 "code": "email.setAttribute('aria-invalid', 'true');\n"
                         "email.focus();\n\n"
                         "/* and in CSS */\n"
                         "input[aria-invalid=\"true\"] { border-color: #c0392b; }",
                 "deeper": "Reset aria-invalid to 'false' on every submit before re-validating. "
                           "Otherwise a field you fixed keeps its red border and its invalid state "
                           "forever, which is a bug users report as 'the form is stuck'."},

                {"title": "Handle the success path — including clearing up",
                 "plain": "If everything passed: empty the error message and mark the form as "
                          "submitted. Clearing the message matters even when there is nothing showing.",
                 "code": "error.textContent = '';\n"
                         "form.dataset.submitted = 'true';",
                 "deeper": "The clear-on-success line is the one people leave out, and it is checked "
                           "here deliberately. A stale error sitting beside a form that just succeeded "
                           "is the difference between a user who believes it worked and a user who "
                           "submits four more times."},
            ],
            "contract": [
                {"name": "#signup-form", "must": "The form element; gets data-submitted=\"true\" on success."},
                {"name": "#email and #password", "must": "Each with a <label for=…> containing real text."},
                {"name": "#form-error", "must": "Must carry role=\"alert\"; holds the message text."},
                {"name": "#password minimum length", "must": "Fewer than 8 characters is rejected, with a message."},
            ],
            "mistakes": [
                "Forgetting preventDefault — the page reloads and nothing you wrote ever runs.",
                "Listening for click on the button instead of submit on the form, so pressing Enter "
                "bypasses all your validation.",
                "Leaving the old error text on screen after a successful submission.",
                "Putting the message in a plain <p> with no role=\"alert\" — visually fine, silent for "
                "screen reader users.",
                "Using `if (email.value)` as the only check. A single space passes it.",
            ],
            "further": [
                "Validate on blur as well as on submit, but never on every keystroke — telling someone "
                "their email is invalid while they are still on the third character is hostile.",
                "Link the message to the field with aria-describedby so it is read out when the input "
                "receives focus, not only when it first appears.",
                "Read about the Constraint Validation API (setCustomValidity, :invalid, "
                "checkValidity()) — the middle ground between native validation and doing it all "
                "yourself.",
            ],
        },
    },
    model_solution={
        "steps": [
            dict(title="preventDefault first, always",
                 detail="Every branch of the handler needs it, so it goes at the very top rather than "
                        "in each branch.",
                 example="form.addEventListener('submit', function (event) {\n  event.preventDefault();\n  …\n});"),
            dict(title="What is wrong, and where",
                 detail="The alert region carries the message; aria-invalid marks the field. Two "
                        "different questions, two different mechanisms.",
                 example="error.textContent = 'Enter a valid email address.';\n"
                         "email.setAttribute('aria-invalid', 'true');\nemail.focus();"),
            dict(title="Clean up on success",
                 detail="Clearing the message is what makes a corrected second attempt feel like it "
                        "worked.",
                 example="error.textContent = '';\nform.dataset.submitted = 'true';"),
        ],
        "key_principle": "An error the user cannot perceive is the same as no error at all — they just "
                         "see a form that refuses to work.",
        "great_looks_like": "Every failure path names the problem, marks the field, and is announced; "
                            "every success path clears what the last failure left behind.",
        "example_solution": starters.TASK4_SOLUTION,
    },
    xp_award=80, skill_awards={"javascript": 20, "accessibility": 20},
)


TASK_5 = dict(
    task_index=5, title="Fetch and Render Live Data", type="code_sandbox", week=2,
    objective="Show the team directory from the API — including while it's loading and when it fails.",
    briefing=(
        "The about page needs a live team directory instead of the hardcoded list we've got. There's an "
        "endpoint at /api/team. What I care about here isn't the happy path — it's the other two: what "
        "the user sees while it's loading, and what they see when it fails. Right now half our pages "
        "just show a blank space forever when a request dies, and nobody notices until a customer "
        "tells us."
    ),
    what_to_do=[
        "Show a loading element BEFORE any await runs.",
        "Await fetchFn('/api/team'), then response.json().",
        "Render <ul data-testid=\"team-list\"> with one <li> per member.",
        "Catch failures and render an element with data-testid=\"error\".",
    ],
    what_to_submit=["A single submission.js exporting renderDirectory(container, fetchFn)."],
    hints=[
        "The loading element must be set synchronously — before your first `await`. Everything after "
        "the first await happens later, by which point the data has already arrived.",
        "The grader passes fetchFn in. Do not call the global fetch; use the function you were given, "
        "so the test can control timing and failure.",
        "Clear the container before rendering the result, or you will end up with the spinner and the "
        "list on screen at the same time.",
    ],
    success_criteria=[
        "A data-testid=\"loading\" element appears before the promise settles",
        "A data-testid=\"team-list\" <ul> with one <li> per member on success",
        "The loading element is gone once the data has rendered",
        "A data-testid=\"error\" element when the fetch rejects",
    ],
    config={
        **_COMMON,
        "language": "javascript",
        "grader_key": "frontend_dev_sim.task5",
        "starter_code": starters.TASK5_STARTER,
        "input_filename": "submission.js",
        "output_filename": "output.json",
        "assessment": assessment_for(5),
        "explainer": {
            "situation": (
                "Anything that comes from a network takes time, and might not arrive. That gap is where "
                "most real frontend bugs live. A component that only handles the case where the data "
                "shows up instantly looks perfect on your machine, on your connection, with your "
                "warm cache — and shows a blank rectangle to a user on a train."
            ),
            "outcome": (
                "A function that always leaves the container in exactly one of three honest states: "
                "waiting, loaded, or failed. Never blank, never two at once."
            ),
            "preview": (
                "  t=0ms            t=0-400ms          t=400ms\n"
                "  ┌───────────┐    ┌───────────┐      ┌────────────────┐\n"
                "  │           │ →  │ Loading…  │  →   │ • Ada Lovelace │\n"
                "  │           │    │           │      │ • Grace Hopper │\n"
                "  └───────────┘    └───────────┘      └────────────────┘\n"
                "                        │\n"
                "                        └── on failure ──→ ┌──────────────────────┐\n"
                "                                           │ Couldn't load team.  │\n"
                "                                           └──────────────────────┘"
            ),
            "concepts": [
                {"term": "Promise",
                 "plain": "An object representing a value that isn't ready yet. It will eventually "
                          "either resolve with a value or reject with an error.",
                 "why": "It is how JavaScript represents 'this is in flight'. The three UI states map "
                        "exactly onto its three conditions: pending, fulfilled, rejected."},
                {"term": "async / await",
                 "plain": "`async` marks a function as returning a promise. `await` pauses inside that "
                          "function until a promise settles, so you can write asynchronous code that "
                          "reads top to bottom.",
                 "why": "It replaced deeply nested .then() chains. The pause is the part to understand "
                        "properly — see the next concept."},
                {"term": "The synchronous window",
                 "plain": "When you call an async function, everything up to its first `await` runs "
                          "IMMEDIATELY, before the call returns. After that first await, the function "
                          "suspends and the rest of your program continues.",
                 "why": "This is the whole reason the loading state has to be set before the first "
                        "await. Set it afterwards and it appears at the same moment as the data, "
                        "which is to say: pointlessly."},
                {"term": "try / catch",
                 "plain": "`try { … } catch (err) { … }` runs the first block, and if anything inside "
                          "throws, jumps to the second. With await, a rejected promise throws.",
                 "why": "It is how one catch block can cover the request failing, the response not "
                        "being JSON, and your own rendering code throwing — all three."},
                {"term": "Dependency injection",
                 "plain": "Being handed the thing you depend on (`fetchFn`) instead of reaching out and "
                          "grabbing it (the global `fetch`).",
                 "why": "It is why the hidden test can freeze the request mid-flight to check your "
                        "loading state, and make it fail on demand, with no network and no mocking of "
                        "globals."},
            ],
            "steps": [
                {"title": "Show the loading state first — before anything async",
                 "plain": "The very first line of the function body puts a loading element in the "
                          "container. Not inside a .then, not after an await. First line.",
                 "code": "async function renderDirectory(container, fetchFn) {\n"
                         "  container.innerHTML = '<p data-testid=\"loading\">Loading the team…</p>';\n"
                         "  // …\n"
                         "}",
                 "deeper": "Run this mentally: the caller invokes renderDirectory, this line executes, "
                           "the function hits its first await and suspends, and control returns to the "
                           "caller — with the loading state already painted. That ordering is exactly "
                           "what the first hidden test measures, by never resolving the promise."},

                {"title": "Await the request, then the JSON",
                 "plain": "Two awaits, not one. The first waits for the response to arrive; the second "
                          "waits for its body to be parsed. Both take time.",
                 "code": "const response = await fetchFn('/api/team');\n"
                         "const members = await response.json();",
                 "deeper": "The two-step exists because a response's headers arrive before its body. "
                           "You can inspect response.ok and response.status before spending time "
                           "parsing a body you may not want. Note also that fetch does NOT reject on a "
                           "404 or a 500 — only on a network-level failure. In production you check "
                           "response.ok yourself and throw."},

                {"title": "Build the list from the data",
                 "plain": "Create a <ul>, tag it with the testid, and add one <li> per member using "
                          "textContent for the name.",
                 "code": "const list = document.createElement('ul');\n"
                         "list.setAttribute('data-testid', 'team-list');\n\n"
                         "members.forEach((member) => {\n"
                         "  const item = document.createElement('li');\n"
                         "  item.textContent = member.name;\n"
                         "  list.appendChild(item);\n"
                         "});",
                 "deeper": "textContent, never innerHTML, for anything that came from a server. "
                           "innerHTML parses its input as markup — a name containing a <script> tag "
                           "or an onerror attribute would execute. That is the entire mechanism of "
                           "cross-site scripting, in one property choice."},

                {"title": "Replace the loading state, don't add to it",
                 "plain": "Clear the container, then put the list in. If you only append, the user "
                          "sees the spinner and the list together.",
                 "code": "container.innerHTML = '';\n"
                         "container.appendChild(list);",
                 "deeper": "Each terminal branch owns the entire container. Think of it as the "
                           "function's postcondition: on exit, the container holds exactly one of "
                           "loading, list, or error — never two, never none."},

                {"title": "Catch failure and say so",
                 "plain": "Wrap the whole async section in try/catch. In the catch, replace the "
                          "contents with an error element.",
                 "code": "try {\n"
                         "  // …fetch, parse, render…\n"
                         "} catch (err) {\n"
                         "  container.innerHTML = '<p data-testid=\"error\">Sorry — we couldn\\'t load the team.</p>';\n"
                         "}",
                 "deeper": "Write the message for the person reading it, not the developer debugging "
                           "it. 'TypeError: Failed to fetch' helps nobody. Log the real error to the "
                           "console or your monitoring, and show a sentence with a way forward."},
            ],
            "contract": [
                {"name": "renderDirectory(container, fetchFn)", "must": "Exported via module.exports; async."},
                {"name": "data-testid=\"loading\"", "must": "Present synchronously, before the first await."},
                {"name": "data-testid=\"team-list\"", "must": "A <ul> with one <li> per member."},
                {"name": "data-testid=\"error\"", "must": "Present when the fetch rejects."},
                {"name": "fetchFn('/api/team')", "must": "Use the injected function, not the global fetch."},
            ],
            "mistakes": [
                "Setting the loading state after the first await, where it can never be seen.",
                "Calling the global `fetch` instead of the injected `fetchFn` — the test controls "
                "timing through that argument, so nothing works.",
                "Appending the list without clearing, leaving the spinner underneath it.",
                "No try/catch, so a failed request leaves the loading state on screen forever.",
                "Forgetting `await response.json()` and rendering a Promise object — which stringifies "
                "to `[object Promise]`.",
            ],
            "further": [
                "Add an empty state: the request succeeded and returned zero members. That is a fourth "
                "state, and it is not an error.",
                "Read about AbortController and how you cancel a request that is no longer wanted — "
                "essential once a user can type in a search box faster than the network responds.",
                "Look into why fetch doesn't reject on HTTP 404 or 500, and what checking response.ok "
                "yourself buys you.",
            ],
        },
    },
    model_solution={
        "steps": [
            dict(title="Loading in the synchronous window",
                 detail="Everything before the first await runs immediately. That is the only moment "
                        "at which a loading state is worth anything.",
                 example="container.innerHTML = '<p data-testid=\"loading\">Loading…</p>';\n"
                         "const response = await fetchFn('/api/team');"),
            dict(title="textContent for anything from a server",
                 detail="innerHTML would execute markup embedded in the data. This is XSS in one line.",
                 example="const item = document.createElement('li');\nitem.textContent = member.name;"),
            dict(title="One coherent state on every exit",
                 detail="Clear, then render. Each branch leaves the container holding exactly one thing.",
                 example="container.innerHTML = '';\ncontainer.appendChild(list);"),
        ],
        "key_principle": "Every network request has three outcomes and the UI owes the user an honest "
                         "answer for all three.",
        "great_looks_like": "You can make the request hang forever, fail instantly, or return an empty "
                            "array, and the screen always says something true.",
        "example_solution": starters.TASK5_SOLUTION,
    },
    xp_award=90, skill_awards={"javascript": 25, "async": 20},
)


TASK_6 = dict(
    task_index=6, title="Search and Filter", type="code_sandbox", week=2,
    objective="Let people search the directory — and separate working out the answer from drawing it.",
    briefing=(
        "The directory's up to about 200 people now and scrolling it is painful. Add a search. Two "
        "things I want to see in how you write it: the filtering logic separate from the rendering, "
        "and a real empty state. A blank screen when nothing matches makes people think the feature "
        "is broken, and we get a ticket about it every single time."
    ),
    what_to_do=[
        "filterMembers(members, query) returns a NEW array of case-insensitive matches.",
        "An empty or whitespace-only query returns everyone.",
        "Never modify the array you were handed.",
        "renderList(container, members) renders one data-testid=\"member-item\" per member.",
        "With no members, render a data-testid=\"empty\" element instead.",
    ],
    what_to_submit=["A single submission.js exporting filterMembers and renderList."],
    hints=[
        ".filter() already returns a new array, so it satisfies 'do not mutate' for free. .sort() and "
        ".reverse() would not — they change the array in place.",
        "Lowercase BOTH sides before comparing. Normalising only one is a bug that passes whichever "
        "test you wrote first.",
        "For an empty query, `members.slice()` returns a copy — cleaner than returning the original "
        "array, since the caller then can't mutate your source through it.",
    ],
    success_criteria=[
        "Case-insensitive matching",
        "Partial matches anywhere in the name",
        "An empty query returns everyone",
        "The input array is never modified",
        "One rendered item per member",
        "An explicit empty state when nothing matches",
    ],
    config={
        **_COMMON,
        "language": "javascript",
        "grader_key": "frontend_dev_sim.task6",
        "starter_code": starters.TASK6_STARTER,
        "input_filename": "submission.js",
        "output_filename": "output.json",
        "assessment": assessment_for(6),
        "explainer": {
            "situation": (
                "Two hundred names is too many to scroll. The feature is a search box — but the "
                "interesting part of this ticket is the shape of the code, not the feature. You are "
                "writing two functions that could have been one, and the reason to keep them apart is "
                "the same reason four of the six checks here need no DOM at all."
            ),
            "outcome": (
                "A pure function that turns (list, query) into a filtered list and touches nothing "
                "else, and a rendering function that turns a list into DOM. Either can be changed, "
                "tested, or replaced without the other noticing."
            ),
            "preview": (
                'filterMembers(members, "ada")   →  [{ name: "Ada Lovelace" }]\n'
                'filterMembers(members, "")      →  all 3 members\n'
                'filterMembers(members, "zzz")   →  []\n'
                "\n"
                "renderList(container, [Ada])    →  <ul><li data-testid=\"member-item\">Ada Lovelace</li></ul>\n"
                "renderList(container, [])       →  <p data-testid=\"empty\">No one matches that search.</p>"
            ),
            "concepts": [
                {"term": "Pure function",
                 "plain": "A function whose output depends only on its arguments, and which changes "
                          "nothing outside itself. Same input, same output, every time, with no side "
                          "effects.",
                 "why": "You can test it with plain values and no setup at all — no DOM, no server, no "
                        "mocks. filterMembers is pure; renderList deliberately is not, because putting "
                        "things on a screen IS a side effect."},
                {"term": "Mutation vs a new value",
                 "plain": "Mutating changes the thing you were given. Returning a new value leaves the "
                          "original alone. `.filter()` returns new; `.sort()` mutates in place.",
                 "why": "A function that silently reorders its caller's array causes bugs a long way "
                        "from where the mistake was made. `.sort()` mutating catches out experienced "
                        "developers regularly."},
                {"term": "Case normalisation",
                 "plain": "Lowercase both the query and the value before comparing, so 'ADA', 'ada' and "
                          "'Ada' all behave the same.",
                 "why": "String comparison is case-sensitive by default. Normalising one side only is a "
                        "half-fix that works for exactly the case you tested."},
                {"term": "Empty state",
                 "plain": "What you show when there is legitimately nothing to show. It is a real "
                          "state that needs designing, not the absence of one.",
                 "why": "Rendering nothing is ambiguous — the user cannot tell 'no matches' from 'still "
                        "loading' from 'this is broken'. One sentence removes the doubt."},
            ],
            "steps": [
                {"title": "Normalise the query once",
                 "plain": "Trim the whitespace and lowercase it at the top of the function, then use "
                          "that variable throughout. Doing it inside the loop repeats the work for "
                          "every member.",
                 "code": "const needle = (query || '').trim().toLowerCase();",
                 "deeper": "The `(query || '')` guard means a null or undefined query behaves like an "
                           "empty one instead of throwing. Deciding what your function does with "
                           "rubbish input is part of designing it, not an afterthought."},

                {"title": "Handle the empty query deliberately",
                 "plain": "No search term means show everyone. Return a copy rather than the original "
                          "array.",
                 "code": "if (!needle) return members.slice();",
                 "deeper": "Every string contains '', so a naive implementation gets this right by "
                           "accident. Writing it explicitly states the intent — and stops someone "
                           "'optimising' it later into behaviour that empties the screen whenever the "
                           "user clears the box. Returning a copy also means the caller cannot reach "
                           "back into your source array through the result."},

                {"title": "Filter without touching the original",
                 "plain": "`.filter()` walks the array and builds a new one from the items whose test "
                          "returns true. The original is untouched.",
                 "code": "return members.filter((member) =>\n"
                         "  member.name.toLowerCase().includes(needle)\n"
                         ");",
                 "deeper": "`.includes()` matches anywhere in the string, which is what people expect "
                           "from a search box — typing 'ing' should find 'Turing'. `.startsWith()` "
                           "would be a different, defensible product decision; the point is that it IS "
                           "a decision."},

                {"title": "Render the empty state first",
                 "plain": "In renderList, clear the container, then check for an empty list before "
                          "doing anything else. Say something specific and get out.",
                 "code": "container.innerHTML = '';\n\n"
                         "if (members.length === 0) {\n"
                         "  const empty = document.createElement('p');\n"
                         "  empty.setAttribute('data-testid', 'empty');\n"
                         "  empty.textContent = 'No one matches that search.';\n"
                         "  container.appendChild(empty);\n"
                         "  return;\n"
                         "}",
                 "deeper": "Early return keeps the main path unindented and makes the two cases "
                           "genuinely separate. The alternative — one big if/else around the whole "
                           "body — is where subtle 'both branches ran' bugs come from."},

                {"title": "Render the list",
                 "plain": "One <li> per member, each tagged with the testid, using textContent for "
                          "the name.",
                 "code": "const list = document.createElement('ul');\n\n"
                         "members.forEach((member) => {\n"
                         "  const item = document.createElement('li');\n"
                         "  item.setAttribute('data-testid', 'member-item');\n"
                         "  item.textContent = member.name;\n"
                         "  list.appendChild(item);\n"
                         "});\n\n"
                         "container.appendChild(list);",
                 "deeper": "Building into a detached <ul> and appending once means the browser lays out "
                           "and paints a single time. Appending each <li> straight into the live "
                           "document can force layout on every iteration — irrelevant at three items, "
                           "very relevant at two thousand."},
            ],
            "contract": [
                {"name": "filterMembers(members, query)", "must": "Returns a new array; never mutates its input."},
                {"name": "Empty / whitespace query", "must": "Returns every member."},
                {"name": "renderList(container, members)", "must": "One data-testid=\"member-item\" per member."},
                {"name": "data-testid=\"empty\"", "must": "Rendered when the members array is empty."},
                {"name": "module.exports = { filterMembers, renderList }", "must": "Both functions exported under exactly these names."},
            ],
            "mistakes": [
                "Using .sort() or .reverse() on the input — both mutate in place and fail the "
                "'unchanged' check.",
                "Lowercasing the query but not the name (or the other way round).",
                "Returning [] for an empty query, so clearing the search box empties the screen.",
                "Rendering nothing at all for no matches, instead of an explicit empty state.",
                "Forgetting to clear the container, so each render appends onto the last one.",
            ],
            "further": [
                "Debounce the search input so a request or an expensive filter fires once when typing "
                "pauses, not once per keystroke.",
                "Try matching against role as well as name — and notice how the change is confined "
                "entirely to the pure function.",
                "Highlight the matched substring in the rendered output. Doing it safely, without "
                "innerHTML, is a genuinely instructive exercise.",
            ],
        },
    },
    model_solution={
        "steps": [
            dict(title="Normalise once, at the top",
                 detail="Trim and lowercase the query a single time rather than inside the loop.",
                 example="const needle = (query || '').trim().toLowerCase();\nif (!needle) return members.slice();"),
            dict(title="filter returns new",
                 detail="No mutation, no reordering — the caller's array is exactly as they left it.",
                 example="return members.filter((m) => m.name.toLowerCase().includes(needle));"),
            dict(title="The empty state is a state",
                 detail="Say 'no matches' out loud rather than rendering silence.",
                 example="if (members.length === 0) { /* render data-testid=\"empty\" */ return; }"),
        ],
        "key_principle": "Keep the decision separate from the drawing. The half that decides is then "
                         "testable with plain values, and reusable anywhere.",
        "great_looks_like": "filterMembers has no idea a DOM exists, and renderList has no idea what "
                            "filtering is.",
        "example_solution": starters.TASK6_SOLUTION,
    },
    xp_award=90, skill_awards={"javascript": 30},
)


TASKS = [TASK_4, TASK_5, TASK_6]

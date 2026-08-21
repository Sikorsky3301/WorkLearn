"""Week 1 — Structure, style, and the first interaction.

Three tickets that take someone from an empty file to a page that responds to
a click: semantic structure, responsive layout, and DOM events.

CONTENT SHAPE — see engineering/__init__.py for the full `explainer` contract.
The short version: every task explains itself twice. `plain` is written for
somebody who has genuinely never done this, in words, with no assumed
vocabulary. `deeper` is the sentence a senior engineer would add — the
trade-off, the failure mode, the reason it is done this way and not the other
way. Neither is a summary of the other, and a reader can skip either one and
still have a complete task.
"""
from app.cms_templates.engineering import starters
from app.cms_templates.engineering.assessments import assessment_for

_COMMON = dict(submission_mode="code", grading_strategy="registered_grader")


TASK_1 = dict(
    task_index=1, title="Landing Hero Section", type="code_sandbox", week=1,
    objective="Build the top of the new marketing page — the part everyone sees first.",
    briefing=(
        "Marketing's been waiting on this for weeks — we need a hero section for the new landing page "
        "before the launch newsletter goes out. Semantic HTML and solid CSS layout, nothing fancy yet. "
        "No JavaScript needed for this one — I just want a page that reads cleanly and holds together "
        "on any screen size."
    ),
    what_to_do=[
        "Structure the page with <header>, <nav>, <main> and <footer>.",
        "Put exactly one <h1> inside a hero <section> in <main>.",
        "Give the nav at least one link with real, visible text.",
        "Lay the hero out with Flexbox or Grid in an embedded <style> block.",
    ],
    what_to_submit=["A single submission.html file, with CSS in an embedded <style> block."],
    hints=[
        "The grader looks for the real tags — <header>, <main>, <footer>, and a <nav> containing an "
        '<a>. A <div class="header"> will not pass, because a class name means nothing to a browser.',
        "Exactly one <h1> inside <main>. Zero fails, two fails. Everything else can be <h2> or lower.",
        "'Flexbox or Grid' means the string `display: flex` or `display: grid` appears somewhere in "
        "your CSS. One is enough.",
    ],
    success_criteria=[
        "header, nav, main and footer are real elements",
        "The nav has at least one link with visible text",
        "Exactly one <h1>, inside <main>",
        "The layout uses Flexbox or Grid",
    ],
    config={
        **_COMMON,
        "language": "html",
        "grader_key": "frontend_dev_sim.task1",
        "starter_code": starters.TASK1_STARTER,
        "input_filename": "submission.html",
        "output_filename": "output.json",
        "assessment": assessment_for(1),
        "explainer": {
            "situation": (
                "Enigma is relaunching its marketing site and the newsletter announcing it goes out on "
                "Friday. The hero section is the block at the very top of the page — the headline, a "
                "sentence explaining what the product is, and the navigation above it. It is the first "
                "and often only thing a visitor reads."
            ),
            "outcome": (
                "One HTML file that renders a complete page: a header bar with navigation, a centred "
                "hero with a headline, and a footer. No JavaScript, no build step, no images required. "
                "It should still make sense if you turn CSS off entirely."
            ),
            "preview": (
                "┌──────────────────────────────────────────────┐\n"
                "│  Enigma            Home  Features  Pricing   │  ← <header> with <nav>\n"
                "├──────────────────────────────────────────────┤\n"
                "│                                              │\n"
                "│           Build better, together.            │  ← the single <h1>\n"
                "│    Enigma is the workspace your team         │\n"
                "│    actually wants to use.                    │\n"
                "│                                              │  ← <main> > <section id=\"hero\">\n"
                "├──────────────────────────────────────────────┤\n"
                "│              © 2026 Enigma                   │  ← <footer>\n"
                "└──────────────────────────────────────────────┘"
            ),
            "concepts": [
                {"term": "Semantic HTML",
                 "plain": "Using the tag that describes what a thing IS — <header> for a header, <nav> "
                          "for navigation — instead of using <div> for everything and explaining "
                          "yourself with class names.",
                 "why": "A browser cannot read your class names. A screen reader announces \"banner\" "
                        "for <header> and nothing at all for <div class=\"header\">. Same pixels, "
                        "completely different experience for someone who cannot see them."},
                {"term": "Block vs inline",
                 "plain": "Block elements (<div>, <section>, <h1>, <p>) start on a new line and take "
                          "the full width available. Inline elements (<a>, <span>, <strong>) sit "
                          "inside a line of text and take only the width they need.",
                 "why": "It explains most 'why won't this element move' confusion. You cannot set a "
                        "height on a plain inline element — it ignores you."},
                {"term": "Flexbox",
                 "plain": "A layout mode for arranging things along ONE direction — a row or a column. "
                          "You set `display: flex` on the container, and its direct children become "
                          "flex items you can space out and align.",
                 "why": "`justify-content: space-between` on a header pushes the logo to one end and "
                        "the nav to the other, at any width, with two lines of CSS."},
                {"term": "CSS Grid",
                 "plain": "A layout mode for arranging things in TWO directions at once — rows and "
                          "columns together. `display: grid` plus `place-items: center` centres "
                          "content both horizontally and vertically.",
                 "why": "Vertical centring was genuinely difficult in CSS for about fifteen years. "
                        "Grid made it one line, and it is the reason `place-items: center` feels like "
                        "a cheat code."},
            ],
            "steps": [
                {"title": "Lay out the page skeleton with real landmark tags",
                 "plain": "Before any styling, get the structure right. A <header> at the top holding "
                          "a <nav>, a <main> holding a <section> for the hero, and a <footer> at the "
                          "bottom. Type the tags themselves — do not use <div> with a class name that "
                          "says 'header'.",
                 "code": '<header>\n'
                         '  <nav>\n'
                         '    <a href="#features">Features</a>\n'
                         '  </nav>\n'
                         '</header>\n\n'
                         '<main>\n'
                         '  <section id="hero">\n'
                         '    <h1>Your headline here</h1>\n'
                         '  </section>\n'
                         '</main>\n\n'
                         '<footer>&copy; 2026 Enigma</footer>',
                 "deeper": "These five tags map onto ARIA landmark roles automatically — banner, "
                           "navigation, main, contentinfo. Screen reader users navigate by jumping "
                           "between landmarks, the way you would skim by scrolling. Divs give them "
                           "nothing to jump to, so the page becomes one undifferentiated wall."},

                {"title": "Write exactly one <h1>",
                 "plain": "The <h1> is the page's title — what this page is about, in one line. Put it "
                          "inside your hero section. Use <h2> and <h3> for anything below it.",
                 "code": '<section id="hero">\n'
                         '  <h1>Build better, together.</h1>\n'
                         '  <p>Enigma is the workspace your team actually wants to use.</p>\n'
                         '</section>',
                 "deeper": "Multiple <h1>s are technically valid HTML5, and plenty of pages ship them. "
                           "They are still a bad idea: the heading levels form a document outline, and "
                           "a document with three 'top level' headings has no outline at all. Choose "
                           "heading level by nesting depth, never by how big you want the text."},

                {"title": "Give the nav links real text",
                 "plain": "Each link needs words a person can read — 'Features', 'Pricing'. An empty "
                          "<a></a>, or one containing only an icon, does not count.",
                 "code": '<nav>\n'
                         '  <a href="#features">Features</a>\n'
                         '  <a href="#pricing">Pricing</a>\n'
                         '</nav>',
                 "deeper": "Icon-only links are announced as 'link' with no name, which is useless. If "
                           "the design demands an icon alone, the text still has to exist — either "
                           "visually hidden, or as aria-label. The link must always have an accessible "
                           "name; the only question is whether you can see it."},

                {"title": "Lay the hero out with Flexbox or Grid",
                 "plain": "Add a <style> block in the <head>. Use Flexbox for the header row (logo one "
                          "side, nav the other) and Grid for the hero (content centred). Either one "
                          "satisfies the check — do both if you want the practice.",
                 "code": 'header {\n'
                         '  display: flex;\n'
                         '  justify-content: space-between;  /* push to opposite ends */\n'
                         '  align-items: center;             /* line up vertically */\n'
                         '  padding: 1rem 2rem;\n'
                         '}\n\n'
                         '#hero {\n'
                         '  display: grid;\n'
                         '  place-items: center;             /* centre both directions */\n'
                         '  min-height: 60vh;                /* 60% of the window height */\n'
                         '  text-align: center;\n'
                         '}',
                 "deeper": "Rule of thumb: one axis, use Flexbox; two axes, use Grid. Both work for "
                           "most simple cases, and choosing the one that matches the problem is what "
                           "stops you fighting the layout later. `min-height: 60vh` rather than a "
                           "fixed pixel height means the hero adapts to the viewport instead of "
                           "clipping on a laptop screen."},
            ],
            "contract": [
                {"name": "<header>, <main>, <footer>", "must": "All three present as real elements."},
                {"name": "<nav> containing at least one <a>", "must": "The link's text must not be empty."},
                {"name": "exactly one <h1> inside <main>", "must": "Not zero, not two."},
                {"name": "display: flex or display: grid", "must": "Somewhere in your <style> block."},
            ],
            "mistakes": [
                "Using <div class=\"header\"> instead of <header>. The check reads tags, not classes — "
                "and so does every screen reader.",
                "Putting the <h1> outside <main>, usually up in the header next to the logo. The check "
                "looks specifically for `main h1`.",
                "Two <h1>s — one for the logo and one for the headline. Make the logo a <strong>, an "
                "<img> with alt text, or a <p>.",
                "Writing the CSS in a separate file. There is only one file here, so styles go in an "
                "embedded <style> block.",
            ],
            "further": [
                "Add a `prefers-reduced-motion` media query before adding any animation — get in the "
                "habit before you have something to animate.",
                "Set the hero headline with `clamp(2rem, 5vw, 3.5rem)` so it scales with the viewport "
                "between a sensible floor and ceiling, with no breakpoints at all.",
                "Look up how a `<picture>` element with multiple `<source>` entries lets the browser "
                "pick the right image format and size — the single biggest lever on hero performance.",
            ],
        },
    },
    model_solution={
        "steps": [
            dict(title="Structure with real landmarks",
                 detail="header > nav, main > section#hero, footer — not divs with matching class "
                        "names. Screen readers and the grader both rely on the actual tag.",
                 example='<header>\n  <nav><a href="#hero">Home</a></nav>\n</header>\n'
                         '<main>\n  <section id="hero">\n    <h1>Build better, together.</h1>\n'
                         '  </section>\n</main>\n<footer>&copy; 2026 Enigma</footer>'),
            dict(title="Lay out the hero with Flexbox or Grid",
                 detail="Grid is a clean fit for centring a hero block; Flexbox suits the header row. "
                        "Either satisfies the check.",
                 example='header { display: flex; justify-content: space-between; align-items: center; }\n'
                         '#hero { display: grid; place-items: center; min-height: 60vh; }'),
        ],
        "key_principle": "Semantic HTML is not a style preference — it is what makes a page navigable "
                         "by screen readers, crawlable by search engines, and testable by tools like "
                         "this one.",
        "great_looks_like": "A page that still reads correctly with CSS turned off — the HTML alone "
                            "tells you what everything is.",
        "example_solution": starters.TASK1_SOLUTION,
    },
    xp_award=50, skill_awards={"html_css": 16, "accessibility": 6},
)


TASK_2 = dict(
    task_index=2, title="Responsive Feature Grid", type="code_sandbox", week=1,
    objective="Add the feature cards below the hero — and make them survive a phone screen.",
    briefing=(
        "Nice work on the hero. Next block down is the feature grid — three cards explaining what the "
        "product does. The important part is that it can't break on mobile; more than half our launch "
        "traffic comes from phones. I don't want a pile of breakpoints either, so use a grid that "
        "reflows on its own and save the media query for the things it genuinely can't handle."
    ),
    what_to_do=[
        "Build at least three cards as <article class=\"card\">, inside a container with class card-grid.",
        "Give every card an image with real alt text, a heading, and a paragraph.",
        "Lay the container out with grid-template-columns: repeat(auto-fit, minmax(...)).",
        "Add a media query for narrow screens.",
    ],
    what_to_submit=["A single submission.html file, with CSS in an embedded <style> block."],
    hints=[
        "The container must have class `card-grid` and the cards must be <article class=\"card\"> — "
        "the checks look for those exact names.",
        "The responsive track is `repeat(auto-fit, minmax(16rem, 1fr))`. The number can be anything "
        "sensible; the auto-fit and minmax parts are what's checked.",
        "The image src can point at a file that doesn't exist — nothing is loaded here. The alt text is "
        "what's being checked.",
    ],
    success_criteria=[
        "Three or more <article class=\"card\"> elements",
        "Every card has a heading and a paragraph",
        "Every card image has non-empty alt text",
        ".card-grid uses display: grid with a repeat(auto-fit/auto-fill, minmax(…)) track",
        "The CSS contains a media query",
    ],
    config={
        **_COMMON,
        "language": "html",
        "grader_key": "frontend_dev_sim.task2",
        "starter_code": starters.TASK2_STARTER,
        "input_filename": "submission.html",
        "output_filename": "output.json",
        "assessment": assessment_for(2),
        "explainer": {
            "situation": (
                "Below the hero sits the feature grid: three cards, each with a picture, a short "
                "heading and a sentence. On a wide monitor they sit side by side. On a phone they have "
                "to stack. The naive way to do that is a stack of breakpoints at 1024px, 768px, 480px "
                "— which works until someone opens it on a screen size nobody predicted."
            ),
            "outcome": (
                "A card grid that works at every width without being told about specific devices. Drag "
                "the browser window narrower and the columns reduce from three to two to one on their "
                "own, because the layout is described in terms of how much room a card needs rather "
                "than how wide the screen is."
            ),
            "preview": (
                "WIDE                                    NARROW\n"
                "┌────────┐ ┌────────┐ ┌────────┐        ┌────────────┐\n"
                "│ [img]  │ │ [img]  │ │ [img]  │        │   [img]    │\n"
                "│ Plan   │ │ Track  │ │ Ship   │        │   Plan     │\n"
                "│ text…  │ │ text…  │ │ text…  │        │   text…    │\n"
                "└────────┘ └────────┘ └────────┘        └────────────┘\n"
                "                                        ┌────────────┐\n"
                "  three columns, no media query         │   [img]    │\n"
                "  involved — auto-fit decided           │   Track    │\n"
                "                                        └────────────┘"
            ),
            "concepts": [
                {"term": "grid-template-columns",
                 "plain": "The property where you describe the columns of a grid. "
                          "`grid-template-columns: 200px 200px 200px` makes three fixed columns. You "
                          "are about to write something much better than that.",
                 "why": "Everything about responsive grid layout is a variation on this one property."},
                {"term": "repeat(auto-fit, …)",
                 "plain": "Instead of saying how many columns you want, you let the browser work it "
                          "out: fit as many as will comfortably go, given the rule that follows.",
                 "why": "The browser knows the container's width and you don't. Handing it the decision "
                        "is why this survives screen sizes that didn't exist when you wrote it."},
                {"term": "minmax(16rem, 1fr)",
                 "plain": "Each column must be at least 16rem wide, and may grow up to an equal share "
                          "of whatever space is left. `fr` means 'fraction of the free space'.",
                 "why": "The minimum is what forces a wrap — once a fourth 16rem column won't fit, "
                        "the grid drops to three. The 1fr is what stops three cards looking stranded "
                        "on the left of a wide screen."},
                {"term": "Media query",
                 "plain": "A block of CSS that only applies under a condition — usually a screen width. "
                          "`@media (max-width: 40rem) { … }` applies only at 40rem and below.",
                 "why": "Once auto-fit handles the column count, breakpoints are free to do what they "
                        "are genuinely good at: adjusting spacing and type size, which no amount of "
                        "grid maths can infer."},
                {"term": "alt text",
                 "plain": "A short description of what an image shows, written for someone who cannot "
                          "see it. `alt=\"A sprint board with tasks in three columns\"`, not "
                          "`alt=\"image\"`.",
                 "why": "It is also what the browser displays when the image fails to load — which on "
                        "a bad mobile connection is a meaningful fraction of your visitors."},
            ],
            "steps": [
                {"title": "Build one card properly, then copy it",
                 "plain": "A card is an <article> because it stands on its own — you could lift it out "
                          "of the page and it would still make sense. Inside: an image, a heading, a "
                          "paragraph. Get one right, then duplicate it twice and change the words.",
                 "code": '<article class="card">\n'
                         '  <img src="plan.png" alt="A sprint board with tasks arranged in three columns" />\n'
                         '  <h3>Plan together</h3>\n'
                         '  <p>Shared boards that stay in sync, so nobody plans against a stale copy.</p>\n'
                         '</article>',
                 "deeper": "The 'would this still make sense on its own?' test is the actual definition "
                           "of <article> in the HTML spec — it is why a blog post, a comment and a "
                           "product card are all articles, while a page's sidebar is not."},

                {"title": "Write alt text that says what the image shows",
                 "plain": "Describe the content, not the file. Someone who cannot see it should end up "
                          "with the same understanding you get from looking at it. If an image is "
                          "purely decorative, use alt=\"\" — an empty string — so it is skipped.",
                 "code": '<!-- good -->\n'
                         '<img src="chart.png" alt="Revenue rising steadily from January to June" />\n\n'
                         '<!-- useless -->\n'
                         '<img src="chart.png" alt="chart" />\n\n'
                         '<!-- correct for pure decoration -->\n'
                         '<img src="swirl.png" alt="" />',
                 "deeper": "alt=\"\" and omitting alt entirely are NOT the same. Empty alt means "
                           "\"skip this, it carries no information\"; a missing alt attribute makes "
                           "many screen readers fall back to reading the filename aloud, which is "
                           "worse than either."},

                {"title": "Make the grid responsive with auto-fit and minmax",
                 "plain": "This is the important line of the whole task. Set the container to "
                          "`display: grid`, then describe the columns by their minimum size rather "
                          "than their number. The browser fits as many as it can.",
                 "code": '.card-grid {\n'
                         '  display: grid;\n'
                         '  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));\n'
                         '  gap: 1.5rem;\n'
                         '}',
                 "deeper": "Swap auto-fit for auto-fill and watch what changes: auto-fill keeps the "
                           "empty tracks, so three cards in a five-column container stay narrow and "
                           "huddle left. auto-fit collapses those empty tracks so the real cards "
                           "expand. Neither is wrong — auto-fit is what you want here."},

                {"title": "Add the media query for what the grid can't do",
                 "plain": "The columns already reflow. What still looks wrong on a phone is spacing "
                          "and text size. That is what your one media query is for.",
                 "code": '@media (max-width: 40rem) {\n'
                         '  main { padding: 2rem 1rem; }\n'
                         '  h1 { font-size: 1.5rem; }\n'
                         '  .card-grid { gap: 1rem; }\n'
                         '}',
                 "deeper": "Using rem in the media query rather than px means the breakpoint moves "
                           "with the user's font size — someone browsing at 24px base text hits it "
                           "sooner, which is usually what they want. It is a small, free "
                           "accessibility win most codebases miss."},
            ],
            "contract": [
                {"name": "class=\"card-grid\"", "must": "On the container; it must have display: grid."},
                {"name": "<article class=\"card\">", "must": "At least three, and they must be <article> elements."},
                {"name": "img inside each card", "must": "With a non-empty alt attribute."},
                {"name": "h2 or h3, and a p, inside each card", "must": "The paragraph must not be empty."},
                {"name": "repeat(auto-fit | auto-fill, minmax(…))", "must": "In the .card-grid rule."},
                {"name": "@media (max-width: …) or (min-width: …)", "must": "Anywhere in your CSS."},
            ],
            "mistakes": [
                "Using <div class=\"card\"> — the check requires the element to actually be <article>.",
                "`repeat(3, 1fr)` instead of `repeat(auto-fit, minmax(…))`. It looks right on your "
                "screen and produces three cripplingly narrow columns on a phone.",
                "alt=\"image\" or alt=\"card image\". It passes a naive check and helps nobody; write "
                "what the picture shows.",
                "Putting `display: grid` on the cards instead of the container. Grid properties go on "
                "the parent — the children just fall into place.",
            ],
            "further": [
                "Try `grid-auto-rows: 1fr` and see how it forces every card in a row to the same "
                "height, without any JavaScript measuring anything.",
                "Read about container queries (`@container`): they let a component respond to the "
                "space IT was given rather than to the whole viewport — the thing media queries "
                "always should have been for components.",
                "Add `aspect-ratio: 16 / 9` to the card images and watch the layout stop jumping as "
                "images load. That jump has a name — Cumulative Layout Shift — and it is a ranked "
                "Core Web Vital.",
            ],
        },
    },
    model_solution={
        "steps": [
            dict(title="One card, three times",
                 detail="An <article> per card — self-contained content, with an image, a heading and "
                        "a paragraph.",
                 example='<article class="card">\n  <img src="plan.png" alt="A sprint board with tasks in three columns" />\n'
                         '  <h3>Plan together</h3>\n  <p>Shared boards that stay in sync.</p>\n</article>'),
            dict(title="The responsive track",
                 detail="auto-fit fits as many >=16rem columns as will go, then stretches them to "
                        "share the row. No breakpoint decides the column count.",
                 example='.card-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));\n'
                         '  gap: 1.5rem;\n}'),
            dict(title="A breakpoint for what's left",
                 detail="Spacing and type size are independent of column count, so they still need a "
                        "media query.",
                 example='@media (max-width: 40rem) {\n  main { padding: 2rem 1rem; }\n  h1 { font-size: 1.5rem; }\n}'),
        ],
        "key_principle": "Describe the layout in terms of what the content needs, not in terms of the "
                         "devices you happen to have tested on.",
        "great_looks_like": "You can drag the window from 320px to 2560px and never find a width where "
                            "it looks broken.",
        "example_solution": starters.TASK2_SOLUTION,
    },
    xp_award=60, skill_awards={"html_css": 22, "accessibility": 6},
)


TASK_3 = dict(
    task_index=3, title="Interactive Navigation", type="code_sandbox", week=1,
    objective="Make the nav work on mobile — and make it announce itself correctly.",
    briefing=(
        "QA flagged that our nav is just static markup right now — no mobile menu, no way to tell "
        "which page you're on. Can you wire it up? Standard pattern: a toggle button that opens and "
        "closes the menu and stays accessible, plus highlighting whichever link is active. This is "
        "vanilla JavaScript — no framework needed yet."
    ),
    what_to_do=[
        "Clicking #nav-toggle flips aria-expanded between \"false\" and \"true\".",
        "The same click toggles a class on #nav-menu so it can show and hide.",
        "Clicking it a second time closes the menu again.",
        "Clicking a .nav-link adds class active to it and removes active from the others.",
    ],
    what_to_submit=["A single submission.html file with an inline <script> at the end of <body>."],
    hints=[
        "Attach your listeners after the elements exist — the <script> at the end of <body> already "
        "does that for you. Moving it into <head> will break everything with a null reference.",
        "aria-expanded is a STRING attribute, not a boolean: it holds \"true\" or \"false\" as text. "
        "Read it with getAttribute and compare to the string.",
        "querySelectorAll returns all matches; querySelector returns only the first. For the links you "
        "want all of them.",
    ],
    success_criteria=[
        "#nav-toggle starts with aria-expanded=\"false\"",
        "Clicking it sets aria-expanded=\"true\" and puts a class on #nav-menu",
        "Clicking again returns aria-expanded to \"false\"",
        "Clicking a .nav-link marks only that link active",
    ],
    config={
        **_COMMON,
        "language": "html",
        "grader_key": "frontend_dev_sim.task3",
        "starter_code": starters.TASK3_STARTER,
        "input_filename": "submission.html",
        "output_filename": "output.json",
        "assessment": assessment_for(3),
        "explainer": {
            "situation": (
                "The nav you built in Task 1 is decoration — it does not do anything. On a phone there "
                "is no room for the links, so they hide behind a menu button. QA also noticed there is "
                "no way to tell which page you are currently on. Both are small pieces of JavaScript, "
                "and both have an accessibility dimension that is easy to skip and expensive to skip."
            ),
            "outcome": (
                "A menu button that opens and closes the nav, keeps the aria-expanded attribute "
                "truthful the whole time, and a link list where clicking one marks it — and only it — "
                "as active."
            ),
            "preview": (
                "CLOSED                              OPEN (after one click)\n"
                "┌──────────────────────┐            ┌──────────────────────┐\n"
                "│ [ Menu ]             │            │ [ Menu ]             │\n"
                "└──────────────────────┘            │  Home        ← .active│\n"
                "                                    │  Docs                │\n"
                "aria-expanded=\"false\"               │  Pricing             │\n"
                "#nav-menu has no class              └──────────────────────┘\n"
                "                                    aria-expanded=\"true\"\n"
                "                                    #nav-menu.open"
            ),
            "concepts": [
                {"term": "Event listener",
                 "plain": "A function you hand to the browser saying \"run this when that happens\". "
                          "`button.addEventListener('click', fn)` means: whenever this button is "
                          "clicked, call fn.",
                 "why": "It is the entire basis of interactivity on the web. Everything from a click to "
                        "a keypress to a page finishing loading arrives this way."},
                {"term": "classList",
                 "plain": "The API for changing an element's classes from JavaScript. `.add('open')`, "
                          "`.remove('open')`, `.toggle('open')`, `.contains('open')`.",
                 "why": "It lets JavaScript decide state and CSS decide appearance. JS says 'this is "
                        "open'; the stylesheet decides what open looks like. Setting styles directly "
                        "from JS mixes the two and you regret it later."},
                {"term": "aria-expanded",
                 "plain": "An attribute on a toggle button that says whether the thing it controls is "
                          "currently open. It holds the text \"true\" or \"false\".",
                 "why": "A sighted user knows the menu is open because they can see it. A screen reader "
                        "user knows only what the attributes say. If you animate the menu open and "
                        "leave aria-expanded at \"false\", you have told them it is closed."},
                {"term": "Truthy strings",
                 "plain": "`\"false\"` is a non-empty string, and every non-empty string is truthy in "
                          "JavaScript. So `if (button.getAttribute('aria-expanded'))` is true even "
                          "when the attribute says false.",
                 "why": "It is one of the classic ways this exact task goes wrong. Compare explicitly: "
                        "`=== 'true'`."},
            ],
            "steps": [
                {"title": "Get references to the elements",
                 "plain": "Before you can listen for anything, you need the button and the menu in "
                          "variables. Do this at the top of your script.",
                 "code": "var toggle = document.getElementById('nav-toggle');\n"
                         "var menu = document.getElementById('nav-menu');",
                 "deeper": "If either of these is null, your script ran before the parser reached the "
                           "element. That is the single most common cause of 'Cannot read properties "
                           "of null' in a first DOM script. Script at the end of <body>, or `defer` on "
                           "a <script src>, or wrap in a DOMContentLoaded listener."},

                {"title": "Toggle the menu on click, reading state from the DOM",
                 "plain": "On click: work out whether the menu is currently open, then set the "
                          "attribute and the class to the opposite. Read 'currently open' from the "
                          "attribute itself rather than keeping a separate variable.",
                 "code": "toggle.addEventListener('click', function () {\n"
                         "  var isOpen = toggle.getAttribute('aria-expanded') === 'true';\n"
                         "  toggle.setAttribute('aria-expanded', String(!isOpen));\n"
                         "  menu.classList.toggle('open', !isOpen);\n"
                         "});",
                 "deeper": "You could keep `let isOpen = false` alongside. Don't. The attribute has to "
                           "be correct for accessibility anyway, so making it the single source of "
                           "truth removes any chance of the two drifting apart — which they will, via "
                           "some other code path that updates one and forgets the other. The second "
                           "argument to classList.toggle forces the result rather than flipping it, "
                           "which keeps the class and the attribute in lockstep by construction."},

                {"title": "Mark the clicked link active, and unmark the rest",
                 "plain": "Get all the links. On a click, first remove `active` from every one of "
                          "them, then add it to the one that was clicked. The order matters — clear, "
                          "then set.",
                 "code": "var links = document.querySelectorAll('.nav-link');\n\n"
                         "links.forEach(function (link) {\n"
                         "  link.addEventListener('click', function () {\n"
                         "    links.forEach(function (other) { other.classList.remove('active'); });\n"
                         "    link.classList.add('active');\n"
                         "  });\n"
                         "});",
                 "deeper": "'Exactly one of these is selected' is a constraint your code has to "
                           "actively maintain — nothing enforces it for you. Only ever adding the "
                           "class is how you end up with four active links and a confused user. The "
                           "clear-then-set shape shows up everywhere: tabs, radio groups, selected "
                           "rows, active filters."},
            ],
            "contract": [
                {"name": "#nav-toggle", "must": "Starts with aria-expanded=\"false\"; each click flips it."},
                {"name": "#nav-menu", "must": "Gains at least one class when opened."},
                {"name": ".nav-link", "must": "At least two of them, inside #nav-menu."},
                {"name": "class \"active\"", "must": "On the clicked link only."},
            ],
            "mistakes": [
                "`if (toggle.getAttribute('aria-expanded'))` — the string \"false\" is truthy, so this "
                "is always true. Compare with `=== 'true'`.",
                "Using querySelector for the links and wondering why only the first one responds. You "
                "want querySelectorAll.",
                "Adding `active` without removing it from the others, so every link you have ever "
                "clicked stays highlighted.",
                "Toggling the class but forgetting aria-expanded — the menu works visually and lies to "
                "every assistive technology on the page.",
                "Moving the <script> into <head>: every getElementById returns null and nothing works.",
            ],
            "further": [
                "Close the menu on Escape, and return focus to the toggle button. Keyboard users "
                "expect it, and it is about four lines.",
                "Look at what a focus trap is and why a full-screen mobile menu needs one — Tab should "
                "not wander off behind the overlay.",
                "Try rewriting the link handling with event delegation: one listener on #nav-menu, "
                "using event.target to work out which link was hit. It scales to links added later "
                "and to lists of a thousand.",
            ],
        },
    },
    model_solution={
        "steps": [
            dict(title="Read state from the DOM, not a variable",
                 detail="aria-expanded has to be correct anyway. Making it the source of truth means "
                        "the class and the attribute cannot disagree.",
                 example="var isOpen = toggle.getAttribute('aria-expanded') === 'true';\n"
                         "toggle.setAttribute('aria-expanded', String(!isOpen));\n"
                         "menu.classList.toggle('open', !isOpen);"),
            dict(title="Clear, then set",
                 detail="Exactly-one-active is a constraint you maintain by hand: remove from all, "
                        "then add to one.",
                 example="links.forEach(function (o) { o.classList.remove('active'); });\n"
                         "link.classList.add('active');"),
        ],
        "key_principle": "Interactive state has to be visible to assistive technology, not just to the "
                         "eye. A menu that looks open and reports itself closed is broken, however "
                         "good it looks.",
        "great_looks_like": "Every visual state change has a matching attribute change, and the two "
                            "are set in the same place so they cannot diverge.",
        "example_solution": starters.TASK3_SOLUTION,
    },
    xp_award=70, skill_awards={"javascript": 10, "accessibility": 8},
)


TASKS = [TASK_1, TASK_2, TASK_3]

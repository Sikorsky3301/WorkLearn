"""Parse a constrained Mermaid flowchart into CMS SimulationTask skeletons."""
from __future__ import annotations

import re
from collections import defaultdict, deque

ALLOWED_TASK_TYPES = (
    "text_rubric",
    "structured_form",
    "quiz",
    "ai_roleplay_chat",
    "crm_workspace",
    "code_sandbox",
    "mermaid_diagram",
)

DEFAULT_TASK_TYPE = "structured_form"

DEFAULT_MERMAID_STARTER = (
    "flowchart TD\n"
    "  startNode[Start] --> process[Name the components]\n"
    "  process --> endNode[End]\n"
)

_RESERVED = {
    "subgraph", "end", "flowchart", "graph", "class", "classdef",
    "style", "linkstyle", "click", "direction",
}

_HEADER = re.compile(r"^(flowchart|graph)\s+(TD|TB|BT|RL|LR)\b", re.I)
_SUBGRAPH = re.compile(
    r"^subgraph\s+"
    r"(?:(?P<id>[A-Za-z][\w]*)\s*)?"
    r"(?:"
    r'\["(?P<dlabel>[^"]*)"\]'
    r"|\['(?P<slabel>[^']*)'\]"
    r"|\[(?P<blabel>[^\]]*)\]"
    r"|(?P<rest>.+)"
    r")?$",
    re.I,
)
_CLASS_ASSIGN = re.compile(
    r"^class\s+(?P<ids>[A-Za-z][\w]*(?:\s*,\s*[A-Za-z][\w]*)*)\s+(?P<cls>[\w-]+)\s*$",
    re.I,
)
_CLASSDEF = re.compile(r"^classDef\b", re.I)
_SHAPE = (
    r"(?:"
    r'\["[^"]*"\]'
    r"|\[\'[^\']*\'\]"
    r"|\[[^\]]*\]"
    r"|\(\([^)]*\)\)"
    r'|\("[^"]*"\)'
    r"|\([^)]*\)"
    r"|\{[^}]*\}"
    r")?"
    r"(?:::{1,2}[\w-]+)?"
)
_NODE_DECL = re.compile(
    r"(?P<id>[A-Za-z][\w]*)\s*"
    r"(?:"
    r'\["(?P<dq>[^"]*)"\]'
    r"|\[\'(?P<sq>[^\']*)\'\]"
    r"|\[(?P<b>[^\]]*)\]"
    r'|\(\((?P<ss>[^)]*)\)\)'
    r'|\("(?P<pdq>[^"]*)"\)'
    r"|\((?P<p>[^)]*)\)"
    r"|\{(?P<br>[^}]*)\}"
    r")?"
    r"(?:::{1,2}(?P<style>[\w-]+))?"
)
_EDGE = re.compile(
    r"(?P<src>[A-Za-z][\w]*)" + _SHAPE + r"\s*"
    r"(?:-->|---|-.->|==>|--x|x--|o--o|--o)"
    r"(?:\|[^|]*\|)?"
    r"\s*(?P<dst>[A-Za-z][\w]*)"
)
_WEEK_NUM = re.compile(r"(\d+)")


def default_config_for(task_type: str) -> dict:
    if task_type == "structured_form":
        return {"fields": []}
    if task_type == "quiz":
        return {"questions": []}
    if task_type == "ai_roleplay_chat":
        return {
            "persona": {
                "name": "Contact Name",
                "role": "Role",
                "personality_prompt": "Describe the persona here.",
                "mood_options": ["neutral"],
                "opening_mood": "neutral",
            },
            "context": {},
            "mode": "custom",
            "min_messages_for_completion": 4,
        }
    if task_type == "crm_workspace":
        return {
            "required_entities": {"accounts": 1, "contacts": 1, "opportunities": 1},
            "pipeline_stages": ["Qualification", "Proposal", "Closed Won", "Closed Lost"],
        }
    if task_type == "code_sandbox":
        return {
            "language": "python",
            "grading_strategy": "declarative_rules",
            "submission_mode": "code",
            "starter_code": "",
            "input_filename": "submission.py",
            "output_filename": "output.json",
            "rules": [],
        }
    if task_type == "mermaid_diagram":
        return {
            "grading_mode": "manual",
            "starter_code": DEFAULT_MERMAID_STARTER,
            "min_words": 0,
        }
    return {}


def strip_fences(source: str) -> str:
    text = (source or "").strip()
    if text.startswith("```"):
        lines = text.splitlines()
        lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    return text.strip()


def _strip_comment(line: str) -> str:
    in_single = in_double = False
    out = []
    i = 0
    while i < len(line):
        ch = line[i]
        if ch == '"' and not in_single:
            in_double = not in_double
            out.append(ch)
        elif ch == "'" and not in_double:
            in_single = not in_single
            out.append(ch)
        elif ch == "%" and not in_single and not in_double and i + 1 < len(line) and line[i + 1] == "%":
            break
        else:
            out.append(ch)
        i += 1
    return "".join(out).strip()


def _week_from_label(label: str | None, subgraph_id: str | None) -> tuple[int | None, str | None]:
    for candidate in (label, subgraph_id):
        if not candidate:
            continue
        m = _WEEK_NUM.search(candidate)
        if m:
            return int(m.group(1)), label or subgraph_id
    return None, label or subgraph_id


def parse_flowchart(source: str) -> dict:
    """Return {errors, warnings, nodes, section_labels} or errors only."""
    errors: list[str] = []
    warnings: list[str] = []
    text = strip_fences(source)
    if not text:
        return {"errors": ["Diagram is empty."], "warnings": [], "nodes": [], "section_labels": {}}

    raw_lines = [_strip_comment(ln) for ln in text.splitlines()]
    lines = [ln for ln in raw_lines if ln]
    if not lines:
        return {"errors": ["Diagram is empty."], "warnings": [], "nodes": [], "section_labels": {}}

    if not _HEADER.match(lines[0]):
        return {
            "errors": ["First line must be a flowchart/graph with direction (TD, LR, TB, BT, or RL)."],
            "warnings": [],
            "nodes": [],
            "section_labels": {},
        }

    body = lines[1:]
    nodes: dict[str, dict] = {}
    order: list[str] = []
    edges: list[tuple[str, str]] = []
    subgraph_stack: list[tuple[int | None, str | None]] = []
    section_labels: dict[str, str] = {}
    out_degree: dict[str, int] = defaultdict(int)

    def ensure_node(nid: str):
        if nid.lower() in _RESERVED:
            return
        if nid not in nodes:
            week = subgraph_stack[-1][0] if subgraph_stack else None
            nodes[nid] = {"id": nid, "title": nid, "type": None, "week": week}
            order.append(nid)
        elif nodes[nid]["week"] is None and subgraph_stack:
            nodes[nid]["week"] = subgraph_stack[-1][0]

    def apply_label(nid: str, label: str | None, style: str | None):
        ensure_node(nid)
        if nid not in nodes:
            return
        if label:
            nodes[nid]["title"] = label.strip()
        if style:
            nodes[nid]["type"] = style.strip()

    for line in body:
        if _CLASSDEF.match(line) or line.lower().startswith("style ") or line.lower().startswith("linkstyle "):
            continue
        if line.lower().startswith("direction "):
            continue
        if line.lower() == "end":
            if subgraph_stack:
                subgraph_stack.pop()
            continue

        sub = _SUBGRAPH.match(line)
        if sub:
            label = (
                sub.group("dlabel") or sub.group("slabel") or sub.group("blabel")
                or (sub.group("rest") or "").strip() or sub.group("id")
            )
            week, display = _week_from_label(label, sub.group("id"))
            subgraph_stack.append((week, display))
            if week is not None and display:
                section_labels[str(week)] = display
            continue

        cls = _CLASS_ASSIGN.match(line)
        if cls:
            class_name = cls.group("cls")
            for nid in re.split(r"\s*,\s*", cls.group("ids")):
                ensure_node(nid)
                if nid in nodes:
                    nodes[nid]["type"] = class_name
            continue

        for em in _EDGE.finditer(line):
            src, dst = em.group("src"), em.group("dst")
            ensure_node(src)
            ensure_node(dst)
            edges.append((src, dst))
            out_degree[src] += 1

        for nm in _NODE_DECL.finditer(line):
            nid = nm.group("id")
            if nid.lower() in _RESERVED:
                continue
            label = next(
                (nm.group(k) for k in ("dq", "sq", "b", "ss", "pdq", "p", "br") if nm.group(k) is not None),
                None,
            )
            style = nm.group("style")
            if label is None and style is None and not (
                "[" in line[nm.start():nm.end()] or "(" in line[nm.start():nm.end()] or "{" in line[nm.start():nm.end()]
            ):
                continue
            apply_label(nid, label, style)

    if not nodes:
        return {"errors": ["No nodes found in the flowchart."], "warnings": [], "nodes": [], "section_labels": {}}

    for nid, node in nodes.items():
        t = node["type"] or DEFAULT_TASK_TYPE
        if t not in ALLOWED_TASK_TYPES:
            errors.append(f"Unknown task type '{t}' on node '{nid}'.")
        node["type"] = t

    ordered, cycle = _topo_sort(order, edges)
    if cycle:
        errors.append("Flowchart has a cycle; CMS stages must be a DAG.")

    if any(d > 1 for d in out_degree.values()):
        warnings.append("Branching detected — stages will be created in topological order (CMS runtime is linear).")

    if errors:
        return {"errors": errors, "warnings": warnings, "nodes": [], "section_labels": section_labels}

    ordered_nodes = [nodes[i] for i in ordered if i in nodes]
    return {
        "errors": [],
        "warnings": warnings,
        "nodes": ordered_nodes,
        "section_labels": section_labels,
    }


def _topo_sort(declaration_order: list[str], edges: list[tuple[str, str]]) -> tuple[list[str], bool]:
    index = {nid: i for i, nid in enumerate(declaration_order)}
    incoming: dict[str, int] = {nid: 0 for nid in declaration_order}
    adj: dict[str, list[str]] = defaultdict(list)
    seen_edges = set()
    for src, dst in edges:
        if src not in incoming or dst not in incoming:
            continue
        if (src, dst) in seen_edges:
            continue
        seen_edges.add((src, dst))
        adj[src].append(dst)
        incoming[dst] += 1
    queue = deque(sorted((n for n, c in incoming.items() if c == 0), key=lambda n: index[n]))
    out: list[str] = []
    while queue:
        n = queue.popleft()
        out.append(n)
        for nxt in sorted(adj[n], key=lambda x: index[x]):
            incoming[nxt] -= 1
            if incoming[nxt] == 0:
                queue.append(nxt)
        queue = deque(sorted(queue, key=lambda x: index[x]))
    return out, len(out) != len(declaration_order)


def plan_to_tasks(parsed: dict) -> tuple[list[dict], dict[str, str]]:
    tasks = []
    for i, node in enumerate(parsed.get("nodes") or [], start=1):
        title = node["title"]
        ttype = node["type"]
        tasks.append({
            "task_index": i,
            "title": title,
            "type": ttype,
            "objective": f"Complete: {title}",
            "briefing": "",
            "what_to_do": [],
            "what_to_submit": [],
            "hints": [],
            "success_criteria": [],
            "config": default_config_for(ttype),
            "xp_award": 0,
            "skill_awards": {},
            "week": node.get("week"),
        })
    return tasks, parsed.get("section_labels") or {}


def architecture_placeholder_sim(slug: str, title: str | None, task_count: int, extra: dict | None = None) -> dict:
    extra = extra or {}
    hours = str(max(1, task_count))
    return {
        "slug": slug,
        "title": title or "Untitled architecture simulation",
        "description": extra.get("description") or (
            "Scaffolded from a Mermaid architecture diagram — edit metadata before publishing."
        ),
        "company": extra.get("company") or "TBD",
        "domain": extra.get("domain") or "General",
        "category": extra.get("category"),
        "accent_color": extra.get("accent_color") or "bg-primary",
        "difficulty": extra.get("difficulty") or "Beginner",
        "estimated_hours": extra.get("estimated_hours") or hours,
        "skills": extra.get("skills") or [],
        "manager": extra.get("manager") or {"name": "Manager", "role": "Hiring Manager", "avatar": "M"},
        "onboarding": extra.get("onboarding") or {
            "company": {"name": extra.get("company") or "TBD", "industry": "", "size": "", "location": "", "about": ""},
            "intro": "",
            "learn": [],
            "offer": {
                "title": f"{title or 'Role'} — Offer",
                "role": "Intern",
                "team": "",
                "company": extra.get("company") or "TBD",
                "body": "",
            },
        },
        "onboarding_xp_award": extra.get("onboarding_xp_award") or 0,
    }

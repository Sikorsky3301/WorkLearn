from app.services.mermaid_architecture import parse_flowchart, plan_to_tasks, default_config_for


SAMPLE = """
flowchart TD
  subgraph W1["Week 1 - Intake"]
    T1["Triage the ticket"]:::structured_form
    T2["Debug the script"]:::code_sandbox
  end
  subgraph W2["Week 2 - Close"]
    T3["Talk through the outage"]:::ai_roleplay_chat
    T4["Write the postmortem"]:::text_rubric
    T5["Draw the architecture"]:::mermaid_diagram
  end
  T1 --> T2 --> T3 --> T4 --> T5
"""


def test_weeks_types_and_topo_order():
    parsed = parse_flowchart(SAMPLE)
    assert parsed["errors"] == []
    titles = [n["title"] for n in parsed["nodes"]]
    assert titles == [
        "Triage the ticket",
        "Debug the script",
        "Talk through the outage",
        "Write the postmortem",
        "Draw the architecture",
    ]
    assert [n["type"] for n in parsed["nodes"]] == [
        "structured_form", "code_sandbox", "ai_roleplay_chat", "text_rubric", "mermaid_diagram",
    ]
    assert [n["week"] for n in parsed["nodes"]] == [1, 1, 2, 2, 2]
    assert parsed["section_labels"]["1"] == "Week 1 - Intake"
    tasks, labels = plan_to_tasks(parsed)
    assert tasks[0]["task_index"] == 1
    assert tasks[1]["config"]["language"] == "python"
    assert tasks[2]["config"]["persona"]["name"] == "Contact Name"
    assert tasks[4]["config"]["grading_mode"] == "manual"
    assert labels["2"].startswith("Week 2")


def test_default_type_when_missing():
    parsed = parse_flowchart("flowchart LR\n  A[First] --> B[Second]\n")
    assert parsed["errors"] == []
    assert parsed["nodes"][0]["type"] == "structured_form"
    assert parsed["nodes"][1]["type"] == "structured_form"


def test_class_assignment():
    src = """
    flowchart TD
      A[Quiz gate]
      B[Form]
      A --> B
      class A quiz
      class B structured_form
    """
    parsed = parse_flowchart(src)
    assert parsed["errors"] == []
    assert parsed["nodes"][0]["type"] == "quiz"
    assert parsed["nodes"][1]["type"] == "structured_form"


def test_cycle_is_error():
    parsed = parse_flowchart("flowchart TD\n  A[One] --> B[Two]\n  B --> A\n")
    assert any("cycle" in e.lower() for e in parsed["errors"])
    assert parsed["nodes"] == []


def test_unknown_type_is_error():
    parsed = parse_flowchart('flowchart TD\n  A["Oops"]:::not_a_type\n')
    assert any("Unknown task type" in e for e in parsed["errors"])


def test_empty_and_bad_header():
    assert parse_flowchart("").get("errors")
    assert parse_flowchart("sequenceDiagram\n  A->>B: hi\n").get("errors")


def test_branching_warns_but_includes_all_nodes():
    src = """
    flowchart TD
      A[Start] --> B[Left]
      A --> C[Right]
      B --> D[Join]
      C --> D
    """
    parsed = parse_flowchart(src)
    assert parsed["errors"] == []
    assert parsed["warnings"]
    assert {n["title"] for n in parsed["nodes"]} == {"Start", "Left", "Right", "Join"}
    assert parsed["nodes"][0]["title"] == "Start"
    assert parsed["nodes"][-1]["title"] == "Join"


def test_default_config_mermaid():
    cfg = default_config_for("mermaid_diagram")
    assert cfg["grading_mode"] == "manual"
    assert "flowchart" in cfg["starter_code"]

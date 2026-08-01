"""
Every LLM-backed feature in one place: the multi-provider LLM client, its
Langfuse tracing, and the two features built on top of it — AI Mentor
(ai/routes/ai_mentor.py + ai/services/mentor_personas.py, mentor_tools.py)
and the generic CMS-authored simulation runtime's AI roleplay/grading
endpoints (ai/routes/sim_runtime.py), which the Sales CRM job simulation's
crm_workspace task type uses too — its old dedicated AI customer/grading
endpoints (ai/routes/crm_sim.py) were removed once every hardcoded stage
that called them was replaced by the generic engine.

Everything else that merely *touches* AI incidentally (e.g. one grader among
many in app/services/graders/ that uses an LLM-judged sub-score alongside
mostly-deterministic checks, or the Config Center's "AI Provider" settings
category, which is one tab of a generic settings store) stays where it is —
this package is for code that exists *because of* AI, not every consumer of
it.
"""

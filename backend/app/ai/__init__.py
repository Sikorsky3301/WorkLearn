"""
Every LLM-backed feature in one place: the multi-provider LLM client, its
Langfuse tracing, and the three features built on top of it — AI Mentor
(ai/routes/ai_mentor.py + ai/services/mentor_personas.py, mentor_tools.py),
the Sales CRM job simulation's AI customer/grading endpoints
(ai/routes/crm_sim.py + ai/services/crm_sim_prompts.py), and the generic
CMS-authored simulation runtime's AI roleplay/grading endpoints
(ai/routes/sim_runtime.py).

Everything else that merely *touches* AI incidentally (e.g. one grader among
many in app/services/graders/ that uses an LLM-judged sub-score alongside
mostly-deterministic checks, or the Config Center's "AI Provider" settings
category, which is one tab of a generic settings store) stays where it is —
this package is for code that exists *because of* AI, not every consumer of
it.
"""

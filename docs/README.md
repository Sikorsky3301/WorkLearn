# Docs

Supporting documentation that doesn't belong in the repo root or inside
`backend/`/`frontend/` directly.

| File | What it is |
|---|---|
| [`routes-flow.txt`](./routes-flow.txt) | ASCII diagram of the app's routes/entry points per role (Direct User, University Student, Class Mentor, Admin, SuperAdmin). |
| [`sales-simulation-proposal.md`](./sales-simulation-proposal.md) | Original design proposal for the Enterprise SaaS Sales Representative job simulation (Nimbus CRM). |
| [`nimbus-crm-test-data.txt`](./nimbus-crm-test-data.txt) | Copy/paste answer sheet for manually testing the Nimbus CRM sales simulation stage-by-stage without re-deriving consistent test data each time. |
| [`quick-start-commands.txt`](./quick-start-commands.txt) | One-off local dev commands — superseded by the root [`README.md`](../README.md)'s setup section, kept for reference. |

For architecture/scaling planning, see `backend/ARCHITECTURE.md`. For
Kubernetes deployment, see `k8s/README.md`. For the LiteLLM Proxy, see
`backend/litellm-proxy/README.md`.

# Docs

Supporting documentation that doesn't belong in the repo root or inside
`backend/`/`frontend/` directly.

| File | What it is |
|---|---|
| [`file_structure.md`](./file_structure.md) | File-by-file reference for the whole monorepo — what each file is for and how it works, backend and frontend. |
| [`flow diagram.md`](./flow%20diagram.md) | Frontend user flow (hosts, login personas, student journey, guards). Partner UI: student + teacher only. |
| [`flow_diagram_backend.md`](./flow_diagram_backend.md) | Backend request/auth/API flow by role. |
| [`TEST_LOGINS.md`](./TEST_LOGINS.md) | Seeded demo accounts, tenant hosts, passwords, known login caveats. |
| [`sales-simulation-proposal.md`](./sales-simulation-proposal.md) | Original design proposal for the Enterprise SaaS Sales Representative job simulation (Nimbus CRM). |
| [`nimbus-crm-test-data.txt`](./nimbus-crm-test-data.txt) | Copy/paste answer sheet for manually testing the Nimbus CRM sales simulation stage-by-stage. |
| [`quick-start-commands.txt`](./quick-start-commands.txt) | One-off local dev commands — superseded by the root [`README.md`](../README.md)'s setup section, kept for reference. |

For architecture/scaling planning, see `backend/ARCHITECTURE.md`. For
Kubernetes deployment, see `k8s/README.md`. For the LiteLLM Proxy, see
`backend/litellm-proxy/README.md`.

# LiteLLM Proxy

A standalone AI gateway the backend can optionally route every AI call
through, instead of calling providers directly. This is separate from (and
optional on top of) the in-process litellm **SDK** usage already in
`app/ai/services/llm.py` — that keeps working exactly as-is if you never
touch this folder. Only switch to the proxy by setting `AI_PROVIDER=litellm_proxy`
in `backend/.env` once it's actually running and reachable.

## Run it locally

From the repo root (needs the `docker-compose.yml` there, and Docker running):

```
docker compose up litellm-proxy litellm-proxy-db
```

This starts the proxy on `http://localhost:4000` plus its own dedicated
Postgres (`litellm-proxy-db`) — a separate database from the app's own, so
the proxy's virtual keys/spend logs/budgets never mix with WorkLearn's
business data.

Needs these set in your shell/`.env` before starting (the proxy's own env,
not `backend/.env` — see `docker-compose.yml`):
- `LITELLM_MASTER_KEY` — pick any long random string; this is the
  admin/root key for the proxy itself, not any provider's key.
- `LITELLM_PROXY_DATABASE_URL` — matches whatever `litellm-proxy-db`'s
  connection string is in `docker-compose.yml`.
- `ANTHROPIC_API_KEY` / `GROQ_API_KEY` / `GEMINI_API_KEY` — same values
  already in `backend/.env`, since `config.yaml` here reads them the same
  way. Any left blank just means that model in `config.yaml` won't work
  until filled in — the others are unaffected.

## Verify it's up

```
curl http://localhost:4000/health/liveliness
```

## Generate a virtual key

The backend should authenticate with a **virtual key** (scoped, revocable,
optionally budget-limited), not the master key directly:

```
curl -X POST http://localhost:4000/key/generate \
  -H "Authorization: Bearer <LITELLM_MASTER_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"models": ["claude-sonnet", "llama-groq", "gemini-flash"]}'
```

Copy the returned `key` value — that's what goes in `backend/.env`'s
`LITELLM_PROXY_API_KEY`.

## Test a real call through it

```
curl http://localhost:4000/chat/completions \
  -H "Authorization: Bearer <virtual key from above>" \
  -H "Content-Type: application/json" \
  -d '{"model": "llama-groq", "messages": [{"role": "user", "content": "say hi"}]}'
```

If that returns a real completion, the proxy itself is working correctly —
independent of whether the backend is pointed at it yet.

## Point the backend at it

In `backend/.env` (see `.env.example` for the full block):

```
AI_PROVIDER=litellm_proxy
LITELLM_PROXY_URL=http://localhost:4000
LITELLM_PROXY_API_KEY=<virtual key>
LITELLM_PROXY_MODEL=llama-groq
```

`LITELLM_PROXY_MODEL` must be one of the `model_name` values in
`config.yaml` (not a raw provider model string — the whole point is that
the backend never needs to know which real provider/model is actually
behind that name).

## Add a self-hosted/ngrok-tunneled model (optional, dev-only)

`config.yaml` doesn't commit an entry for the generic OpenAI-compatible slot
(what `backend`'s own `AI_PROVIDER=openai` means) since the model name is
whatever happens to be tunneled on your machine at the time. To use one
through the proxy, add locally (don't commit a real ngrok URL):

```yaml
  - model_name: openai-compatible
    litellm_params:
      model: openai/<the model name your self-hosted server reports>
      api_base: os.environ/OPENAI_BASE_URL
      api_key: os.environ/OPENAI_API_KEY
```

## Production (Kubernetes)

See `k8s/litellm/` and the "LiteLLM Proxy" section of `k8s/README.md` — same
pattern as the backend's own `k8s/backend/`, deployed into the same
`worklearn` namespace.

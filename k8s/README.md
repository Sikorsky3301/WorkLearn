# Running WorkLearn on Docker Desktop Kubernetes

This deploys the FastAPI backend on a single-node Kubernetes cluster (Docker
Desktop's built-in Kubernetes) and switches the code-execution sandbox from
per-submission `docker run` to per-submission Kubernetes **Jobs** in the
`worklearn-sandbox` namespace, so the cluster schedules and caps every
concurrent user's sandbox container instead of the backend host doing it
directly.

The frontend is not containerized here — keep running it locally with
`npm run dev` (Vite, port 5173). Its default `VITE_API_URL` is
`http://localhost:3001`, which the backend Service below exposes as-is.

## Prerequisites

- Docker Desktop with Kubernetes enabled: Settings → Kubernetes → Enable
  Kubernetes → Apply & Restart.
- `kubectl` pointed at the right context: `kubectl config use-context docker-desktop`
- `kubectl get nodes` should show a single `Ready` node.

## 1. Build the images

Both images must be built with Docker Desktop's own daemon (the same one
backing the cluster) since Jobs use `imagePullPolicy: Never` — nothing is
pushed to a registry.

```
docker build -t worklearn-backend:latest backend
docker build -t worklearn-sandbox-python:latest backend/sandboxes/python
```

## 2. Apply the base manifests

```
kubectl apply -f k8s/namespaces.yaml
```

## 3. Create the backend Secret

Not committed to the repo — created from your existing `backend/.env`:

```
kubectl create secret generic worklearn-backend-env -n worklearn --from-env-file=backend/.env
```

Re-run with `kubectl delete secret ... ; kubectl create secret ...` (or
`--dry-run=client -o yaml | kubectl apply -f -`) whenever `.env` changes.

## 4. Apply RBAC, storage, and sandbox policy

```
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/backend/pvc.yaml
kubectl apply -f k8s/sandbox/networkpolicy.yaml
kubectl apply -f k8s/sandbox/resourcequota.yaml
```

## 5. Deploy the backend

```
kubectl apply -f k8s/backend/deployment.yaml
kubectl apply -f k8s/backend/service.yaml
```

## 6. Verify

```
kubectl -n worklearn get pods
curl http://localhost:3001/health
kubectl -n worklearn logs deploy/worklearn-backend
```

## 7. (Optional) Deploy the LiteLLM Proxy

Only needed if you're running the backend with `AI_PROVIDER=litellm_proxy` —
see `backend/litellm-proxy/README.md` for what this is and how to test it
locally with `docker compose` first. Unlike the backend/sandbox images, this
uses a public image (`ghcr.io/berriai/litellm-database`) pulled from ghcr.io,
not built locally.

The proxy needs its own Postgres — **not** a table in the app's own Supabase
database (keeps the proxy's virtual keys/spend logs/budgets fully separate
from WorkLearn's business data, and matches litellm's own reference setup).
Provision a small dedicated Postgres database (a second Supabase project, or
a second database in the same project) before continuing.

```
kubectl apply -f k8s/litellm/configmap.yaml
```

Create its Secret the same way as the backend's — not committed, includes
the master key you choose plus the provider API keys and the dedicated
Postgres URL from above:

```
kubectl create secret generic worklearn-litellm-env -n worklearn \
  --from-literal=LITELLM_MASTER_KEY=<pick-a-long-random-string> \
  --from-literal=LITELLM_PROXY_DATABASE_URL=<your-dedicated-postgres-url> \
  --from-literal=ANTHROPIC_API_KEY=<...> \
  --from-literal=GROQ_API_KEY=<...> \
  --from-literal=GEMINI_API_KEY=<...> \
  --from-literal=OPENAI_BASE_URL=<...> \
  --from-literal=OPENAI_API_KEY=<...>
```

```
kubectl apply -f k8s/litellm/deployment.yaml
kubectl apply -f k8s/litellm/service.yaml
```

Verify:

```
kubectl -n worklearn get pods -l app=worklearn-litellm
kubectl -n worklearn port-forward svc/worklearn-litellm 4000:4000
curl http://localhost:4000/health/liveliness
```

Then generate a virtual key and set `LITELLM_PROXY_URL`/`LITELLM_PROXY_API_KEY`/
`LITELLM_PROXY_MODEL` in `worklearn-backend-env` (re-create it the same way
as step 3), and set `AI_PROVIDER=litellm_proxy` — same `.env` vars either
way, whether the backend is running locally or in-cluster.

Then use the app as usual (Vite dev server, `npm run dev`) — submitting a
sandboxed task now creates a Job in `worklearn-sandbox`. Watch it live with:

```
kubectl -n worklearn-sandbox get jobs,pods -w
```

## Known local-only limitations

- **NetworkPolicy is not enforced by Docker Desktop's CNI.** The shipped
  `sandbox-default-deny` policy (`k8s/sandbox/networkpolicy.yaml`) is inert
  here — it becomes effective on any cluster running a policy-enforcing CNI
  (Calico, Cilium, etc). Locally, sandbox pod isolation instead relies on
  `automountServiceAccountToken: false` (can't reach the K8s API) and
  `dnsPolicy: Default` (can't resolve cluster service names). There is no
  equivalent of `docker run --network=none` in vanilla Kubernetes.
- **No per-pod pids limit.** Docker's `--pids-limit=64` has no direct K8s
  field; a fork bomb is bounded only by the pod's cpu/memory limits and the
  execution deadline, not by process count.
- **hostPath storage is node-local and ephemeral.** `/worklearn/sandbox-work`
  and the `worklearn-data` PVC (default `hostpath` provisioner) live inside
  the Docker Desktop VM and can be wiped by a VM reset. Fine for local dev;
  replace with a real RWX volume / object storage on a production cluster.

## Production notes

Everything above is deliberately scoped to Docker Desktop's single-node
local cluster, not a real production deployment. Both Deployments now carry
resource `requests`/`limits` (see `k8s/backend/deployment.yaml` and
`k8s/litellm/deployment.yaml`) — untested starting points, not load-tested
numbers — but the rest of this list is genuinely not done, not just
under-tuned. Before pointing this at real users, on a real (multi-node,
managed) cluster:

- **Push images to a real registry.** `imagePullPolicy: Never` only works
  because the image is built straight into Docker Desktop's own daemon —
  there's no `docker push` step anywhere, and no CI job builds/publishes an
  image (the GitHub Actions workflow at `.github/workflows/ci.yml` runs
  tests only). A real cluster's nodes can't pull an image that only exists
  on one developer's laptop.
- **No autoscaling.** No `HorizontalPodAutoscaler` on either Deployment —
  `worklearn-backend` is hard-pinned to `replicas: 1` anyway (in-process
  APScheduler, see the comment in its `deployment.yaml`) and would need that
  scheduler moved to a separate worker/cron mechanism before it could scale
  past one pod at all. `worklearn-litellm` has no such constraint and is the
  more realistic autoscaling candidate.
- **No Ingress/TLS.** Both Services are exposed via `kubectl port-forward`
  or a bare `LoadBalancer`/`ClusterIP` — nothing terminates TLS or does
  host/path routing. A real deployment needs an Ingress controller (or a
  cloud load balancer) with a real certificate, not `http://localhost`.
- **No PodDisruptionBudget.** Nothing stops a node drain or rolling
  upgrade from taking `worklearn-litellm`'s pods down simultaneously despite
  `replicas: 2`.
- **NetworkPolicy is not enforced.** Already called out under "Known
  local-only limitations" above — `sandbox-default-deny` is inert on Docker
  Desktop's CNI and only becomes real isolation on a policy-enforcing CNI
  (Calico, Cilium, etc).
- **hostPath storage is node-local.** Also already called out above — a
  real cluster needs a real RWX volume or object storage, not the default
  `hostpath` provisioner backing `/worklearn/sandbox-work` and the
  `worklearn-data` PVC.
- **Single-node.** There is currently exactly one place this whole stack
  can run. No node affinity/anti-affinity, no pod topology spread — nothing
  to reason about because nothing is multi-node yet.
- **Secrets are created imperatively, not managed.** `kubectl create secret
  --from-env-file` (steps 3 and 7 above) is fine for one developer's local
  cluster; a real deployment wants these in a secrets manager (Vault, cloud
  provider KMS, Sealed Secrets, etc.) with rotation, not a plaintext `.env`
  file someone runs a command against by hand.

## Local (non-Kubernetes) dev is unaffected

`SANDBOX_RUNNER` defaults to `docker`, so running the backend directly on the
host (`uvicorn app.main:app --port 3001`) with a local Docker daemon still
uses the original `docker run`-based sandbox — no cluster required.

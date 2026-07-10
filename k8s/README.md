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
docker build -t worklearn-backend:latest backend-py
docker build -t worklearn-sandbox-python:latest backend-py/sandboxes/python
```

## 2. Apply the base manifests

```
kubectl apply -f k8s/namespaces.yaml
```

## 3. Create the backend Secret

Not committed to the repo — created from your existing `backend-py/.env`:

```
kubectl create secret generic worklearn-backend-env -n worklearn --from-env-file=backend-py/.env
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

## Local (non-Kubernetes) dev is unaffected

`SANDBOX_RUNNER` defaults to `docker`, so running the backend directly on the
host (`uvicorn app.main:app --port 3001`) with a local Docker daemon still
uses the original `docker run`-based sandbox — no cluster required.

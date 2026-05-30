# Kubernetes

Apply the backend stack with:

```bash
kubectl apply -k infra/k8s/base
```

The manifests currently target the backend services. Web microfrontends are deployed to Vercel.

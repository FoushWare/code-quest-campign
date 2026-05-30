output "microfrontends" {
  description = "Microfrontend deployment targets"
  value       = local.microfrontends
}

output "microservices" {
  description = "Container image targets for Kubernetes"
  value       = local.microservices
}

output "cluster_name" {
  description = "Kubernetes cluster name"
  value       = var.cluster_name
}

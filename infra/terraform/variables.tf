variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "dev"
}

variable "vercel_token" {
  description = "Vercel API token used in CI/CD"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cluster_name" {
  description = "Target Kubernetes cluster name"
  type        = string
  default     = "code-quest"
}

variable "container_registry" {
  description = "OCI registry for service images"
  type        = string
  default     = "ghcr.io/code-quest-campaign"
}

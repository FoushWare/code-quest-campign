locals {
  microfrontends = {
    website = {
      root        = "apps/web/website"
      buildTarget = "web-website"
      provider    = "vercel"
    }
    admin = {
      root        = "apps/web/admin"
      buildTarget = "web-admin"
      provider    = "vercel"
    }
  }

  microservices = {
    auth = {
      image = "${var.container_registry}/auth:latest"
      port  = 8081
    }
    content = {
      image = "${var.container_registry}/content:latest"
      port  = 8082
    }
    gamification = {
      image = "${var.container_registry}/gamification:latest"
      port  = 8083
    }
    leaderboard = {
      image = "${var.container_registry}/leaderboard:latest"
      port  = 8084
    }
    spaced_repetition = {
      image = "${var.container_registry}/spaced-repetition:latest"
      port  = 8085
    }
  }
}

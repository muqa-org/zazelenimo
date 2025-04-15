# Docker Container Management Best Practices

Managing multiple Docker containers effectively requires consistency and clear conventions. Here are some best practices for container properties to improve manageability, especially when dealing with different applications:

## 1. Container Naming (`--name`)

*   **Practice:** Use descriptive and consistent names. Avoid letting Docker assign random names.
*   **Why:** Makes it easy to identify, start, stop, inspect, and manage specific containers (e.g., `docker stop myapp-db-prod`).
*   **Example Pattern:** `<project/app_name>-<component>-<environment>`
    *   `zazelenimo-db-dev`
    *   `analytics-api-staging`
    *   `website-web-prod`

## 2. Image Tagging (`image:tag`)

*   **Practice:** Avoid using the `:latest` tag in production or even development. Use specific, immutable tags:
    *   Semantic versions: `myapp:1.2.1`
    *   Git commit SHAs: `myapp:a1b2c3d`
    *   Build dates: `myapp:20240726`
*   **Why:** Ensures reproducibility and predictable deployments/rollbacks. `:latest` can change unexpectedly.
*   **Tip:** Tag related images (e.g., frontend and backend for the same release) consistently.

## 3. Port Mapping (`-p host:container`)

*   **Practice:**
    *   Only expose ports needing access from *outside* the Docker host/network.
    *   Be consistent with internal container ports (e.g., always use `80` or `8080` for web servers).
    *   Document your host port mappings clearly.
*   **Why:** Reduces security risks and prevents host port conflicts. If running multiple instances, map to different host ports (e.g., `-p 8081:80`, `-p 8082:80`).
*   **Tip:** Use `docker-compose.yml` to define and manage port mappings centrally.

## 4. Environment Variables (`-e KEY=VALUE`, `--env-file`)

*   **Practice:**
    *   Externalize **all** configuration (database URLs, API keys, settings) using environment variables.
    *   Use clear, potentially prefixed names (e.g., `APP_DB_HOST`, `SERVICE_X_API_KEY`).
    *   Use `.env` files (`--env-file`) for local development (add `.env` to `.gitignore`).
*   **Why:** Keeps configuration separate from the image, making images reusable across environments (dev, staging, prod) and avoids baking secrets into images.
*   **Secrets:** For sensitive data in production, use Docker secrets or external secret management systems (Vault, AWS Secrets Manager, etc.) instead of plain environment variables or env files.

## 5. Volumes (`-v name:/path`, `-v /host/path:/container/path`)

*   **Practice:**
    *   Use **named volumes** (`-v myapp-data:/var/lib/mysql`) for persistent data (databases, uploads).
    *   Use **bind mounts** (`-v ./src:/app/src`) primarily for development (code syncing) or accessing specific host configurations/logs.
*   **Why:** Named volumes are managed by Docker, easier to back up, migrate, and less prone to host path issues/permissions than bind mounts. Explicitly define what data needs to persist.

## 6. Networking (`--network`)

*   **Practice:**
    *   Create custom bridge networks (`docker network create myapp-network`) for containers belonging to the same application stack.
    *   Attach related containers (web, API, database) to this network.
*   **Why:** Provides better isolation than the default bridge network. Allows containers on the same network to communicate using their container names as hostnames (e.g., the web container can reach `myapp-db:5432`).

## 7. Labels (`--label`)

*   **Practice:** Add metadata labels to containers and images. Use reverse-DNS notation to avoid conflicts.
    *   `--label com.mycompany.project=myapp`
    *   `--label com.mycompany.environment=production`
    *   `--label maintainer="Your Name <email@example.com>"`
*   **Why:** Allows filtering and organizing resources (`docker ps --filter "label=com.mycompany.environment=production"`). Useful for automation, monitoring, and cost allocation tools.

## 8. Resource Limits (`--memory`, `--cpus`)

*   **Practice:** Set reasonable memory (`--memory="512m"`) and CPU (`--cpus="0.5"`) limits, especially in shared or production environments.
*   **Why:** Prevents a single runaway container from consuming all host resources and impacting other applications. Monitor usage (`docker stats`) to tune limits appropriately.

## 9. Logging (`--log-driver`, `--log-opt`)

*   **Practice:**
    *   Configure a suitable logging driver (e.g., `json-file` with size/rotation limits: `--log-opt max-size=10m --log-opt max-file=3`, `syslog`, `journald`, `fluentd`).
    *   Ensure applications within containers log to `stdout`/`stderr`.
*   **Why:** Makes logs easier to collect, aggregate, and analyze centrally, especially with many containers. Prevents log files from filling up disk space.

## 10. Health Checks (`HEALTHCHECK` in Dockerfile)

*   **Practice:** Define a `HEALTHCHECK` instruction in your Dockerfiles for services that run continuously (web servers, APIs, databases).
    *   `HEALTHCHECK --interval=5m --timeout=3s CMD curl -f http://localhost:80/health || exit 1`
*   **Why:** Allows Docker (and orchestrators like Swarm/Kubernetes) to monitor the *actual* health of the application inside the container, not just whether the container process is running. Enables automatic recovery actions.

## Key Tool: Docker Compose

For managing multi-container applications, `docker-compose` is invaluable. Use a `docker-compose.yml` file to define and run your entire application stack. This file is the ideal place to implement and document many of these best practices (naming, networks, volumes, ports, environment variables, labels, resource limits, health checks). 
.PHONY: help setup staging staging-build staging-up staging-down staging-logs \
        db-migrate db-seed db-generate build test lint typecheck clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Setup ───────────────────────────────────────────────────────────────────
setup: ## Install all dependencies
	pnpm install

build: ## Build all packages
	pnpm build

# ── Staging Docker ──────────────────────────────────────────────────────────
staging-build: ## Build staging Docker images
	docker compose -f docker-compose.staging.yml build

staging-up: ## Start staging environment
	docker compose -f docker-compose.staging.yml up -d

staging-down: ## Stop staging environment
	docker compose -f docker-compose.staging.yml down

staging-logs: ## Tail staging logs
	docker compose -f docker-compose.staging.yml logs -f

staging-ps: ## List staging containers
	docker compose -f docker-compose.staging.yml ps

staging-restart: staging-down staging-up ## Restart staging environment

staging-clean: ## Stop and remove volumes
	docker compose -f docker-compose.staging.yml down -v

# ── Database ────────────────────────────────────────────────────────────────
db-generate: ## Generate Prisma client
	pnpm db:generate

db-migrate: ## Run database migrations
	pnpm db:migrate

db-deploy: ## Deploy migrations (staging/production)
	pnpm db:deploy

db-seed: ## Seed database with default data
	pnpm db:seed

db-studio: ## Open Prisma Studio
	pnpm db:studio

db-reset: ## Reset database (drops all data)
	pnpm db:reset

# ── Validation ──────────────────────────────────────────────────────────────
test: ## Run all tests
	pnpm test

test-unit: ## Run unit tests
	pnpm test:unit

test-integration: ## Run integration tests
	pnpm test:integration

lint: ## Run linter
	pnpm lint

typecheck: ## Run TypeScript type checking
	pnpm typecheck

# ── Development ─────────────────────────────────────────────────────────────
dev: ## Start development servers
	pnpm dev

clean: ## Clean build artifacts
	pnpm clean

format: ## Format code
	pnpm format

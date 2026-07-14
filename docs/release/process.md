# Release Process

## Semantic Versioning

The project follows [Semantic Versioning](https://semver.org/) (SemVer):

```
MAJOR.MINOR.PATCH

MAJOR — Breaking API changes or major feature removals
MINOR — New features, backward-compatible
PATCH — Bug fixes, security patches, backward-compatible
```

### Pre-release Versions

```
MAJOR.MINOR.PATCH-rc.1    Release Candidate 1
MAJOR.MINOR.PATCH-beta.1  Beta 1
MAJOR.MINOR.PATCH-alpha.1 Alpha 1
```

### Examples

| Version | Description |
|---|---|
| `0.1.0` | Initial development release |
| `0.2.0` | New feature added (backward-compatible) |
| `0.2.1` | Bug fix in `0.2.0` |
| `0.2.2-rc.1` | Release candidate for next patch |
| `1.0.0` | First stable public release |
| `2.0.0` | Breaking API changes |

## Release Branches

```
main                    ← Production releases
├── develop             ← Integration branch (future)
├── release/v0.2.0      ← Release preparation (future)
└── hotfix/v0.2.1       ← Emergency fixes
```

### Branch Strategy

| Branch | Purpose | Merges Into |
|---|---|---|
| `main` | Production-ready code | — |
| `release/v*` | Release preparation | `main` |
| `hotfix/v*` | Emergency production fixes | `main` + `develop` |

## Version Bump Procedure

### 1. Determine Version Bump

```bash
# Check conventional commits (if using commitlint)
git log --oneline HEAD~10..HEAD

# Or manually review changes
git log --oneline -20
```

**Bump rules:**
- `feat:` → MINOR bump
- `fix:` → PATCH bump
- `feat!:` or `BREAKING CHANGE:` → MAJOR bump
- `docs:`, `chore:`, `style:`, `refactor:` → no version bump

### 2. Update Version

```bash
# Update root package.json version
npm version <major|minor|patch> --no-git-tag-version

# Or manually edit package.json
# "version": "0.2.0"
```

### 3. Update Dependencies

```bash
# If workspace packages have version dependencies
# Update all @conversation-platform/* references
grep -r '"version"' packages/*/package.json apps/*/package.json

# Ensure workspace protocol is used for internal deps
grep -r 'workspace:\*' packages/*/package.json apps/*/package.json
```

### 4. Update Documentation

- Update `CHANGELOG.md` with new version section
- Update `RELEASE_NOTES.md` if creating a release
- Update any version references in documentation

## Changelog Generation

### Keep a Changelog Format

```markdown
## [0.2.0] - 2024-02-15

### Added
- Feature X with Y capability
- Support for Z integration

### Changed
- Improved performance of W by 40%
- Updated authentication flow

### Deprecated
- Legacy API endpoint `/api/v1/old-endpoint` (use `/api/v1/new-endpoint`)

### Removed
- Removed deprecated V1 widget API

### Fixed
- Fixed memory leak in WebSocket handler
- Fixed race condition in campaign executor

### Security
- Updated bcryptjs to patch CVE-2024-XXXX
- Added rate limiting to webhook endpoints
```

### Automated Changelog (Future)

```bash
# Using conventional-changelog
npx conventional-changelog -p angular -i CHANGELOG.md -s

# Or using release-it
npx release-it --changelog
```

## Tagging Conventions

### Tags

```
v0.1.0          Stable release
v0.1.0-rc.1     Release candidate
v0.1.0-beta.1   Beta release
```

### Creating Tags

```bash
# Annotated tag (preferred)
git tag -a v0.2.0 -m "Release v0.2.0: Add campaign management"

# Push tags
git push origin v0.2.0
git push origin --tags
```

### Tag Naming Convention

- Always prefix with `v`
- Use semantic version format
- Pre-release suffixes use `-rc.N`, `-beta.N`, `-alpha.N`

## Build and Publish

### Build Pipeline

```bash
# 1. Run tests
pnpm test
pnpm lint
pnpm typecheck

# 2. Build all packages
pnpm build

# 3. Build Docker image
docker build -f apps/api/Dockerfile -t cp-api:v0.2.0 .
docker tag cp-api:v0.2.0 your-registry.com/cp-api:v0.2.0

# 4. Push to registry
docker push your-registry.com/cp-api:v0.2.0
docker push your-registry.com/cp-api:latest
```

### Helm Chart Version

```yaml
# Chart.yaml
apiVersion: v2
name: cp-api
version: 0.2.0        # Chart version
appVersion: "0.2.0"   # Application version
```

### Publish to Container Registry

```bash
# Build with version tag
docker build \
  --build-arg APP_VERSION=0.2.0 \
  -f apps/api/Dockerfile \
  -t your-registry.com/conversation-platform/api:0.2.0 \
  .

# Push
docker push your-registry.com/conversation-platform/api:0.2.0
```

## Release Candidate Flow

### 1. Create Release Branch

```bash
git checkout main
git checkout -b release/v0.2.0
```

### 2. Stabilize

```bash
# Only bug fixes and documentation changes
git commit -m "fix: resolve race condition in campaign executor"
git commit -m "docs: update deployment guide"
```

### 3. Tag RC

```bash
git tag -a v0.2.0-rc.1 -m "Release candidate v0.2.0-rc.1"
git push origin v0.2.0-rc.1
```

### 4. Test RC

```bash
# Deploy RC to staging environment
helm upgrade --install cp-api ./infrastructure/kubernetes/helm/cp-api \
  --set image.tag=0.2.0-rc.1 \
  --namespace cp-staging
```

### 5. Promote to Release

```bash
# Merge to main
git checkout main
git merge --no-ff release/v0.2.0

# Tag final release
git tag -a v0.2.0 -m "Release v0.2.0"

# Push
git push origin main --tags

# Delete release branch
git branch -d release/v0.2.0
```

## Hotfix Process

### 1. Create Hotfix Branch

```bash
git checkout main
git checkout -b hotfix/v0.2.1
```

### 2. Apply Fix

```bash
# Fix the issue
git commit -m "fix: patch critical auth vulnerability"
```

### 3. Test and Tag

```bash
pnpm test
pnpm lint

git tag -a v0.2.1 -m "Hotfix v0.2.1: Patch auth vulnerability"
```

### 4. Merge to Main

```bash
git checkout main
git merge --no-ff hotfix/v0.2.1
git push origin main --tags
```

### 5. Deploy

```bash
# Build and deploy immediately
docker build -f apps/api/Dockerfile -t cp-api:v0.2.1 .
docker push your-registry.com/cp-api:v0.2.1

# Update deployment
helm upgrade cp-api ./infrastructure/kubernetes/helm/cp-api \
  --set image.tag=0.2.1 \
  --namespace cp-production
```

## Rollback Procedure

### Kubernetes Rollback

```bash
# Check release history
helm history cp-api -n conversation-platform

# Rollback to previous version
helm rollback cp-api <REVISION> -n conversation-platform

# Rollback to specific version
helm rollback cp-api <REVISION> -n conversation-platform

# Verify rollback
kubectl rollout status deployment/cp-api -n conversation-platform
```

### Docker Compose Rollback

```bash
# Edit docker-compose.prod.yml to use previous image tag
# Update: image: your-registry.com/cp-api:v0.1.0

# Redeploy
docker compose -f docker-compose.prod.yml up -d --no-deps api

# Verify
curl http://localhost:3000/api/v1/health
```

### Database Rollback

```bash
# If database migration needs rollback
# 1. Stop API
docker compose stop api

# 2. Rollback migration (manual SQL)
docker compose exec postgres psql -U cp_user -d conversation_platform
> -- Execute rollback SQL manually

# 3. Deploy previous API version
docker compose -f docker-compose.prod.yml up -d api
```

### Rollback Checklist

1. [ ] Notify team of rollback
2. [ ] Stop traffic to affected version (if possible)
3. [ ] Execute rollback (Kubernetes or Docker Compose)
4. [ ] Verify service health
5. [ ] Verify database state
6. [ ] Monitor error rates post-rollback
7. [ ] Create incident report if needed
8. [ ] Fix issue in main branch
9. [ ] Re-deploy with fix when ready

## Release Checklist

### Pre-Release

- [ ] All tests passing (`pnpm test`)
- [ ] Lint clean (`pnpm lint`)
- [ ] Type check clean (`pnpm typecheck`)
- [ ] Build successful (`pnpm build`)
- [ ] Docker image builds successfully
- [ ] Database migrations backward-compatible
- [ ] Environment variables documented
- [ ] CHANGELOG.md updated
- [ ] Version bumped in `package.json`

### Release

- [ ] Create release branch (if applicable)
- [ ] Tag release with version
- [ ] Build and push Docker image
- [ ] Update Helm chart version
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Verify health endpoints
- [ ] Monitor error rates for 30 minutes

### Post-Release

- [ ] Verify all services healthy
- [ ] Check error logs for new issues
- [ ] Announce release to team
- [ ] Update documentation site
- [ ] Close release milestones
- [ ] Delete release branch (if applicable)
- [ ] Archive release notes

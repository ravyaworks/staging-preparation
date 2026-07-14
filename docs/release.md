# Release Process

## Version Scheme

This project follows [Semantic Versioning 2.0](https://semver.org/):
- **MAJOR**: Breaking API changes or database migrations
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes and performance improvements

Pre-release suffixes: `-alpha.N`, `-beta.N`, `-rc.N`

## Release Checklist

### Preparation (1 week before release)
- [ ] All features for the milestone are merged to `develop`
- [ ] No P0/P1 bugs open against the milestone
- [ ] Test coverage >= 80%
- [ ] E2E tests pass on CI
- [ ] Security scan passes (no high/critical vulnerabilities)
- [ ] Performance benchmarks meet SLOs
- [ ] Documentation updated (API reference, changelog, migration guides)
- [ ] Database migration scripts reviewed and tested

### Release Day
1. Create a release branch from `develop`:
   ```bash
   git checkout develop && git pull
   git checkout -b release/v1.x.x
   ```

2. Update version in package.json files:
   ```bash
   pnpm version patch|minor|major --no-git-tag-version
   ```

3. Update CHANGELOG.md with release notes

4. Create pull request to `main`

5. After PR approval and merge, tag the release:
   ```bash
   git checkout main && git pull
   git tag v1.x.x
   git push origin v1.x.x
   ```

6. CI/CD pipeline automatically:
   - Builds Docker images
   - Publishes to GHCR
   - Creates GitHub Release with release notes

### Post-Release
- [ ] Merge `main` back to `develop`
- [ ] Deploy to production
- [ ] Monitor metrics for 1 hour post-deployment
- [ ] Announce release on team communication channel

## Hotfix Process

For critical production issues:
1. Branch from `main`: `git checkout -b hotfix/v1.x.x`
2. Fix the issue and update patch version
3. Create PR to `main` and `develop`
4. Tag and release normally

## Rollback

If a release causes issues:
```bash
# Rollback Docker image
docker compose -f docker-compose.prod.yml up -d api:previous-tag

# Rollback database migration (if needed)
pnpm prisma:migrate:down

# Revert git tag
git push --delete origin v1.x.x
git tag -d v1.x.x
```

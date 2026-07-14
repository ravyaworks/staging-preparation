#!/bin/bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_hr()    { echo "========================================"; }

EXIT_CODE=0

echo ""
log_hr
log_info "Security Audit Script"
log_info "Started: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
log_hr
echo ""

check_command() {
  if ! command -v "$1" &>/dev/null; then
    log_warn "Command '$1' not found. Skipping related checks."
    return 1
  fi
  return 0
}

# ---- Dependency Auditing ----
if check_command pnpm; then
  log_info "Running pnpm audit..."
  if pnpm audit --audit-level=high; then
    log_info "pnpm audit: No high/critical vulnerabilities found."
  else
    log_warn "pnpm audit: Vulnerabilities found (see above)."
    EXIT_CODE=1
  fi
fi

if [ -f "package-lock.json" ] && check_command npm; then
  log_info "Running npm audit..."
  if npm audit --audit-level=high; then
    log_info "npm audit: No high/critical vulnerabilities found."
  else
    log_warn "npm audit: Vulnerabilities found (see above)."
  fi
fi

# ---- Secrets in Git ----
if check_command git; then
  log_info "Checking for accidentally committed secrets..."
  if git rev-parse --git-dir > /dev/null 2>&1; then
    SECRET_PATTERNS=(
      '-----BEGIN.*PRIVATE KEY-----'
      'ghp_[a-zA-Z0-9]{36}'
      'gho_[a-zA-Z0-9]{36}'
      'ghu_[a-zA-Z0-9]{36}'
      'ghs_[a-zA-Z0-9]{36}'
      'ghr_[a-zA-Z0-9]{36}'
      'sk_live_[0-9a-zA-Z]+'
      'pk_live_[0-9a-zA-Z]+'
      'xox[baprs]-[0-9a-zA-Z]+'
      'AKIA[0-9A-Z]{16}'
      'eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+'
      'mongodb\+srv://[a-zA-Z0-9]+:'
      'postgresql://[a-zA-Z0-9]+:'
      'sk-[a-zA-Z0-9]{20,}'
      'sk-ant-[a-zA-Z0-9]{20,}'
      'AIza[0-9A-Za-z_-]{35}'
      'xai-[a-zA-Z0-9]{20,}'
    )

    for pattern in "${SECRET_PATTERNS[@]}"; do
      results=$(git grep -n "$pattern" -- ':!pnpm-lock.yaml' ':!*.lock' ':!package-lock.json' 2>/dev/null || true)
      if [ -n "$results" ]; then
        log_error "Potential secret found matching pattern: $pattern"
        echo "$results"
        EXIT_CODE=1
      fi
    done
    log_info "Secret pattern scan complete."
  else
    log_warn "Not a git repository, skipping git checks."
  fi
fi

# ---- File Permissions ----
log_info "Checking sensitive file permissions..."
for file in .env .env.local .env.development; do
  if [ -f "$file" ]; then
    perms=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%OLp" "$file" 2>/dev/null)
    if [ "$perms" != "600" ] && [ "$perms" != "400" ]; then
      log_warn "File $file has permissions $perms (recommended: 600)"
    else
      log_info "File $file permissions are secure: $perms"
    fi
  fi
done

# ---- Docker Best Practices ----
if [ -f "docker-compose.prod.yml" ]; then
  log_info "Checking docker-compose.prod.yml for security issues..."
  if grep -q "privileged: true" docker-compose.prod.yml 2>/dev/null; then
    log_warn "docker-compose.prod.yml: Privileged mode detected (security risk)"
    EXIT_CODE=1
  fi
  if grep -q "image:.*latest" docker-compose.prod.yml 2>/dev/null; then
    log_warn "docker-compose.prod.yml: 'latest' tag usage detected (use specific versions)"
  fi
  if ! grep -q "healthcheck" docker-compose.prod.yml 2>/dev/null; then
    log_warn "docker-compose.prod.yml: Some services may be missing healthchecks"
  fi
fi

# ---- Outdated Dependencies ----
if check_command pnpm; then
  log_info "Checking for outdated dependencies..."
  outdated=$(pnpm outdated --depth=0 2>/dev/null || true)
  if [ -n "$outdated" ]; then
    log_warn "Outdated dependencies found:"
    echo "$outdated" | head -20
  fi
fi

# ---- Summary ----
echo ""
log_hr
if [ $EXIT_CODE -eq 0 ]; then
  log_info "Security audit completed. No issues found."
else
  log_error "Security audit completed. Issues found (see above)."
fi
log_info "Finished: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
log_hr
exit $EXIT_CODE

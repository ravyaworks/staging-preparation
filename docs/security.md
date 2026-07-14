# Security Guide

## Overview

Security is implemented at multiple layers: network, application, data, and operational. This document describes the security measures in place and best practices for maintaining them.

## Authentication & Authorization

### JWT-based Authentication
- Access tokens: 15-minute expiry, signed with HS256
- Refresh tokens: 7-day expiry, stored securely
- Tokens are signed using a strong secret (`openssl rand -base64 32`)
- Invalidated tokens are added to a Redis blocklist

### Role-Based Access Control (RBAC)
| Role | Permissions |
|------|-------------|
| `super_admin` | Full system access, multi-tenant |
| `admin` | Tenant-level administration |
| `agent` | Conversation management, no settings |
| `viewer` | Read-only access |

### API Key Authentication
- Used for webhook and external integration access
- Keys are hashed with bcrypt before storage
- Rate-limited per key
- Revocable without affecting user accounts

## Data Protection

### Encryption at Rest
- Database: AES-256 encryption (PostgreSQL TDE or disk-level)
- Sensitive fields (PII, API keys): Application-level encryption using `@conversation-platform/encryption`
- Encryption key: 32-byte key stored in `ENCRYPTION_KEY` env var (never in code)

### Encryption in Transit
- TLS 1.3 for all external communication (enforced by Traefik)
- Let's Encrypt for automatic certificate management
- Internal Docker network communication uses Docker's overlay network encryption

### Secrets Management
- All secrets stored as environment variables
- `.env` files are gitignored (never committed)
- Production secrets injected via Docker secrets or vault
- Secrets rotated quarterly

## API Security

### Rate Limiting
- 100 requests per 15-minute window per IP (configurable)
- Stricter limits for auth endpoints (10 requests/minute)
- Webhook endpoints: 500 requests/minute per tenant
- Implemented via middleware using Redis for distributed rate tracking

### Request Validation
- Input sanitization using Zod schemas
- SQL injection prevention via Prisma (parameterized queries)
- XSS protection via output encoding
- CSRF protection with double-submit cookie pattern
- Content-Type validation on all endpoints

### Security Headers
All API responses include:
- `Strict-Transport-Security: max-age=63072000`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Content-Security-Policy: default-src 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Infrastructure Security

### Docker Security
- Non-root user in containers (`appuser:1001`)
- No privileged containers
- Read-only root filesystem where possible
- Resource limits set per container
- Regular image scanning with Trivy

### Database Security
- PostgreSQL not exposed externally
- Database user has minimal required privileges
- Connection pooling with PgBouncer
- Automated daily backups with 30-day retention
- Point-in-time recovery enabled

### Network Security
- All services on internal Docker network
- Only Traefik exposes ports 80/443
- Redis password-protected
- Database access restricted to application containers

## Security Checklist

### Pre-Deployment
- [ ] Run `scripts/security/audit.sh` and fix all issues
- [ ] Run `pnpm audit` and resolve high/critical vulnerabilities
- [ ] Verify no secrets in git history (`git log --all -p | grep -i secret`)
- [ ] Check Docker image for CVEs (`trivy image conversation-platform-api:latest`)
- [ ] Verify TLS certificates are valid
- [ ] Test rate limiting on API endpoints

### Weekly
- [ ] Review security scan results (GitHub Security tab)
- [ ] Check dependency vulnerabilities
- [ ] Review access logs for suspicious activity
- [ ] Verify backup integrity

### Monthly
- [ ] Rotate API keys and secrets
- [ ] Review IAM permissions
- [ ] Penetration test critical endpoints
- [ ] Update SSL/TLS certificates if needed
- [ ] Review and update incident response runbooks

# Multi-Region Deployment Configuration

Each region should have its own PostgreSQL and Redis instances.
DNS-based global routing (e.g., AWS Route53, Cloudflare) directs traffic to the nearest region.

## Region Configuration

Each region gets a unique ID and deploys the full stack:

| Region | ID       | API Hostname                    | DB Hostname                  |
|--------|----------|---------------------------------|------------------------------|
| US-E   | us-east  | api-us-east.conversation-platform.com | postgres-us-east.internal |
| EU-W   | eu-west  | api-eu-west.conversation-platform.com | postgres-eu-west.internal |
| AP-SE  | ap-southeast | api-ap-southeast.conversation-platform.com | postgres-ap-southeast.internal |

## Environment Variables per Region

```
REGION=us-east
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## Helm Deployment

```bash
# Deploy to US-East
helm upgrade --install cp-api ./infrastructure/kubernetes/helm/cp-api \
  --namespace cp-us-east \
  --set env.REGION=us-east \
  --set postgresql.host=postgres-us-east.internal \
  --set redis.host=redis-us-east.internal \
  -f ./infrastructure/kubernetes/helm/cp-api/values.yaml

# Deploy to EU-West
helm upgrade --install cp-api ./infrastructure/kubernetes/helm/cp-api \
  --namespace cp-eu-west \
  --set env.REGION=eu-west \
  --set postgresql.host=postgres-eu-west.internal \
  --set redis.host=redis-eu-west.internal \
  -f ./infrastructure/kubernetes/helm/cp-api/values.yaml
```

## Cross-Region Considerations

- **WebSocket connections** are region-local (no cross-region passthrough)
- **Webhook delivery** targets the origin region's API
- **Widget embed** serves from the nearest region via DNS
- **Data isolation** — each region has its own database (no global replication yet)
- **API keys** are region-scoped (tenant + region)

// Conversation Platform Load Tests
// Run with: node scripts/benchmark/load-test.mjs
// Prerequisites: target server must be running

import http from 'http';

const TARGET = process.env.LOAD_TEST_TARGET || 'http://localhost:3000';
const CONCURRENCY = parseInt(process.env.LOAD_TEST_CONCURRENCY || '20', 10);
const DURATION = parseInt(process.env.LOAD_TEST_DURATION || '10', 10); // seconds
const RAMP_UP = parseInt(process.env.LOAD_TEST_RAMP_UP || '2', 10); // seconds

const ENDPOINTS = [
  { path: '/api/v1/health', method: 'GET', weight: 30 },
  { path: '/api/v1/channels', method: 'GET', weight: 15 },
  { path: '/api/v1/channels/implementations', method: 'GET', weight: 10 },
  { path: '/api/v1/webhooks', method: 'GET', weight: 10 },
  { path: '/api/v1/integrations', method: 'GET', weight: 10 },
  { path: '/api/v1/health/metrics', method: 'GET', weight: 15 },
  { path: '/api/v1/auth/login', method: 'POST', weight: 10 },
];

const totalWeight = ENDPOINTS.reduce((s, e) => s + e.weight, 0);

function pickEndpoint() {
  let r = Math.random() * totalWeight;
  for (const ep of ENDPOINTS) {
    r -= ep.weight;
    if (r <= 0) return ep;
  }
  return ENDPOINTS[0];
}

async function makeRequest(endpoint) {
  const url = new URL(endpoint.path, TARGET);
  return new Promise((resolve) => {
    const start = Date.now();
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-api-key',
      },
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          latency: Date.now() - start,
          size: body.length,
          endpoint: endpoint.path,
        });
      });
    });

    req.on('error', () => {
      resolve({ status: 0, latency: Date.now() - start, size: 0, endpoint: endpoint.path, error: true });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, latency: Date.now() - start, size: 0, endpoint: endpoint.path, error: true, timeout: true });
    });

    if (endpoint.method === 'POST') {
      req.write(JSON.stringify({ email: 'test@example.com', password: 'test123' }));
    }
    req.end();
  });
}

function percentile(sorted, pct) {
  const idx = Math.floor(sorted.length * pct / 100);
  return sorted[Math.min(idx, sorted.length - 1)];
}

async function run() {
  console.log(`\n=== Load Test: ${TARGET} ===`);
  console.log(`Concurrency: ${CONCURRENCY}, Duration: ${DURATION}s, Ramp-up: ${RAMP_UP}s`);
  console.log(`Endpoints: ${ENDPOINTS.map(e => `${e.method} ${e.path}(${e.weight})`).join(', ')}\n`);

  const results = [];
  const startTime = Date.now();
  let active = 0;
  let tick = 0;

  return new Promise((resolve) => {
    function spawn() {
      if (active >= CONCURRENCY && (Date.now() - startTime) / 1000 >= RAMP_UP) return;
      if (active >= CONCURRENCY) return;

      active++;
      const endpoint = pickEndpoint();
      makeRequest(endpoint).then((result) => {
        results.push(result);
        active--;
        tick++;

        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= DURATION && active === 0) {
          resolve();
          return;
        }

        // Keep spawning while within duration
        if (elapsed < DURATION) {
          setImmediate(spawn);
        }
      });

      setImmediate(spawn);
    }

    spawn();
  }).then(() => {
    const duration = (Date.now() - startTime) / 1000;
    const latencies = results.filter(r => !r.error).map(r => r.latency).sort((a, b) => a - b);
    const errors = results.filter(r => r.error);

    console.log('=== Results ===');
    console.log(`  Total requests: ${results.length}`);
    console.log(`  Successful: ${results.length - errors.length}`);
    console.log(`  Failed: ${errors.length}`);
    console.log(`  Duration: ${duration.toFixed(1)}s`);
    console.log(`  Throughput: ${(results.length / duration).toFixed(1)} req/s`);
    console.log(`');

    if (latencies.length > 0) {
      console.log(`  Latency (ms):`);
      console.log(`    Min:   ${Math.min(...latencies)}`);
      console.log(`    Avg:   ${(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)}`);
      console.log(`    Max:   ${Math.max(...latencies)}`);
      console.log(`    p50:   ${percentile(latencies, 50)}`);
      console.log(`    p90:   ${percentile(latencies, 90)}`);
      console.log(`    p95:   ${percentile(latencies, 95)}`);
      console.log(`    p99:   ${percentile(latencies, 99)}`);
    }

    // Per-endpoint breakdown
    const byEndpoint = {};
    for (const r of results) {
      if (!byEndpoint[r.endpoint]) byEndpoint[r.endpoint] = { total: 0, errors: 0, latencies: [] };
      byEndpoint[r.endpoint].total++;
      if (r.error) byEndpoint[r.endpoint].errors++;
      else byEndpoint[r.endpoint].latencies.push(r.latency);
    }

    console.log(`\n  Per-Endpoint:`);
    for (const [path, data] of Object.entries(byEndpoint)) {
      const avg = data.latencies.length > 0
        ? (data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length).toFixed(1)
        : 'N/A';
      console.log(`    ${path}: ${data.total} req, ${data.errors} err, avg ${avg}ms`);
    }

    // Result code for CI
    process.exit(errors.length > results.length * 0.1 ? 1 : 0);
  });
}

run().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});

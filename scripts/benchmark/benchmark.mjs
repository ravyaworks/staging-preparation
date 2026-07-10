// Conversation Platform Performance Benchmarks
// Run with: node scripts/benchmark/benchmark.mjs
// Requires: autocannon (npm install -g autocannon) or use built-in http module

import http from 'http';

const TARGET = process.env.BENCHMARK_TARGET || 'http://localhost:3000';
const CONCURRENCY = parseInt(process.env.BENCHMARK_CONCURRENCY || '10', 10);
const DURATION = parseInt(process.env.BENCHMARK_DURATION || '30', 10);
const ENDPOINTS = [
  { path: '/api/v1/health', method: 'GET' },
  { path: '/api/v1/channels', method: 'GET' },
  { path: '/api/v1/channels/implementations', method: 'GET' },
  { path: '/api/v1/webhooks', method: 'GET' },
  { path: '/api/v1/integrations', method: 'GET' },
];

async function benchmarkEndpoint(endpoint) {
  const url = new URL(endpoint.path, TARGET);
  const options = {
    hostname: url.hostname,
    port: url.port || 3000,
    path: url.pathname,
    method: endpoint.method,
    headers: { 'Content-Type': 'application/json' },
  };

  const start = Date.now();
  let completed = 0;
  let errors = 0;
  const latencies = [];

  await new Promise((resolve) => {
    let active = 0;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      if (elapsed >= DURATION) {
        clearInterval(interval);
        resolve();
        return;
      }
      while (active < CONCURRENCY) {
        active++;
        const reqStart = Date.now();
        const req = http.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            latencies.push(Date.now() - reqStart);
            completed++;
            if (res.statusCode >= 400) errors++;
            active--;
          });
        });
        req.on('error', () => { errors++; active--; });
        req.end();
      }
    }, 10);
  });

  const avgLatency = latencies.length > 0
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;
  const p99 = latencies.length > 0
    ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.99)]
    : 0;

  return {
    endpoint: endpoint.path,
    method: endpoint.method,
    completed,
    errors,
    avgLatencyMs: avgLatency,
    p99LatencyMs: p99,
    rps: DURATION > 0 ? Math.round(completed / DURATION) : 0,
  };
}

async function main() {
  console.log(`\n=== Conversation Platform Benchmarks ===`);
  console.log(`Target: ${TARGET}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Duration: ${DURATION}s\n`);

  const results = [];
  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`Benchmarking ${endpoint.method} ${endpoint.path}... `);
    const result = await benchmarkEndpoint(endpoint);
    results.push(result);
    console.log(`${result.completed} req, ${result.rps} rps, avg ${result.avgLatencyMs}ms, p99 ${result.p99LatencyMs}ms`);
  }

  console.log(`\n=== Summary ===`);
  console.table(results);
  console.log(`\nTimestamp: ${new Date().toISOString()}`);
}

main().catch(console.error);

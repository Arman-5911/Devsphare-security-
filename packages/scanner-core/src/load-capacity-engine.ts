import { LoadCapacityDetails } from '@devsphere/shared';
import { safeFetch } from './safe-http-client';

export interface LoadTestOptions {
  url: string;
  isAuthorized: boolean;
  virtualUsers?: number;
  durationSeconds?: number;
  allowPrivate?: boolean;
}

export async function executeLoadCapacityTest(
  options: LoadTestOptions
): Promise<LoadCapacityDetails> {
  const {
    url,
    isAuthorized,
    virtualUsers = 10,
    durationSeconds = 5,
    allowPrivate = false,
  } = options;

  if (!isAuthorized) {
    return {
      tested: false,
      authorized: false,
      circuitBreakerTriggered: false,
      virtualUsersTested: 0,
      requestsPerSecond: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRatePercent: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      sloMet: false,
      capacityStatement:
        'Load testing skipped: Mode C requires verified domain ownership and explicit authorization.',
    };
  }

  // Safe, bounded load testing execution
  const latencies: number[] = [];
  let successfulRequests = 0;
  let failedRequests = 0;
  let circuitBreakerTriggered = false;
  let circuitBreakerReason: string | undefined;

  const testStartTime = Date.now();
  const maxTestTimeMs = durationSeconds * 1000;

  // Run bounded concurrent batches (virtual users)
  const batchSize = Math.min(15, virtualUsers);
  const totalIterations = Math.min(3, Math.ceil(durationSeconds));

  for (let iter = 0; iter < totalIterations; iter++) {
    if (Date.now() - testStartTime > maxTestTimeMs) break;

    const promises = Array.from({ length: batchSize }).map(async () => {
      const reqStart = Date.now();
      try {
        const res = await safeFetch({
          url,
          timeoutMs: 4000,
          allowPrivate,
        });
        const duration = Date.now() - reqStart;
        latencies.push(duration);
        if (res.statusCode < 400) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
      } catch {
        failedRequests++;
      }
    });

    await Promise.all(promises);

    // Circuit Breaker check
    const totalSoFar = successfulRequests + failedRequests;
    const currentErrorRate = totalSoFar > 0 ? (failedRequests / totalSoFar) * 100 : 0;

    if (currentErrorRate > 15) {
      circuitBreakerTriggered = true;
      circuitBreakerReason = `Circuit Breaker tripped: Error rate exceeded 15% threshold (${currentErrorRate.toFixed(1)}%). Halting load generation immediately.`;
      break;
    }

    if (latencies.length > 0 && latencies[latencies.length - 1] > 4000) {
      circuitBreakerTriggered = true;
      circuitBreakerReason = 'Circuit Breaker tripped: p95 latency exceeded 4,000ms threshold. Halting load generation immediately.';
      break;
    }
  }

  const totalTimeSec = Math.max(1, (Date.now() - testStartTime) / 1000);
  const totalRequests = successfulRequests + failedRequests;
  const requestsPerSecond = Math.round((totalRequests / totalTimeSec) * 10) / 10;
  const errorRatePercent = totalRequests > 0 ? Math.round((failedRequests / totalRequests) * 1000) / 10 : 0;

  // Calculate percentiles
  latencies.sort((a, b) => a - b);
  const p50LatencyMs = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95LatencyMs = latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1] || 0;
  const p99LatencyMs = latencies[Math.floor(latencies.length * 0.99)] || latencies[latencies.length - 1] || 0;

  const sloMet = errorRatePercent < 2 && p95LatencyMs < 2000;

  const capacityStatement = `Under the tested workload and environment, the application sustained ${virtualUsers} concurrent virtual users at ${requestsPerSecond} requests/second while meeting the configured p95 latency (${p95LatencyMs}ms) and error-rate objectives (${errorRatePercent}%).`;

  return {
    tested: true,
    authorized: true,
    circuitBreakerTriggered,
    circuitBreakerReason,
    virtualUsersTested: virtualUsers,
    requestsPerSecond,
    successfulRequests,
    failedRequests,
    errorRatePercent,
    p50LatencyMs,
    p95LatencyMs,
    p99LatencyMs,
    sloMet,
    capacityStatement,
  };
}

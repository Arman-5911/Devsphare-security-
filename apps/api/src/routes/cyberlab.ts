import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  CreateCyberLabSessionSchema,
  SimulateTrafficSchema,
  InjectFaultSchema,
  RunSecuritySimSchema,
  GenerateAiRemediationSchema,
  StartCyberLabV3Schema,
  CreateVerificationSessionSchema,
  TriggerVerificationSchema,
  DeploymentWebhookSchema,
  CyberLabSession,
  CyberLabV3Run,
  VerificationSession,
} from '@devsphere/shared';
import {
  CyberLabEngine,
  CyberLabV3Orchestrator,
  AutoFixVerificationEngine,
} from '@devsphere/scanner-core';
import { CyberLabStore } from '../storage/cyberlab-store';
import { CyberLabV3Store } from '../storage/cyberlab-v3-store';
import { VerificationStore } from '../storage/verification-store';

const cyberLabStore = new CyberLabStore();
const cyberLabEngine = new CyberLabEngine();
const cyberLabV3Store = new CyberLabV3Store();
const cyberLabV3Orchestrator = new CyberLabV3Orchestrator();
const verificationStore = new VerificationStore();
const autoFixVerificationEngine = new AutoFixVerificationEngine();

export const cyberLabRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Create a new CyberLab Session
  fastify.post('/cyberlab/sessions', async (request, reply) => {
    const parseResult = CreateCyberLabSessionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.format(),
      });
    }

    const { targetUrl, mode, name, framework, repositoryUrl } = parseResult.data;
    const normalizedUrl = targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
      ? targetUrl
      : `https://${targetUrl}`;

    try {
      const sessionId = `lab_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Generate initial Virtual Snapshot safely
      const snapshot = await cyberLabEngine.createVirtualSnapshot(normalizedUrl);
      const detectedFramework = framework || cyberLabEngine.detectFramework(
        JSON.stringify(snapshot.domStructure),
        Object.fromEntries(
          Object.entries(snapshot.securityHeaders).filter(([_, v]) => v !== null) as [string, string][]
        )
      );

      // Baseline sandbox security findings
      const initialFindings = cyberLabEngine.runSandboxSecuritySimulation();

      const newSession: CyberLabSession = {
        id: sessionId,
        name: name || `CyberLab: ${new URL(normalizedUrl).hostname}`,
        targetUrl: normalizedUrl,
        mode,
        status: 'ready',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        verifiedDomain: mode === 'verified_sandbox',
        framework: detectedFramework,
        repositoryUrl,
        snapshot,
        activeVUs: 0,
        quotas: {
          maxVUs: 1000,
          maxDurationSec: 60,
          maxFaults: 10,
          memoryMb: 1024,
        },
        trafficSimulationHistory: [],
        faultInjectionHistory: [],
        securityFindings: initialFindings,
        auditEvents: [
          {
            id: `audit_${Date.now()}_1`,
            timestamp: new Date().toISOString(),
            action: 'SESSION_INITIALIZED',
            actor: 'System Orchestrator',
            details: { mode, targetUrl: normalizedUrl, framework: detectedFramework },
          },
        ],
      };

      cyberLabStore.save(newSession);
      return reply.status(201).send(newSession);
    } catch (err: any) {
      request.log.error({ err }, 'Failed to initialize CyberLab session');
      return reply.status(500).send({
        error: 'Failed to initialize CyberLab session',
        message: err.message || 'Internal simulation engine error',
      });
    }
  });

  // List all CyberLab Sessions
  fastify.get('/cyberlab/sessions', async () => {
    return cyberLabStore.listAll();
  });

  // Get specific CyberLab Session
  fastify.get('/cyberlab/sessions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = cyberLabStore.getById(id);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }
    return session;
  });

  // Destroy session and clean up isolated resources
  fastify.delete('/cyberlab/sessions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = cyberLabStore.getById(id);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    cyberLabStore.delete(id);
    return {
      success: true,
      message: `CyberLab session ${id} and all isolated replica resources successfully destroyed.`,
      sessionId: id,
    };
  });

  // Delete all sessions
  fastify.delete('/cyberlab/sessions', async () => {
    cyberLabStore.deleteAll();
    return {
      success: true,
      message: 'All CyberLab sessions and isolated environments purged successfully.',
    };
  });

  // Run controlled mock traffic simulation
  fastify.post('/cyberlab/sessions/:id/simulate-traffic', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = cyberLabStore.getById(id);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const parseResult = SimulateTrafficSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.format(),
      });
    }

    const simResult = cyberLabEngine.simulateMockTraffic(parseResult.data);

    // Update session state
    session.trafficSimulationHistory.unshift(simResult);
    session.activeVUs = 0;
    session.status = 'ready';
    session.auditEvents.unshift({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'TRAFFIC_SIMULATION_EXECUTED',
      actor: 'Developer',
      details: {
        vus: simResult.vus,
        duration: simResult.durationSec,
        rps: simResult.requestsPerSecond,
        circuitBreakerTriggered: simResult.circuitBreakerTriggered,
      },
    });

    cyberLabStore.save(session);
    return simResult;
  });

  // Inject infrastructure fault
  fastify.post('/cyberlab/sessions/:id/inject-fault', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = cyberLabStore.getById(id);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const parseResult = InjectFaultSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.format(),
      });
    }

    const faultResult = cyberLabEngine.injectFault(parseResult.data);

    session.faultInjectionHistory.unshift(faultResult);
    session.auditEvents.unshift({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'FAULT_INJECTED',
      actor: 'SRE / Chaos Engineer',
      details: {
        faultType: faultResult.faultType,
        status: faultResult.status,
        resilienceScore: faultResult.resilienceScore,
      },
    });

    cyberLabStore.save(session);
    return faultResult;
  });

  // Run or refresh sandbox defensive security checks
  fastify.post('/cyberlab/sessions/:id/security-simulation', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = cyberLabStore.getById(id);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const parseResult = RunSecuritySimSchema.safeParse(request.body);
    const categories = parseResult.success ? parseResult.data.categories : undefined;

    const findings = cyberLabEngine.runSandboxSecuritySimulation(categories);
    session.securityFindings = findings;
    session.auditEvents.unshift({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'SECURITY_SIMULATION_EXECUTED',
      actor: 'AppSec Engineer',
      details: { findingsCount: findings.length },
    });

    cyberLabStore.save(session);
    return findings;
  });

  // Generate evidence-grounded AI Remediation plan
  fastify.post('/cyberlab/sessions/:id/ai-remediation', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = cyberLabStore.getById(id);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const parseResult = GenerateAiRemediationSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.format(),
      });
    }

    const { findingId, framework } = parseResult.data;
    const finding = session.securityFindings.find((f) => f.id === findingId);
    if (!finding) {
      return reply.status(404).send({ error: 'Finding not found in current session' });
    }

    const remediation = cyberLabEngine.generateAiRemediation(finding, framework || session.framework || 'nextjs');

    session.auditEvents.unshift({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'AI_REMEDIATION_GENERATED',
      actor: 'AI Systems Engineer',
      details: { findingId, framework: remediation.framework },
    });

    cyberLabStore.save(session);
    return remediation;
  });

  // ==========================================
  // CYBERLAB V3 AUTONOMOUS ENGINE ROUTES
  // ==========================================

  // Start Autonomous CyberLab V3 Run (One-click execution)
  fastify.post('/cyberlab/v3/start', async (request, reply) => {
    const parseResult = StartCyberLabV3Schema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.format(),
      });
    }

    const { url, isVerifiedOwner } = parseResult.data;

    // Initialize in-memory run
    const runId = `run_v3_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const initialRun: CyberLabV3Run = {
      id: runId,
      targetUrl: url,
      normalizedUrl: url,
      state: 'QUEUED',
      progressPercent: 5,
      currentStepTitle: 'Queued',
      currentStepDetail: 'Initializing CyberLab V3 test orchestrator...',
      startedAt: new Date().toISOString(),
      preflight: {
        isValid: false,
        normalizedUrl: url,
        originalInput: url,
        hostname: '',
        tlsValid: false,
        isParkedDomain: false,
        isSpaFallback: false,
        redirectChain: [],
      },
      snapshot: {
        url,
        title: 'Initializing...',
        domStructure: {
          title: '',
          metaTags: {},
          headers: [],
          links: [],
          forms: [],
          buttons: [],
          scripts: [],
          stylesheets: [],
          images: [],
        },
        networkResources: [],
        syntheticApis: [],
        viewportMetrics: {
          desktop: { width: 1440, height: 900, layoutShiftScore: 0.02 },
          tablet: { width: 768, height: 1024, layoutShiftScore: 0.04 },
          mobile: { width: 375, height: 667, layoutShiftScore: 0.07 },
        },
        securityHeaders: {},
        observedAt: new Date().toISOString(),
        disclaimer: 'Public Visual Preview — Not a Complete Website Clone.',
      },
      discoveredPages: [],
      functional: {
        pagesTested: 0,
        brokenLinksCount: 0,
        missingAssetsCount: 0,
        consoleErrorsCount: 0,
        soft404Count: 0,
        horizontalOverflowDetected: false,
        issues: [],
      },
      performanceMetrics: {
        fcpMs: 0,
        lcpMs: 0,
        clsScore: 0,
        ttfbMs: 0,
        tbtMs: 0,
        speedIndexMs: 0,
        transferSizeBytes: 0,
        requestCount: 0,
        renderBlockingResources: 0,
        domContentLoadedMs: 0,
      },
      securityAudit: {
        tlsGrade: 'A',
        certificateExpiresDays: 90,
        httpsEnforced: true,
        hstsPresent: false,
        cspStrictness: 'missing',
        securityTxt: { present: false, rfc9116Valid: false, issues: [] },
        headersScore: 70,
      },
      findings: [],
      evidenceLog: [],
      aiFixMasterPrompt: '',
    };

    cyberLabV3Store.save(initialRun);

    // Launch autonomous pipeline asynchronously
    cyberLabV3Orchestrator
      .runAutonomousLab(url, isVerifiedOwner, (progressUpdate) => {
        cyberLabV3Store.update(runId, progressUpdate);
      })
      .then((finalRun) => {
        finalRun.id = runId;
        cyberLabV3Store.save(finalRun);
      })
      .catch((err) => {
        request.log.error({ err }, 'CyberLab V3 autonomous execution failed');
        cyberLabV3Store.update(runId, {
          state: 'FAILED',
          progressPercent: 100,
          currentStepTitle: 'Execution Failed',
          currentStepDetail: err.message || 'Fatal orchestrator failure.',
          completedAt: new Date().toISOString(),
        });
      });

    return reply.status(202).send({
      runId,
      message: 'CyberLab V3 autonomous execution started.',
      run: initialRun,
    });
  });

  // Get CyberLab V3 Run Status & Data
  fastify.get('/cyberlab/v3/runs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const run = cyberLabV3Store.getById(id);
    if (!run) {
      return reply.status(404).send({ error: 'CyberLab V3 run not found' });
    }
    return run;
  });

  // Cancel running job
  fastify.post('/cyberlab/v3/runs/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const run = cyberLabV3Store.getById(id);
    if (!run) {
      return reply.status(404).send({ error: 'CyberLab V3 run not found' });
    }

    const updated = cyberLabV3Store.update(id, {
      state: 'CANCELLED',
      isCancelled: true,
      currentStepTitle: 'Cancelled',
      currentStepDetail: 'Autonomous execution cancelled by user.',
      completedAt: new Date().toISOString(),
    });

    return { success: true, message: 'Run cancelled.', run: updated };
  });

  // Get AI Fix Master Prompt
  fastify.get('/cyberlab/v3/runs/:id/fix-prompt', async (request, reply) => {
    const { id } = request.params as { id: string };
    const run = cyberLabV3Store.getById(id);
    if (!run) {
      return reply.status(404).send({ error: 'Run not found' });
    }
    return {
      runId: id,
      targetUrl: run.targetUrl,
      prompt: run.aiFixMasterPrompt,
    };
  });

  // ==========================================
  // AUTO-FIX VERIFICATION ENGINE ROUTES
  // ==========================================

  // Create an Auto-Fix Verification Session from an existing baseline CyberLab run
  fastify.post('/cyberlab/verification/sessions', async (request, reply) => {
    const parseResult = CreateVerificationSessionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: parseResult.error.format(),
      });
    }

    const { runId } = parseResult.data;
    const baselineRun = cyberLabV3Store.getById(runId);
    if (!baselineRun) {
      return reply.status(404).send({
        error: 'Baseline run not found',
        message: `CyberLab V3 run ${runId} does not exist.`,
      });
    }

    const sessionId = `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const newSession: VerificationSession = {
      id: sessionId,
      targetUrl: baselineRun.targetUrl,
      baselineRunId: runId,
      baselineRun: JSON.parse(JSON.stringify(baselineRun)), // Immutable deep clone of baseline
      status: 'baseline_captured',
      createdAt: new Date().toISOString(),
      summary: {
        totalBaselineFindings: baselineRun.findings.length,
        verifiedFixedCount: 0,
        stillPresentCount: baselineRun.findings.length,
        regressionsCount: 0,
        improvedCount: 0,
        overallVerdict: 'NO_CHANGE',
        scoreDelta: 0,
      },
      findingComparisons: baselineRun.findings.map((f) => ({
        findingId: f.id,
        ruleId: f.ruleId,
        title: f.title,
        category: f.category,
        severity: f.severity,
        status: 'STILL_PRESENT',
        statusReason: 'Baseline finding awaiting deployment re-verification.',
        baselineEvidence: f.evidence,
        explanation: f.explanation,
        remediation: f.remediation,
      })),
      performanceComparison: {
        fcp: { metric: 'FCP', unit: 'ms', baseline: baselineRun.performanceMetrics.fcpMs, latest: baselineRun.performanceMetrics.fcpMs, delta: 0, percentageChange: 0, verdict: 'neutral', isMeaningful: false },
        lcp: { metric: 'LCP', unit: 'ms', baseline: baselineRun.performanceMetrics.lcpMs, latest: baselineRun.performanceMetrics.lcpMs, delta: 0, percentageChange: 0, verdict: 'neutral', isMeaningful: false },
        cls: { metric: 'CLS', unit: '', baseline: baselineRun.performanceMetrics.clsScore, latest: baselineRun.performanceMetrics.clsScore, delta: 0, percentageChange: 0, verdict: 'neutral', isMeaningful: false },
        ttfb: { metric: 'TTFB', unit: 'ms', baseline: baselineRun.performanceMetrics.ttfbMs, latest: baselineRun.performanceMetrics.ttfbMs, delta: 0, percentageChange: 0, verdict: 'neutral', isMeaningful: false },
        transferSize: { metric: 'Transfer Size', unit: 'bytes', baseline: baselineRun.performanceMetrics.transferSizeBytes, latest: baselineRun.performanceMetrics.transferSizeBytes, delta: 0, percentageChange: 0, verdict: 'neutral', isMeaningful: false },
        requestCount: { metric: 'Requests', unit: '', baseline: baselineRun.performanceMetrics.requestCount, latest: baselineRun.performanceMetrics.requestCount, delta: 0, percentageChange: 0, verdict: 'neutral', isMeaningful: false },
        overallPerformanceDelta: 0,
      },
      functionalRegressions: [],
      updatedAiFixPrompt: baselineRun.aiFixMasterPrompt || '',
    };

    verificationStore.save(newSession);
    return reply.status(201).send(newSession);
  });

  // List all Verification Sessions
  fastify.get('/cyberlab/verification/sessions', async () => {
    return verificationStore.listAll();
  });

  // Get single Verification Session
  fastify.get('/cyberlab/verification/sessions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = verificationStore.getById(id);
    if (!session) {
      return reply.status(404).send({ error: 'Verification session not found' });
    }
    return session;
  });

  // Execute Re-Scan and Verify Fixes
  fastify.post('/cyberlab/verification/sessions/:id/verify', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = verificationStore.getById(id);
    if (!session) {
      return reply.status(404).send({ error: 'Verification session not found' });
    }

    const parseResult = TriggerVerificationSchema.safeParse(request.body || {});
    const notes = parseResult.success ? parseResult.data.notes : undefined;
    const commitSha = parseResult.success ? parseResult.data.commitSha : undefined;

    // Update status to verifying
    verificationStore.update(id, {
      status: 'verifying',
      deploymentInfo: {
        provider: 'manual',
        commitSha,
        notes,
        detectedAt: new Date().toISOString(),
      },
    });

    try {
      // Re-run autonomous CyberLab V3 on target website
      const latestRun = await cyberLabV3Orchestrator.runAutonomousLab(session.targetUrl);
      cyberLabV3Store.save(latestRun);

      // Compare baseline with latest re-scan
      const comparison = autoFixVerificationEngine.compareRuns(session.baselineRun, latestRun);

      // Update verification session
      const updatedSession = verificationStore.update(id, {
        latestRunId: latestRun.id,
        latestRun,
        status: 'completed',
        verifiedAt: new Date().toISOString(),
        summary: comparison.summary,
        findingComparisons: comparison.findingComparisons,
        performanceComparison: comparison.performanceComparison,
        functionalRegressions: comparison.functionalRegressions,
        updatedAiFixPrompt: comparison.updatedAiFixPrompt,
      });

      return updatedSession;
    } catch (err: any) {
      request.log.error({ err }, 'Verification re-scan execution failed');
      verificationStore.update(id, { status: 'failed' });
      return reply.status(500).send({
        error: 'Verification execution failed',
        message: err.message || 'Failed to complete re-scan verification.',
      });
    }
  });

  // CI/CD Deployment Webhook
  fastify.post('/cyberlab/verification/webhook', async (request, reply) => {
    const parseResult = DeploymentWebhookSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid Webhook Payload',
        details: parseResult.error.format(),
      });
    }

    const { targetUrl, provider, commitSha, deploymentId, autoVerify } = parseResult.data;

    // Find active verification session matching targetUrl
    const sessions = verificationStore.listAll();
    const matchingSession = sessions.find((s) => s.targetUrl.includes(targetUrl) || targetUrl.includes(s.targetUrl));

    if (!matchingSession) {
      return reply.status(404).send({
        error: 'No active verification session registered for target URL',
        targetUrl,
      });
    }

    if (autoVerify) {
      // Launch background verification
      cyberLabV3Orchestrator.runAutonomousLab(matchingSession.targetUrl).then((latestRun) => {
        cyberLabV3Store.save(latestRun);
        const comparison = autoFixVerificationEngine.compareRuns(matchingSession.baselineRun, latestRun);
        verificationStore.update(matchingSession.id, {
          latestRunId: latestRun.id,
          latestRun,
          status: 'completed',
          verifiedAt: new Date().toISOString(),
          summary: comparison.summary,
          findingComparisons: comparison.findingComparisons,
          performanceComparison: comparison.performanceComparison,
          functionalRegressions: comparison.functionalRegressions,
          updatedAiFixPrompt: comparison.updatedAiFixPrompt,
          deploymentInfo: {
            provider,
            commitSha,
            deploymentId,
            detectedAt: new Date().toISOString(),
          },
        });
      });
    }

    return {
      success: true,
      message: 'Deployment event accepted. Auto-verification initiated.',
      sessionId: matchingSession.id,
    };
  });
};

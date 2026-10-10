import { CyberLabMode, CyberLabSession, VirtualSnapshot, TrafficSimulationResult, SimulateTrafficInput, FaultInjectionResult, InjectFaultInput, SandboxSecurityFinding, AiRemediationPlan } from '@devsphere/shared';
export interface CreateLabOptions {
    targetUrl: string;
    mode: CyberLabMode;
    name?: string;
    framework?: CyberLabSession['framework'];
    repositoryUrl?: string;
}
/**
 * DevSphere CyberLab Core Engine
 * Manages Virtual Snapshots, Mock Traffic Simulation,
 * Fault Injection, Sandbox Security Assessments, and AI Remediation.
 */
export declare class CyberLabEngine {
    /**
     * Safe Public Preview Snapshot Creator
     * Inspects public DOM, resources, and passive headers without disruptive testing.
     */
    createVirtualSnapshot(targetUrl: string): Promise<VirtualSnapshot>;
    /**
     * Framework Detection from passive HTML and Headers
     */
    detectFramework(html: string, headers?: Record<string, string>): CyberLabSession['framework'];
    /**
     * Controlled Mock Traffic Simulation
     * Strictly in-memory & isolated DevSphere infrastructure.
     * Zero external target requests sent.
     */
    simulateMockTraffic(config: SimulateTrafficInput): TrafficSimulationResult;
    /**
     * Infrastructure Fault Injection Simulator
     * Injects controlled anomalies into isolated mock infrastructure.
     */
    injectFault(config: InjectFaultInput): FaultInjectionResult;
    /**
     * Safe Defensive Security Simulation
     * Evaluates defensive boundaries within authorized sandbox without destructive exploits.
     */
    runSandboxSecuritySimulation(categories?: string[]): SandboxSecurityFinding[];
    /**
     * Evidence-Grounded AI Remediation Assistant
     * Generates framework-tailored root cause explanation, actionable code patches, and verification tests.
     */
    generateAiRemediation(finding: SandboxSecurityFinding, framework?: string): AiRemediationPlan;
}

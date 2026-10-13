export type RiskLevel = 'low' | 'medium' | 'high';
export type Trend = 'improving' | 'stable' | 'declining';
export type BenefitStatus = 'eligible' | 'pending' | 'unavailable';
export type CriterionStatus = 'met' | 'watch' | 'not-met';
export const CRITERION_LABELS: Readonly<Record<CriterionStatus, string>> = {
  met: 'Met',
  watch: 'Watch',
  'not-met': 'Needs attention',
};
export type DriverSort = 'score-desc' | 'score-asc' | 'name-asc';
export type RiskFilter = 'all' | RiskLevel;

export interface ScorePoint {
  readonly label: string;
  readonly score: number;
}

export interface DrivingCriterion {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly target: string;
  readonly status: CriterionStatus;
  readonly detail: string;
}

export interface BenefitDecisionCriterion {
  readonly label: string;
  readonly status: CriterionStatus;
  readonly detail: string;
}

export interface BenefitDecision {
  readonly status: BenefitStatus;
  readonly benefitLabel: string;
  readonly value: string;
  readonly headline: string;
  readonly rationale: string;
  readonly evaluatedAt: string;
  readonly nextReviewAt: string;
  readonly criteria: readonly BenefitDecisionCriterion[];
}

export interface DecisionHistoryEntry {
  readonly id: string;
  readonly status: BenefitStatus;
  readonly benefitLabel: string;
  readonly value: string;
  readonly evaluatedAt: string;
  readonly reason: string;
}

export interface FleetBenchmark {
  readonly fleetName: string;
  readonly averageScore: number;
  readonly rank: number;
  readonly totalDrivers: number;
  readonly percentile: number;
}

export type ApiScenario =
  'success' | 'bad-request' | 'unauthorized' | 'forbidden' | 'not-found' | 'server-error';

export interface Benefit {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly status: BenefitStatus;
  readonly description: string;
}

export interface Driver {
  readonly id: string;
  readonly displayName: string;
  readonly region: string;
  readonly score: number;
  readonly riskLevel: RiskLevel;
  readonly annualDistanceKm: number;
  readonly harshBrakingEvents: number;
  readonly speedingEvents: number;
  readonly trend: Trend;
  readonly benefits: readonly Benefit[];
  readonly lastUpdated: string;
  readonly scoreHistory: readonly ScorePoint[];
  readonly criteria: readonly DrivingCriterion[];
  readonly benefitDecision: BenefitDecision | null;
  readonly decisionHistory: readonly DecisionHistoryEntry[];
  readonly fleetBenchmark: FleetBenchmark;
}

export interface ApiError {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly retryable: boolean;
}

export interface DriverSummary {
  readonly totalDrivers: number;
  readonly averageScore: number;
  readonly eligibleBenefits: number;
  readonly highRiskDrivers: number;
}

export const API_SCENARIO_LABELS: Readonly<Record<ApiScenario, string>> = {
  success: '200 · Success',
  'bad-request': '400 · Bad request',
  unauthorized: '401 · Unauthorized',
  forbidden: '403 · Forbidden',
  'not-found': '404 · Not found',
  'server-error': '500 · Server error',
};

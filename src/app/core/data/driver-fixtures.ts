import {
  Benefit,
  BenefitDecision,
  CriterionStatus,
  DecisionHistoryEntry,
  Driver,
  DrivingCriterion,
  FleetBenchmark,
  ScorePoint,
} from '../models/tmx.models';

const MONTH_LABELS = [
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
] as const;

type BaseDriver = Omit<
  Driver,
  'scoreHistory' | 'criteria' | 'benefitDecision' | 'decisionHistory' | 'fleetBenchmark'
>;

type CriteriaSource = Pick<Driver, 'score' | 'harshBrakingEvents' | 'speedingEvents' | 'trend'>;

const scoreHistory = (scores: readonly number[]): readonly ScorePoint[] =>
  MONTH_LABELS.map((label, index) => ({ label, score: scores[index] }));

const thresholdStatus = (value: number, metAt: number, watchAt: number): CriterionStatus => {
  if (value <= metAt) return 'met';
  if (value <= watchAt) return 'watch';
  return 'not-met';
};

const criteriaFor = (driver: CriteriaSource): readonly DrivingCriterion[] => {
  const scoreStatus: CriterionStatus =
    driver.score >= 80 ? 'met' : driver.score >= 70 ? 'watch' : 'not-met';
  const brakingStatus = thresholdStatus(driver.harshBrakingEvents, 8, 16);
  const speedingStatus = thresholdStatus(driver.speedingEvents, 5, 10);
  const trendStatus: CriterionStatus =
    driver.trend === 'improving' ? 'met' : driver.trend === 'stable' ? 'watch' : 'not-met';

  return [
    {
      id: 'score-threshold',
      label: 'Driving score',
      value: `${driver.score}/100`,
      target: '≥ 80',
      status: scoreStatus,
      detail: `Current score is ${driver.score} against the benefit threshold.`,
    },
    {
      id: 'harsh-braking',
      label: 'Safe braking',
      value: `${driver.harshBrakingEvents} events`,
      target: '≤ 8 events',
      status: brakingStatus,
      detail: 'Harsh braking events recorded during the evaluation period.',
    },
    {
      id: 'speeding-compliance',
      label: 'Speed compliance',
      value: `${driver.speedingEvents} events`,
      target: '≤ 5 events',
      status: speedingStatus,
      detail: 'Speeding events recorded during the evaluation period.',
    },
    {
      id: 'score-trajectory',
      label: 'Score trajectory',
      value: driver.trend,
      target: 'Improving or stable',
      status: trendStatus,
      detail: 'Direction of the score across the latest reporting periods.',
    },
  ];
};

const reviewDateFor = (lastUpdated: string): string => {
  const reviewDate = new Date(`${lastUpdated}T00:00:00Z`);
  reviewDate.setUTCDate(reviewDate.getUTCDate() + 30);
  return reviewDate.toISOString().slice(0, 10);
};

const shiftDate = (dateString: string, days: number): string => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const decisionHistoryFor = (driver: BaseDriver): readonly DecisionHistoryEntry[] => {
  const benefit: Benefit | undefined = driver.benefits[0];
  if (!benefit) return [];

  const previousStatus = benefit.status === 'eligible' ? 'pending' : 'unavailable';
  const previousReason =
    previousStatus === 'pending'
      ? 'A further review period was requested before confirming eligibility.'
      : 'The behaviour signals were below the current benefit threshold.';

  return [
    {
      id: `${benefit.id}-history-1`,
      status: previousStatus,
      benefitLabel: benefit.label,
      value: benefit.value,
      evaluatedAt: shiftDate(driver.lastUpdated, -60),
      reason: previousReason,
    },
    {
      id: `${benefit.id}-history-2`,
      status: benefit.status,
      benefitLabel: benefit.label,
      value: benefit.value,
      evaluatedAt: driver.lastUpdated,
      reason: benefit.description,
    },
  ];
};

const benefitDecisionFor = (
  driver: BaseDriver,
  criteria: readonly DrivingCriterion[],
): BenefitDecision | null => {
  const benefit: Benefit | undefined = driver.benefits[0];
  if (!benefit) return null;

  const rationaleByStatus = {
    eligible: 'The driver meets the current score and behaviour thresholds for this benefit.',
    pending: 'The profile is close to the current threshold and needs another review period.',
    unavailable: 'The current behaviour signals do not meet the threshold for this benefit.',
  } as const;

  return {
    status: benefit.status,
    benefitLabel: benefit.label,
    value: benefit.value,
    headline:
      benefit.status === 'eligible'
        ? `${benefit.value} benefit currently available`
        : benefit.status === 'pending'
          ? 'Benefit decision pending review'
          : 'Benefit is not currently available',
    rationale: rationaleByStatus[benefit.status],
    evaluatedAt: driver.lastUpdated,
    nextReviewAt: reviewDateFor(driver.lastUpdated),
    criteria: criteria.map(({ label, status, detail }) => ({ label, status, detail })),
  };
};

const withDetails = (
  driver: BaseDriver,
  scores: readonly number[],
  fleetBenchmark: FleetBenchmark,
): Driver => {
  const criteria = criteriaFor(driver);

  return {
    ...driver,
    scoreHistory: scoreHistory(scores),
    criteria,
    benefitDecision: benefitDecisionFor(driver, criteria),
    decisionHistory: decisionHistoryFor(driver),
    fleetBenchmark,
  };
};

const fleet = (
  fleetName: string,
  averageScore: number,
  rank: number,
  totalDrivers: number,
  percentile: number,
): FleetBenchmark => ({
  fleetName,
  averageScore,
  rank,
  totalDrivers,
  percentile,
});

export const DRIVER_FIXTURES: readonly Driver[] = [
  withDetails(
    {
      id: 'tmx-1042',
      displayName: 'Avery Morgan',
      region: 'North West',
      score: 92,
      riskLevel: 'low',
      annualDistanceKm: 12400,
      harshBrakingEvents: 2,
      speedingEvents: 1,
      trend: 'improving',
      lastUpdated: '2026-10-07',
      benefits: [
        {
          id: 'benefit-1042-1',
          label: 'Safe driving discount',
          value: '15%',
          status: 'eligible',
          description: 'Eligible based on the current annual driving score.',
        },
        {
          id: 'benefit-1042-2',
          label: 'Roadside assistance',
          value: 'Included',
          status: 'eligible',
          description: 'Included in the current benefit package.',
        },
      ],
    },
    [78, 80, 81, 82, 84, 84, 85, 87, 88, 90, 91, 92],
    fleet('Northstar Mobility', 80, 2, 12, 92),
  ),
  withDetails(
    {
      id: 'tmx-1098',
      displayName: 'Jordan Lee',
      region: 'South East',
      score: 84,
      riskLevel: 'low',
      annualDistanceKm: 18900,
      harshBrakingEvents: 6,
      speedingEvents: 4,
      trend: 'stable',
      lastUpdated: '2026-10-06',
      benefits: [
        {
          id: 'benefit-1098-1',
          label: 'Safe driving discount',
          value: '10%',
          status: 'eligible',
          description: 'Eligible with a stable driving profile.',
        },
      ],
    },
    [84, 83, 85, 84, 83, 84, 84, 85, 84, 84, 84, 84],
    fleet('Central Fleet Services', 79, 6, 18, 75),
  ),
  withDetails(
    {
      id: 'tmx-1124',
      displayName: 'Taylor Brooks',
      region: 'Midlands',
      score: 76,
      riskLevel: 'medium',
      annualDistanceKm: 21300,
      harshBrakingEvents: 11,
      speedingEvents: 8,
      trend: 'improving',
      lastUpdated: '2026-10-08',
      benefits: [
        {
          id: 'benefit-1124-1',
          label: 'Driver coaching',
          value: 'Available',
          status: 'pending',
          description: 'A coaching recommendation is ready to review.',
        },
      ],
    },
    [68, 70, 71, 72, 72, 73, 74, 74, 75, 76, 76, 76],
    fleet('Central Fleet Services', 79, 11, 18, 54),
  ),
  withDetails(
    {
      id: 'tmx-1177',
      displayName: 'Casey Patel',
      region: 'West Midlands',
      score: 68,
      riskLevel: 'medium',
      annualDistanceKm: 27800,
      harshBrakingEvents: 19,
      speedingEvents: 12,
      trend: 'stable',
      lastUpdated: '2026-10-05',
      benefits: [
        {
          id: 'benefit-1177-1',
          label: 'Driver coaching',
          value: 'Available',
          status: 'pending',
          description: 'A coaching recommendation is ready to review.',
        },
      ],
    },
    [72, 70, 71, 70, 69, 68, 68, 67, 67, 68, 68, 68],
    fleet('Westline Logistics', 72, 16, 21, 34),
  ),
  withDetails(
    {
      id: 'tmx-1219',
      displayName: 'Riley Chen',
      region: 'London',
      score: 61,
      riskLevel: 'high',
      annualDistanceKm: 32100,
      harshBrakingEvents: 28,
      speedingEvents: 22,
      trend: 'declining',
      lastUpdated: '2026-10-08',
      benefits: [
        {
          id: 'benefit-1219-1',
          label: 'Safe driving discount',
          value: 'Not available',
          status: 'unavailable',
          description: 'The current score does not meet the discount threshold.',
        },
      ],
    },
    [78, 76, 74, 72, 70, 69, 68, 67, 65, 64, 62, 61],
    fleet('Westline Logistics', 72, 23, 21, 8),
  ),
  withDetails(
    {
      id: 'tmx-1260',
      displayName: 'Morgan Wilson',
      region: 'East of England',
      score: 88,
      riskLevel: 'low',
      annualDistanceKm: 14700,
      harshBrakingEvents: 4,
      speedingEvents: 3,
      trend: 'improving',
      lastUpdated: '2026-10-07',
      benefits: [
        {
          id: 'benefit-1260-1',
          label: 'Safe driving discount',
          value: '12%',
          status: 'eligible',
          description: 'Eligible based on the current annual driving score.',
        },
      ],
    },
    [79, 80, 82, 83, 84, 85, 85, 86, 87, 87, 88, 88],
    fleet('Northstar Mobility', 80, 4, 12, 83),
  ),
  withDetails(
    {
      id: 'tmx-1311',
      displayName: 'Jamie Evans',
      region: 'South West',
      score: 73,
      riskLevel: 'medium',
      annualDistanceKm: 23100,
      harshBrakingEvents: 13,
      speedingEvents: 9,
      trend: 'stable',
      lastUpdated: '2026-10-04',
      benefits: [],
    },
    [73, 72, 74, 73, 74, 73, 72, 73, 73, 73, 72, 73],
    fleet('South Coast Motor', 76, 13, 16, 46),
  ),
];

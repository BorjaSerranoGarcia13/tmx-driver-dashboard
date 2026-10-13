import { BenefitStatus, Driver } from './tmx.models';

export function decisionStatus(driver: Driver): BenefitStatus {
  if (driver.benefits.some((benefit) => benefit.status === 'eligible')) return 'eligible';
  if (driver.benefits.some((benefit) => benefit.status === 'pending')) return 'pending';
  return 'unavailable';
}

export function riskDistribution(drivers: readonly Driver[]) {
  return (['low', 'medium', 'high'] as const).map((level) => {
    const count = drivers.filter((driver) => driver.riskLevel === level).length;
    return {
      label: level[0].toUpperCase() + level.slice(1) + ' band',
      level,
      count,
      percentage: drivers.length ? Math.round((count / drivers.length) * 100) : 0,
    };
  });
}

/** One category per driver: eligible takes precedence over pending, then unavailable. */
export function benefitDecisions(drivers: readonly Driver[]) {
  const rows = [
    {
      label: 'Eligible for benefit',
      detail: 'Drivers with a benefit available to review',
      status: 'eligible',
    },
    { label: 'Under review', detail: 'Drivers with a pending recommendation', status: 'pending' },
    {
      label: 'No current benefit',
      detail: 'Drivers without an active benefit match',
      status: 'unavailable',
    },
  ] as const;
  return rows.map((row) => {
    const count = drivers.filter((driver) => decisionStatus(driver) === row.status).length;
    return {
      ...row,
      count,
      percentage: drivers.length ? Math.round((count / drivers.length) * 100) : 0,
    };
  });
}

/** Aggregate supplied evaluations; missing criteria are excluded, not treated as failures. */
export function portfolioCriteria(drivers: readonly Driver[]) {
  const definitions = [
    ...new Map(
      drivers.flatMap((driver) =>
        driver.criteria.map(
          (criterion) => [criterion.id, { id: criterion.id, label: criterion.label }] as const,
        ),
      ),
    ).values(),
  ];
  return definitions.map((definition) => {
    const evaluations = drivers.flatMap((driver) =>
      driver.criteria.filter((criterion) => criterion.id === definition.id),
    );
    const met = evaluations.filter((criterion) => criterion.status === 'met').length;
    return {
      ...definition,
      met,
      evaluated: evaluations.length,
      percentage: evaluations.length ? Math.round((met / evaluations.length) * 100) : 0,
    };
  });
}

import { DRIVER_FIXTURES } from '../data/driver-fixtures';
import { benefitDecisions, portfolioCriteria, riskDistribution } from './portfolio';

describe('Portfolio aggregation', () => {
  it('handles an empty portfolio without NaN', () => {
    expect(riskDistribution([]).every((row) => row.percentage === 0)).toBe(true);
    expect(benefitDecisions([]).every((row) => row.count === 0)).toBe(true);
    expect(portfolioCriteria([])).toEqual([]);
  });
  it('places each driver in exactly one decision category', () => {
    const driver = DRIVER_FIXTURES[0];
    const mixed = {
      ...driver,
      benefits: [
        { ...driver.benefits[0], status: 'eligible' as const },
        { ...driver.benefits[0], status: 'pending' as const },
      ],
    };
    const rows = benefitDecisions([mixed, { ...driver, benefits: [] }]);
    expect(rows.map((row) => row.count)).toEqual([1, 0, 1]);
    expect(rows.reduce((sum, row) => sum + row.count, 0)).toBe(2);
  });
  it('derives percentages from supplied criteria, excluding missing evaluations', () => {
    const driver = DRIVER_FIXTURES[0];
    const criterion = driver.criteria[0];
    const drivers = [
      { ...driver, criteria: [{ ...criterion, status: 'met' as const }] },
      { ...driver, criteria: [{ ...criterion, status: 'watch' as const }] },
      { ...driver, criteria: [] },
    ];
    expect(portfolioCriteria(drivers)[0]).toEqual({
      id: criterion.id,
      label: criterion.label,
      met: 1,
      evaluated: 2,
      percentage: 50,
    });
  });
});

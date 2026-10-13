import { DRIVER_FIXTURES } from '../data/driver-fixtures';
import { averageDriverScore, withFleetBenchmarks } from './fleet-score';

describe('fleet scores', () => {
  it('uses the same population and average for every driver in a fleet', () => {
    for (const driver of DRIVER_FIXTURES) {
      const members = DRIVER_FIXTURES.filter(
        (member) => member.fleetBenchmark.fleetName === driver.fleetBenchmark.fleetName,
      );
      expect(driver.fleetBenchmark.averageScore).toBe(averageDriverScore(members));
      expect(driver.fleetBenchmark.totalDrivers).toBe(members.length);
      expect(driver.fleetBenchmark.rank).toBeGreaterThanOrEqual(1);
      expect(driver.fleetBenchmark.rank).toBeLessThanOrEqual(members.length);
    }
    expect(DRIVER_FIXTURES[0].fleetBenchmark).toEqual({
      fleetName: 'Northstar Mobility',
      averageScore: 90,
      rank: 1,
      totalDrivers: 2,
    });
  });

  it('shares ranks for ties without mutating the inputs', () => {
    const members = [90, 90, 60].map((score, index) => ({
      ...DRIVER_FIXTURES[0],
      id: `driver-${index}`,
      score,
      fleetBenchmark: { fleetName: 'Shared fleet' },
    }));
    const result = withFleetBenchmarks(members);
    expect(result.map((driver) => driver.fleetBenchmark.rank)).toEqual([1, 1, 3]);
    expect(result.map((driver) => driver.fleetBenchmark.averageScore)).toEqual([80, 80, 80]);
    expect(members[0].fleetBenchmark).toEqual({ fleetName: 'Shared fleet' });
  });

  it('handles single-driver fleets and empty populations', () => {
    const [driver] = withFleetBenchmarks([DRIVER_FIXTURES[0]]);
    expect(driver.fleetBenchmark).toEqual({
      fleetName: 'Northstar Mobility',
      averageScore: 92,
      rank: 1,
      totalDrivers: 1,
    });
    expect(withFleetBenchmarks([])).toEqual([]);
    expect(averageDriverScore([])).toBe(0);
    expect(averageDriverScore([{ score: 81 }, { score: 82 }])).toBe(82);
  });
});

import { Driver, FleetBenchmark } from './tmx.models';

export type FleetDriver = Omit<Driver, 'fleetBenchmark'> & {
  readonly fleetBenchmark: Pick<FleetBenchmark, 'fleetName'>;
};

export function averageDriverScore(drivers: readonly Pick<Driver, 'score'>[]): number {
  return drivers.length
    ? Math.round(drivers.reduce((total, driver) => total + driver.score, 0) / drivers.length)
    : 0;
}

export function withFleetBenchmarks(drivers: readonly FleetDriver[]): readonly Driver[] {
  return drivers.map((driver) => {
    const fleetName = driver.fleetBenchmark.fleetName;
    const members = drivers.filter((member) => member.fleetBenchmark.fleetName === fleetName);
    return {
      ...driver,
      fleetBenchmark: {
        fleetName,
        averageScore: averageDriverScore(members),
        // Equal scores share the same position (competition ranking).
        rank: 1 + members.filter((member) => member.score > driver.score).length,
        totalDrivers: members.length,
      },
    };
  });
}

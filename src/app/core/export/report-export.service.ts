import { Injectable } from '@angular/core';
import { Driver } from '../models/tmx.models';

@Injectable({ providedIn: 'root' })
export class ReportExportService {
  toDriversCsv(drivers: readonly Driver[]): string {
    const rows = [
      [
        'Driver ID',
        'Driver name',
        'Fleet',
        'Region',
        'Score',
        'Risk level',
        'Trend',
        'Benefit status',
        'Benefit value',
        'Last updated',
      ],
      ...drivers.map((driver) => [
        driver.id,
        driver.displayName,
        driver.fleetBenchmark.fleetName,
        driver.region,
        driver.score,
        driver.riskLevel,
        driver.trend,
        driver.benefitDecision?.status ?? 'none',
        driver.benefitDecision?.value ?? '',
        driver.lastUpdated,
      ]),
    ];

    // Spanish-locale Excel uses semicolons; the BOM identifies UTF-8 accents.
    return (
      '\uFEFF' + rows.map((row) => row.map((value) => this.escape(value)).join(';')).join('\r\n')
    );
  }

  downloadDriversCsv(drivers: readonly Driver[], filename = 'tmx-driver-report.csv'): void {
    const blob = new Blob([this.toDriversCsv(drivers)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  private escape(value: string | number): string {
    const text = String(value);
    return /[;",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }
}

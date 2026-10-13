import { TestBed } from '@angular/core/testing';
import { DRIVER_FIXTURES } from '../data/driver-fixtures';
import { ReportExportService } from './report-export.service';

describe('ReportExportService', () => {
  it('creates a CSV with operational driver fields', () => {
    const service = TestBed.inject(ReportExportService);

    const csv = service.toDriversCsv([DRIVER_FIXTURES[0]]);
    const rows = csv.split('\r\n');

    expect(rows[0]).toBe(
      '\uFEFFDriver ID;Driver name;Fleet;Region;Score;Risk level;Trend;Benefit status;Benefit value;Last updated',
    );
    expect(rows[1]).toContain('tmx-1042;Avery Morgan;Northstar Mobility');
    expect(rows[1]).toContain(';92;low;improving;eligible;15%;');
    expect(rows[1].split(';')).toHaveLength(10);
  });

  it('escapes commas and quotes in driver names', () => {
    const service = TestBed.inject(ReportExportService);
    const driver = { ...DRIVER_FIXTURES[0], displayName: 'Morgan, "Avery"' };

    expect(service.toDriversCsv([driver])).toContain('"Morgan, ""Avery"""');
  });

  it('quotes semicolons and line breaks without changing the data', () => {
    const service = TestBed.inject(ReportExportService);
    const driver = { ...DRIVER_FIXTURES[0], displayName: 'José; Muñoz', region: 'North\r\nWest' };
    expect(service.toDriversCsv([driver])).toContain(';"José; Muñoz";');
    expect(service.toDriversCsv([driver])).toContain(';"North\r\nWest";');
  });

  it('includes exactly one UTF-8 BOM and retains accents', () => {
    const service = TestBed.inject(ReportExportService);
    const csv = service.toDriversCsv([{ ...DRIVER_FIXTURES[0], displayName: 'José Muñoz' }]);
    expect(Array.from(new TextEncoder().encode(csv).slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(csv.match(/\uFEFF/g)).toHaveLength(1);
    expect(csv).toContain('José Muñoz');
  });

  it('exports a header for an empty selection', () => {
    const csv = TestBed.inject(ReportExportService).toDriversCsv([]);
    expect(csv.split('\r\n')).toHaveLength(1);
    expect(csv.split(';')).toHaveLength(10);
  });

  it('downloads the BOM-prefixed payload as a UTF-8 CSV', async () => {
    let downloaded: Blob | undefined;
    const createObjectURL = vi.fn((blob: Blob) => {
      downloaded = blob;
      return 'blob:csv-test';
    });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      TestBed.inject(ReportExportService).downloadDriversCsv(
        [DRIVER_FIXTURES[0]],
        'tmx-fleet-report.csv',
      );
      expect(downloaded?.type).toBe('text/csv;charset=utf-8;');
      expect(click).toHaveBeenCalledOnce();
      expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe('tmx-fleet-report.csv');
      const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(downloaded!);
      });
      expect(Array.from(new Uint8Array(bytes).slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
      expect(new TextDecoder().decode(bytes)).toContain('Driver ID;Driver name;Fleet');
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv-test');
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  });
});

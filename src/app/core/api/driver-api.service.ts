import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Driver } from '../models/tmx.models';

@Injectable({ providedIn: 'root' })
export class DriverApiService {
  private readonly http = inject(HttpClient);

  getDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>('/api/tmx/drivers');
  }

  getDriver(id: string): Observable<Driver> {
    return this.http.get<Driver>(`/api/tmx/drivers/${id}`);
  }
}

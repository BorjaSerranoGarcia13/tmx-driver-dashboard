import { Injectable, signal } from '@angular/core';
import { ApiScenario } from '../models/tmx.models';

@Injectable({ providedIn: 'root' })
export class DemoScenarioService {
  readonly scenario = signal<ApiScenario>('success');

  setScenario(scenario: ApiScenario): void {
    this.scenario.set(scenario);
  }
}

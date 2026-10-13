import { Component, inject } from '@angular/core';
import { API_SCENARIO_LABELS, ApiScenario } from '../../core/models/tmx.models';
import { DemoScenarioService } from '../../core/api/demo-scenario.service';

@Component({
  selector: 'app-api-scenario-control',
  template: `
    <label class="scenario-control">
      <span>API response</span>
      <select [value]="scenarioService.scenario()" (change)="setScenario($event)">
        @for (option of options; track option[0]) {
          <option [value]="option[0]">{{ option[1] }}</option>
        }
      </select>
    </label>
  `,
  styleUrl: './api-scenario-control.component.css',
})
export class ApiScenarioControlComponent {
  readonly scenarioService = inject(DemoScenarioService);
  readonly options = Object.entries(API_SCENARIO_LABELS) as [ApiScenario, string][];

  setScenario(event: Event): void {
    this.scenarioService.setScenario((event.target as HTMLSelectElement).value as ApiScenario);
  }
}

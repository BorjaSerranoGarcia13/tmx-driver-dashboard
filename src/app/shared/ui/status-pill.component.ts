import { Component, input } from '@angular/core';
import { ReviewWorkStatus } from '../../core/models/review-work.models';
import { CriterionStatus, RiskLevel, Trend } from '../../core/models/tmx.models';

type StatusValue =
  RiskLevel | Trend | CriterionStatus | ReviewWorkStatus | 'eligible' | 'pending' | 'unavailable';

@Component({
  selector: 'app-status-pill',
  template: `<span class="status-pill" [class]="'status-pill--' + value()">{{ label() }}</span>`,
  styleUrl: './status-pill.component.css',
})
export class StatusPillComponent {
  readonly value = input.required<StatusValue>();
  readonly label = input.required<string>();
}

import { Component, input } from '@angular/core';
import { Driver, CRITERION_LABELS } from '../../core/models/tmx.models';
import { DatePipe } from '@angular/common';
import { StatusPillComponent } from '../../shared/ui/status-pill.component';
@Component({
  selector: 'app-benefit-explanation',
  imports: [DatePipe, StatusPillComponent],
  templateUrl: './benefit-explanation.component.html',
  styleUrls: ['./driver-panel.shared.css', './benefit-explanation.component.css'],
})
export class BenefitExplanationComponent {
  readonly driver = input.required<Driver>();
  readonly criterionLabels = CRITERION_LABELS;
}

import { Component, input } from '@angular/core';
import { Driver } from '../../core/models/tmx.models';
import { StatusPillComponent } from '../../shared/ui/status-pill.component';
@Component({
  selector: 'app-driver-summary',
  imports: [StatusPillComponent],
  templateUrl: './driver-summary.component.html',
  styleUrls: ['./driver-panel.shared.css', './driver-summary.component.css'],
})
export class DriverSummaryComponent {
  readonly driver = input.required<Driver>();
}

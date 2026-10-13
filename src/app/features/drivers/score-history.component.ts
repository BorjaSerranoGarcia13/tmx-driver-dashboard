import { Component, input, computed, signal } from '@angular/core';
import { Driver } from '../../core/models/tmx.models';

@Component({
  selector: 'app-score-history',
  imports: [],
  templateUrl: './score-history.component.html',
  styleUrls: ['./driver-panel.shared.css', './score-history.component.css'],
})
export class ScoreHistoryComponent {
  readonly driver = input.required<Driver>();
  readonly scoreRange = signal<'3m' | '6m' | '12m'>('6m');
  readonly visibleScoreHistory = computed(() =>
    this.driver().scoreHistory.slice(-{ '3m': 3, '6m': 6, '12m': 12 }[this.scoreRange()]),
  );
  readonly scoreRangeLabel = computed(
    () => ({ '3m': '3 months', '6m': '6 months', '12m': '12 months' })[this.scoreRange()],
  );
  readonly historyDescription = computed(() =>
    this.visibleScoreHistory()
      .map((point) => point.label + ': ' + point.score)
      .join(', '),
  );
  readonly scoreDelta = computed(() => {
    const points = this.visibleScoreHistory();
    return points.length > 1 ? points[points.length - 1].score - points[0].score : 0;
  });
  setScoreRange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === '3m' || value === '6m' || value === '12m') this.scoreRange.set(value);
  }
}

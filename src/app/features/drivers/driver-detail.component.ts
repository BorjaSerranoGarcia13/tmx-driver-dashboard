import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, distinctUntilChanged } from 'rxjs';
import { CRITERION_LABELS } from '../../core/models/tmx.models';
import { ErrorDialogService } from '../../shared/ui/error-dialog.service';
import { LoadingBlockComponent } from '../../shared/ui/loading-block.component';
import { StatusPillComponent } from '../../shared/ui/status-pill.component';
import { ReviewEditorComponent, ReviewDraft } from '../workspace/review-editor.component';
import { ReviewWorkFacade } from '../workspace/store/review-work.facade';
import { DriverFacade } from './store/driver.facade';
import { DriverSummaryComponent } from './driver-summary.component';
import { ScoreHistoryComponent } from './score-history.component';
import { BenefitExplanationComponent } from './benefit-explanation.component';

@Component({
  selector: 'app-driver-detail',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    LoadingBlockComponent,
    StatusPillComponent,
    ReviewEditorComponent,
    DriverSummaryComponent,
    ScoreHistoryComponent,
    BenefitExplanationComponent,
  ],
  templateUrl: './driver-detail.component.html',
  styleUrls: ['./driver-panel.shared.css', './driver-detail.component.css'],
  host: { '(window:beforeunload)': 'protectDraft($event)' },
})
export class DriverDetailComponent {
  readonly facade = inject(DriverFacade);
  readonly work = inject(ReviewWorkFacade);
  readonly criterionLabels = CRITERION_LABELS;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errorDialog = inject(ErrorDialogService);
  private readonly editor = viewChild(ReviewEditorComponent);
  readonly driverId = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );
  readonly workItem = computed(
    () => this.work.items().find((item) => item.driverId === this.driverId()) ?? null,
  );

  private readonly loadProfile = effect(() => {
    const id = this.driverId();
    if (id) untracked(() => this.facade.loadDriver(id));
  });
  private readonly showError = effect(() => {
    const error = this.facade.detailError();
    if (error)
      this.errorDialog.show({
        error,
        retry: error.retryable ? () => this.refresh() : undefined,
        secondaryLabel: 'Back to drivers',
        secondary: () => this.goBack(),
      });
  });

  hasUnsavedChanges(): boolean {
    return this.editor()?.hasChanges() ?? false;
  }
  protectDraft(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }
  refresh(): void {
    if (this.driverId()) this.facade.loadDriver(this.driverId());
  }
  saveWork(draft: ReviewDraft): void {
    const existing = this.workItem();
    const now = new Date().toISOString();
    this.work.upsert({
      ...draft,
      driverId: this.driverId(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }
  removeWork(): void {
    if (
      this.hasUnsavedChanges() &&
      !globalThis.confirm('Discard unsaved changes and remove this review?')
    )
      return;
    this.work.remove(this.driverId());
  }
  goBack(): void {
    void this.router.navigate(['/drivers']);
  }
}

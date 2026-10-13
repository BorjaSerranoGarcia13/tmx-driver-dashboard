import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { FormField, form, maxLength, validate } from '@angular/forms/signals';
import {
  REVIEW_WORK_NOTE_MAX_LENGTH,
  REVIEW_WORK_STATUSES,
  REVIEW_WORK_STATUS_LABELS,
  ReviewWorkItem,
  ReviewWorkStatus,
} from '../../core/models/review-work.models';
import { StatusPillComponent } from '../../shared/ui/status-pill.component';

export interface ReviewDraft {
  status: ReviewWorkStatus;
  note: string;
}

@Component({
  selector: 'app-review-editor',
  imports: [FormField, StatusPillComponent],
  template: `
    <section class="panel work-panel">
      <div class="panel__heading">
        <div>
          <span class="eyebrow">Personal workspace</span>
          <h2>Review this driver</h2>
        </div>
        @if (item(); as saved) {
          <app-status-pill [value]="saved.status" [label]="labels[saved.status]" />
        }
      </div>
      <form class="work-form" (submit)="onSubmit($event)" novalidate>
        <label class="work-field"
          ><span>Status</span>
          <select [formField]="reviewForm.status">
            @for (status of statuses; track status) {
              <option [value]="status">{{ labels[status] }}</option>
            }
          </select>
        </label>
        <label class="work-field work-field--note"
          ><span>Review note</span>
          <textarea
            [formField]="reviewForm.note"
            rows="3"
            aria-describedby="review-note-help"
            placeholder="What should you remember for the next review?"
          ></textarea>
          <small id="review-note-help"
            >{{ draft().note.length }}/{{ noteMaxLength }} characters</small
          >
        </label>
        @if (reviewForm().invalid()) {
          <p role="alert">
            Choose a valid status and keep the note within {{ noteMaxLength }} characters.
          </p>
        }
        @if (error()) {
          <p role="alert">{{ error() }}</p>
          @if (!ready()) {
            <button class="button button--ghost" type="button" (click)="retryStorage.emit()">
              Try again
            </button>
          }
        }
        <p role="status">
          {{
            saving()
              ? 'Saving…'
              : hasChanges()
                ? 'Unsaved changes'
                : item()
                  ? 'All changes saved'
                  : 'Not saved yet'
          }}
        </p>
        <div class="work-form__actions">
          <button
            class="button button--primary"
            type="submit"
            [disabled]="
              !ready() || saving() || reviewForm().invalid() || (!!item() && !hasChanges())
            "
          >
            {{ item() ? 'Save review' : 'Save to My work' }}
          </button>
          <button
            class="button button--ghost"
            type="button"
            [disabled]="!hasChanges() || saving()"
            (click)="cancel()"
          >
            Cancel changes
          </button>
          @if (item()) {
            <button
              class="button button--ghost"
              type="button"
              [disabled]="saving()"
              (click)="remove.emit()"
            >
              Remove from My work
            </button>
          }
        </div>
      </form>
    </section>
  `,
  styleUrl: './review-editor.component.css',
})
export class ReviewEditorComponent {
  readonly driverId = input.required<string>();
  readonly item = input<ReviewWorkItem | null>(null);
  readonly ready = input(true);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly save = output<ReviewDraft>();
  readonly remove = output<void>();
  readonly retryStorage = output<void>();
  readonly labels = REVIEW_WORK_STATUS_LABELS;
  readonly statuses = REVIEW_WORK_STATUSES;
  readonly noteMaxLength = REVIEW_WORK_NOTE_MAX_LENGTH;
  // Unrelated workspace updates must not reset an edited draft.
  private readonly baseline = computed(
    () => ({
      driverId: this.driverId(),
      status: this.item()?.status ?? ('saved' as ReviewWorkStatus),
      note: this.item()?.note ?? '',
      updatedAt: this.item()?.updatedAt ?? '',
    }),
    {
      equal: (a, b) =>
        a.driverId === b.driverId &&
        a.status === b.status &&
        a.note === b.note &&
        a.updatedAt === b.updatedAt,
    },
  );
  readonly draft = linkedSignal((): ReviewDraft => ({
    status: this.baseline().status,
    note: this.baseline().note,
  }));
  readonly reviewForm = form(this.draft, (path) => {
    maxLength(path.note, REVIEW_WORK_NOTE_MAX_LENGTH);
    validate(path.status, ({ value }) =>
      REVIEW_WORK_STATUSES.includes(value())
        ? null
        : { kind: 'status', message: 'Choose a valid status.' },
    );
  });
  readonly hasChanges = computed(
    () =>
      this.draft().note !== this.baseline().note || this.draft().status !== this.baseline().status,
  );

  cancel(): void {
    this.reviewForm().reset({ status: this.baseline().status, note: this.baseline().note });
  }
  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.ready() || this.saving() || this.reviewForm().invalid()) return;
    if (this.item() && !this.hasChanges()) return;
    this.save.emit({ ...this.draft(), note: this.draft().note.trim() });
  }
}

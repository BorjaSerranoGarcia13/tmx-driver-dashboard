import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-block',
  template: `
    <div class="loading-block" [style.min-height.px]="height()" role="status" aria-live="polite">
      <span class="sr-only">Loading data</span>
    </div>
  `,
  styleUrl: './loading-block.component.css',
})
export class LoadingBlockComponent {
  readonly height = input(180);
}

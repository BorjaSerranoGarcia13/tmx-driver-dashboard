import { Injectable, signal } from '@angular/core';
import { ApiError } from '../../core/models/tmx.models';

export interface ErrorDialogState {
  readonly id: number;
  readonly error: ApiError;
  readonly retry?: () => void;
  readonly secondaryLabel?: string;
  readonly secondary?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ErrorDialogService {
  private nextId = 0;
  private readonly state = signal<ErrorDialogState | null>(null);
  readonly dialog = this.state.asReadonly();

  show(input: Omit<ErrorDialogState, 'id'>): void {
    this.state.set({ ...input, id: ++this.nextId });
  }

  close(): void {
    this.state.set(null);
  }
}

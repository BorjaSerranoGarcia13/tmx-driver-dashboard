import { TestBed } from '@angular/core/testing';
import { ReviewEditorComponent } from './review-editor.component';

describe('ReviewEditorComponent', () => {
  async function setup() {
    const fixture = TestBed.createComponent(ReviewEditorComponent);
    fixture.componentRef.setInput('driverId', 'driver-a');
    await fixture.whenStable();
    return fixture;
  }
  it('validates, emits a typed draft and cancels edits', async () => {
    const fixture = await setup();
    const editor = fixture.componentInstance;
    const saved = vi.fn();
    editor.save.subscribe(saved);
    editor.reviewForm.note().value.set('x'.repeat(501));
    expect(editor.reviewForm().invalid()).toBe(true);
    editor.onSubmit(new Event('submit'));
    expect(saved).not.toHaveBeenCalled();
    editor.reviewForm.note().value.set('  Review next week  ');
    editor.onSubmit(new Event('submit'));
    expect(saved).toHaveBeenCalledWith({ status: 'saved', note: 'Review next week' });
    expect(editor.hasChanges()).toBe(true);
    editor.cancel();
    expect(editor.draft().note).toBe('');
    expect(editor.hasChanges()).toBe(false);
  });
  it('retains drafts after failure and unrelated input updates, resets for another driver', async () => {
    const fixture = await setup();
    const editor = fixture.componentInstance;
    editor.reviewForm.note().value.set('Keep me');
    fixture.componentRef.setInput('error', 'Storage blocked');
    await fixture.whenStable();
    expect(editor.draft().note).toBe('Keep me');
    expect(fixture.nativeElement.textContent).toContain('Storage blocked');
    fixture.componentRef.setInput('driverId', 'driver-b');
    await fixture.whenStable();
    expect(editor.hasChanges()).toBe(false);
    expect(editor.draft().note).toBe('');
  });
  it('does not discard edits when the same saved record is rehydrated', async () => {
    const fixture = await setup();
    const item = {
      driverId: 'driver-a',
      status: 'saved',
      note: 'Original',
      updatedAt: '2026-10-12T10:00:00Z',
      createdAt: '2026-10-12T10:00:00Z',
    };
    fixture.componentRef.setInput('item', item);
    await fixture.whenStable();
    fixture.componentInstance.reviewForm.note().value.set('Edited');
    fixture.componentRef.setInput('item', { ...item });
    await fixture.whenStable();
    expect(fixture.componentInstance.draft().note).toBe('Edited');
  });
});

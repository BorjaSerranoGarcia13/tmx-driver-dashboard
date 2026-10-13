import { Routes } from '@angular/router';
import { AppShellComponent } from './app-shell.component';
import { pendingReviewGuard } from './features/drivers/pending-review.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (module) => module.DashboardComponent,
          ),
      },
      {
        path: 'drivers',
        loadComponent: () =>
          import('./features/drivers/driver-list.component').then(
            (module) => module.DriverListComponent,
          ),
      },
      {
        path: 'fleet',
        loadComponent: () =>
          import('./features/fleet/fleet-overview.component').then(
            (module) => module.FleetOverviewComponent,
          ),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./features/reviews/review-queue.component').then(
            (module) => module.ReviewQueueComponent,
          ),
      },
      {
        path: 'my-work',
        loadComponent: () =>
          import('./features/workspace/workspace.component').then(
            (module) => module.WorkspaceComponent,
          ),
      },
      {
        path: 'drivers/:id',
        canDeactivate: [pendingReviewGuard],
        loadComponent: () =>
          import('./features/drivers/driver-detail.component').then(
            (module) => module.DriverDetailComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];

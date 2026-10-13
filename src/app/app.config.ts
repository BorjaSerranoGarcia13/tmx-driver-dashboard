import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { mockApiInterceptor } from './core/api/mock-api.interceptor';
import { DriverEffects } from './features/drivers/store/driver.effects';
import { driverReducer } from './features/drivers/store/driver.reducer';
import { ReviewWorkEffects } from './features/workspace/store/review-work.effects';
import { reviewWorkReducer } from './features/workspace/store/review-work.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([mockApiInterceptor])),
    provideStore({ drivers: driverReducer, reviewWork: reviewWorkReducer }),
    provideEffects(DriverEffects, ReviewWorkEffects),
  ],
};

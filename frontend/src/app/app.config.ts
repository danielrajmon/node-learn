import { ApplicationConfig, provideBrowserGlobalErrorListeners, ENVIRONMENT_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideQuillConfig } from 'ngx-quill';
import { authInterceptor } from './interceptors/auth.interceptor';
import { SecurityContext } from '@angular/core';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideQuillConfig({
      theme: 'snow',
      modules: {
        syntax: false
      }
    }),
    {
      provide: ENVIRONMENT_INITIALIZER,
      useValue: () => {
        // Suppress sanitization warnings
        if (typeof window !== 'undefined') {
          const originalWarn = console.warn;
          console.warn = (...args: any[]) => {
            if (args[0]?.includes?.('sanitizing HTML stripped')) {
              return;
            }
            originalWarn.apply(console, args);
          };
        }
      },
      multi: true
    }
  ]
};

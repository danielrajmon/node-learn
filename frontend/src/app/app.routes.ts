import { Routes } from '@angular/router';
import { Quiz } from './quiz/quiz';

export const routes: Routes = [
  { path: '', component: Quiz },
  { path: '**', redirectTo: '' }
];

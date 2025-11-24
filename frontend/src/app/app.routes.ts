import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Quiz } from './quiz/quiz';
import { Questions } from './questions/questions';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'quiz', component: Quiz },
  { path: 'questions', component: Questions },
  { path: '**', redirectTo: '' }
];

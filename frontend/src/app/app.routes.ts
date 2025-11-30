import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Learn } from './learn/learn';
import { Questions } from './questions/questions';
import { AdminComponent } from './admin/admin';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'learn', component: Learn },
  { path: 'questions', component: Questions },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];

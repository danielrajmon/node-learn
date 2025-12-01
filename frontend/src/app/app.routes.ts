import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Learn } from './learn/learn';
import { Questions } from './questions/questions';
import { Quiz } from './quiz/quiz';
import { AdminComponent } from './admin/admin';
import { LoginComponent } from './login/login';
import { AuthCallbackComponent } from './auth-callback/auth-callback';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'learn', component: Learn },
  { path: 'questions', component: Questions },
  { path: 'quiz', component: Quiz },
  { path: 'admin', component: AdminComponent },
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: '**', redirectTo: '' }
];

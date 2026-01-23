import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Learn } from './learn/learn';
import { Questions } from './questions/questions';
import { Quiz } from './quiz/quiz';
import { AdminComponent } from './admin/admin';
import { LoginComponent } from './login/login';
import { AuthCallbackComponent } from './auth-callback/auth-callback';
import { AchievementsComponent } from './achievements/achievements';
import { StatsComponent } from './stats/stats';
import { LeaderboardsComponent } from './leaderboards/leaderboards';
import { UnsavedChangesGuard } from './guards/unsaved-changes.guard';
import { AuthGuard, AdminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'learn', component: Learn },
  { path: 'questions', component: Questions },
  { path: 'questions/:id', component: Questions },
  { path: 'quiz', component: Quiz, canDeactivate: [UnsavedChangesGuard] },
  { path: 'leaderboards', component: LeaderboardsComponent },
  { path: 'achievements', component: AchievementsComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: '**', redirectTo: '' }
];

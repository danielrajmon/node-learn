import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Learn } from './learn/learn';
import { Questions } from './questions/questions';
import { Quiz } from './quiz/quiz';
import { AdminComponent } from './admin/admin';
import { AdminLayoutComponent } from './admin/admin-layout';
import { AdminUsersComponent } from './admin-users/admin-users';
import { AdminMigrationsComponent } from './admin-migrations/admin-migrations';
import { AdminServicesComponent } from './admin-services/admin-services';
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
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: 'questions', component: AdminComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'migrations', component: AdminMigrationsComponent },
      { path: 'services', component: AdminServicesComponent },
      { path: '', redirectTo: 'questions', pathMatch: 'full' }
    ]
  },
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: '**', redirectTo: '' }
];

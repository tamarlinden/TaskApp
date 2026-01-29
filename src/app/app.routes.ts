import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Teams } from './components/teams/teams';
import { Projects } from './components/projects/projects';
import { Tasks } from './components/tasks/tasks';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', component: Login },
    { path: 'login', component: Login },
    { path: 'teams', component: Teams, canActivate: [authGuard] },
    { path: 'projects/:teamId', component: Projects, canActivate: [authGuard] },
    { path: 'tasks/:projectId', component: Tasks, canActivate: [authGuard] }
];

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { SignupComponent } from './components/auth/signup/signup.component';
import { ResultsComponent } from './components/results/results.component';
import { JobsComponent } from './components/jobs/jobs.component';
import { CvTemplatesComponent } from './components/cv-templates/cv-templates.component';
import { HomeComponent } from './components/home/home.component';
import { CvAnalysisComponent } from './components/cv-analysis/cv-analysis.component';
import { SavedJobsComponent } from './components/saved-jobs/saved-jobs.component';
import { JobSkillsComponent } from './components/job-skills/job-skills.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'results', component: ResultsComponent, canActivate: [AuthGuard] },
  { path: 'jobs', component: JobsComponent, canActivate: [AuthGuard] },
  { path: 'saved-jobs', component: SavedJobsComponent, canActivate: [AuthGuard] },
  { path: 'job-skills/:id', component: JobSkillsComponent, canActivate: [AuthGuard] },
  { path: 'cv-templates', component: CvTemplatesComponent, canActivate: [AuthGuard] },
  { path: 'cv-analysis/:id', component: CvAnalysisComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule { }

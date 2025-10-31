import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

// Components
import { HomeComponent } from './components/home/home.component';
import { CoursesComponent } from './components/courses/courses.component';
import { CourseDetailComponent } from './components/course-detail/course-detail.component';
import { CourseFormComponent } from './components/course-form/course-form.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { LessonFormComponent } from './components/lesson-form/lesson-form.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { LessonDetailComponent } from './components/lesson-detail/lesson-detail.component';
import { CertificateViewComponent } from './components/certificates/certificate-view.component';
import { MyCertificatesComponent } from './components/certificates/my-certificates.component';

const routes: Routes = [
  // Public routes
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'courses', component: CoursesComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  
  // Protected routes
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'lessons/:id', component: LessonDetailComponent },
  { path: 'my-certificates', component: MyCertificatesComponent, canActivate: [AuthGuard] },
  { path: 'certificate/:id', component: CertificateViewComponent },
  
  // Instructor routes - MUST come before generic courses/:id route
  { path: 'courses/create', component: CourseFormComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['INSTRUCTOR', 'ADMIN'] } },
  { path: 'courses/:id/edit', component: CourseFormComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['INSTRUCTOR', 'ADMIN'] } },
  { path: 'courses/:courseId/lessons/create', component: LessonFormComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['INSTRUCTOR', 'ADMIN'] } },
  { path: 'courses/:courseId/lessons/:lessonId/edit', component: LessonFormComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['INSTRUCTOR', 'ADMIN'] } },
  
  // Generic course detail route - MUST come after specific routes
  { path: 'courses/:id', component: CourseDetailComponent },
  
  // Admin routes
  { path: 'admin', component: AdminPanelComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['ADMIN'] } },
  
  // Error routes
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '/404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
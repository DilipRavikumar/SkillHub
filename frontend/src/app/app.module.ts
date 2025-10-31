import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';

// Toastr
import { ToastrModule } from 'ngx-toastr';

// Charts
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { CoursesComponent } from './components/courses/courses.component';
import { CourseCardComponent } from './components/course-card/course-card.component';
import { CourseDetailComponent } from './components/course-detail/course-detail.component';
import { CourseFormComponent } from './components/course-form/course-form.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { LessonFormComponent } from './components/lesson-form/lesson-form.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { VideoUploadComponent } from './components/video-upload/video-upload.component';
import { LessonDetailComponent } from './components/lesson-detail/lesson-detail.component';
import { CertificateViewComponent } from './components/certificates/certificate-view.component';
import { MyCertificatesComponent } from './components/certificates/my-certificates.component';

// Services
import { AuthService } from './services/auth.service';
import { CourseService } from './services/course.service';
import { UserService } from './services/user.service';
import { NotificationService } from './services/notification.service';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    CoursesComponent,
    CourseCardComponent,
    CourseDetailComponent,
    CourseFormComponent,
    DashboardComponent,
    LoginComponent,
    SignupComponent,
    ProfileComponent,
    AdminPanelComponent,
    LessonFormComponent,
    NotFoundComponent,
    VideoPlayerComponent,
    VideoUploadComponent,
    LessonDetailComponent,
    CertificateViewComponent,
    MyCertificatesComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    
    // Angular Material
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatTableModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule,
    MatStepperModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSliderModule,
    MatMenuModule,
    MatTooltipModule,
    MatExpansionModule,
    MatDividerModule,
    
    // Charts
    BaseChartDirective,
    
    // Toastr
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-right',
      timeOut: 2000,  
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
      enableHtml: true,
      progressAnimation: 'increasing',
      easeTime: 300,
      extendedTimeOut: 500,
      tapToDismiss: true,
      newestOnTop: true,
      toastClass: 'toast-modern',
      titleClass: 'toast-modern-title',
      messageClass: 'toast-modern-message',
      iconClasses: {
        error: 'toast-modern-icon toast-modern-error',
        info: 'toast-modern-icon toast-modern-info',
        success: 'toast-modern-icon toast-modern-success',
        warning: 'toast-modern-icon toast-modern-warning'
      }
    })
  ],
  providers: [
    AuthService,
    CourseService,
    UserService,
    NotificationService,
    provideCharts(withDefaultRegisterables()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

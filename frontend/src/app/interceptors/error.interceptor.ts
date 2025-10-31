import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = error.error.message;
          this.notificationService.networkError();
        } else {
          // Server-side error
          switch (error.status) {
            case 400:
              errorMessage = error.error?.message || 'Bad Request';
              this.notificationService.showError(errorMessage, 'Bad Request');
              break;
            case 401:
              errorMessage = 'Unauthorized access';
              // Only redirect to login for protected endpoints, not public ones
              const isPublicEndpoint = this.isPublicEndpoint(request.url);
              // Also check if this is a dashboard or profile endpoint
              const isDashboardOrProfileEndpoint = this.isDashboardOrProfileEndpoint(request.url);
              
              if (!isPublicEndpoint && !isDashboardOrProfileEndpoint) {
                // Only redirect on 401 if it's not a dashboard/profile call
                // Dashboard/profile errors should be handled by the component
                this.notificationService.unauthorizedError();
                this.authService.logout();
                this.router.navigate(['/login']);
              } else {
                console.log('401 error on public/dashboard/profile endpoint, allowing component to handle:', request.url);
              }
              break;
            case 403:
              errorMessage = 'Forbidden - You do not have permission';
              this.notificationService.unauthorizedError();
              break;
            case 404:
              errorMessage = 'Resource not found';
              this.notificationService.notFoundError();
              break;
            case 409:
              errorMessage = error.error?.message || 'Conflict - Resource already exists';
              this.notificationService.showError(errorMessage, 'Conflict');
              break;
            case 422:
              errorMessage = error.error?.message || 'Validation error';
              this.notificationService.showError(errorMessage, 'Validation Error');
              break;
            case 500:
              errorMessage = 'Internal server error';
              this.notificationService.serverError();
              break;
            case 503:
              errorMessage = 'Service unavailable';
              this.notificationService.showError('Service is temporarily unavailable', 'Service Unavailable');
              break;
            default:
              errorMessage = error.error?.message || `Error ${error.status}`;
              this.notificationService.showError(errorMessage, 'Error');
          }
        }

        return throwError(() => error);
      })
    );
  }

  private isPublicEndpoint(url: string): boolean {
    // Define public endpoints that shouldn't redirect to login on 401
    const publicEndpoints = [
      '/api/courses',
      '/api/lessons',
      '/api/video'
    ];
    
    return publicEndpoints.some(endpoint => url.includes(endpoint));
  }

  private isDashboardOrProfileEndpoint(url: string): boolean {
    // Define dashboard and profile endpoints where 401 should be handled gracefully
    const dashboardProfileEndpoints = [
      '/api/student/dashboard',
      '/api/instructor/dashboard',
      '/api/admin/dashboard',
      '/api/enrollments/my-enrollments',
      '/api/certificates/my-certificates',
      '/api/certificates/student/my-certificates',
      '/api/instructor/courses',
      '/api/admin/users',
      '/api/admin/total-enrollments',
      '/api/enrollments/student/my-enrollments',
      '/api/courses/instructor/my-courses'
    ];
    
    return dashboardProfileEndpoints.some(endpoint => url.includes(endpoint));
  }
}

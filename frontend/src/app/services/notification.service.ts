import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private toastr: ToastrService) {}

  showSuccess(message: string, title?: string): void {
    this.toastr.success(message, title, {
      timeOut: 2000,
      positionClass: 'toast-top-right',
      closeButton: true,
      progressBar: true
    });
  }

  showError(message: string, title?: string): void {
    this.toastr.error(message, title, {
      timeOut: 3000,
      positionClass: 'toast-top-right',
      closeButton: true,
      progressBar: true
    });
  }

  showInfo(message: string, title?: string): void {
    this.toastr.info(message, title, {
      timeOut: 2000,
      positionClass: 'toast-top-right',
      closeButton: true,
      progressBar: true
    });
  }

  showWarning(message: string, title?: string): void {
    this.toastr.warning(message, title, {
      timeOut: 2000,
      positionClass: 'toast-top-right',
      closeButton: true,
      progressBar: true
    });
  }

  // Specific notification methods for common actions
  loginSuccess(userName: string): void {
    this.showSuccess(`Welcome back, ${userName}!`, 'Login Successful');
  }

  loginError(): void {
    this.showError('Invalid email or password. Please try again.', 'Login Failed');
  }

  registrationSuccess(): void {
    this.showSuccess('Account created successfully! Welcome to SkillHub.', 'Registration Successful');
  }

  registrationError(): void {
    this.showError('Registration failed. Please try again.', 'Registration Failed');
  }

  enrollmentSuccess(courseName: string): void {
    this.showSuccess(`Successfully enrolled in "${courseName}"!`, 'Enrollment Successful');
  }

  enrollmentError(): void {
    this.showError('Enrollment failed. Please try again.', 'Enrollment Failed');
  }

  courseCreated(): void {
    this.showSuccess('Course created successfully!', 'Course Created');
  }

  courseUpdated(): void {
    this.showSuccess('Course updated successfully!', 'Course Updated');
  }

  courseDeleted(): void {
    this.showSuccess('Course deleted successfully!', 'Course Deleted');
  }

  profileUpdated(): void {
    this.showSuccess('Profile updated successfully!', 'Profile Updated');
  }

  logoutSuccess(): void {
    this.showInfo('You have been logged out successfully.', 'Logout');
  }

  networkError(): void {
    this.showError('Network error. Please check your connection.', 'Connection Error');
  }

  unauthorizedError(): void {
    this.showError('You are not authorized to perform this action.', 'Unauthorized');
  }

  notFoundError(): void {
    this.showError('The requested resource was not found.', 'Not Found');
  }

  serverError(): void {
    this.showError('Server error. Please try again later.', 'Server Error');
  }
}

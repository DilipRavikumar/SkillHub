// src/app/components/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { CourseService } from '../../services/course.service';
import { NotificationService } from '../../services/notification.service';
import { User, Enrollment, Certificate } from '../../models/user.model';
import { Course } from '../../models/course.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  enrollments: Enrollment[] = [];
  certificates: Certificate[] = [];
  instructorCourses: Course[] = [];
  allUsers: User[] = [];
  allCourses: Course[] = [];
  enrolledCourses = 0;
  completedCourses = 0;
  totalLearningTime = '0';
  totalStudents = 0;
  totalInstructors = 0;
  totalCourses = 0;
  totalEnrollments = 0;
  
  // Edit mode
  isEditing = false;
  editForm = {
    name: '',
    email: ''
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private courseService: CourseService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Load user from auth service, with fallback to localStorage
    this.currentUser = this.authService.getCurrentUser();
    
    // If user is not in BehaviorSubject, try to load from storage directly
    if (!this.currentUser) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);
          console.log('Profile: Loaded user from localStorage:', this.currentUser);
        } catch (e) {
          console.error('Profile: Failed to parse user from localStorage:', e);
        }
      }
    }
    
    // Only redirect if we still don't have a user after checking storage
    if (!this.currentUser) {
      console.log('Profile: No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('Profile: Loading data for user:', this.currentUser);
    this.loadProfileData();
  }

  loadProfileData(): void {
    // Certificates are now shown in navbar dropdown, not on profile page
    // if (this.currentUser?.role === 'STUDENT') {
    //   this.loadCertificates();
    // }
  }

  loadCertificates(): void {
    // Real-time certificates data from backend
    this.userService.getCertificates().subscribe({
      next: (certificates) => {
        this.certificates = certificates;
      },
      error: (error) => {
        console.error('Error loading certificates:', error);
        // Fallback to empty array if no certificates
        this.certificates = [];
        // Don't show error notification for certificates as they're optional
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = true;
    this.editForm = {
      name: this.currentUser?.name || '',
      email: this.currentUser?.email || ''
    };
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editForm = {
      name: '',
      email: ''
    };
  }

  saveProfile(): void {
    if (!this.currentUser) return;

    // Validate form
    if (!this.editForm.name || !this.editForm.email) {
      this.notificationService.showError('Name and email are required', 'Validation Error');
      return;
    }

    // Update user profile via auth service (name and email only)
    this.authService.updateProfile({
      name: this.editForm.name,
      email: this.editForm.email
    }).subscribe({
      next: (updatedUser) => {
        this.currentUser = updatedUser;
        this.isEditing = false;
        this.notificationService.showSuccess('Profile updated successfully!');
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.notificationService.showError(
          error.error?.message || 'Failed to update profile. Please try again.',
          'Update Failed'
        );
      }
    });
  }

  downloadCertificate(certificate: Certificate): void {
    // Real certificate download functionality
    window.open(certificate.certificateUrl, '_blank');
  }
}

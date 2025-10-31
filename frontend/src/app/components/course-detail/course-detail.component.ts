import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { CertificateService } from '../../services/certificate.service';
import { Course } from '../../models/course.model';

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.css']
})
export class CourseDetailComponent implements OnInit {
  course: Course | null = null;
  courseId!: number;
  isEnrolling = false;
  isInstructor = false;
  lessonAccessibility: Map<number, boolean> = new Map();
  lessonCompletion: Map<number, boolean> = new Map();
  certificateEligible = false;
  hasCertificate = false;
  completionPercentage: number = 0;
  checkingCertificate = false;
  isEnrolled = false;
  isCheckingEnrollment = false;

  // Make Math available in template
  Math = Math;

  // Helper method to cap progress at 100%
  capProgress(progress: number): number {
    return Math.min(Math.max(progress || 0, 0), 100);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private certificateService: CertificateService
  ) {}

  ngOnInit(): void {
    this.courseId = +this.route.snapshot.paramMap.get('id')!;
    this.loadCourse();
    this.checkUserRole();
    if (!this.isInstructor) {
      this.checkEnrollmentStatus();
      this.checkCertificateEligibility();
      this.loadCompletionPercentage();
    }
  }

  checkEnrollmentStatus(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }
    
    this.isCheckingEnrollment = true;
    this.courseService.getStudentEnrollments().subscribe({
      next: (enrollments: any[]) => {
        this.isEnrolled = enrollments.some(e => e.course?.id === this.courseId || e.courseId === this.courseId);
        this.isCheckingEnrollment = false;
      },
      error: (error) => {
        console.error('Error checking enrollment:', error);
        this.isCheckingEnrollment = false;
      }
    });
  }

  checkUserRole(): void {
    try {
      const currentUser = this.authService.getCurrentUser();
      this.isInstructor = currentUser?.role === 'INSTRUCTOR' || currentUser?.role === 'ADMIN';
    } catch (error) {
      // If there's an error getting the user, assume not an instructor
      this.isInstructor = false;
    }
  }

  loadCourse(): void {
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.course = course;
        if (!this.isInstructor) {
          this.loadLessonAccessibility();
          // Check if course is completed and show toast
          this.checkCourseCompletion();
        }
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.course = null;
        // Don't redirect to login for course viewing - this should be public
        if (error.status === 401) {
          console.log('Course access requires authentication, but this should be public');
        }
      }
    });
  }

  async enrollInCourse(): Promise<void> {
    if (!this.course) return;

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.notificationService.showWarning('Please login to enroll in courses', 'Authentication Required');
      this.router.navigate(['/login']);
      return;
    }

    // Check if user is a student
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role !== 'STUDENT') {
      this.notificationService.showWarning('Only students can enroll in courses', 'Access Denied');
      return;
    }

    this.isEnrolling = true;

    try {
      const response = await this.courseService.enrollInCourse(this.courseId).toPromise();
      this.notificationService.enrollmentSuccess(this.course.title);
      this.isEnrolled = true; // Mark as enrolled
      this.checkEnrollmentStatus(); // Refresh enrollment status
      this.checkCertificateEligibility(); // Refresh certificate eligibility
      this.loadCompletionPercentage(); // Refresh completion percentage
      // Don't navigate, stay on course page
      // this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Enrollment error:', error);
      if (error.status === 400) {
        this.notificationService.showWarning('You are already enrolled in this course!', 'Already Enrolled');
        this.isEnrolled = true; // Mark as enrolled
        this.checkEnrollmentStatus(); // Refresh enrollment status
        this.checkCertificateEligibility(); // Refresh certificate eligibility
        this.loadCompletionPercentage(); // Refresh completion percentage
      } else if (error.status === 401) {
        this.notificationService.showWarning('Please login to enroll in courses', 'Authentication Required');
        this.router.navigate(['/login']);
      } else {
        this.notificationService.enrollmentError();
      }
    } finally {
      this.isEnrolling = false;
    }
  }

  checkCourseCompletion(): void {
    // Check if course is 100% complete (capped progress)
    if (this.capProgress(this.completionPercentage) >= 100) {
      this.notificationService.showSuccess(
        `Congratulations! You've completed "${this.course?.title}" course!`,
        'Course Completed! 🎉'
      );
    }
  }

  editCourse(): void {
    this.router.navigate(['/courses', this.courseId, 'edit']);
  }

  addLesson(): void {
    this.router.navigate(['/courses', this.courseId, 'lessons', 'create']);
  }

  editLesson(lessonId: number): void {
    this.router.navigate(['/courses', this.courseId, 'lessons', lessonId, 'edit']);
  }

  deleteLesson(lessonId: number): void {
    if (confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      this.courseService.deleteLesson(lessonId).subscribe({
        next: () => {
          console.log('Lesson deleted successfully');
          this.notificationService.showSuccess('Lesson deleted successfully!', 'Lesson Deleted');
          this.loadCourse(); // Reload the course to update the lessons list
        },
        error: (error) => {
          console.error('Error deleting lesson:', error);
          this.notificationService.showError('Failed to delete lesson. Please try again.', 'Delete Failed');
        }
      });
    }
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  loadLessonAccessibility(): void {
    if (!this.course?.lessons) return;
    
    this.course.lessons.forEach(lesson => {
      // Check accessibility
      this.courseService.checkLessonAccessibility(lesson.id).subscribe({
        next: (response: any) => {
          this.lessonAccessibility.set(lesson.id, response.isAccessible);
        },
        error: (error) => {
          console.error('Error checking lesson accessibility:', error);
          this.lessonAccessibility.set(lesson.id, false);
        }
      });

      // Check completion status
      this.courseService.getLessonProgress(lesson.id).subscribe({
        next: (progress: any) => {
          this.lessonCompletion.set(lesson.id, progress.isCompleted || false);
        },
        error: (error) => {
          console.error('Error checking lesson completion:', error);
          this.lessonCompletion.set(lesson.id, false);
        }
      });
    });
  }

  isLessonAccessible(lessonId: number): boolean {
    return this.lessonAccessibility.get(lessonId) || false;
  }

  isLessonCompleted(lessonId: number): boolean {
    return this.lessonCompletion.get(lessonId) || false;
  }

  navigateToLesson(lessonId: number): void {
    if (!this.isInstructor && !this.isLessonAccessible(lessonId)) {
      this.notificationService.showWarning('Please complete the previous lesson to unlock this lesson.', 'Lesson Locked');
      return;
    }
    this.router.navigate(['/lessons', lessonId]);
  }

  checkCertificateEligibility(): void {
    this.checkingCertificate = true;
    this.certificateService.checkEligibility(this.courseId).subscribe({
      next: (eligibility) => {
        // If eligible is true, check if certificate already exists
        if (eligibility.eligible) {
          this.certificateService.getMyCertificates().subscribe({
            next: (certificates) => {
              // Check if certificate for this course already exists by matching course title
              this.hasCertificate = certificates.some(cert => 
                cert.courseTitle === this.course?.title
              );
              // Only show eligible button if certificate doesn't exist yet
              this.certificateEligible = !this.hasCertificate;
              this.checkingCertificate = false;
            },
            error: () => {
              this.certificateEligible = true;
              this.hasCertificate = false;
              this.checkingCertificate = false;
            }
          });
        } else {
          this.certificateEligible = false;
          this.hasCertificate = false;
          this.checkingCertificate = false;
        }
      },
      error: (error) => {
        console.error('Error checking certificate eligibility:', error);
        this.checkingCertificate = false;
      }
    });
  }

  loadCompletionPercentage(): void {
    this.certificateService.getCompletionPercentage(this.courseId).subscribe({
      next: (response) => {
        this.completionPercentage = this.capProgress(response.completion || 0);
        // Check completion and show toast
        if (this.capProgress(this.completionPercentage) >= 100) {
          setTimeout(() => {
            this.checkCourseCompletion();
          }, 1000); // Delay to ensure course is loaded
        }
      },
      error: (error) => {
        console.error('Error loading completion percentage:', error);
      }
    });
  }

  issueCertificate(): void {
    this.checkingCertificate = true;
    this.certificateService.issueCertificate(this.courseId).subscribe({
      next: (certificate) => {
        this.notificationService.showSuccess(
          `Certificate issued! Certificate ID: ${certificate.certificateNumber}`,
          'Certificate Issued'
        );
        this.checkingCertificate = false;
        this.hasCertificate = true;
        this.certificateEligible = false;
        // Navigate to my certificates page
        this.router.navigate(['/my-certificates']);
      },
      error: (error) => {
        console.error('Error issuing certificate:', error);
        this.checkingCertificate = false;
        let errorMessage = 'Failed to issue certificate. Please try again.';
        
        if (error.error) {
          // If error.error is a string, use it directly
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } 
          // If error.error is an object, try to extract the message
          else if (error.error.error) {
            errorMessage = error.error.error;
          }
        }
        
        this.notificationService.showError(errorMessage, 'Certificate Error');
      }
    });
  }

  viewCertificate(): void {
    this.router.navigate(['/my-certificates']);
  }
}

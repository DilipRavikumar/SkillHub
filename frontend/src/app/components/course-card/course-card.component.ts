import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Course } from '../../models/course.model';

@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.css']
})
export class CourseCardComponent {
  @Input() course!: Course;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Output() enroll = new EventEmitter<number>();
  @Output() view = new EventEmitter<number>();
  isEnrolling = false;

  constructor(
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  viewCourse(): void {
    this.view.emit(this.course.id);
    this.router.navigate(['/courses', this.course.id]);
  }

  getLessonCount(): number {
    // Use lessonCount from backend if available, otherwise fall back to lessons array length
    return this.course.lessonCount ?? this.course.lessons?.length ?? 0;
  }

  async enrollCourse(event: Event): Promise<void> {
    event.stopPropagation();
    
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
      const response = await this.courseService.enrollInCourse(this.course.id).toPromise();
      this.notificationService.enrollmentSuccess(this.course.title);
      this.enroll.emit(this.course.id);
    } catch (error: any) {
      console.error('Enrollment error:', error);
      if (error.status === 400) {
        this.notificationService.showWarning('You are already enrolled in this course!', 'Already Enrolled');
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
}

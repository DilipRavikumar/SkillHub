import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Course } from '../models/course.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`);
  }

  getAllCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`);
  }

  getCourseById(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/courses/${id}`);
  }

  createCourse(course: Partial<Course>): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/courses`, course)
      .pipe(tap(() => {
        this.notificationService.courseCreated();
      }));
  }

  updateCourse(id: number, course: Partial<Course>): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/courses/${id}`, course)
      .pipe(tap(() => {
        this.notificationService.courseUpdated();
      }));
  }

  deleteCourse(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/courses/${id}`, {
      headers: this.getHeaders()
    });
  }

  getInstructorCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`, {
      headers: this.getHeaders()
    });
  }

  enrollInCourse(courseId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/enrollments/enroll`, { courseId })
      .pipe(tap(() => {
        this.notificationService.enrollmentSuccess('Course');
      }));
  }

  unenrollFromCourse(courseId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/enrollments/unenroll/${courseId}`);
  }

  getStudentEnrollments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/enrollments/student/my-enrollments`);
  }

  updateProgress(courseId: number, lessonId: number, completed: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/enrollments/progress`, {
      courseId,
      lessonId,
      completed
    });
  }

  getCertificates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/certificates/student/my-certificates`);
  }

  // Lesson-related methods
  createLesson(courseId: number, lesson: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${courseId}/lessons`, lesson)
      .pipe(tap(() => {
        this.notificationService.showSuccess('Lesson created successfully!');
      }));
  }

  updateLesson(lessonId: number, lesson: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/lessons/${lessonId}`, lesson)
      .pipe(tap(() => {
        this.notificationService.showSuccess('Lesson updated successfully!');
      }));
  }

  getLessonsByCourse(courseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/courses/${courseId}/lessons`);
  }

  getLessonById(lessonId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/lessons/${lessonId}`);
  }

  deleteLesson(lessonId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/lessons/${lessonId}`)
      .pipe(tap(() => {
        this.notificationService.showSuccess('Lesson deleted successfully!');
      }));
  }

  // Lesson accessibility methods
  checkLessonAccessibility(lessonId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/lesson/${lessonId}/accessibility`);
  }

  getLessonProgress(lessonId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/video-progress/${lessonId}`);
  }

  getNextAccessibleLesson(courseId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/courses/${courseId}/next-lesson`);
  }

  // Image upload method
  uploadImage(file: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/upload/image`, file);
  }

  // Platform statistics
  getPlatformStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/stats`);
  }

  // Public platform statistics (no auth required)
  getPublicStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}

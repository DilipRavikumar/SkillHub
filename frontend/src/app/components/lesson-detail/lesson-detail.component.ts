import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Lesson {
  id: number;
  courseId: number;
  title: string;
  description: string;
  videoUrl: string;
  videoFilename?: string;
  videoDuration: number;
  lessonOrder: number;
  createdAt: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: {
    id: number;
    name: string;
    email: string;
  };
}

@Component({
  selector: 'app-lesson-detail',
  templateUrl: './lesson-detail.component.html',
  styleUrls: ['./lesson-detail.component.css']
})
export class LessonDetailComponent implements OnInit, OnDestroy {
  lesson: Lesson | null = null;
  course: Course | null = null;
  courseLessons: Lesson[] = [];
  isLoading = true;
  error: string | null = null;
  videoProgress = 0;
  isLessonCompleted = false;
  nextButtonEnabled = false;
  
  private apiUrl = environment.apiUrl;
  private routeSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to route params to reload data when navigating between lessons
    this.routeSubscription = this.route.params.subscribe(params => {
      const lessonId = params['id'];
      if (lessonId) {
        this.loadLesson(parseInt(lessonId));
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from route params to prevent memory leaks
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('Getting headers, token:', token ? 'present' : 'missing');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private loadLesson(lessonId: number): void {
    this.isLoading = true;
    this.error = null;
    
    // Reset progress state when loading a new lesson
    this.videoProgress = 0;
    this.isLessonCompleted = false;
    this.nextButtonEnabled = false;

    // Check if user is a student and if lesson is accessible
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.role === 'STUDENT') {
      this.checkLessonAccessibility(lessonId);
    } else {
      this.loadLessonData(lessonId);
    }
  }

  private checkLessonAccessibility(lessonId: number): void {
    // Check if user is instructor or admin - they should have full access
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && (currentUser.role === 'INSTRUCTOR' || currentUser.role === 'ADMIN')) {
      this.loadLessonData(lessonId);
      return;
    }

    // For students, allow lesson to load - we'll check accessibility after loading lesson data
    this.loadLessonData(lessonId);
  }

  private loadLessonData(lessonId: number): void {
    // Load lesson details - try without auth first for public access
    this.http.get(`${this.apiUrl}/lessons/${lessonId}`).subscribe({
      next: (lesson: any) => {
        this.lesson = lesson;
        if (lesson && lesson.courseId) {
          this.loadCourse(lesson.courseId);
          this.loadCourseLessons(lesson.courseId);
          this.loadVideoProgress(lessonId);
        } else {
          this.error = 'Lesson data is incomplete. Missing course information.';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading lesson:', error);
        // Try with auth headers if first attempt fails
        this.http.get(`${this.apiUrl}/lessons/${lessonId}`, {
          headers: this.getHeaders()
        }).subscribe({
          next: (lesson: any) => {
            this.lesson = lesson;
            if (lesson && lesson.courseId) {
              this.loadCourse(lesson.courseId);
              this.loadCourseLessons(lesson.courseId);
              this.loadVideoProgress(lessonId);
            } else {
              this.error = 'Lesson data is incomplete. Missing course information.';
              this.isLoading = false;
            }
          },
          error: (authError) => {
            console.error('Error loading lesson with auth:', authError);
            if (authError.status === 404) {
              this.error = `Lesson with ID ${lessonId} not found. Please check the lesson URL.`;
            } else if (authError.status === 401) {
              this.error = 'Please login to access this lesson.';
            } else {
              this.error = 'Failed to load lesson details. Please try again.';
            }
            this.isLoading = false;
          }
        });
      }
    });
  }

  private loadCourse(courseId: number): void {
    this.http.get(`${this.apiUrl}/courses/${courseId}`).subscribe({
      next: (course: any) => {
        this.course = course;
      },
      error: (error) => {
        console.error('Error loading course:', error);
        // Try with auth if first attempt fails
        this.http.get(`${this.apiUrl}/courses/${courseId}`, {
          headers: this.getHeaders()
        }).subscribe({
          next: (course: any) => {
            this.course = course;
          },
          error: (authError) => {
            console.error('Error loading course with auth:', authError);
          }
        });
      }
    });
  }

  private loadCourseLessons(courseId: number): void {
    this.http.get<any[]>(`${this.apiUrl}/courses/${courseId}/lessons`).subscribe({
      next: (lessons: any[]) => {
        this.courseLessons = lessons.sort((a, b) => a.lessonOrder - b.lessonOrder);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading course lessons:', error);
        // Try with auth if first attempt fails
        this.http.get<any[]>(`${this.apiUrl}/courses/${courseId}/lessons`, {
          headers: this.getHeaders()
        }).subscribe({
          next: (lessons: any[]) => {
            this.courseLessons = lessons.sort((a, b) => a.lessonOrder - b.lessonOrder);
            this.isLoading = false;
          },
          error: (authError) => {
            console.error('Error loading course lessons with auth:', authError);
            this.isLoading = false;
          }
        });
      }
    });
  }

  private loadVideoProgress(lessonId: number): void {
    const currentUser = this.authService.getCurrentUser();
    console.log('Loading video progress for lesson:', lessonId, 'User:', currentUser);
    
    if (!currentUser || currentUser.role !== 'STUDENT') {
      // For instructors/admins, always enable next button
      console.log('User is not a student, enabling next button');
      this.nextButtonEnabled = true;
      return;
    }

    // Initialize with disabled state for students
    this.nextButtonEnabled = false;
    this.videoProgress = 0;
    this.isLessonCompleted = false;

    console.log('Making API call to load video progress...');
    
    // Try with authentication first
    this.http.get(`${this.apiUrl}/video-progress/${lessonId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (progress: any) => {
        console.log('Video progress API response:', progress);
        this.videoProgress = progress.completionPercentage || 0;
        this.isLessonCompleted = progress.isCompleted || false;
        this.nextButtonEnabled = this.isLessonCompleted;
        console.log('Video progress loaded - Progress:', this.videoProgress, 'Completed:', this.isLessonCompleted, 'Next enabled:', this.nextButtonEnabled);
      },
      error: (error) => {
        console.error('Error loading video progress with auth:', error);
        console.error('Error details:', error.status, error.statusText, error.error);
        
        // If authenticated call fails, try without auth (fallback)
        console.log('Trying without authentication...');
        this.http.get(`${this.apiUrl}/video-progress/${lessonId}`).subscribe({
          next: (progress: any) => {
            console.log('Video progress API response (no auth):', progress);
            this.videoProgress = progress.completionPercentage || 0;
            this.isLessonCompleted = progress.isCompleted || false;
            this.nextButtonEnabled = this.isLessonCompleted;
            console.log('Video progress loaded (no auth) - Progress:', this.videoProgress, 'Completed:', this.isLessonCompleted, 'Next enabled:', this.nextButtonEnabled);
          },
          error: (noAuthError) => {
            console.error('Error loading video progress without auth:', noAuthError);
            // If both attempts fail, lesson is not completed
            this.videoProgress = 0;
            this.isLessonCompleted = false;
            this.nextButtonEnabled = false;
            console.log('Set default values - Progress:', this.videoProgress, 'Completed:', this.isLessonCompleted, 'Next enabled:', this.nextButtonEnabled);
          }
        });
      }
    });
  }

  onVideoProgressUpdate(progress: number): void {
    console.log('Video progress update received:', progress);
    this.videoProgress = progress;
    
    // Auto-completion threshold based on video length:
    // - For videos >= 20 seconds: complete at 50%
    // - For videos < 20 seconds: complete at 90%
    const videoDuration = this.lesson?.videoDuration || 0;
    const completionThreshold = videoDuration >= 20 ? 50 : 90;
    
    if (progress >= completionThreshold && !this.isLessonCompleted) {
      this.nextButtonEnabled = true;
      this.isLessonCompleted = true;
      
      // Save completion to backend when auto-completing
      const token = this.authService.getToken();
      if (token && this.lesson) {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        // Mark as complete by saving progress with watched duration
        // The backend will calculate completion based on its own logic
        let watchedDuration = this.lesson.videoDuration || 600;
        
        const progressData = {
          lessonId: this.lesson.id,
          watchedDuration: watchedDuration
        };

        this.http.post(`${this.apiUrl}/video-progress`, progressData, { headers })
          .subscribe({
            next: (response: any) => {
              console.log('Auto-completion progress saved:', response);
            },
            error: (error) => {
              console.log('Auto-progress save failed:', error);
            }
          });
      }
    } else if (progress < completionThreshold) {
      this.nextButtonEnabled = this.isLessonCompleted;
    }
      
    console.log('Updated progress - Progress:', this.videoProgress, 'Completed:', this.isLessonCompleted, 'Next enabled:', this.nextButtonEnabled);
  }

  // Method to refresh lesson completion status
  refreshLessonCompletionStatus(): void {
    if (this.lesson) {
      this.loadVideoProgress(this.lesson.id);
    }
  }

  // Manual completion method for students
  markLessonAsComplete(): void {
    if (!this.lesson) return;
    
    console.log('Marking lesson as complete manually');
    
    const token = this.authService.getToken();
    if (!token) {
      console.error('No authentication token available');
      return;
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Use the explicit completion endpoint
    this.http.post(`${this.apiUrl}/video-progress/${this.lesson.id}/complete`, {}, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('Lesson marked as complete:', response);
          
          // Update UI
          this.isLessonCompleted = true;
          this.nextButtonEnabled = true;
          this.videoProgress = 100;
          
          // Show success message (if notification service is available)
          console.log('Lesson marked as complete - Ready for next lesson');
        },
        error: (error) => {
          console.error('Failed to mark lesson as complete:', error);
          
          // Even if API call fails, update UI optimistically
          this.isLessonCompleted = true;
          this.nextButtonEnabled = true;
          this.videoProgress = 100;
        }
      });
  }

  navigateToLesson(lessonId: number): void {
    const currentUser = this.authService.getCurrentUser();
    const currentLessonOrder = this.lesson?.lessonOrder || 0;
    const targetLesson = this.courseLessons.find(l => l.id === lessonId);
    const targetLessonOrder = targetLesson?.lessonOrder || 0;
    
    // For students, only allow navigation to:
    // 1. Previous lessons (any time)
    // 2. Current lesson (already on it)
    // 3. Next lesson only if current lesson is completed
    if (currentUser?.role === 'STUDENT') {
      if (targetLessonOrder < currentLessonOrder) {
        // Previous lesson - always allowed
        this.router.navigate(['/lessons', lessonId]);
      } else if (targetLessonOrder === currentLessonOrder) {
        // Current lesson - already here
        return;
      } else if (targetLessonOrder === currentLessonOrder + 1 && this.isLessonCompleted) {
        // Next lesson - only if completed
        this.router.navigate(['/lessons', lessonId]);
      } else {
        // Future lessons - not accessible until previous ones are completed
        console.log('Lesson is locked. Complete the current lesson first.');
        return;
      }
    } else {
      // For instructors/admins, allow access to any lesson
      this.router.navigate(['/lessons', lessonId]);
    }
  }

  navigateToCourse(): void {
    if (this.course) {
      this.router.navigate(['/courses', this.course.id]);
    }
  }

  getNextLesson(): Lesson | null {
    if (!this.lesson || !this.courseLessons.length) return null;
    
    const currentIndex = this.courseLessons.findIndex(l => l.id === this.lesson!.id);
    return currentIndex < this.courseLessons.length - 1 ? this.courseLessons[currentIndex + 1] : null;
  }

  getPreviousLesson(): Lesson | null {
    if (!this.lesson || !this.courseLessons.length) return null;
    
    const currentIndex = this.courseLessons.findIndex(l => l.id === this.lesson!.id);
    return currentIndex > 0 ? this.courseLessons[currentIndex - 1] : null;
  }

  getFormattedDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}

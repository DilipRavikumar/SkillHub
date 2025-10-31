import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  @Input() videoFilename?: string;
  @Input() videoUrl?: string;  // Add videoUrl input for S3 URLs
  @Input() lessonId!: number;
  @Output() progressUpdate = new EventEmitter<number>();
  
  actualVideoUrl = '';
  isLoading = true;
  error = '';
  currentTime = 0;
  duration = 0;
  isPlaying = false;
  showControls = false;

  private videoElement: HTMLVideoElement | null = null;
  private progressInterval: any;
  private lastProgressSave = 0;
  private readonly PROGRESS_SAVE_INTERVAL = 5000; // Save progress every 5 seconds

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadVideo();
  }

  ngOnDestroy(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  loadVideo(): void {
    console.log('Loading video with videoFilename:', this.videoFilename, 'videoUrl:', this.videoUrl);
    
    // Check if we have a direct URL (S3 URL) in either videoUrl or videoFilename
    if (this.videoUrl && this.videoUrl.startsWith('http')) {
      console.log('Using direct video URL from videoUrl (S3):', this.videoUrl);
      this.actualVideoUrl = this.videoUrl;
      this.isLoading = false;
      this.setupVideoElement();
      return;
    }
    
    // Also check if videoFilename contains a full URL (S3 URL)
    if (this.videoFilename && this.videoFilename.startsWith('http')) {
      console.log('Using direct video URL from videoFilename (S3):', this.videoFilename);
      this.actualVideoUrl = this.videoFilename;
      this.isLoading = false;
      this.setupVideoElement();
      return;
    }

    // If no videoFilename is provided, show error
    if (!this.videoFilename) {
      this.error = 'No video file specified';
      this.isLoading = false;
      return;
    }

    // Try to load video without authentication first (for public access)
    this.http.get(`${environment.apiUrl}/video/${this.videoFilename}`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        this.actualVideoUrl = URL.createObjectURL(blob);
        this.isLoading = false;
        this.setupVideoElement();
      },
      error: (error) => {
        console.error('Video loading error:', error);
        console.log('Attempting to load video with authentication...');
        
        // If first attempt fails, try with authentication headers
        const token = this.authService.getToken();
        if (token) {
          const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
          });

          this.http.get(`${environment.apiUrl}/video/${this.videoFilename}`, {
            headers,
            responseType: 'blob'
          }).subscribe({
            next: (blob) => {
              console.log('Video loaded successfully with auth');
              this.actualVideoUrl = URL.createObjectURL(blob);
              this.isLoading = false;
              this.setupVideoElement();
            },
            error: (authError) => {
              console.error('Video loading error with auth:', authError);
              this.handleVideoError(authError);
            }
          });
        } else {
          console.error('No auth token available');
          this.handleVideoError(error);
        }
      }
    });
  }

  private handleVideoError(error: any): void {
    this.error = 'Failed to load video. Please check your connection.';
    this.isLoading = false;
    
    // Try to provide more specific error messages
    if (error.status === 401) {
      this.error = 'Authentication required. Please login to view this video.';
      this.notificationService.showWarning('Authentication required. Please login to view this video.', 'Login Required');
    } else if (error.status === 404) {
      this.error = 'Video file not found. Please contact the instructor.';
      this.notificationService.showError('Video file not found. Please contact the instructor.', 'Video Not Found');
    } else if (error.status === 403) {
      this.error = 'Access denied. You may not have permission to view this video.';
      this.notificationService.showError('Access denied. You may not have permission to view this video.', 'Access Denied');
    } else {
      this.notificationService.showError('Failed to load video. Please check your connection.', 'Video Error');
    }
  }

  setupVideoElement(): void {
    setTimeout(() => {
      this.videoElement = document.getElementById('videoPlayer') as HTMLVideoElement;
      if (this.videoElement) {
        // Set up event listeners
        this.videoElement.addEventListener('loadedmetadata', () => {
          this.duration = this.videoElement!.duration;
          console.log('Video duration loaded:', this.duration);
        });

        this.videoElement.addEventListener('timeupdate', () => {
          this.currentTime = this.videoElement!.currentTime;
          this.updateProgress();
        });

        this.videoElement.addEventListener('play', () => {
          this.isPlaying = true;
        });

        this.videoElement.addEventListener('pause', () => {
          this.isPlaying = false;
        });

        this.videoElement.addEventListener('ended', () => {
          this.isPlaying = false;
          // Mark lesson as completed
          this.markLessonCompleted();
        });

        // Force load metadata if not already loaded
        if (this.videoElement.readyState >= 1) {
          this.duration = this.videoElement.duration;
          console.log('Video duration already available:', this.duration);
        }
      }
    }, 100);
  }

  togglePlay(): void {
    if (this.videoElement) {
      if (this.isPlaying) {
        this.videoElement.pause();
      } else {
        this.videoElement.play();
      }
    }
  }

  seekTo(time: number): void {
    if (this.videoElement) {
      this.videoElement.currentTime = time;
    }
  }

  onProgressBarClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target && this.duration > 0) {
      const rect = target.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = clickX / rect.width;
      const time = percentage * this.duration;
      this.seekTo(time);
    }
  }

  updateProgress(): void {
    // Calculate progress percentage
    const progressPercentage = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    
    console.log('Video progress update - Current time:', this.currentTime, 'Duration:', this.duration, 'Percentage:', progressPercentage);
    
    // Emit progress update to parent component
    this.progressUpdate.emit(progressPercentage);
    
    // Send progress update to backend (only for authenticated users)
    // Throttle: only save every 5 seconds
    const now = Date.now();
    if (this.lessonId && this.currentTime > 0 && (now - this.lastProgressSave) >= this.PROGRESS_SAVE_INTERVAL) {
      this.lastProgressSave = now;
      
      const token = this.authService.getToken();
      if (token) {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        const progressData = {
          lessonId: this.lessonId,
          watchedDuration: Math.floor(this.currentTime)
        };

        this.http.post(`${environment.apiUrl}/video-progress`, progressData, { headers })
          .subscribe({
            next: (response) => {
              console.log('Progress saved to database:', response);
            },
            error: (error) => {
              console.error('Failed to save progress:', error);
              // Don't show notification for every error to avoid annoyance
            }
          });
      }
    }
  }

  markLessonCompleted(): void {
    // Mark lesson as completed when video ends
    if (this.lessonId) {
      const token = this.authService.getToken();
      if (token) {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        this.http.post(`${environment.apiUrl}/video-progress/${this.lessonId}/complete`, {}, { headers })
          .subscribe({
            next: (response) => {
              console.log('Lesson marked as completed:', response);
              // Success - user can continue to next lesson
            },
            error: (error) => {
              console.log('Completion endpoint not available (continuing anyway):', error);
              // Silently handle error - lesson completion is tracked locally anyway
            }
          });
      }
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getProgressPercentage(): number {
    if (this.duration === 0) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  // Event handlers for video events
  onVideoLoaded(): void {
    this.duration = this.videoElement?.duration || 0;
    console.log('Video loaded, duration:', this.duration);
  }

  onTimeUpdate(): void {
    this.currentTime = this.videoElement?.currentTime || 0;
    this.updateProgress();
  }

  onPlay(): void {
    this.isPlaying = true;
  }

  onPause(): void {
    this.isPlaying = false;
  }

  onEnded(): void {
    this.isPlaying = false;
    this.markLessonCompleted();
  }

  // Fullscreen functionality
  toggleFullscreen(): void {
    if (this.videoElement) {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (this.videoElement.requestFullscreen) {
          this.videoElement.requestFullscreen();
        } else if ((this.videoElement as any).webkitRequestFullscreen) {
          (this.videoElement as any).webkitRequestFullscreen();
        } else if ((this.videoElement as any).msRequestFullscreen) {
          (this.videoElement as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    }
  }

  // Keyboard shortcuts
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      this.toggleFullscreen();
    }
  }
}
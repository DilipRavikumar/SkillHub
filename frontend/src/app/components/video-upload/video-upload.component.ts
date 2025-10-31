import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-video-upload',
  templateUrl: './video-upload.component.html',
  styleUrls: ['./video-upload.component.css']
})
export class VideoUploadComponent {
  @Input() courseId!: number;
  @Input() lessonId!: number;
  @Output() videoUploaded = new EventEmitter<string>();

  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadError = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'video/mp4') {
        this.selectedFile = file;
        this.uploadError = '';
      } else {
        this.uploadError = 'Please select an MP4 video file.';
        this.selectedFile = null;
        this.notificationService.showWarning('Please select an MP4 video file.', 'Invalid File Type');
      }
    }
  }

  uploadVideo(): void {
    if (!this.selectedFile || !this.courseId) {
      this.uploadError = 'Please select a file and ensure course ID is provided.';
      this.notificationService.showWarning('Please select a file and ensure course ID is provided.', 'Missing Information');
      return;
    }

    // Check authentication
    if (!this.authService.isAuthenticated()) {
      this.uploadError = 'Please login to upload videos.';
      this.notificationService.showWarning('Please login to upload videos.', 'Authentication Required');
      return;
    }

    // Check user role
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN')) {
      this.uploadError = 'Only instructors can upload videos.';
      this.notificationService.showWarning('Only instructors can upload videos.', 'Access Denied');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadError = '';

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('courseId', this.courseId.toString());
    formData.append('lessonId', this.lessonId.toString());

    const token = this.authService.getToken();
    console.log('Upload token:', token ? 'Present' : 'Missing');
    console.log('Current user:', currentUser);
    console.log('FormData:', formData);
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post<any>(`${environment.apiUrl}/upload/video`, formData, { 
      headers,
      reportProgress: true,
      observe: 'events'
    })
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            // Calculate upload progress percentage
            this.uploadProgress = Math.round(100 * event.loaded / (event.total || 1));
          } else if (event.type === HttpEventType.Response) {
            // Upload completed
            this.isUploading = false;
            this.uploadProgress = 100;
            // S3 upload returns {videoUrl: string, filename: string}
            const response = event.body;
            this.videoUploaded.emit(response?.videoUrl || response?.filename || '');
            this.selectedFile = null;
            this.notificationService.showSuccess('Video uploaded successfully!', 'Upload Complete');
            // Reset file input
            const fileInput = document.getElementById('videoFile') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
          }
        },
        error: (error) => {
          this.isUploading = false;
          this.uploadError = error.error?.message || error.message || 'Upload failed. Please try again.';
          this.notificationService.showError(this.uploadError, 'Upload Failed');
        }
      });
  }

  removeFile(): void {
    this.selectedFile = null;
    this.uploadError = '';
    const fileInput = document.getElementById('videoFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

interface Lesson {
  id?: number;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  videoFilename?: string;
  duration: number;
  order: number;
  isPublished: boolean;
  courseId: number;
}

@Component({
  selector: 'app-lesson-form',
  templateUrl: './lesson-form.component.html',
  styleUrls: ['./lesson-form.component.css']
})
export class LessonFormComponent implements OnInit {
  lessonForm: FormGroup;
  isEditMode = false;
  lessonId?: number;
  courseId?: number;
  course: any = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  uploadedVideoFilename: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.lessonForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = +params['courseId'];
      this.lessonId = params['lessonId'] ? +params['lessonId'] : undefined;
      this.isEditMode = !!this.lessonId;
      
      if (this.courseId) {
        this.loadCourse();
      }
      
      if (this.isEditMode && this.lessonId) {
        this.loadLesson();
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      content: ['', [Validators.required, Validators.minLength(50)]],
      videoUrl: [''],
      duration: [0, [Validators.required, Validators.min(1), Validators.max(300)]],
      order: [1, [Validators.required, Validators.min(1)]],
      isPublished: [false]
    });
  }

  loadCourse(): void {
    if (!this.courseId) return;
    
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course: any) => {
        this.course = course;
      },
      error: (error: any) => {
        console.error('Error loading course:', error);
        this.error = 'Failed to load course information';
      }
    });
  }

  loadLesson(): void {
    if (!this.lessonId || !this.courseId) return;
    
    this.loading = true;
    this.error = null;
    
    // Mock lesson data - in real app, this would come from API
    const mockLesson: Lesson = {
      id: this.lessonId,
      title: 'Introduction to React Hooks',
      description: 'Learn the fundamentals of React Hooks and how to use them effectively in your applications.',
      content: `# Introduction to React Hooks

React Hooks are functions that let you use state and other React features in functional components. They were introduced in React 16.8 and have revolutionized how we write React applications.

## What are Hooks?

Hooks are special functions that start with "use" and allow you to:
- Use state in functional components
- Use lifecycle methods
- Share stateful logic between components

## Common Hooks

### useState
The useState hook allows you to add state to functional components:

\`\`\`javascript
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

### useEffect
The useEffect hook lets you perform side effects in functional components:

\`\`\`javascript
import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`You clicked \${count} times\`;
  });

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

## Best Practices

1. Only call hooks at the top level
2. Don't call hooks inside loops, conditions, or nested functions
3. Use multiple useState calls for different state variables
4. Use useEffect for side effects and cleanup

## Conclusion

React Hooks provide a more direct API to the React concepts you already know: props, state, context, refs, and lifecycle. They don't fundamentally change how React works, but they make it easier to reuse stateful logic between components.`,
      videoUrl: 'https://www.youtube.com/watch?v=example',
      duration: 45,
      order: 1,
      isPublished: true,
      courseId: this.courseId
    };
    
    // Simulate API call
    setTimeout(() => {
      this.lessonForm.patchValue(mockLesson);
      this.loading = false;
    }, 1000);
  }

  onSubmit(): void {
    if (this.lessonForm.valid) {
      this.loading = true;
      this.error = null;
      this.success = null;
      
      const lessonData = this.lessonForm.value;
      
      // Add courseId to the lesson data
      lessonData.courseId = this.courseId;
      
      if (this.isEditMode) {
        lessonData.id = this.lessonId;
        this.updateLesson(lessonData);
      } else {
        this.createLesson(lessonData);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  createLesson(lessonData: Lesson): void {
    if (!this.courseId) {
      this.error = 'Course ID is required';
      this.loading = false;
      return;
    }

    // Get the videoUrl from the form value
    const formVideoUrl = this.lessonForm.get('videoUrl')?.value;
    
    // Map the form data to match backend expectations
    // Convert duration from minutes to seconds
    const lessonPayload = {
      title: lessonData.title,
      description: lessonData.description,
      videoUrl: formVideoUrl || lessonData.videoUrl || '',
      videoFilename: this.uploadedVideoFilename || lessonData.videoFilename || '',
      videoDuration: (lessonData.duration || 0) * 60, // Convert minutes to seconds
      lessonOrder: lessonData.order || 1
    };

    this.courseService.createLesson(this.courseId, lessonPayload).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Lesson created successfully!';
        this.notificationService.showSuccess('Lesson created successfully!', 'Lesson Created');
        
        // Redirect to course detail page after a short delay
        setTimeout(() => {
          this.router.navigate(['/courses', this.courseId]);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating lesson:', error);
        this.error = 'Failed to create lesson. Please try again.';
        this.notificationService.showError('Failed to create lesson. Please try again.', 'Creation Failed');
      }
    });
  }

  updateLesson(lessonData: Lesson): void {
    if (!this.lessonId) {
      this.error = 'Lesson ID is required for update';
      this.loading = false;
      return;
    }

    // Get the videoUrl from the form value
    const formVideoUrl = this.lessonForm.get('videoUrl')?.value;
    
    // Map the form data to match backend expectations
    // Convert duration from minutes to seconds
    const lessonPayload = {
      title: lessonData.title,
      description: lessonData.description,
      videoUrl: formVideoUrl || lessonData.videoUrl || '',
      videoFilename: this.uploadedVideoFilename || lessonData.videoFilename || '',
      videoDuration: (lessonData.duration || 0) * 60, // Convert minutes to seconds
      lessonOrder: lessonData.order || 1
    };

    this.courseService.updateLesson(this.lessonId, lessonPayload).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Lesson updated successfully!';
        this.notificationService.showSuccess('Lesson updated successfully!', 'Lesson Updated');
        
        // Redirect to course detail page after a short delay
        setTimeout(() => {
          this.router.navigate(['/courses', this.courseId]);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating lesson:', error);
        this.error = 'Failed to update lesson. Please try again.';
        this.notificationService.showError('Failed to update lesson. Please try again.', 'Update Failed');
      }
    });
  }

  markFormGroupTouched(): void {
    Object.keys(this.lessonForm.controls).forEach(key => {
      const control = this.lessonForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/courses', this.courseId]);
  }

  onPreview(): void {
    // Open lesson preview in a new tab/window
    const lessonData = this.lessonForm.value;
    console.log('Preview lesson:', lessonData);
    // In a real app, this would open a preview modal or new tab
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.lessonForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.lessonForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${this.getFieldLabel(fieldName)} must not exceed ${field.errors['max'].max}`;
      }
      if (field.errors['pattern']) {
        return `${this.getFieldLabel(fieldName)} format is invalid`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Title',
      description: 'Description',
      content: 'Content',
      videoUrl: 'Video URL',
      duration: 'Duration',
      order: 'Order',
      isPublished: 'Published'
    };
    return labels[fieldName] || fieldName;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
  }

  getWordCount(content: string): number {
    return content.split(/\s+/).length;
  }

  getEstimatedReadingTime(content: string): number {
    // Average reading speed: 200 words per minute
    const wordsPerMinute = 200;
    const wordCount = this.getWordCount(content);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  onVideoUploaded(urlOrFilename: string): void {
    // The URL can be either a full S3 URL or just a filename
    // If it starts with http, it's a full S3 URL
    if (urlOrFilename && urlOrFilename.startsWith('http')) {
      // It's a full S3 URL - store it in videoUrl
      this.lessonForm.patchValue({
        videoUrl: urlOrFilename,
        videoFilename: urlOrFilename.split('/').pop() || '' // Extract filename from URL
      });
      this.uploadedVideoFilename = urlOrFilename;
    } else {
      // It's just a filename
      this.uploadedVideoFilename = urlOrFilename;
      this.lessonForm.patchValue({
        videoFilename: urlOrFilename,
        videoUrl: '' // Clear the URL field when using filename
      });
    }
  }
}

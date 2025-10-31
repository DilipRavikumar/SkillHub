import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-course-form',
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.css']
})
export class CourseFormComponent implements OnInit {
  courseForm: FormGroup;
  isEditMode = false;
  courseId: number | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;
  currentStep = 1;
  isDragOver = false;

  categories = [
    { value: 'PROGRAMMING', label: 'Programming' },
    { value: 'DESIGN', label: 'Design' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'DATA_SCIENCE', label: 'Data Science' },
    { value: 'WEB_DEVELOPMENT', label: 'Web Development' },
    { value: 'MOBILE_DEVELOPMENT', label: 'Mobile Development' },
    { value: 'CYBERSECURITY', label: 'Cybersecurity' }
  ];

  difficulties = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.courseForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.log('Course Form Route Params:', params);
      if (params['id']) {
        this.isEditMode = true;
        this.courseId = +params['id'];
        console.log('Edit mode enabled for course ID:', this.courseId);
        this.loadCourse();
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      category: ['', Validators.required],
      difficulty: ['', Validators.required],
      price: [0],
      duration: ['', [Validators.required, Validators.minLength(3)]],
      language: ['en'],
      currency: ['USD'],
      isPublished: [false],
      isFeatured: [false],
      thumbnail: ['', this.thumbnailValidator.bind(this)]
    });
  }

  thumbnailValidator(control: any) {
    // For new courses, thumbnail is required
    if (!this.isEditMode && !this.imagePreview) {
      return { required: true };
    }
    return null;
  }

  loadCourse(): void {
    if (!this.courseId) return;
    
    this.isLoading = true;
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course: any) => {
        this.courseForm.patchValue({
          title: course.title,
          description: course.description,
          category: course.category,
          difficulty: course.difficulty,
          price: course.price,
          duration: course.duration,
          thumbnail: course.thumbnail
        });
        this.imagePreview = course.thumbnail;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading course:', error);
        this.error = 'Failed to load course details';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFileSelection(file);
    }
  }

  async uploadImage(): Promise<string | null> {
    if (!this.selectedFile) {
      return this.courseForm.get('thumbnail')?.value || null;
    }

    this.isUploading = true;
    try {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      const response = await this.courseService.uploadImage(formData).toPromise();
      this.isUploading = false;
      return response.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      this.error = 'Failed to upload image. Please try again.';
      this.isUploading = false;
      this.notificationService.showError('Failed to upload image. Please try again.', 'Upload Failed');
      return null;
    }
  }

  async onSubmit(): Promise<void> {
    // Check if thumbnail is required for new courses
    if (!this.isEditMode && !this.selectedFile && !this.imagePreview) {
      this.error = 'Please upload a course thumbnail';
      this.notificationService.showError('Please upload a course thumbnail', 'Thumbnail Required');
      this.markFormGroupTouched();
      return;
    }

    if (this.courseForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.error = null;

      // Upload image first if a new file is selected
      let imageUrl = await this.uploadImage();
      
      // For new courses with a selected file, imageUrl is required
      if (!this.isEditMode && this.selectedFile && !imageUrl) {
        this.isSubmitting = false;
        this.error = 'Failed to upload thumbnail. Please try again.';
        this.notificationService.showError('Failed to upload thumbnail. Please try again.', 'Upload Failed');
        return;
      }

      // For editing without a new file, use existing thumbnail
      if (this.isEditMode && !this.selectedFile && !imageUrl) {
        // Keep existing thumbnail
        imageUrl = this.courseForm.get('thumbnail')?.value || null;
      }

      const courseData = this.courseForm.value;
      const currentUser = this.authService.getCurrentUser();
      
      if (currentUser) {
        courseData.instructorId = currentUser.id;
      }

      // Set thumbnail URL
      if (imageUrl) {
        courseData.thumbnail = imageUrl;
      } else if (this.isEditMode) {
        // Keep existing thumbnail if editing without new file
        courseData.thumbnail = this.courseForm.get('thumbnail')?.value || '';
      } else {
        // For new course, thumbnail is required
        this.isSubmitting = false;
        this.error = 'Thumbnail is required';
        this.notificationService.showError('Thumbnail is required', 'Validation Error');
        return;
      }

      const operation = this.isEditMode 
        ? this.courseService.updateCourse(this.courseId!, courseData)
        : this.courseService.createCourse(courseData);

      operation.subscribe({
        next: (response) => {
          if (this.isEditMode) {
            this.notificationService.courseUpdated();
            this.router.navigate(['/dashboard']);
          } else {
            this.notificationService.courseCreated();
            // After creating a new course, redirect to course detail to add lessons
            this.router.navigate(['/courses', response.id]);
          }
        },
        error: (error: any) => {
          console.error('Error saving course:', error);
          this.error = this.isEditMode 
            ? 'Failed to update course. Please try again.'
            : 'Failed to create course. Please try again.';
          this.isSubmitting = false;
          this.notificationService.showError(this.error, this.isEditMode ? 'Update Failed' : 'Creation Failed');
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.courseForm.controls).forEach(key => {
      const control = this.courseForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  getFieldError(fieldName: string): string {
    const field = this.courseForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['min'].min}`;
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Title',
      description: 'Description',
      category: 'Category',
      difficulty: 'Difficulty',
      price: 'Price',
      duration: 'Duration',
      thumbnail: 'Course Image'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.courseForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.courseForm.patchValue({ thumbnail: '' });
    // Trigger validation update
    const thumbnailControl = this.courseForm.get('thumbnail');
    if (thumbnailControl) {
      thumbnailControl.updateValueAndValidity();
    }
  }

  // Step Navigation Methods
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  updateStep(): void {
    // Auto-advance to next step if current step is complete
    if (this.currentStep === 1 && this.isStep1Valid()) {
      setTimeout(() => this.nextStep(), 300);
    } else if (this.currentStep === 2 && this.isStep2Valid()) {
      setTimeout(() => this.nextStep(), 300);
    }
  }

  isStep1Valid(): boolean {
    const title = this.courseForm.get('title');
    const description = this.courseForm.get('description');
    const category = this.courseForm.get('category');
    const difficulty = this.courseForm.get('difficulty');
    
    return !!(title?.valid && description?.valid && category?.valid && difficulty?.valid);
  }

  isStep2Valid(): boolean {
    const duration = this.courseForm.get('duration');
    const thumbnail = this.courseForm.get('thumbnail');
    
    return !!(duration?.valid && (thumbnail?.value || this.imagePreview));
  }

  selectDifficulty(difficulty: string): void {
    this.courseForm.patchValue({ difficulty });
    this.updateStep();
  }

  // Drag and Drop Methods
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.handleFileSelection(file);
      } else {
        this.error = 'Please select a valid image file';
      }
    }
  }

  private handleFileSelection(file: File): void {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.error = 'Please select a valid image file';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'Image size must be less than 5MB';
      return;
    }

    this.selectedFile = file;
    this.error = null;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
      // Trigger validation update after preview is set
      const thumbnailControl = this.courseForm.get('thumbnail');
      if (thumbnailControl) {
        thumbnailControl.updateValueAndValidity();
      }
    };
    reader.readAsDataURL(file);
  }
}

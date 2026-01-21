import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { Course } from '../../models/course.model';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  isLoading = true;
  error: string | null = null;
  searchTerm = '';
  selectedDifficulty = '';
  selectedCategory = '';
  sortBy = 'newest';
  viewMode: 'grid' | 'list' = 'grid';
  
  // Stats for hero section
  totalCourses = 0;
  totalStudents = 0;
  totalInstructors = 0;

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCourses();
    this.loadStats();
  }

  loadCourses(): void {
    this.isLoading = true;
    this.error = null;
    
    this.courseService.getCourses().subscribe({
      next: (courses: Course[]) => {
        this.courses = courses;
        this.totalCourses = this.courses.length;
        this.filterCourses();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading courses:', error);
        this.error = 'Failed to load courses. Please try again.';
        this.courses = [];
        this.filteredCourses = [];
        this.isLoading = false;
      }
    });
  }

  loadStats(): void {
    // Try to load stats for all users (using public stats endpoint)
    this.courseService.getPublicStats().subscribe({
      next: (stats: any) => {
        this.totalStudents = stats.totalStudents || 0;
        this.totalInstructors = stats.totalInstructors || 0;
      },
      error: (error: any) => {
        console.error('Error loading stats:', error);
        // If public stats fail, try admin stats if user is admin
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.role === 'ADMIN') {
          this.courseService.getPlatformStats().subscribe({
            next: (adminStats: any) => {
              this.totalStudents = adminStats.totalStudents || 0;
              this.totalInstructors = adminStats.totalInstructors || 0;
            },
            error: () => {
              this.totalStudents = 0;
              this.totalInstructors = 0;
            }
          });
        } else {
          // Fallback to default values
          this.totalStudents = 0;
          this.totalInstructors = 0;
        }
      }
    });
  }

  filterCourses(): void {
    let filtered = [...this.courses];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.title?.toLowerCase().includes(searchLower) ||
        course.instructor?.name?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower) ||
        course.category?.toLowerCase().includes(searchLower)
      );
    }

    // Apply difficulty filter
    if (this.selectedDifficulty) {
      filtered = filtered.filter(course => course.difficulty === this.selectedDifficulty);
    }

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(course => course.category === this.selectedCategory);
    }

    // Apply sorting
    this.filteredCourses = filtered;
    this.filteredCourses = this.sortCourses();
  }

  sortCourses(sortBy?: string): Course[] {
    const sortCriteria = sortBy || this.sortBy;
    switch (sortCriteria) {
      case 'newest':
        return this.filteredCourses.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      case 'popular':
        return this.filteredCourses.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
      default:
        return this.filteredCourses;
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedDifficulty = '';
    this.selectedCategory = '';
    this.sortBy = 'newest';
    this.filterCourses();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedDifficulty || this.selectedCategory || this.sortBy !== 'newest');
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    // Update view buttons
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.view-btn[data-mode="${mode}"]`)?.classList.add('active');
  }

  trackByCourseId(index: number, course: Course): number {
    return course.id;
  }

  onEnroll(courseId: number): void {
    console.log(`Enrollment completed for course ${courseId}`);
    // Optionally refresh the courses list or update UI
    this.loadCourses();
  }

  onViewCourse(courseId: number): void {
    this.router.navigate(['/courses', courseId]);
  }
}

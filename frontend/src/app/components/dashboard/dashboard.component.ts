// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { CourseService } from '../../services/course.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  
  // Helper method to cap progress at 100%
  capProgress(progress: number): number {
    return Math.min(Math.max(progress || 0, 0), 100);
  }
  currentUser: User | null = null;
  dashboardData: any = null;
  completedCourses = 0;
  certificates: any[] = [];
  chartType: 'donut' | 'bar' = 'donut'; // Default to donut chart
  
  // Make Math available in template
  Math = Math;

  // Chart.js donut chart data for enrollments
  public donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%', // Creates the donut hole
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} enrollments (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: '#fff'
      }
    }
  };

  public donutChartData: any = {
    labels: ['Loading...'],
    datasets: [{
      data: [1],
      backgroundColor: ['#e5e7eb'],
      borderColor: '#fff',
      borderWidth: 3
    }]
  };
  public donutChartType = 'doughnut' as const;
  
  // Bar chart data for alternative visualization
  public barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  public barChartData: any = {
    labels: ['Completed', 'In Progress', 'Not Started'],
    datasets: [{
      label: 'Courses',
      data: [0, 0, 0],
      backgroundColor: [
        '#10b981',
        '#f59e0b', 
        '#ef4444'
      ],
      borderColor: '#fff',
      borderWidth: 2
    }]
  };
  public barChartType = 'bar' as const;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private courseService: CourseService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Initialize donut chart with default data
    this.initializeDonutChart();
    this.loadDashboardData();
  }

  initializeDonutChart(): void {
    this.donutChartData = {
      datasets: [{
        data: [1], // Default single value
        backgroundColor: ['#e5e7eb'],
        borderColor: '#fff',
        borderWidth: 3
      }],
      labels: ['Loading...']
    };
  }

  loadDashboardData(): void {
    if (this.currentUser?.role === 'STUDENT') {
      this.userService.getStudentDashboard().subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.calculateCompletedCourses();
          this.updateDonutChartData();
        },
        error: (error) => {
          console.error('Error loading student dashboard:', error);
          if (error.status === 401) {
            // Authentication failed, redirect to login
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          this.dashboardData = null;
        }
      });
    } else if (this.currentUser?.role === 'INSTRUCTOR') {
      this.userService.getInstructorDashboard().subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.updateDonutChartData();
        },
        error: (error) => {
          console.error('Error loading instructor dashboard:', error);
          if (error.status === 401) {
            // Authentication failed, redirect to login
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          this.dashboardData = null;
        }
      });
    } else if (this.currentUser?.role === 'ADMIN') {
      this.userService.getAdminDashboard().subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.updateDonutChartData();
        },
        error: (error) => {
          console.error('Error loading admin dashboard:', error);
          if (error.status === 401) {
            // Authentication failed, redirect to login
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          this.dashboardData = null;
        }
      });
    }
  }

  calculateCompletedCourses(): void {
    if (this.dashboardData?.myEnrolledCourses) {
      this.completedCourses = this.dashboardData.myEnrolledCourses.filter(
        (enrollment: any) => enrollment.progress === 100
      ).length;
    }
  }

  continueCourse(courseId: number): void {
    this.router.navigate(['/courses', courseId]);
  }

  editCourse(courseId: number): void {
    this.router.navigate(['/courses', courseId, 'edit']);
  }

  deleteCourse(courseId: number): void {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone and will delete all lessons and student progress.')) {
      this.courseService.deleteCourse(courseId).subscribe({
        next: () => {
          console.log('Course deleted successfully');
          this.notificationService.courseDeleted();
          this.loadDashboardData(); // Reload dashboard data
        },
        error: (error: any) => {
          console.error('Error deleting course:', error);
          this.notificationService.showError('Failed to delete course. Please try again.', 'Delete Failed');
        }
      });
    }
  }

  viewCourse(courseId: number): void {
    this.router.navigate(['/courses', courseId]);
  }

  viewCourseDetails(courseId: number): void {
    this.router.navigate(['/courses', courseId]);
  }

  createCourse(): void {
    this.router.navigate(['/courses/create']);
  }

  getCourseStatus(progress: number): string {
    if (progress === 0) {
      return 'not-started';
    } else if (progress === 100) {
      return 'completed';
    } else {
      return 'in-progress';
    }
  }

  calculateOverallProgress(): number {
    if (this.currentUser?.role === 'STUDENT' && this.dashboardData?.myEnrolledCourses) {
      const totalProgress = this.dashboardData.myEnrolledCourses.reduce(
        (sum: number, enrollment: any) => sum + (Math.min(enrollment.progress || 0, 100)), 0
      );
      const result = this.dashboardData.myEnrolledCourses.length > 0 
        ? Math.round(totalProgress / this.dashboardData.myEnrolledCourses.length)
        : 0;
      // Cap at 100%
      return Math.min(result, 100);
    }
    return 0;
  }

  getCompletionPercentage(): number {
    const totalEnrolled = this.dashboardData?.myEnrolledCourses?.length || 1;
    return totalEnrolled > 0 ? Math.round((this.completedCourses / totalEnrolled) * 100) : 0;
  }

  calculateTotalEnrollments(): number {
    if (this.currentUser?.role === 'INSTRUCTOR' && this.dashboardData?.myCourses) {
      return this.dashboardData.myCourses.reduce(
        (sum: number, course: any) => sum + (course.enrollmentCount || 0), 0
      );
    }
    return 0;
  }

  calculateAverageStudentsPerCourse(): number {
    if (this.currentUser?.role === 'INSTRUCTOR' && this.dashboardData?.myCourses) {
      const totalCourses = this.dashboardData.myCourses.length;
      if (totalCourses === 0) return 0;
      
      const totalStudents = this.calculateTotalEnrollments();
      return Math.round(totalStudents / totalCourses * 10) / 10; // Round to 1 decimal
    }
    return 0;
  }

  // Donut chart data methods for enrollments
  generateStudentDonutChartData(): void {
    if (this.dashboardData?.myEnrolledCourses) {
      const completed = this.completedCourses;
      const inProgress = this.dashboardData.myEnrolledCourses.filter((enrollment: any) => 
        enrollment.progress > 0 && enrollment.progress < 100).length;
      const notStarted = this.dashboardData.myEnrolledCourses.filter((enrollment: any) => 
        enrollment.progress === 0).length;
      
      // Only show categories that have data
      const labels = [];
      const data = [];
      const colors = [];
      
      if (completed > 0) {
        labels.push('Completed');
        data.push(completed);
        colors.push('#FF6B6B'); // Coral Red
      }
      
      if (inProgress > 0) {
        labels.push('In Progress');
        data.push(inProgress);
        colors.push('#4ECDC4'); // Turquoise
      }
      
      if (notStarted > 0) {
        labels.push('Not Started');
        data.push(notStarted);
        colors.push('#45B7D1'); // Sky Blue
      }
      
      // If no data, show a placeholder
      if (data.length === 0) {
        labels.push('No Enrollments');
        data.push(1);
        colors.push('#e5e7eb');
      }
      
      // Create new chart data object
      this.donutChartData = {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 3
        }]
      };
      
      // Also update bar chart data
      this.updateBarChartData(completed, inProgress, notStarted);
    } else {
      // Fallback when no data
      this.donutChartData = {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e5e7eb'],
          borderColor: '#fff',
          borderWidth: 3
        }]
      };
      this.updateBarChartData(0, 0, 0);
    }
  }

  generateInstructorDonutChartData(): void {
    if (this.dashboardData?.myCourses) {
      // Get enrollment data for instructor's courses
      const courses = this.dashboardData.myCourses;
      const labels = [];
      const data = [];
      const colors = [];
      
      // Show top 5 courses by enrollment count
      const sortedCourses = courses
        .filter((course: any) => course.enrollmentCount > 0)
        .sort((a: any, b: any) => b.enrollmentCount - a.enrollmentCount)
        .slice(0, 5);
      
      sortedCourses.forEach((course: any, index: number) => {
        labels.push(course.title.length > 20 ? course.title.substring(0, 20) + '...' : course.title);
        data.push(course.enrollmentCount);
        
        // Use the new color palette directly
        const colorPalette = [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
          '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
          '#F8C471', '#82E0AA'
        ];
        colors.push(colorPalette[index % colorPalette.length]);
      });
      
      // If no enrollments, show a placeholder
      if (data.length === 0) {
        labels.push('No Enrollments');
        data.push(1);
        colors.push('#e5e7eb');
      }
      
      // Create new chart data object
      this.donutChartData = {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 3
        }]
      };
    } else {
      this.donutChartData = {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e5e7eb'],
          borderColor: '#fff',
          borderWidth: 3
        }]
      };
    }
  }

  generateAdminDonutChartData(): void {
    if (this.dashboardData) {
      // Get enrollment statistics for admin view
      const totalEnrollments = this.dashboardData.totalEnrollments || 0;
      const activeEnrollments = this.dashboardData.activeEnrollments || 0;
      const completedEnrollments = this.dashboardData.completedEnrollments || 0;
      
      const labels = [];
      const data = [];
      const colors = [];
      
      if (completedEnrollments > 0) {
        labels.push('Completed');
        data.push(completedEnrollments);
        colors.push('#96CEB4'); // Mint Green
      }
      
      if (activeEnrollments > 0) {
        labels.push('Active');
        data.push(activeEnrollments);
        colors.push('#FFEAA7'); // Soft Yellow
      }
      
      const inactiveEnrollments = totalEnrollments - activeEnrollments - completedEnrollments;
      if (inactiveEnrollments > 0) {
        labels.push('Inactive');
        data.push(inactiveEnrollments);
        colors.push('#DDA0DD'); // Plum
      }
      
      // If no enrollments, show a placeholder
      if (data.length === 0) {
        labels.push('No Enrollments');
        data.push(1);
        colors.push('#e5e7eb');
      }
      
      // Create new chart data object
      this.donutChartData = {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 3
        }]
      };
    } else {
      this.donutChartData = {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e5e7eb'],
          borderColor: '#fff',
          borderWidth: 3
        }]
      };
    }
  }

  updateDonutChartData(): void {
    if (this.currentUser?.role === 'STUDENT') {
      this.generateStudentDonutChartData();
    } else if (this.currentUser?.role === 'INSTRUCTOR') {
      this.generateInstructorDonutChartData();
    } else if (this.currentUser?.role === 'ADMIN') {
      this.generateAdminDonutChartData();
    }
    
    // Force chart to re-render
    setTimeout(() => {
      this.donutChartData = { ...this.donutChartData };
    }, 100);
  }

  updateBarChartData(completed: number, inProgress: number, notStarted: number): void {
    this.barChartData.datasets[0].data = [completed, inProgress, notStarted];
  }

  toggleChartType(): void {
    this.chartType = this.chartType === 'donut' ? 'bar' : 'donut';
  }

  hasNoData(): boolean {
    return this.donutChartData.datasets[0].data.length === 0 || 
           this.donutChartData.datasets[0].data.every((d: number) => d === 0);
  }

  // Welcome section methods
  getCurrentDate(): string {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return today.toLocaleDateString('en-US', options);
  }

  getTotalCourses(): number {
    if (this.currentUser?.role === 'STUDENT') {
      return this.dashboardData?.myEnrolledCourses?.length || 0;
    } else if (this.currentUser?.role === 'INSTRUCTOR') {
      return this.dashboardData?.myCourses?.length || 0;
    } else if (this.currentUser?.role === 'ADMIN') {
      return this.dashboardData?.totalCourses || 0;
    }
    return 0;
  }

  getRoleBasedLabel(): string {
    if (this.currentUser?.role === 'STUDENT') return 'Courses Enrolled';
    if (this.currentUser?.role === 'INSTRUCTOR') return 'Courses Created';
    if (this.currentUser?.role === 'ADMIN') return 'Total Courses';
    return 'Courses';
  }

  getProgressStat(): number {
    if (this.currentUser?.role === 'STUDENT') {
      return this.calculateOverallProgress();
    }
    // For instructor or admin, return enrollment or growth percentage
    return Math.min((this.getTotalCourses() / 10) * 100, 100);
  }

  getProgressLabel(): string {
    if (this.currentUser?.role === 'STUDENT') return 'Average Progress';
    if (this.currentUser?.role === 'INSTRUCTOR') return 'Course Growth';
    if (this.currentUser?.role === 'ADMIN') return 'Platform Growth';
    return 'Progress';
  }
}

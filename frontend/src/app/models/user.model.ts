import { Course } from './course.model';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

export interface Enrollment {
  id: number;
  course: Course;
  student: User;
  enrolledAt: string;
  progress: number;
}

export interface Certificate {
  id: number;
  courseName: string;
  issuedDate: string;
  certificateUrl: string;
}

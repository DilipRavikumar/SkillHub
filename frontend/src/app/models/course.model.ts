// src/app/models/course.model.ts
export interface Course {
  id: number;
  title: string;
  description: string;
  instructor: {
    id: number;
    name: string;
    email: string;
    password?: string;
    role?: {
      id: number;
      roleName: string;
    };
  } | null; // Made nullable to match backend reality
  lessons?: Lesson[]; // Optional - not always included in all responses
  lessonCount?: number; // Count from backend
  // Optional fields for backward compatibility
  price?: number;
  thumbnail?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category?: string;
  duration?: number; // Changed from string to number for hours
  enrollmentCount?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'COMPLETED'; // Added status property
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  videoFilename?: string;
  videoDuration: number;
  lessonOrder: number;
  createdAt: string;
}


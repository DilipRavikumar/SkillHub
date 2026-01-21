// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Enrollment, Certificate } from '../models/user.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getStudentDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/student/dashboard`, {
      headers: this.getHeaders()
    });
  }

  getInstructorDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/instructor/dashboard`, {
      headers: this.getHeaders()
    });
  }

  getAdminDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/dashboard`, {
      headers: this.getHeaders()
    });
  }

  getEnrollments(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.apiUrl}/enrollments/my-enrollments`, {
      headers: this.getHeaders()
    });
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/users`, {
      headers: this.getHeaders()
    });
  }

  // Admin methods
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/users`, {
      headers: this.getHeaders()
    });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${userId}`, {
      headers: this.getHeaders()
    });
  }

  getTotalEnrollments(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/admin/total-enrollments`, {
      headers: this.getHeaders()
    });
  }

  // Certificate methods
  getCertificates(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/certificates/my-certificates`, {
      headers: this.getHeaders()
    });
  }

  // Platform statistics for admin analytics
  getPlatformStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/stats`, {
      headers: this.getHeaders()
    });
  }
}

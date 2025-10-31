import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';

interface AuthResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.loadUserFromStorage();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap(response => {
        console.log('AuthService - Login Response:', response);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify({
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role
        }));
        this.currentUserSubject.next({
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role as 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
        });
        console.log('AuthService - User stored in localStorage and BehaviorSubject');
        this.notificationService.loginSuccess(response.name);
      }));
  }

  register(name: string, email: string, password: string, role: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, { name, email, password, role })
      .pipe(tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify({
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role
        }));
        this.currentUserSubject.next({
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role as 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
        });
        this.notificationService.registrationSuccess();
      }));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.notificationService.logoutSuccess();
    this.router.navigate(['/home']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    // Check if there's a user in localStorage (for cases where BehaviorSubject hasn't loaded yet)
    const localStorageUser = localStorage.getItem('user');
    const parsedUser = localStorageUser ? JSON.parse(localStorageUser) : null;
    
    // If BehaviorSubject is empty but localStorage has user, populate it
    if (!this.currentUserSubject.value && parsedUser) {
      this.currentUserSubject.next(parsedUser);
      console.log('AuthService - Loaded user from localStorage into BehaviorSubject');
    }
    
    const user = this.getCurrentUser();
    const isAuth = !!token && !!user;
    console.log('AuthService - isAuthenticated check:', { token: !!token, user: !!user, isAuth });
    return isAuth;
  }

  getCurrentUser(): User | null {
    const user = this.currentUserSubject.value;
    console.log('AuthService - getCurrentUser called, returning:', user);
    return user;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  private loadUserFromStorage(): void {
    const user = localStorage.getItem('user');
    console.log('AuthService - Loading user from storage:', user);
    if (user) {
      const parsedUser = JSON.parse(user);
      console.log('AuthService - Parsed user:', parsedUser);
      this.currentUserSubject.next(parsedUser);
    } else {
      console.log('AuthService - No user found in localStorage');
    }
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  updateProfile(profileData: { name: string; email: string }): Observable<User> {
    const token = this.getToken();
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestBody = {
      name: profileData.name,
      email: profileData.email
    };

    console.log('Sending profile update request:', requestBody);

    return this.http.put<User>(`${this.apiUrl}/auth/profile`, requestBody, { headers })
      .pipe(tap(updatedUser => {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
        console.log('Profile updated in AuthService');
      }));
  }
}

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: any): boolean {
    const isAuth = this.authService.isAuthenticated();
    const token = this.authService.getToken();
    const user = this.authService.getCurrentUser();
    const isDashboard = route.url?.[0]?.path === 'dashboard';
    
    console.log('AuthGuard - Is Authenticated:', isAuth);
    console.log('AuthGuard - Token:', token ? 'Present' : 'Missing');
    console.log('AuthGuard - User:', user);
    
    if (!isAuth) {
      console.log('AuthGuard - Not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
    
    // Block admins from accessing dashboard
    if (isDashboard && user?.role === 'ADMIN') {
      console.log('AuthGuard - Admin trying to access dashboard, redirecting to admin panel');
      this.router.navigate(['/admin']);
      return false;
    }
    
    return true;
  }
}
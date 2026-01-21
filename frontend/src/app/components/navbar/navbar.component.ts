import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  user: any = null;
  userRole = '';
  private authSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
    // Subscribe to auth changes
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      console.log('Navbar - currentUser$ subscription - user:', user);
      this.isLoggedIn = !!user;
      this.user = user;
      this.userRole = user?.role || '';
      console.log('Navbar - currentUser$ subscription - isLoggedIn:', this.isLoggedIn);
      console.log('Navbar - currentUser$ subscription - userRole:', this.userRole);
    });
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    console.log('Navbar - checkAuthStatus - isLoggedIn:', this.isLoggedIn);
    if (this.isLoggedIn) {
      this.user = this.authService.getCurrentUser();
      this.userRole = this.user?.role || '';
      console.log('Navbar - checkAuthStatus - user:', this.user);
      console.log('Navbar - checkAuthStatus - userRole:', this.userRole);
    }
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.user = null;
    this.userRole = '';
    this.router.navigate(['/home']);
  }
}
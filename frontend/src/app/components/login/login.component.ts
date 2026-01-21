import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;
      
      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('LoginComponent - Login successful:', response);
          this.isLoading = false;
          this.notificationService.loginSuccess(response.name || 'User');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('LoginComponent - Login error:', error);
          
          // Extract error message from response
          if (error.error && typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else if (error.status === 400) {
            // Check if it's a credentials error
            if (error.error && error.error.includes('Bad credentials')) {
              this.errorMessage = 'Invalid email or password. Please check your credentials.';
            } else {
              this.errorMessage = 'Invalid request. Please check your input.';
            }
          } else if (error.status === 401) {
            this.errorMessage = 'Authentication failed. Please check your credentials.';
          } else if (error.status === 0) {
            this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
          } else {
            this.errorMessage = 'Login failed. Please try again.';
          }
          
          // Show toast notification for login error
          this.notificationService.loginError();
        }
      });
    }
  }
}

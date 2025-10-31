// src/app/components/signup/signup.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.signupForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.isLoading = true;
      const { name, email, password, role } = this.signupForm.value;
      
      this.authService.register(name, email, password, role).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.notificationService.registrationSuccess();
          this.router.navigate(['/courses']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error:', error);
          this.notificationService.registrationError();
        }
      });
    }
  }
}

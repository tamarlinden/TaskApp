import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);

  isRegisterMode = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = true;
  submitted = false;

  loginForm = this.fb.group({
    name: ['', this.isRegisterMode() ? [Validators.required] : []],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  toggleMode() {
    this.isRegisterMode.update(value => !value);
    this.errorMessage.set(null);
    // Update validators based on mode
    if (this.isRegisterMode()) {
      this.loginForm.get('name')?.setValidators([Validators.required]);
    } else {
      this.loginForm.get('name')?.clearValidators();
    }
    this.loginForm.get('name')?.updateValueAndValidity();
    this.submitted = false;
  }

  onSubmit() {
    this.submitted = true;
    if (this.loginForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const { email, password } = this.loginForm.value;
    if (this.isRegisterMode()) {
      this.authService.register({
        name: this.loginForm.value.name || '',
        email: email || '',
        password: password || ''
      }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/teams']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'שגיאה בהרשמה');
          setTimeout(() => this.errorMessage.set(null), 5000);
          console.error('Register error:', err);
        }
      });
    } else {
      this.authService.login({
        email: email || '',
        password: password || ''
      }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/teams']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'שגיאה בהתחברות');
          setTimeout(() => this.errorMessage.set(null), 5000);
          console.error('Login error:', err);
        }
      });
    }
  }
}
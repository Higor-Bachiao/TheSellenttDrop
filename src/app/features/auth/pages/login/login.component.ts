import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (user) => {
          this.isLoading = false;
          this.toastService.success('Login realizado com sucesso! 🎰');
          this.router.navigate(['/gacha']);
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage = this.getErrorMessage(error);
          this.toastService.error(errorMessage);
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  private getErrorMessage(error: any): string {
    if (error?.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return 'Usuário não encontrado';
        case 'auth/wrong-password':
          return 'Senha incorreta';
        case 'auth/invalid-email':
          return 'E-mail inválido';
        case 'auth/user-disabled':
          return 'Usuário desabilitado';
        case 'auth/email-not-verified':
          return 'Email não verificado! Verifique sua caixa de entrada e spam.';
        case 'auth/invalid-credential':
          return 'Email ou senha incorretos';
        default:
          return 'Erro ao fazer login. Tente novamente.';
      }
    }
    return error?.message || 'Erro ao fazer login';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}

// login.component.ts
import { Component, OnInit } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm = this.fb.group({
    displayName: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(
    private authService: AuthService,
    private toast: HotToastService,
    private router: Router,
    private fb: NonNullableFormBuilder
  ) {}

  ngOnInit(): void {}

  get password() {
    return this.loginForm.get('password');
  }

  get displayName() {
    return this.loginForm.get('displayName');
  }

  submit() {
    const { displayName, password } = this.loginForm.value;

    if (!this.loginForm.valid || !displayName || !password) {
      return;
    }

    const email = `${displayName}@example.com`;

    this.authService
      .login(email, password)
      .pipe(
        this.toast.observe({
          success: 'Logged in successfully',
          loading: 'Logging in...',
          error: ({ message }) => `There was an error: ${message} `,
        })
      )
      .subscribe(() => {
        // Use the navigateToHome method from AppComponent
        this.navigateToHome();
      });
  }

  // Add this method to navigate to either /home or /chats based on window width
  navigateToHome() {
    const isMobile = window.innerWidth <= 700;
    const route = isMobile ? '/chats' : '/home';
    this.router.navigate([route]);
  }
}

// sign-up.component.ts
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import { switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { UsersService } from 'src/app/services/users.service';

export function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordsDontMatch: true };
    } else {
      return null;
    }
  };
}

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit {
  signUpForm = this.fb.group(
    {
      name: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      licenseAgreement: ['', Validators.requiredTrue], // Added requiredTrue validator
    },
    { validators: passwordsMatchValidator() }
  );

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: HotToastService,
    private usersService: UsersService,
    private fb: NonNullableFormBuilder
  ) {}

  ngOnInit(): void {}

  get password() {
    return this.signUpForm.get('password');
  }

  get confirmPassword() {
    return this.signUpForm.get('confirmPassword');
  }

  get name() {
    return this.signUpForm.get('name');
  }

  submit() {
    const { name, password } = this.signUpForm.value;

    if (!this.signUpForm.valid || !name || !password) {
      return;
    }

    const email = `${name}@example.com`;

    const defaultColor = 'rgb(128, 128, 128)';

    this.authService
      .signUp(email, password)
      .pipe(
        switchMap(({ user: { uid } }) =>
          this.usersService.addUser({
            uid,
            email,
            displayName: name,
            color: defaultColor,
          })
        ),
        this.toast.observe({
          success: 'Congrats! You are all signed up',
          loading: 'Signing up...',
          error: ({ message }) => `${message}`,
        })
      )
      .subscribe(() => {
        this.navigateToHome();
      });
  }

  navigateToHome() {
    const isMobile = window.innerWidth <= 700;
    const route = isMobile ? '/chats' : '/home';
    this.router.navigate([route]);
  }
}

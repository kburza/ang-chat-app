import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import { getAuth, updatePassword } from 'firebase/auth';

@Component({
  selector: 'app-pass-reset',
  templateUrl: './pass-reset.component.html',
  styleUrls: ['./pass-reset.component.css'],
})
export class PassResetComponent implements OnInit {
  resetPasswordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toast: HotToastService
  ) {
    this.resetPasswordForm = this.fb.group(
      {
        newPassword: ['', Validators.required],
        confirmNewPassword: ['', Validators.required],
      },
      { validators: this.passwordsMatchValidator() }
    );
  }

  ngOnInit(): void {}

  get newPassword() {
    return this.resetPasswordForm.get('newPassword');
  }

  get confirmNewPassword() {
    return this.resetPasswordForm.get('confirmNewPassword');
  }

  async submit() {
    if (this.resetPasswordForm.valid) {
      const newPassword = this.resetPasswordForm.value.newPassword;

      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        try {
          await updatePassword(user, newPassword);
          this.toast.success('Password updated successfully!');
          this.router.navigate(['/profile']); // Navigate to the profile route upon success
        } catch (error) {
          console.error('Error updating password:', error);
          this.toast.error('An error occurred while updating the password.');
        }
      } else {
        // User is not logged in
        this.toast.error('User is not logged in.');
      }
    } else {
      // If the form is invalid, display an error toast
      this.toast.error('Please fill in all required fields correctly.');
    }
  }

  passwordsMatchValidator() {
    return (formGroup: FormGroup) => {
      const newPasswordControl = formGroup.get('newPassword');
      const confirmNewPasswordControl = formGroup.get('confirmNewPassword');

      if (newPasswordControl && confirmNewPasswordControl) {
        const newPassword = newPasswordControl.value;
        const confirmNewPassword = confirmNewPasswordControl.value;

        if (newPassword !== confirmNewPassword) {
          confirmNewPasswordControl.setErrors({ passwordsDontMatch: true });
        } else {
          confirmNewPasswordControl.setErrors(null);
        }
      }
    };
  }
}

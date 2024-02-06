import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pass-reset',
  templateUrl: './pass-reset.component.html',
  styleUrls: ['./pass-reset.component.css'],
})
export class PassResetComponent implements OnInit {
  email: any;
  newPassword: any;
  confirmNewPassword: any;
  submit() {
    throw new Error('Method not implemented.');
  }
  resetPasswordForm!: FormGroup<any>;
  constructor() {}

  ngOnInit(): void {}
}

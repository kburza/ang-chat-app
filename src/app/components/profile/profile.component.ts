import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HotToastService } from '@ngneat/hot-toast';
import { map } from 'rxjs/operators';
import { User } from 'firebase/auth';
import { ImageUploadService } from 'src/app/services/image-upload.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  user$ = this.authService.currentUser$;

  profileForm = new FormGroup({
    uid: new FormControl(''),
    displayName: new FormControl(''),
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    phone: new FormControl(''),
    address: new FormControl(''),
  });

  constructor(
    private imageUploadService: ImageUploadService,
    private toast: HotToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {}

  uploadFile(event: any, user: User) {
    this.imageUploadService
      .uploadImage(event.target.files[0], `images/profile/${user.uid}`)
      .pipe(
        this.toast.observe({
          loading: 'Uploading profile image...',
          success: 'Image uploaded successfully',
          error: 'There was an error in uploading the image',
        }),
        map((photoURL) => {
          this.authService.updateProfileData({ photoURL });
        })
      )
      .subscribe();
  }

  saveProfile() {}
}

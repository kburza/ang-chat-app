import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HotToastService } from '@ngneat/hot-toast';
import { map, switchMap, catchError } from 'rxjs/operators';
import { User } from 'firebase/auth';
import { ImageUploadService } from 'src/app/services/image-upload.service';
import { AuthService } from 'src/app/services/auth.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';

@UntilDestroy()
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
  router: any;

  constructor(
    private imageUploadService: ImageUploadService,
    private toast: HotToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(untilDestroyed(this))
      .subscribe((user) => {
        this.profileForm.patchValue({ ...user });
      });
  }

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

  saveProfile() {
    const profileData = this.profileForm.value as {
      uid: string;
      displayName?: string | null | undefined;
      firstName?: string | null | undefined;
      lastName?: string | null | undefined;
      phone?: string | null | undefined;
      address?: string | null | undefined;
    };

    if (!profileData) {
      return;
    }

    of(this.authService.updateUser(profileData))
      .pipe(
        switchMap(async () => this.authService.addUser(profileData)),
        this.toast.observe({
          loading: 'Updating profile data...',
          success: 'Profile updated successfully',
          error: 'There was an error in updating the profile',
        })
      )
      .subscribe(() => {
        this.router.navigate(['/home']);
      });
  }
}

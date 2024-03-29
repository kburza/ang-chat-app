import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { HotToastService } from '@ngneat/hot-toast';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap, tap } from 'rxjs';
import { ProfileUser } from 'src/app/models/user';
import { ImageUploadService } from 'src/app/services/image-upload.service';
import { UsersService } from 'src/app/services/users.service';
import { Router, NavigationEnd } from '@angular/router';

@UntilDestroy()
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  user$ = this.usersService.currentUserProfile$;

  profileForm = this.fb.group({
    uid: [''],
    displayName: [''],
    firstName: [''],
    lastName: [''],
    bio: [''],
    color: [''],
  });
  colorOptions: string[] = [
    'rgb(255, 154, 159)', // red
    'rgb(255, 192, 203)', // pink
    'rgb(236, 157, 126)', // orange
    'rgb(233, 215, 135)', // yellow
    'rgb(186, 232, 172)', // green
    'rgb(82, 129, 206)', // blue
    'rgb(153, 140, 235)', // purple
    'rgb(128, 128, 128)', // gray
    'rgb(216, 171, 158)', // brown
  ];

  constructor(
    private imageUploadService: ImageUploadService,
    private toast: HotToastService,
    private usersService: UsersService,
    private fb: NonNullableFormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usersService.currentUserProfile$
      .pipe(untilDestroyed(this), tap(console.log))
      .subscribe((user) => {
        this.profileForm.patchValue({ ...user });
      });

    this.router.events.pipe(untilDestroyed(this)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Check the current route and handle window resize accordingly
        if (event.url.includes('/profile')) {
          window.addEventListener('resize', this.handleWindowResize.bind(this));
        } else {
          window.removeEventListener('resize', this.handleWindowResize);
        }
      }
    });
  }

  uploadFile(event: any, { uid }: ProfileUser) {
    this.imageUploadService
      .uploadImage(event.target.files[0], `images/profile/${uid}`)
      .pipe(
        this.toast.observe({
          loading: 'Uploading profile image...',
          success: 'Image uploaded successfully',
          error: 'There was an error in uploading the image',
        }),
        switchMap((photoURL) =>
          this.usersService.updateUser({
            uid,
            // photoURL,
          })
        )
      )
      .subscribe();
  }

  setColor(color: string) {
    this.profileForm.patchValue({ color });
    this.saveProfile();
  }

  saveProfile() {
    const { uid, ...data } = this.profileForm.value;

    if (!uid) {
      return;
    }

    this.usersService
      .updateUser({ uid, ...data })
      .pipe(
        this.toast.observe({
          loading: 'Saving profile data...',
          success: 'Profile updated successfully',
          error: 'There was an error in updating the profile',
        })
      )
      .subscribe();
  }

  onMouseEnter() {
    const matIcon = document.querySelector('.larger-icon');
    if (matIcon) {
      matIcon.classList.add('hovered');
    }
  }

  onMouseLeave() {
    const matIcon = document.querySelector('.larger-icon');
    if (matIcon) {
      matIcon.classList.remove('hovered');
    }
  }

  handleWindowResize() {
    if (this.isMobileScreen() && this.router.url.includes('/profile')) {
      console.log('Handling window resize for profile route');
    }
  }

  isMobileScreen(): boolean {
    return window.innerWidth <= 700;
  }
}

import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { UsersService } from './services/users.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  user$ = this.usersService.currentUserProfile$;

  constructor(
    public authService: AuthService,
    private router: Router,
    private usersService: UsersService,
    private ngZone: NgZone
  ) {}

  logout() {
    this.authService.logout().subscribe(() => {
      this.ngZone.run(() => {
        this.router.navigate(['']);
        return true;
      });
    });
  }

  navigateToHome() {
    const isMobile = window.innerWidth <= 700;
    const route = isMobile ? '/chats' : '/home';
    this.router.navigate([route]);
  }
}

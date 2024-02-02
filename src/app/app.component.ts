import { Component } from '@angular/core';
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
  toolbarColor: string = 'primary'; // Set default color

  constructor(
    public authService: AuthService,
    private router: Router,
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.user$.subscribe((user) => {
      this.toolbarColor = user?.color || 'primary';
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['']);
      window.location.reload();
    });
  }
}

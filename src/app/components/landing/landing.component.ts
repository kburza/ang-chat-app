import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit {
  user$ = this.usersService.currentUserProfile$;

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {}
}

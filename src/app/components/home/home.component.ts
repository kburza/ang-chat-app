import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  HostListener,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  combineLatest,
  map,
  Observable,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { Message } from 'src/app/models/chat';
import { ProfileUser } from 'src/app/models/user';
import { ChatsService } from 'src/app/services/chats.service';
import { UsersService } from 'src/app/services/users.service';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  @ViewChild('endOfChat')
  endOfChat!: ElementRef;

  user$ = this.usersService.currentUserProfile$;
  currentUser$ = this.user$ as Observable<ProfileUser>;
  myChats$ = this.chatsService.myChats$;

  searchControl = new FormControl('');
  messageControl = new FormControl('');
  chatListControl = new FormControl<string[]>(['']);

  messages$: Observable<Message[]> | undefined;

  otherUsers$ = combineLatest([this.usersService.allUsers$, this.user$]).pipe(
    map(([users, user]) => users.filter((u) => u.uid !== user?.uid))
  );

  users$ = combineLatest([
    this.otherUsers$,
    this.searchControl.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([users, searchString]) =>
      users.filter(
        (u) =>
          u.displayName
            ?.toLowerCase()
            .includes(searchString?.toLowerCase() ?? '') ||
          u.email?.toLowerCase().includes(searchString?.toLowerCase() ?? '')
      )
    )
  );

  selectedChat$ = combineLatest([
    this.chatListControl.valueChanges,
    this.myChats$,
  ]).pipe(map(([value, chats]) => chats.find((c) => c.id === value?.[0])));

  private destroy$ = new Subject<void>();
  allowRedirect: boolean = true;

  constructor(
    private usersService: UsersService,
    private chatsService: ChatsService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  initialScreenWidth: number = window.innerWidth;
  currentRoute: string = '';

  ngOnInit(): void {
    this.initialScreenWidth = window.innerWidth;

    this.messages$ = this.chatListControl.valueChanges.pipe(
      map((value) => value?.[0]),
      switchMap((chatId) =>
        chatId ? this.chatsService.getChatMessages$(chatId) : of([])
      ),
      tap(() => {
        this.scrollToBottom();
      })
    );

    // Add listener for window resize
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result.matches) {
          // It's a mobile screen
          this.handleMobileScreen();
        } else {
          // It's not a mobile screen
          this.allowRedirect = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleMobileScreen() {
    const currentRoute = this.router.url;

    if (currentRoute === '/home' && !this.allowRedirect) {
      this.allowRedirect = true; // Enable redirection
      this.router.navigate(['/chats']);
    } else if (currentRoute === '/chats' && !this.allowRedirect) {
      this.allowRedirect = true; // Enable redirection
      this.router.navigate(['/home']);
    }
  }

  showMessages: boolean = false;

  createChat(user: ProfileUser) {
    this.chatsService
      .isExistingChat(user.uid)
      .pipe(
        switchMap((chatId) =>
          !chatId ? this.chatsService.createChat(user) : of(chatId)
        )
      )
      .subscribe((chatId) => {
        console.log('ChatId being passed:', chatId);

        // Check if the user is on the home page before navigating to chats
        if (this.router.url === '/') {
          const chatRoute = this.isMobileScreen()
            ? `/messages/${chatId[0]}`
            : '/chats';
          this.router.navigate([chatRoute]);
        }
      });
  }

  toggleMessages() {
    this.showMessages = !this.showMessages;
  }

  sendMessage() {
    const message = this.messageControl.value;
    const selectedChatId = this.chatListControl.value?.[0];
    if (message && selectedChatId) {
      this.chatsService
        .addChatMessage(selectedChatId, message)
        .subscribe(() => {
          this.scrollToBottom();
        });
      this.messageControl.setValue('');
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.endOfChat) {
        this.endOfChat.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  isMobileScreen(): boolean {
    return this.initialScreenWidth <= 700;
  }
}

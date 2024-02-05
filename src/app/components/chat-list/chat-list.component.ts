import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
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
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.css'],
})
export class ChatListComponent implements OnInit, OnDestroy {
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

  private unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private usersService: UsersService,
    private chatsService: ChatsService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.messages$ = this.chatListControl.valueChanges.pipe(
      map((value) => value?.[0]),
      switchMap((chatId) =>
        chatId ? this.chatsService.getChatMessages$(chatId) : of([])
      ),
      tap(() => {
        this.scrollToBottom();
      }),
      takeUntil(this.unsubscribe$) // Unsubscribe when component is destroyed
    );

    // Add listener for window resize
    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleWindowResize);
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  showMessages: boolean = false;

  createChat(user: ProfileUser) {
    console.log('Creating chat for user:', user);

    this.chatsService
      .isExistingChat(user.uid)
      .pipe(
        switchMap((chatId) =>
          !chatId ? this.chatsService.createChat(user) : of(chatId)
        ),
        takeUntil(this.unsubscribe$)
      )
      .subscribe((chatId) => {
        const chatRoute = '/messages';
        console.log('Navigating to route:', chatRoute);

        // Navigate to the '/messages' route with the chatId as a parameter
        this.router.navigate([chatRoute, chatId]);
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

  // Add this method to check if the screen is mobile
  isMobileScreen(): boolean {
    return window.innerWidth <= 700;
  }

  handleWindowResize() {
    const currentRoute = this.router.url;

    if (!this.isMobileScreen() && currentRoute.includes('/chats')) {
      // If the screen width goes above 700px and the current route is /chats,
      // navigate back to /home
      this.router.navigate(['/home']);
    }
  }
}

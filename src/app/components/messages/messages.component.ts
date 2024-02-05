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
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
})
export class MessageWindowComponent implements OnInit {
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
  showMessages: boolean | undefined;

  constructor(
    private usersService: UsersService,
    private chatsService: ChatsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const chatId = params['chatId'];
      console.log('Received chatId:', chatId);
      // Now you have the chatId, you can load the chat messages or perform other actions
    });

    this.messages$ = this.chatListControl.valueChanges.pipe(
      map((value) => value?.[0]),
      switchMap((chatId) =>
        chatId ? this.chatsService.getChatMessages$(chatId) : of([])
      ),
      tap(() => {
        this.scrollToBottom();
      }),
      takeUntil(this.unsubscribe$)
    );

    this.handleWindowResize(); // Call the method to check the screen width initially
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  createChat(user: ProfileUser) {
    this.chatsService
      .isExistingChat(user.uid)
      .pipe(
        switchMap((chatId) =>
          !chatId ? this.chatsService.createChat(user) : of(chatId)
        )
      )
      .subscribe((chatId) => {
        this.chatListControl.setValue([chatId[0] || ''] as string[]);
        this.showMessages = true; // Show messages when chat is created
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

  // Handle window resize
  @HostListener('window:resize', ['$event'])
  handleWindowResize(event?: Event) {
    if (!this.isMobileScreen()) {
      // If the screen width goes above 700px, navigate back to home
      this.router.navigate(['/home']);
    }
  }
}

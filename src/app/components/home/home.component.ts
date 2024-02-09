import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import {
  debounceTime,
  map,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { Message } from 'src/app/models/chat';
import { ProfileUser } from 'src/app/models/user';
import { ChatsService } from 'src/app/services/chats.service';
import { UsersService } from 'src/app/services/users.service';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
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

  ngOnInit(): void {
    this.initialScreenWidth = window.innerWidth;

    this.messages$ = this.chatListControl.valueChanges.pipe(
      map((value) => value?.[0]),
      switchMap((chatId) =>
        chatId ? this.chatsService.getChatMessages$(chatId) : of([])
      ),
      tap(() => {
        this.scrollToBottom();
      }),
      map((messages) => this.decryptMessages(messages)) // Decrypt messages before displaying
    );

    // Add listener for window resize with debounce
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(
        debounceTime(500), // Adjust the debounce time as needed
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        if (result.matches) {
          // It's a mobile screen
          if (this.router.url === '/home') {
            // Only redirect if on the home route
            this.router.navigate(['/chats']);
          }
        } else {
          // It's not a mobile screen
          if (this.router.url === '/chats') {
            // Only redirect if on the chats route
            this.router.navigate(['/home']);
          }
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
      // Encrypt the message using AES
      const encryptedMessage = this.encryptMessage(message, 'Chatsper9999');
      this.chatsService
        .addChatMessage(selectedChatId, encryptedMessage)
        .subscribe(() => {
          this.scrollToBottom();
        });
      this.messageControl.setValue('');
    }
  }

  decryptMessages(messages: Message[]): Message[] {
    const decryptedMessages = messages.map((message) => {
      const decryptedText = this.decryptMessage(message.text, 'Chatsper9999');
      return { ...message, text: decryptedText };
    });
    return decryptedMessages;
  }

  encryptMessage(message: string, key: string): string {
    const encrypted = CryptoJS.AES.encrypt(message, key).toString();
    return encrypted;
  }

  decryptMessage(encryptedMessage: string, key: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key).toString(
      CryptoJS.enc.Utf8
    );
    return decrypted;
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

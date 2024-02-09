import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  HostListener,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { combineLatest, map, Observable, of, switchMap, tap } from 'rxjs';
import { Message } from 'src/app/models/chat';
import { ProfileUser } from 'src/app/models/user';
import { ChatsService } from 'src/app/services/chats.service';
import { UsersService } from 'src/app/services/users.service';
import { Router, ActivatedRoute } from '@angular/router';
import { startWith, take, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import * as CryptoJS from 'crypto-js';

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
  messagesSubscription: Subscription | undefined;

  constructor(
    private usersService: UsersService,
    private chatsService: ChatsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const chatId = params['chatId'];
      this.loadOrCreateChat(chatId);
    });

    this.handleWindowResize();

    // Subscribe to messages$ observable
    this.messagesSubscription = this.chatListControl.valueChanges
      .pipe(
        map((value) => value?.[0]),
        switchMap((chatId) =>
          chatId ? this.chatsService.getChatMessages$(chatId) : of([])
        ),
        tap(() => {
          this.scrollToBottom();
        }),
        map((messages) => this.decryptMessages(messages)) // Decrypt messages before rendering
      )
      .subscribe((messages) => {
        this.messages$ = of(messages);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    // Unsubscribe from messages$ observable
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
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
        if (this.router.url === '/') {
          const routeChatId = this.router.url.includes('/chats/')
            ? this.router.url.split('/chats/')[1]
            : null;
          const chatRoute = routeChatId
            ? `/messages/${routeChatId}`
            : this.isMobileScreen()
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

  scrollToBottom() {
    setTimeout(() => {
      if (this.endOfChat) {
        this.endOfChat.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  isMobileScreen(): boolean {
    return window.innerWidth <= 700;
  }

  @HostListener('window:resize', ['$event'])
  handleWindowResize(event?: Event) {
    if (!this.isMobileScreen()) {
      this.router.navigate(['/home']);
    }
  }

  loadOrCreateChat(chatId: string) {
    if (chatId) {
      this.chatsService.getChatMessages$(chatId).subscribe((messages) => {
        this.chatListControl.setValue([chatId]);
        // Additional logic if needed to handle loaded messages
      });
    } else {
      // If chatId is not provided, create a new chat
      const user$ = this.usersService.currentUserProfile$;
      user$.pipe(take(1)).subscribe((user) => {
        if (user) {
          // Check if user is not null
          this.chatsService.createChat(user).subscribe((newChatId) => {
            this.chatListControl.setValue([newChatId]);
            // Additional logic if needed after creating the new chat
          });
        } else {
          console.error('User is null. Cannot create a chat.'); // Handle the case where user is null
        }
      });
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
}

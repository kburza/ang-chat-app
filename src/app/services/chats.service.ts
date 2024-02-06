import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  doc,
  Firestore,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { concatMap, map, Observable, switchMap, take } from 'rxjs';
import { Chat, Message } from '../models/chat';
import { ProfileUser } from '../models/user';
import { UsersService } from './users.service';
import { from, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatsService {
  getLatestMessages(): any {
    throw new Error('Method not implemented.');
  }
  constructor(
    private firestore: Firestore,
    private usersService: UsersService
  ) {}

  get myChats$(): Observable<Chat[]> {
    const ref = collection(this.firestore, 'chats');
    return this.usersService.currentUserProfile$.pipe(
      concatMap((user) => {
        const myQuery = query(
          ref,
          where('userIds', 'array-contains', user?.uid)
        );
        return collectionData(myQuery, { idField: 'id' }).pipe(
          map((chats: any) => this.addChatNameAndPic(user?.uid, chats))
        ) as Observable<Chat[]>;
      })
    );
  }

  createChat(otherUserOrChatId: ProfileUser | string): Observable<string> {
    const ref = collection(this.firestore, 'chats');
    return this.usersService.currentUserProfile$.pipe(
      take(1),
      switchMap((user) => {
        if (typeof otherUserOrChatId === 'string') {
          // Handle the case where a chatId is provided
          return of(otherUserOrChatId);
        } else {
          // Handle the case where a ProfileUser object is provided
          return from(
            addDoc(ref, {
              userIds: [user?.uid, otherUserOrChatId?.uid],
              users: [
                {
                  displayName: user?.displayName ?? '',
                  //   photoURL: user?.photoURL ?? '',
                },
                {
                  displayName: otherUserOrChatId.displayName ?? '',
                  //   photoURL: otherUserOrChatId.photoURL ?? '',
                },
              ],
            })
          ).pipe(map((ref) => ref.id));
        }
      })
    );
  }

  createChatWithId(chatId: string): Observable<string> {
    const ref = collection(this.firestore, 'chats');
    return this.usersService.currentUserProfile$.pipe(
      take(1),
      concatMap((user) =>
        addDoc(ref, {
          userIds: [user?.uid, chatId], // Use the provided chatId
          users: [
            {
              displayName: user?.displayName ?? '',
            },
            // ... rest of your code
          ],
        })
      ),
      map((ref) => ref.id)
    );
  }

  isExistingChat(otherUserId: string): Observable<string | null> {
    return this.myChats$.pipe(
      take(1),
      map((chats) => {
        for (let i = 0; i < chats.length; i++) {
          if (chats[i].userIds.includes(otherUserId)) {
            return chats[i].id;
          }
        }

        return null;
      })
    );
  }

  addChatMessage(chatId: string, message: string): Observable<any> {
    const ref = collection(this.firestore, 'chats', chatId, 'messages');
    const chatRef = doc(this.firestore, 'chats', chatId);
    const today = Timestamp.fromDate(new Date());
    return this.usersService.currentUserProfile$.pipe(
      take(1),
      concatMap((user) =>
        addDoc(ref, {
          text: message,
          senderId: user?.uid,
          sentDate: today,
        })
      ),
      concatMap(() =>
        updateDoc(chatRef, { lastMessage: message, lastMessageDate: today })
      )
    );
  }

  getChatMessages$(chatId: string): Observable<Message[]> {
    const ref = collection(this.firestore, 'chats', chatId, 'messages');
    const queryAll = query(ref, orderBy('sentDate', 'asc'));
    return collectionData(queryAll) as Observable<Message[]>;
  }

  addChatNameAndPic(currentUserId: string | undefined, chats: Chat[]): Chat[] {
    chats.forEach((chat: Chat) => {
      const otherUserIndex =
        chat.userIds.indexOf(currentUserId ?? '') === 0 ? 1 : 0;
      const { displayName } = chat.users[otherUserIndex];
      chat.chatName = displayName;
      //   chat.chatPic = photoURL;
    });

    return chats;
  }
}

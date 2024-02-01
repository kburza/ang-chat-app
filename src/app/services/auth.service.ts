import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  authState,
  createUserWithEmailAndPassword,
  updateProfile,
  UserCredential,
} from '@angular/fire/auth';
import { from, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  addUser(profileData: any) {
    throw new Error('Method not implemented.');
  }
  updateUser(arg0: {
    displayName?: string | null | undefined;
    firstName?: string | null | undefined;
    lastName?: string | null | undefined;
    phone?: string | null | undefined;
    address?: string | null | undefined;
    uid: string;
  }) {
    throw new Error('Method not implemented.');
  }
  currentUser$ = authState(this.auth);

  constructor(private auth: Auth) {}

  signUp(email: string, password: string): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  updateProfileData(data: { photoURL: string }): Observable<void> {
    const user = this.auth.currentUser;
    if (!user) {
      return of(); // Return an observable with no value if the user is not authenticated
    }

    return from(updateProfile(user, data));
  }

  logout(): Observable<any> {
    return from(this.auth.signOut());
  }
}

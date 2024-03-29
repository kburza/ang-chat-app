import { NgModule, Pipe } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './components/login/login.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { HomeComponent } from './components/home/home.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { HotToastModule } from '@ngneat/hot-toast';
import { LandingComponent } from './components/landing/landing.component';
import { MatMenuModule } from '@angular/material/menu';
import { ProfileComponent } from './components/profile/profile.component';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Ghost, LucideAngularModule } from 'lucide-angular';

import { MatListModule } from '@angular/material/list';
import {} from '@angular/material/form-field';
import {} from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DateDisplayPipe } from 'src/app/components/pipes/date-display.pipe';
import { TimeAgoPipe } from 'time-ago-pipe';
import { DatePipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { ChatListComponent } from './components/chat-list/chat-list.component';
import { MessageWindowComponent } from './components/messages/messages.component';
import { PassResetComponent } from './components/pass-reset/pass-reset.component';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Pipe({
  name: 'timeAgo',
  pure: false,
})
export class TimeAgoExtendsPipe extends TimeAgoPipe {}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignUpComponent,
    LandingComponent,
    HomeComponent,
    ProfileComponent,
    DateDisplayPipe,
    TimeAgoExtendsPipe,
    ChatListComponent,
    MessageWindowComponent,
    PassResetComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    HotToastModule.forRoot(),
    MatMenuModule,
    MatButtonToggleModule,
    MatTooltipModule,
    LucideAngularModule.pick({ Ghost }),
    MatAutocompleteModule,
    MatListModule,
    DatePipe,
    MatDividerModule,
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}

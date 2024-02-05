import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageWindowComponent } from './messages.component';

describe('MessageWindowComponent', () => {
  let component: MessageWindowComponent;
  let fixture: ComponentFixture<MessageWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MessageWindowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MessageWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { DatePipe } from '@angular/common';
import { DateDisplayPipe } from '../pipes/date-display.pipe'; // Adjust the path based on your project structure

describe('DateDisplayPipe', () => {
  it('create an instance', () => {
    const datePipe = new DatePipe('en-US');
    const pipe = new DateDisplayPipe(datePipe);
    expect(pipe).toBeTruthy();
  });
});

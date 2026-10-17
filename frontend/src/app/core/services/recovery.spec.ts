import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { RecoveryService } from './recovery';

describe('RecoveryService', () => {
  let service: RecoveryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(RecoveryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AchievementsMainComponent } from './achievements-main.component';

describe('AchievementsMainComponent', () => {
  let component: AchievementsMainComponent;
  let fixture: ComponentFixture<AchievementsMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AchievementsMainComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AchievementsMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

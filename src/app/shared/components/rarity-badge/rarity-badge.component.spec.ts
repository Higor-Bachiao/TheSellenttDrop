import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RarityBadgeComponent } from './rarity-badge.component';

describe('RarityBadgeComponent', () => {
  let component: RarityBadgeComponent;
  let fixture: ComponentFixture<RarityBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RarityBadgeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RarityBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

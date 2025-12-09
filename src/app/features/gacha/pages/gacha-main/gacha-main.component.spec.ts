import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GachaMainComponent } from './gacha-main.component';

describe('GachaMainComponent', () => {
  let component: GachaMainComponent;
  let fixture: ComponentFixture<GachaMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GachaMainComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GachaMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

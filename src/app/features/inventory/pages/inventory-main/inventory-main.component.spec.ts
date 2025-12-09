import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryMainComponent } from './inventory-main.component';

describe('InventoryMainComponent', () => {
  let component: InventoryMainComponent;
  let fixture: ComponentFixture<InventoryMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryMainComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InventoryMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

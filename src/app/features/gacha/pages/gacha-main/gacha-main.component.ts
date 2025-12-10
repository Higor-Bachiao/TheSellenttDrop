import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GachaService } from '../../../../core/services/gacha.service';
import { GachaBox } from '../../../../../../shared/types';

@Component({
  selector: 'app-gacha-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gacha-main.component.html',
  styleUrl: './gacha-main.component.css'
})
export class GachaMainComponent implements OnInit {
  private gachaService = inject(GachaService);
  private router = inject(Router);

  boxes: GachaBox[] = [];
  loading = true;

  ngOnInit() {
    this.loadBoxes();
  }

  loadBoxes() {
    this.gachaService.listBoxes().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.boxes = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openBox(boxId: string) {
    this.router.navigate(['/gacha/roll'], { queryParams: { boxId } });
  }
}

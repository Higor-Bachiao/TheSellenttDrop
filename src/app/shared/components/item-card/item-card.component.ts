import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Item } from '../../../../../shared/types';
import { RarityBadgeComponent } from '../rarity-badge/rarity-badge.component';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule, RarityBadgeComponent],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.css'
})
export class ItemCardComponent {
  @Input() item!: Item;
  @Input() quantity?: number;

  getRarityClass(): string {
    return `rarity-border-${this.item.rarity}`;
  }
}

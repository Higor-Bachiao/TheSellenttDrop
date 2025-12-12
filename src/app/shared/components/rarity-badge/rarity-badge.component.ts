import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemRarity } from '../../../../../shared/types';

@Component({
  selector: 'app-rarity-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rarity-badge.component.html',
  styleUrl: './rarity-badge.component.css'
})
export class RarityBadgeComponent {
  @Input() rarity!: ItemRarity;

  getRarityClass(): string {
    return `rarity-${this.rarity}`;
  }

  getRarityLabel(): string {
    const labels: Record<ItemRarity, string> = {
      [ItemRarity.COMUM]: 'Comum',
      [ItemRarity.RARO]: 'Raro',
      [ItemRarity.EPICO]: 'Épico',
      [ItemRarity.LENDARIO]: 'Lendário',
      [ItemRarity.QUANTUM]: 'Accidentally Quantum Existence'
    };
    return labels[this.rarity] || this.rarity;
  }
}

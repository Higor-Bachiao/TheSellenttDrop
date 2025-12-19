import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { ItemCardComponent } from '../../../../shared/components/item-card/item-card.component';
import { UserItem, Item, ItemRarity } from '../../../../../../shared/types';
import { ItemService } from '../../../../core/services/item.service';

interface InventoryItem {
  item: Item;
  rarity: number;
  quantity: number;
  obtainedAt: any;
}

@Component({
  selector: 'app-inventory-main',
  standalone: true,
  imports: [CommonModule, RouterModule, ItemCardComponent],
  templateUrl: './inventory-main.component.html',
  styleUrl: './inventory-main.component.css'
})
export class InventoryMainComponent implements OnInit {
  items: InventoryItem[] = [];
  sortedItems: InventoryItem[] = [];
  loading = false;
  error: string | null = null;
  sortBy: 'rarity' | 'date' | 'quantity' = 'rarity';

  constructor(
    private itemService: ItemService,
    private auth: Auth
  ) {}

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      this.error = 'Usuário não autenticado';
      return;
    }

    // Primeiro, verificar se há cache disponível
    const cache = this.itemService.getInventoryCache();
    cache.subscribe(cachedItems => {
      if (cachedItems) {
        // Mostrar dados do cache imediatamente
        this.items = cachedItems;
        this.sortItems();
        this.loading = false;
      }
    });

    this.loading = true;
    this.error = null;
    
    // Buscar dados atualizados do servidor
    this.itemService.getUserInventory(currentUser.uid).subscribe({
      next: (response) => {
        this.items = response.data || [];
        this.sortItems();
        this.loading = false;
      },
      error: (err) => {
        // Se houver cache, não mostrar erro
        if (!this.items.length) {
          this.error = 'Erro ao carregar inventário';
        }
        this.loading = false;
        console.error('Erro ao carregar inventário:', err);
      }
    });
  }

  getRarityOrder(rarity: string): number {
    // Ordem: Quantum (5) > Lendário (4) > Épico (3) > Raro (2) > Comum (1)
    const rarityMap: { [key: string]: number } = {
      'quantum': 5,
      'lendario': 4,
      'epico': 3,
      'raro': 2,
      'comum': 1
    };
    return rarityMap[rarity?.toLowerCase()] || 0;
  }

  sortItems() {
    this.sortedItems = [...this.items];

    switch (this.sortBy) {
      case 'rarity':
        this.sortedItems.sort((a, b) => {
          const rarityA = a.item?.rarity || '';
          const rarityB = b.item?.rarity || '';
          const orderA = this.getRarityOrder(rarityA);
          const orderB = this.getRarityOrder(rarityB);

          // Se forem da mesma categoria, ordenar pelo nome
          if (orderA === orderB) {
            return (a.item?.name || '').localeCompare(b.item?.name || '');
          }

          // Caso contrário, ordenar pela categoria (maior primeiro)
          return orderB - orderA;
        });
        break;
      case 'date':
        this.sortedItems = [...this.items].sort((a, b) => {
          // Função auxiliar para converter qualquer formato para timestamp
          const toTimestamp = (obtainedAt: any): number => {
            if (typeof obtainedAt === 'number') return obtainedAt;
            if (typeof obtainedAt === 'string') return new Date(obtainedAt).getTime();
            if (obtainedAt instanceof Date) return obtainedAt.getTime();
            if (obtainedAt?.toDate) return obtainedAt.toDate().getTime();
            return 0;
          };

          const timeA = toTimestamp(a.obtainedAt);
          const timeB = toTimestamp(b.obtainedAt);

          // Se as datas são diferentes, ordenar por data (mais recente primeiro)
          if (timeA !== timeB) {
            return timeB - timeA;
          }

          // Se as datas são iguais, ordenar por nome como critério de desempate
          return (a.item?.name || '').localeCompare(b.item?.name || '');
        });
        break;
      case 'quantity':
        this.sortedItems.sort((a, b) => {
          const qtyA = Number(a.quantity) || 0;
          const qtyB = Number(b.quantity) || 0;
          return qtyB - qtyA;
        });
        break;
    }
  }

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.sortBy = target.value as 'rarity' | 'date' | 'quantity';
    this.sortItems();
  }

  getRarityColor(rarity: number): string {
    if (rarity <= 200) return '#9e9e9e'; // comum
    if (rarity <= 400) return '#4caf50'; // incomum
    if (rarity <= 600) return '#2196f3'; // raro
    if (rarity <= 800) return '#9c27b0'; // épico
    return '#f44336'; // lendário
  }

  getRarityTier(rarity: number): string {
    if (rarity <= 200) return 'Comum';
    if (rarity <= 400) return 'Incomum';
    if (rarity <= 600) return 'Raro';
    if (rarity <= 800) return 'Épico';
    return 'Lendário';
  }

  getRarityIcon(rarity: number): string {
    if (rarity <= 200) return 'bi-circle';
    if (rarity <= 400) return 'bi-square';
    if (rarity <= 600) return 'bi-diamond';
    if (rarity <= 800) return 'bi-star';
    return 'bi-gem';
  }
}

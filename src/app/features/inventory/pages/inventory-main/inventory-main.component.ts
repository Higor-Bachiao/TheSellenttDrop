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

  getRarityOrder(rarity: number): number {
    // Ordem: Quantum (1000+) > Lendário (800-999) > Épico (600-799) > Raro (400-599) > Comum (0-399)
    if (rarity >= 1000) return 5; // Quantum
    if (rarity >= 800) return 4;  // Lendário
    if (rarity >= 600) return 3;  // Épico
    if (rarity >= 400) return 2;  // Raro
    return 1;                      // Comum
  }

  sortItems() {
    this.sortedItems = [...this.items];
    
    console.log('🔄 Ordenando por:', this.sortBy);
    console.log('📦 Itens antes:', this.sortedItems.length);
    
    switch (this.sortBy) {
      case 'rarity':
        this.sortedItems.sort((a, b) => {
          const rarityA = Number(a.rarity) || 0;
          const rarityB = Number(b.rarity) || 0;
          const orderA = this.getRarityOrder(rarityA);
          const orderB = this.getRarityOrder(rarityB);
          
          // Se forem da mesma categoria, ordenar pelo número exato
          if (orderA === orderB) {
            return rarityB - rarityA;
          }
          
          // Caso contrário, ordenar pela categoria (maior primeiro)
          return orderB - orderA;
        });
        console.log('✅ Ordenado por raridade:', this.sortedItems.map(i => `${i.item.name}: ${i.rarity} (ordem: ${this.getRarityOrder(i.rarity)})`));
        break;
      case 'date':
        this.sortedItems.sort((a, b) => {
          const getTimestamp = (obtainedAt: any): number => {
            if (!obtainedAt) return 0;
            
            // Firestore Timestamp com método toDate()
            if (typeof obtainedAt.toDate === 'function') {
              return obtainedAt.toDate().getTime();
            }
            
            // Date object
            if (obtainedAt instanceof Date) {
              return obtainedAt.getTime();
            }
            
            // Formato Firestore serializado: {_seconds, _nanoseconds}
            if (typeof obtainedAt._seconds === 'number') {
              return obtainedAt._seconds * 1000 + Math.floor((obtainedAt._nanoseconds || 0) / 1000000);
            }
            
            // Formato alternativo: {seconds, nanoseconds}
            if (typeof obtainedAt.seconds === 'number') {
              return obtainedAt.seconds * 1000 + Math.floor((obtainedAt.nanoseconds || 0) / 1000000);
            }
            
            // Tentar converter string ou número
            const timestamp = new Date(obtainedAt).getTime();
            return isNaN(timestamp) ? 0 : timestamp;
          };
          
          const timestampA = getTimestamp(a.obtainedAt);
          const timestampB = getTimestamp(b.obtainedAt);
          
          return timestampB - timestampA; // Mais recente primeiro
        });
        console.log('✅ Ordenado por data');
        break;
      case 'quantity':
        this.sortedItems.sort((a, b) => {
          const qtyA = Number(a.quantity) || 0;
          const qtyB = Number(b.quantity) || 0;
          return qtyB - qtyA;
        });
        console.log('✅ Ordenado por quantidade:', this.sortedItems.map(i => `${i.item.name}: ${i.quantity}`));
        break;
    }
  }

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.sortBy = target.value as 'rarity' | 'date' | 'quantity';
    console.log('📝 Filtro alterado para:', this.sortBy);
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

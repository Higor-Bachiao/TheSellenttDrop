import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { environment } from '../../../../../environments/environment';

interface InventoryItem {
  item: {
    id: string;
    name: string;
    imageUrl: string;
    rarity: string;
  };
  rarity: number;
  quantity: number;
  obtainedAt: any;
}

@Component({
  selector: 'app-inventory-main',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
    private http: HttpClient,
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

    this.loading = true;
    this.error = null;
    this.http.get<any>(`${environment.apiUrl}/users/${currentUser.uid}/items`).subscribe({
      next: (response) => {
        this.items = response.data || [];
        this.sortItems();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar inventário';
        this.loading = false;
        console.error('Erro ao carregar inventário:', err);
      }
    });
  }

  sortItems() {
    this.sortedItems = [...this.items];
    
    switch (this.sortBy) {
      case 'rarity':
        this.sortedItems.sort((a, b) => b.rarity - a.rarity);
        break;
      case 'date':
        this.sortedItems.sort((a, b) => {
          const dateA = a.obtainedAt?.toDate?.() || new Date(0);
          const dateB = b.obtainedAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'quantity':
        this.sortedItems.sort((a, b) => b.quantity - a.quantity);
        break;
    }
  }

  onSortChange(event: any) {
    this.sortBy = event.target.value;
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

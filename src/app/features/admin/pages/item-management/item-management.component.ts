import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface Item {
  id: string;
  name: string;
  imageUrl: string;
  rarity: string;
  dropRate: number;
  boxId: string;
}

interface Box {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  cost: number;
}

@Component({
  selector: 'app-item-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-management.component.html',
  styleUrl: './item-management.component.css'
})
export class ItemManagementComponent implements OnInit {
  items: Item[] = [];
  allItems: Item[] = [];
  boxes: Box[] = [];
  selectedBoxId: string = 'all';
  loading = false;
  loadingBoxes = false;
  error: string | null = null;
  
  showModal = false;
  editingItem: Item | null = null;
  
  formData = {
    name: '',
    imageUrl: '',
    rarity: 'comum',
    dropRate: 0,
    boxId: ''
  };

  rarityOptions = ['comum', 'incomum', 'raro', 'épico', 'lendário'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadBoxes();
    this.loadItems();
  }

  loadBoxes() {
    this.loadingBoxes = true;
    this.http.get<any>(`${environment.apiUrl}/boxes`).subscribe({
      next: (response) => {
        this.boxes = response.data || [];
        this.loadingBoxes = false;
      },
      error: (err) => {
        console.error('Erro ao carregar caixas:', err);
        this.loadingBoxes = false;
      }
    });
  }

  loadItems() {
    this.loading = true;
    this.error = null;
    this.http.get<any>(`${environment.apiUrl}/items`).subscribe({
      next: (response) => {
        this.allItems = response.data || [];
        this.filterItemsByBox();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar itens';
        this.loading = false;
        console.error('Erro ao carregar itens:', err);
      }
    });
  }

  filterItemsByBox() {
    if (this.selectedBoxId === 'all') {
      this.items = this.allItems;
    } else {
      this.items = this.allItems.filter(item => item.boxId === this.selectedBoxId);
    }
  }

  onBoxFilterChange() {
    this.filterItemsByBox();
  }

  openAddModal() {
    this.editingItem = null;
    this.formData = {
      name: '',
      imageUrl: '',
      rarity: 'comum',
      dropRate: 0,
      boxId: this.boxes.length > 0 ? this.boxes[0].id : ''
    };
    this.showModal = true;
  }

  openEditModal(item: Item) {
    this.editingItem = item;
    this.formData = {
      name: item.name,
      imageUrl: item.imageUrl,
      rarity: item.rarity,
      dropRate: item.dropRate,
      boxId: item.boxId
    };
    this.showModal = true;
  }

  getBoxName(boxId: string): string {
    const box = this.boxes.find(b => b.id === boxId);
    return box ? box.name : 'Sem caixa';
  }

  closeModal() {
    this.showModal = false;
    this.editingItem = null;
  }

  saveItem() {
    if (!this.formData.boxId) {
      alert('Por favor, selecione uma caixa para o item');
      return;
    }

    if (this.editingItem) {
      // Update existing item
      this.http.put(`${environment.apiUrl}/items/${this.editingItem.id}`, this.formData).subscribe({
        next: () => {
          this.loadItems();
          this.closeModal();
        },
        error: (err) => {
          alert('Erro ao atualizar item');
          console.error('Erro ao atualizar:', err);
        }
      });
    } else {
      // Create new item
      this.http.post(`${environment.apiUrl}/items`, this.formData).subscribe({
        next: () => {
          this.loadItems();
          this.closeModal();
        },
        error: (err) => {
          alert('Erro ao criar item');
          console.error('Erro ao criar:', err);
        }
      });
    }
  }

  deleteItem(itemId: string) {
    if (confirm('Tem certeza que deseja deletar este item?')) {
      this.http.delete(`${environment.apiUrl}/items/${itemId}`).subscribe({
        next: () => {
          this.loadItems();
        },
        error: (err) => {
          alert('Erro ao deletar item');
          console.error(err);
        }
      });
    }
  }

  getRarityColor(rarity: string): string {
    const colors: any = {
      'comum': '#9e9e9e',
      'incomum': '#4caf50',
      'raro': '#2196f3',
      'épico': '#9c27b0',
      'lendário': '#f44336'
    };
    return colors[rarity] || '#fff';
  }
}

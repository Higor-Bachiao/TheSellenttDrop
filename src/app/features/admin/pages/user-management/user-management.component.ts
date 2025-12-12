import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'ADMIN' | 'JOGADOR';
  coins: number;
  createdAt: any;
}

interface UserItem {
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
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  selectedUser: User | null = null;
  userItems: UserItem[] = [];
  showItemsModal = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = null;
    this.http.get<{ data: User[] }>(`${environment.apiUrl}/users`).subscribe({
      next: (response) => {
        this.users = response.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar usuários';
        this.loading = false;
        console.error(err);
      }
    });
  }

  updateUserRole(uid: string, newRole: 'ADMIN' | 'JOGADOR') {
    this.http.put(`${environment.apiUrl}/users/${uid}/role`, { role: newRole }).subscribe({
      next: () => {
        const user = this.users.find(u => u.uid === uid);
        if (user) {
          user.role = newRole;
        }
      },
      error: (err) => {
        alert('Erro ao atualizar role do usuário');
        console.error(err);
      }
    });
  }

  viewUserItems(user: User) {
    this.selectedUser = user;
    this.showItemsModal = true;
    this.http.get<{ items: UserItem[] }>(`${environment.apiUrl}/users/${user.uid}/items`).subscribe({
      next: (response) => {
        this.userItems = response.items;
      },
      error: (err) => {
        alert('Erro ao carregar itens do usuário');
        console.error(err);
      }
    });
  }

  closeItemsModal() {
    this.showItemsModal = false;
    this.selectedUser = null;
    this.userItems = [];
  }

  getRarityColor(rarity: number): string {
    if (rarity <= 250) return '#3b82f6';   // Comum - Azul
    if (rarity <= 500) return '#f97316';   // Raro - Laranja
    if (rarity <= 750) return '#a855f7';   // Épico - Roxo
    if (rarity <= 950) return '#fbbf24';   // Lendário - Dourado
    return '#ff0080';                       // Quantum - Rosa/Multicolor
  }

  getRarityTier(rarity: number): string {
    if (rarity <= 250) return 'Comum';
    if (rarity <= 500) return 'Raro';
    if (rarity <= 750) return 'Épico';
    if (rarity <= 950) return 'Lendário';
    return 'Quantum';
  }
}

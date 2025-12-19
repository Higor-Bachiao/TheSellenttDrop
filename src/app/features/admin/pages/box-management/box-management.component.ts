import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';

interface Box {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  cost: number;
  createdAt?: any;
  updatedAt?: any;
}

@Component({
  selector: 'app-box-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './box-management.component.html',
  styleUrl: './box-management.component.css'
})
export class BoxManagementComponent implements OnInit {
  boxes: Box[] = [];
  loading = false;
  error: string | null = null;
  showModal = false;
  editingBox: Box | null = null;
  
  formData = {
    name: '',
    description: '',
    imageUrl: '',
    cost: 100
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadBoxes();
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  loadBoxes() {
    this.loading = true;
    this.error = null;
    this.http.get<{ success: boolean; data: Box[] }>(`${environment.apiUrl}/boxes`).subscribe({
      next: (response) => {
        this.boxes = response.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar boxes';
        this.loading = false;
        console.error(err);
      }
    });
  }

  openAddModal() {
    this.editingBox = null;
    this.formData = {
      name: '',
      description: '',
      imageUrl: '',
      cost: 100
    };
    this.showModal = true;
  }

  openEditModal(box: Box) {
    this.editingBox = box;
    this.formData = {
      name: box.name,
      description: box.description,
      imageUrl: box.imageUrl,
      cost: box.cost
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingBox = null;
  }

  saveBox() {
    const url = this.editingBox 
      ? `${environment.apiUrl}/boxes/${this.editingBox.id}`
      : `${environment.apiUrl}/boxes`;
    
    const method = this.editingBox ? 'put' : 'post';

    this.http.request(method, url, { body: this.formData }).subscribe({
      next: () => {
        this.closeModal();
        this.loadBoxes();
      },
      error: (err) => {
        alert('Erro ao salvar box');
        console.error(err);
      }
    });
  }

  deleteBox(boxId: string) {
    if (!confirm('Tem certeza que deseja deletar esta box? Todos os itens associados serão removidos!')) {
      return;
    }

    this.http.delete(`${environment.apiUrl}/boxes/${boxId}`).subscribe({
      next: () => {
        this.loadBoxes();
      },
      error: (err) => {
        alert('Erro ao deletar box');
        console.error(err);
      }
    });
  }
}

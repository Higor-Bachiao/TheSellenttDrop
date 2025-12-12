import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Item } from '../../../../shared/types';

interface InventoryItem {
  item: Item;
  rarity: number;
  quantity: number;
  obtainedAt: any;
}

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private inventoryCache$ = new BehaviorSubject<InventoryItem[] | null>(null);
  private lastFetch = 0;
  private cacheDuration = 30000; // 30 segundos de cache

  constructor(private http: HttpClient) { }

  getUserInventory(userId: string, forceRefresh = false): Observable<any> {
    const now = Date.now();
    
    // Se não forçar refresh e tiver cache válido, retorna do cache
    if (!forceRefresh && this.inventoryCache$.value && (now - this.lastFetch) < this.cacheDuration) {
      return of({ success: true, data: this.inventoryCache$.value });
    }

    // Buscar do servidor
    return this.http.get<any>(`${environment.apiUrl}/users/${userId}/items`).pipe(
      tap(response => {
        if (response.success) {
          this.inventoryCache$.next(response.data);
          this.lastFetch = now;
        }
      })
    );
  }

  getInventoryCache(): Observable<InventoryItem[] | null> {
    return this.inventoryCache$.asObservable();
  }

  invalidateCache(): void {
    this.inventoryCache$.next(null);
    this.lastFetch = 0;
  }

  refreshInventory(userId: string): Observable<any> {
    return this.getUserInventory(userId, true);
  }
}

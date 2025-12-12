import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interface para conquista com progresso do usuário
export interface AchievementWithProgress {
  id: string;
  name: string;
  description: string;
  reward: number;
  progress: number;
  requirement: number;
  completed: boolean;
  claimed: boolean;
  completedAt?: Date;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon?: string;
  secret?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private http = inject(HttpClient);
  private achievementsSubject = new BehaviorSubject<AchievementWithProgress[]>([]);
  public achievements$ = this.achievementsSubject.asObservable();
  private lastFetch = 0;
  private cacheDuration = 30000; // 30 segundos de cache

  // Obter todas as conquistas com progresso do usuário
  getUserAchievements(userId: string, forceRefresh = false): Observable<any> {
    const now = Date.now();
    
    // Se não forçar refresh e tiver cache válido, retorna do cache
    if (!forceRefresh && this.achievementsSubject.value.length > 0 && (now - this.lastFetch) < this.cacheDuration) {
      return of({ success: true, data: this.achievementsSubject.value });
    }

    return this.http.get<any>(`${environment.apiUrl}/users/${userId}/achievements`).pipe(
      tap(response => {
        if (response.data) {
          this.achievementsSubject.next(response.data);
          this.lastFetch = now;
        }
      })
    );
  }

  // Invalidar cache
  invalidateCache(): void {
    this.lastFetch = 0;
  }

  // Reivindicar recompensa de uma conquista
  claimReward(userId: string, achievementId: string): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/users/${userId}/achievements/${achievementId}/claim`,
      {}
    );
  }

  // Verificar se há novas conquistas desbloqueadas
  checkAchievements(userId: string): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/users/${userId}/achievements/check`,
      {}
    );
  }

  // Calcular progresso percentual
  calculateProgress(current: number, required: number): number {
    return Math.min(Math.round((current / required) * 100), 100);
  }

  // Obter cor do tier
  getTierColor(tier?: string): string {
    switch (tier) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'platinum': return '#e5e4e2';
      default: return '#f97316';
    }
  }
}

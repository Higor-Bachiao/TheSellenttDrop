import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchievementService, AchievementWithProgress } from '../../../../core/services/achievement.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-achievements-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './achievements-main.component.html',
  styleUrl: './achievements-main.component.css'
})
export class AchievementsMainComponent implements OnInit {
  achievements: AchievementWithProgress[] = [];
  filteredAchievements: AchievementWithProgress[] = [];
  currentFilter: 'all' | 'completed' | 'in-progress' | 'locked' = 'all';
  loadingAchievements = true;
  
  // Estatísticas
  totalAchievements = 0;
  completedCount = 0;
  totalCoinsEarned = 0;
  completionRate = 0;

  constructor(
    private achievementService: AchievementService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadAchievements();
  }

  loadAchievements() {
    this.loadingAchievements = true;
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.loadingAchievements = false;
      return;
    }

    // Forçar refresh para buscar dados mais recentes
    this.achievementService.getUserAchievements(user.uid, true).subscribe({
      next: (response) => {
        this.achievements = response.data || [];
        this.updateStatistics();
        this.applyFilter(this.currentFilter);
        this.loadingAchievements = false;
      },
      error: (err) => {
        console.error('Erro ao carregar conquistas:', err);
        this.toastService.show('Erro ao carregar conquistas', 'error');
        this.loadingAchievements = false;
      }
    });
  }

  updateStatistics() {
    this.totalAchievements = this.achievements.length;
    this.completedCount = this.achievements.filter(a => a.completed).length;
    this.totalCoinsEarned = this.achievements
      .filter(a => a.claimed)
      .reduce((sum, a) => sum + a.reward, 0);
    this.completionRate = this.totalAchievements > 0 
      ? Math.round((this.completedCount / this.totalAchievements) * 100) 
      : 0;
  }

  applyFilter(filter: 'all' | 'completed' | 'in-progress' | 'locked') {
    this.currentFilter = filter;
    
    switch (filter) {
      case 'completed':
        this.filteredAchievements = this.achievements.filter(a => a.completed);
        break;
      case 'in-progress':
        this.filteredAchievements = this.achievements.filter(a => !a.completed && a.progress > 0);
        break;
      case 'locked':
        this.filteredAchievements = this.achievements.filter(a => !a.completed && a.progress === 0);
        break;
      default:
        this.filteredAchievements = [...this.achievements];
    }
  }

  onClaimReward(achievementId: string) {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.toastService.show('Você precisa estar logado', 'error');
      return;
    }

    this.achievementService.claimReward(user.uid, achievementId).subscribe({
      next: (response) => {
        const reward = response.data?.reward || 0;
        this.toastService.show(`Recompensa reivindicada! +${reward} moedas`, 'success');
        
        // Recarregar dados do usuário para atualizar moedas
        this.authService.loadCurrentUser().subscribe();
        
        // Invalidar cache e recarregar conquistas
        this.achievementService.invalidateCache();
        this.loadAchievements();
      },
      error: (err) => {
        console.error('Erro ao reivindicar recompensa:', err);
        this.toastService.show('Erro ao reivindicar recompensa', 'error');
      }
    });
  }

  checkForNewAchievements() {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      return;
    }

    this.achievementService.checkAchievements(user.uid).subscribe({
      next: (response) => {
        const newAchievements = response.data || [];
        if (newAchievements.length > 0) {
          this.toastService.show(
            `🎉 ${newAchievements.length} nova(s) conquista(s) desbloqueada(s)!`, 
            'success'
          );
        } else {
          this.toastService.show('Nenhuma conquista nova encontrada', 'info');
        }
        // SEMPRE recarregar após verificar (mesmo sem novas conquistas, pode ter progresso atualizado)
        this.achievementService.invalidateCache();
        this.loadAchievements();
      },
      error: (err) => {
        console.error('Erro ao verificar conquistas:', err);
      }
    });
  }

  // Helpers para template
  getProgress(achievement: AchievementWithProgress): number {
    return this.achievementService.calculateProgress(achievement.progress, achievement.requirement);
  }

  getProgressText(achievement: AchievementWithProgress): string {
    return `${achievement.progress} / ${achievement.requirement}`;
  }

  getTierEmoji(tier?: string): string {
    switch (tier) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      default: return '🏆';
    }
  }

  getTierClass(tier?: string): string {
    return `tier-${tier || 'bronze'}`;
  }

  canClaimReward(achievement: AchievementWithProgress): boolean {
    return achievement.completed && !achievement.claimed;
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GachaService } from '../../../../core/services/gacha.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ItemService } from '../../../../core/services/item.service';
import { AchievementService } from '../../../../core/services/achievement.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';
import { User, GachaBox, GachaResult } from '../../../../../../shared/types';

interface BoxItem {
  id: string;
  name: string;
  imageUrl: string;
  rarity: string;
  dropRate: number;
  boxId: string;
}

@Component({
  selector: 'app-gacha-roll',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gacha-roll.component.html',
  styleUrl: './gacha-roll.component.css'
})
export class GachaRollComponent implements OnInit {
  private gachaService = inject(GachaService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private itemService = inject(ItemService);
  private achievementService = inject(AchievementService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  currentUser$: Observable<User | null> = this.authService.currentUser$;
  currentBox: GachaBox | null = null;
  boxItems: BoxItem[] = [];
  slotItems: BoxItem[] = [];
  isRolling = false;
  showResult = false;
  result: GachaResult | null = null;
  boxId: string | null = null;
  slotPosition = 0;
  animationPhase: 'fast' | 'slow' | 'stop' = 'fast';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.boxId = params['boxId'] || 'box-inicial';
      this.loadBox();
    });
  }

  loadBox() {
    if (!this.boxId) {
      this.router.navigate(['/gacha']);
      return;
    }

    this.gachaService.getBox(this.boxId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentBox = response.data;
          this.loadBoxItems();
        } else {
          this.toastService.error('Caixa não encontrada');
          this.router.navigate(['/gacha']);
        }
      },
      error: (error) => {
        console.error('Erro ao carregar box:', error);
        this.toastService.error('Erro ao carregar caixa do gacha');
        this.router.navigate(['/gacha']);
      }
    });
  }

  loadBoxItems() {
    if (!this.boxId) return;

    this.http.get<any>(`${environment.apiUrl}/items`, {
      params: { boxId: this.boxId }
    }).subscribe({
      next: (response) => {
        this.boxItems = response.data || [];
        console.log('📦 Itens da box carregados:', this.boxItems);
        this.prepareSlotItems();
      },
      error: (error) => {
        console.error('Erro ao carregar itens da box:', error);
      }
    });
  }

  prepareSlotItems() {
    // Criar uma lista repetida de itens para o efeito de slot machine
    if (this.boxItems.length > 0) {
      this.slotItems = [];
      // Repetir itens 10 vezes para criar o efeito de loop longo
      for (let i = 0; i < 10; i++) {
        this.slotItems.push(...this.boxItems);
      }
    }
  }

  getSlotTransform(): string {
    return `translateY(${this.slotPosition}px)`;
  }

  isWinningItem(index: number): boolean {
    if (!this.result || this.animationPhase !== 'stop') return false;
    
    const wonItemIndex = this.boxItems.findIndex(item => item.id === this.result?.item.id);
    const targetRepetition = 5;
    const winningIndex = targetRepetition * this.boxItems.length + wonItemIndex;
    
    if (index === winningIndex) {
      console.log('✨ Item vencedor destacado:', {
        index,
        itemId: this.boxItems[wonItemIndex % this.boxItems.length]?.id,
        itemName: this.boxItems[wonItemIndex % this.boxItems.length]?.name,
        resultId: this.result?.item.id,
        resultName: this.result?.item.name
      });
    }
    
    return index === winningIndex;
  }

  rollGacha() {
    if (this.isRolling || !this.currentBox) return;

    this.isRolling = true;
    this.showResult = false;
    this.slotPosition = 0;
    this.animationPhase = 'fast';

    this.gachaService.roll(this.currentBox.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.result = response.data || null;
          
          console.log('🎰 Item ganho:', response.data?.item.name, '(ID:', response.data?.item.id, ')');
          console.log('📋 Itens disponíveis:', this.boxItems.map(i => ({ id: i.id, name: i.name })));
          
          // Encontrar a posição do item sorteado na lista
          const wonItemIndex = this.boxItems.findIndex(item => item.id === response.data?.item.id);
          
          console.log('📍 Índice do item na lista:', wonItemIndex);
          
          if (wonItemIndex !== -1) {
            // Aguardar um pouco para garantir que o DOM está renderizado
            setTimeout(() => {
              // Medir dimensões reais do DOM
              const slotItems = document.querySelector('.slot-items');
              const firstItem = document.querySelector('.slot-item');
              const slotWindow = document.querySelector('.slot-window');
              
              let itemHeight = 176; // Valor padrão
              let itemVisualHeight = 166; // Altura sem gap
              let containerPadding = 20;
              let windowCenterY = 300;
              let gapSize = 10;
              
              if (firstItem && slotItems) {
                // Altura real do item
                const itemRect = firstItem.getBoundingClientRect();
                itemVisualHeight = itemRect.height;
                
                // Gap do flexbox
                const containerStyle = window.getComputedStyle(slotItems);
                gapSize = parseFloat(containerStyle.gap) || 10;
                
                // Altura total = altura do item + gap
                itemHeight = itemVisualHeight + gapSize;
                
                // Padding do container
                const paddingTop = parseFloat(containerStyle.paddingTop) || 20;
                containerPadding = paddingTop;
                
                console.log('📏 Medições Reais do DOM:');
                console.log('  - Altura visual do item:', itemVisualHeight.toFixed(2), 'px');
                console.log('  - Gap do flex:', gapSize, 'px');
                console.log('  - Total por item:', itemHeight.toFixed(2), 'px');
                console.log('  - Padding do container:', containerPadding, 'px');
              }
              
              if (slotWindow) {
                const windowHeight = slotWindow.getBoundingClientRect().height;
                windowCenterY = windowHeight / 2;
                console.log('  - Altura da janela:', windowHeight.toFixed(2), 'px');
                console.log('  - Centro da janela:', windowCenterY.toFixed(2), 'px');
              }
              
              // Posição no meio da lista repetida (5ª repetição)
              const targetRepetition = 5;
              const absoluteItemIndex = targetRepetition * this.boxItems.length + wonItemIndex;
              
              // Posição do centro do item sorteado
              // = padding inicial + (quantidade de itens antes * altura total) + (metade da altura visual do item)
              const itemTopY = containerPadding + (absoluteItemIndex * itemHeight);
              const itemCenterY = itemTopY + (itemVisualHeight / 2);
              
              // Posição final: mover o container para que o centro do item fique no centro da janela
              // Ajuste fino: -5px para fazer o item descer só um pouquinho
              const finalPosition = windowCenterY - itemCenterY - 5;
              
              console.log('🎯 Cálculos de Alinhamento:');
              console.log('  - Item ganho: índice', wonItemIndex, 'de', this.boxItems.length);
              console.log('  - Nome:', response.data?.item.name);
              console.log('  - ID:', response.data?.item.id);
              console.log('  - Índice absoluto:', absoluteItemIndex);
              console.log('  - Topo do item:', itemTopY.toFixed(2), 'px');
              console.log('  - Centro do item:', itemCenterY.toFixed(2), 'px');
              console.log('  - Posição final (translateY):', finalPosition.toFixed(2), 'px');
              
              // Fase 1: Giro rápido (2s)
              this.animateFastSpin(finalPosition);
              
              // Fase 2: Desaceleração lenta (3s)
              setTimeout(() => {
                this.animationPhase = 'slow';
                this.animateSlowdown(finalPosition);
              }, 2000);
              
              // Fase 3: Mostrar resultado (após 2s + 3s + 2s de pausa = 7s total)
              setTimeout(() => {
                this.animationPhase = 'stop';
                this.showResult = true;
                this.isRolling = false;
                this.toastService.success(response.message || 'Item obtido!');
                
                // Invalidar cache do inventário para forçar refresh
                this.itemService.invalidateCache();
                
                // Recarregar dados do usuário para atualizar moedas
                this.authService.loadCurrentUser().subscribe();
                
                // Verificar novas conquistas desbloqueadas
                const currentUser = this.authService.getCurrentUser();
                if (currentUser) {
                  this.achievementService.checkAchievements(currentUser.uid).subscribe({
                    next: (checkResponse) => {
                      if (checkResponse.success && checkResponse.data?.length > 0) {
                        const newAchievements = checkResponse.data;
                        // Mostrar notificação para cada nova conquista
                        newAchievements.forEach((achievement: any) => {
                          this.toastService.success(`🏆 Conquista desbloqueada: ${achievement.name}!`);
                        });
                        // Invalidar cache de conquistas
                        this.achievementService.invalidateCache();
                      }
                    },
                    error: (err) => {
                      console.error('Erro ao verificar conquistas:', err);
                    }
                  });
                }
              }, 7000);
            }, 100); // 100ms para garantir renderização
          }
        }
      },
      error: (error) => {
        this.isRolling = false;
        const errorMessage = error?.error?.error || 'Erro ao rolar gacha';
        this.toastService.error(errorMessage);
      }
    });
  }

  animateFastSpin(finalPosition: number) {
    const startTime = Date.now();
    const duration = 2000; // 2 segundos de spin rápido
    const startPosition = 0;
    const intermediatePosition = finalPosition - 1500; // Ir além e depois voltar

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing linear para spin constante e rápido
      const eased = progress;
      this.slotPosition = startPosition + (intermediatePosition - startPosition) * eased;
      
      if (progress < 1 && this.animationPhase === 'fast') {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  animateSlowdown(finalPosition: number) {
    const startTime = Date.now();
    const duration = 3000; // 3 segundos de desaceleração - MAIS LENTO
    const startPosition = this.slotPosition;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing cubic-out: desaceleração suave e gradual, sem bounce
      // Quanto mais próximo de 1, mais lenta a desaceleração
      const eased = 1 - Math.pow(1 - progress, 3);
      
      this.slotPosition = startPosition + (finalPosition - startPosition) * eased;
      
      if (progress < 1 && this.animationPhase === 'slow') {
        requestAnimationFrame(animate);
      } else if (progress >= 1) {
        // Garantir que para exatamente na posição final
        this.slotPosition = finalPosition;
        console.log('🎯 Parou na posição:', finalPosition, 'px');
      }
    };
    
    requestAnimationFrame(animate);
  }

  goBack() {
    this.router.navigate(['/gacha']);
  }

  closeResult() {
    this.showResult = false;
    this.result = null;
  }

  getRarityClass(rarity: string): string {
    return `rarity-${rarity}`;
  }

  getRarityColor(rarity: string): string {
    const colors: any = {
      'comum': '#3b82f6',      // Azul
      'raro': '#f97316',       // Laranja
      'epico': '#a855f7',      // Roxo
      'lendario': '#fbbf24',   // Dourado
      'quantum': '#ff0080'     // Rosa/Multicolor
    };
    return colors[rarity] || '#9ca3af';
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GachaService } from '../../../../core/services/gacha.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
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
            // Calcular posição final: item deve ficar no centro (posição do indicador)
            // Altura por item: min-height(80) + padding(30) + border(4) + gap(10) = 124px
            // Mas visualmente, o gap de 10px é o espaçamento, então consideramos 114px + 10px gap
            const itemHeight = 124; // Altura total incluindo gap
            
            // A janela tem 300px de altura
            // O indicador está centralizado, começando em 100px e indo até 200px (100px de altura)
            // O centro do indicador está em 150px do topo da janela
            const windowHeight = 300;
            const indicatorCenter = windowHeight / 2; // 150px
            
            // Padding do container no topo
            const containerPadding = 20;
            
            // Posição no meio da lista repetida (5ª repetição de 10 total)
            const targetRepetition = 5;
            const absoluteItemIndex = targetRepetition * this.boxItems.length + wonItemIndex;
            
            // Posição do topo do item no container (considerando padding inicial)
            const itemTopPosition = containerPadding + (absoluteItemIndex * itemHeight);
            
            // Centro do item (metade da altura efetiva do item visual)
            const itemVisualHeight = 80 + 30; // min-height + padding
            const itemCenterOffset = itemVisualHeight / 2;
            
            // Posição do centro do item
            const itemCenterPosition = itemTopPosition + itemCenterOffset;
            
            // Para centralizar: queremos que itemCenterPosition fique em indicatorCenter
            // transform: translateY(finalPosition) move o container
            // finalPosition negativo move para cima
            const finalPosition = indicatorCenter - itemCenterPosition;
            
            console.log('🎯 Cálculos:');
            console.log('  - Índice do item:', wonItemIndex);
            console.log('  - Índice absoluto na lista:', absoluteItemIndex);
            console.log('  - Posição do topo do item:', itemTopPosition, 'px');
            console.log('  - Posição do centro do item:', itemCenterPosition, 'px');
            console.log('  - Centro do indicador:', indicatorCenter, 'px');
            console.log('  - Posição final (translateY):', finalPosition, 'px');
            
            // Fase 1: Giro rápido (1.5s)
            this.animateFastSpin(finalPosition);
            
            // Fase 2: Desaceleração (1.5s)
            setTimeout(() => {
              this.animationPhase = 'slow';
              this.animateSlowdown(finalPosition);
            }, 1500);
            
            // Fase 3: Mostrar resultado (após 3s total)
            setTimeout(() => {
              this.animationPhase = 'stop';
              this.showResult = true;
              this.isRolling = false;
              this.toastService.success(response.message || 'Item obtido!');
              
              // Recarregar dados do usuário para atualizar moedas
              this.authService.loadCurrentUser().subscribe();
            }, 3000);
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
    const duration = 1500;
    const startPosition = 0;
    const intermediatePosition = finalPosition - 1000; // Ir além e depois voltar

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing rápido no início
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
    const duration = 1500;
    const startPosition = this.slotPosition;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing ease-out com bounce no final
      let eased: number;
      if (progress < 0.9) {
        // Desaceleração suave
        eased = 1 - Math.pow(1 - progress / 0.9, 3);
      } else {
        // Mini bounce no final
        const bounceProgress = (progress - 0.9) / 0.1;
        const bounce = Math.sin(bounceProgress * Math.PI * 2) * 0.02;
        eased = 1 + bounce;
      }
      
      this.slotPosition = startPosition + (finalPosition - startPosition) * eased;
      
      if (progress < 1 && this.animationPhase === 'slow') {
        requestAnimationFrame(animate);
      } else if (progress >= 1) {
        this.slotPosition = finalPosition;
      }
    };
    
    requestAnimationFrame(animate);
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
      'comum': '#9ca3af',
      'incomum': '#60a5fa',
      'raro': '#a78bfa',
      'epico': '#f59e0b',
      'lendario': '#ef4444'
    };
    return colors[rarity] || '#9ca3af';
  }
}

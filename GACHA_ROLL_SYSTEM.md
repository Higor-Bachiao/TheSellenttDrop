# Sistema de Roll do Gacha - Como Funciona a Animação

## Visão Geral

O sistema de roll do gacha implementa uma slot machine virtual que simula o comportamento de máquinas caça-níqueis reais. A animação começa rápida e desacelera gradualmente até parar exatamente no item sorteado, criando uma experiência imersiva e realista.

## Componentes Principais

### 1. Estrutura de Dados

#### BoxItem Interface
```typescript
interface BoxItem {
  id: string;
  name: string;
  imageUrl: string;
  rarity: string;
  dropRate: number;
  boxId: string;
}
```

#### Propriedades do Componente
- `boxItems`: Array com todos os itens disponíveis na caixa
- `slotItems`: Array repetido 10x para criar efeito de rolagem infinita
- `slotPosition`: Posição Y atual da lista de itens (em pixels)
- `animationPhase`: Estado atual da animação ('fast', 'slow', 'stop')

### 2. Preparação dos Itens

#### Método `prepareSlotItems()`
```typescript
prepareSlotItems() {
  if (this.boxItems.length > 0) {
    this.slotItems = [];
    // Repetir itens 10 vezes para criar o efeito de loop longo
    for (let i = 0; i < 10; i++) {
      this.slotItems.push(...this.boxItems);
    }
  }
}
```

**Por que 10 repetições?**
- Garante que a lista seja longa o suficiente para criar ilusão de movimento infinito
- Permite que o item sorteado apareça na 5ª repetição (posição central)

### 3. Processo de Roll

#### Fluxo Completo

1. **Verificação de Estado**: Confirma que não está rolando e há uma caixa selecionada
2. **Chamada da API**: `gachaService.roll()` determina o item sorteado
3. **Cálculo de Posição**: Determina onde o item deve parar na tela
4. **Animação**: Move os itens de cima para baixo com desaceleração

#### Cálculo da Posição Final

```typescript
// 1. Encontrar índice do item sorteado
const wonItemIndex = this.boxItems.findIndex(item => item.id === response.data?.item.id);

// 2. Calcular posição absoluta na lista repetida (5ª repetição)
const targetRepetition = 5;
const absoluteItemIndex = targetRepetition * this.boxItems.length + wonItemIndex;

// 3. Calcular posição Y do centro do item
const itemTopY = containerPadding + (absoluteItemIndex * itemHeight);
const itemCenterY = itemTopY + (itemVisualHeight / 2);

// 4. Calcular translateY para centralizar o item na janela
const finalPosition = windowCenterY - itemCenterY - 5;
```

**Variáveis importantes:**
- `itemHeight`: Altura total do item + gap do flexbox
- `itemVisualHeight`: Altura visual do item (sem gap)
- `containerPadding`: Padding do container
- `windowCenterY`: Centro vertical da janela de visualização
- `targetRepetition = 5`: Sempre para na 5ª repetição para consistência

### 4. Sistema de Animação

#### Método `animateSlotMachine()`

```typescript
animateSlotMachine(finalPosition: number) {
  const startTime = Date.now();
  const duration = 9000; // 9 segundos total
  const startPosition = -1000; // Começa 1000px acima (invisível)

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing quartic-out: começa rápido, desacelera gradualmente
    const eased = 1 - Math.pow(1 - progress, 4);

    this.slotPosition = startPosition + (finalPosition - startPosition) * eased;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Garantir parada precisa
      this.slotPosition = finalPosition;
      this.showResult = true;
    }
  };

  requestAnimationFrame(animate);
}
```

#### Easing Quartic-Out
```
f(t) = 1 - (1-t)^4

Onde:
- t = 0: velocidade máxima (início)
- t = 1: velocidade zero (final)
- A curva cria desaceleração suave e natural
```

### 5. Medições Dinâmicas do DOM

O sistema mede dinamicamente as dimensões reais dos elementos:

```typescript
// Altura real do item
const itemRect = firstItem.getBoundingClientRect();
itemVisualHeight = itemRect.height;

// Gap do flexbox
const containerStyle = window.getComputedStyle(slotItems);
gapSize = parseFloat(containerStyle.gap) || 10;

// Altura total = altura visual + gap
itemHeight = itemVisualHeight + gapSize;
```

**Por que medição dinâmica?**
- Garante precisão independente de CSS/styling
- Adapta-se a mudanças de design
- Funciona com diferentes tamanhos de tela

### 6. Destaque do Item Vencedor

#### Método `isWinningItem()`
```typescript
isWinningItem(index: number): boolean {
  const wonItemIndex = this.boxItems.findIndex(item => item.id === this.result?.item.id);
  const targetRepetition = 5;
  const winningIndex = targetRepetition * this.boxItems.length + wonItemIndex;

  return index === winningIndex;
}
```

**Quando é chamado:**
- Só retorna `true` quando `animationPhase === 'stop'`
- Permite destacar visualmente o item sorteado após a animação

### 7. Estados da Animação

- **'fast'**: Fase inicial (não usado na versão atual)
- **'slow'**: Fase de desaceleração (não usado na versão atual)
- **'stop'**: Animação completa, item destacado

### 8. Tratamento de Erros e Edge Cases

- **Item não encontrado**: Redireciona para página de gacha
- **DOM não renderizado**: Timeout de 100ms para medição
- **Animação interrompida**: Estados booleanos previnem múltiplas execuções
- **Posicionamento preciso**: `this.slotPosition = finalPosition` garante alinhamento exato

### 9. Otimizações de Performance

- **RequestAnimationFrame**: Animação suave e eficiente
- **Easing matemático**: Cálculos leves sem bibliotecas externas
- **Medição única**: DOM medido apenas uma vez por roll
- **Cache de itens**: Lista repetida criada apenas na inicialização

### 10. Debug e Logging

O sistema inclui logs detalhados para debugging:

```typescript
console.log('🎯 Cálculos de Alinhamento:', {
  'Item ganho': `índice ${wonItemIndex} de ${this.boxItems.length}`,
  'Nome': response.data?.item.name,
  'ID': response.data?.item.id,
  'Índice absoluto': absoluteItemIndex,
  'Posição final': `${finalPosition.toFixed(2)}px`
});
```

## Conclusão

O sistema cria uma experiência de slot machine realista através de:

1. **Cálculos precisos** de posicionamento baseados em medições reais do DOM
2. **Animação fluida** com easing matemático que simula física real
3. **Repetição inteligente** de itens para ilusão de movimento infinito
4. **Sincronização perfeita** entre resultado da API e animação visual
5. **Adaptação dinâmica** a diferentes layouts e tamanhos de tela

A combinação desses elementos resulta em uma experiência de gacha envolvente e confiável.
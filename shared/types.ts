// Tipos compartilhados entre frontend e backend

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export enum UserRole {
  JOGADOR = 'JOGADOR',
  ADMIN = 'ADMIN'
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isAdmin?: boolean;
  coins: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum ItemRarity {
  COMUM = 'comum',
  RARO = 'raro',
  EPICO = 'epico',
  LENDARIO = 'lendario',
  QUANTUM = 'quantum'
}

export interface Item {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  imageUrl: string;
  dropRate: number; // Peso para cálculo de probabilidade (ex: 50 = 50% do total)
  boxId?: string; // ID da box que contém este item
  createdAt: Date;
  updatedAt: Date;
}

export interface GachaBox {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  cost: number; // Custo em moedas para rolar
  items: Item[]; // Itens disponíveis nesta box
  createdAt: Date;
  updatedAt: Date;
}

export interface UserItem {
  id: string;
  userId: string;
  itemId: string;
  quantity?: number;
  rarity: number; // Raridade de 1 a 1000
  obtainedAt: Date;
  item?: Item; // Dados do item (populated)
}

export interface GachaResult {
  item: Item;
  rarity: number;
  userItem: UserItem;
  isNew?: boolean;
  totalQuantity?: number;
}

export enum AchievementType {
  FIRST_PULL = 'FIRST_PULL',
  TOTAL_PULLS = 'TOTAL_PULLS',
  RARE_ITEM = 'RARE_ITEM',
  EPIC_ITEM = 'EPIC_ITEM',
  LEGENDARY_ITEM = 'LEGENDARY_ITEM',
  COLLECTION = 'COLLECTION',
  COINS_SPENT = 'COINS_SPENT'
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  requirement: number;
  reward: number;
  iconUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  rewardClaimed: boolean;
}

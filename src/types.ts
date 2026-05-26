export interface AdItem {
  id: string;
  title: string;
  titleColor?: string;
  subtitle?: string;
  subtitleColor?: string;
  url: string;
  imageUrl?: string;
  badgeText?: string;
  badgeColor?: string;
  badgeBgColor?: string;
  size: 'small' | 'medium' | 'large';
  order: number;
  visible: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
  order: number;
  visible: boolean;
}

export interface LinkItem {
  id: string;
  categoryId: string;
  title: string;
  subtitle?: string;
  url: string;
  icon?: string;
  iconUrl?: string;
  bgColor?: string;
  textColor?: string;
  subtitleColor?: string;
  badgeText?: string;
  badgeColor?: string;
  badgeBgColor?: string;
  order: number;
  visible: boolean;
}

export interface MarqueeItem {
  id: string
  text: string
  color: string
  url?: string
  order: number
  visible: boolean
}

export interface SystemSettings {
  siteTitle: string;
  siteSubtitle: string;
  adminPassword: string;
  font: string;
  customColors: string[];
}

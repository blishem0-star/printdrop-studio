export type OrderStatus = 'DRAFT' | 'PAID' | 'IN_PRODUCTION' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type DesignAsset = {
  id: string;
  title: string;
  emoji: string | null;
  customText: string | null;
  colorHex: string;
  colorName: string;
  size: string;
  filePath: string | null;
  svgDataUrl: string | null;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  qty: number;
  unitPrice: number;
  designAsset: DesignAsset;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
};

export type Order = {
  id: string;
  status: OrderStatus;
  total: number;
  shippingName: string;
  shippingAddr: string;
  shippingCity: string;
  shippingZip: string;
  shippingState: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  items: OrderItem[];
};

export const ORDER_STATUSES: OrderStatus[] = [
  'DRAFT', 'PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED',
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT:         'Request Received',
  PAID:          'Payment Confirmed',
  IN_PRODUCTION: 'In Production',
  SHIPPED:       'Shipped',
  DELIVERED:     'Delivered',
  CANCELLED:     'Cancelled',
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  DRAFT:         'rgba(255,255,255,0.3)',
  PAID:          '#3B82F6',
  IN_PRODUCTION: '#F59E0B',
  SHIPPED:       '#8B5CF6',
  DELIVERED:     '#10B981',
  CANCELLED:     '#EF4444',
};

export const STATUS_BG: Record<OrderStatus, string> = {
  DRAFT:         'rgba(255,255,255,0.04)',
  PAID:          'rgba(59,130,246,0.1)',
  IN_PRODUCTION: 'rgba(245,158,11,0.1)',
  SHIPPED:       'rgba(139,92,246,0.1)',
  DELIVERED:     'rgba(16,185,129,0.1)',
  CANCELLED:     'rgba(239,68,68,0.1)',
};

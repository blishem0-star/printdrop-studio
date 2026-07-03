import type { OrderStatus } from './types';

export const CONFIRMED_ORDER_STATUSES: OrderStatus[] = ['PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'];
export const OPEN_ORDER_STATUSES: OrderStatus[] = ['DRAFT', 'PAID', 'IN_PRODUCTION'];

export function isConfirmedOrderStatus(status: string): status is OrderStatus {
  return CONFIRMED_ORDER_STATUSES.includes(status as OrderStatus);
}

export function isOpenOrderStatus(status: string): status is OrderStatus {
  return OPEN_ORDER_STATUSES.includes(status as OrderStatus);
}

// Customer-facing labels/colors - single source for profile, orders, admin.
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: 'Request Received', PAID: 'Payment Confirmed', IN_PRODUCTION: 'In Production',
  SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};
export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  DRAFT: 'rgba(255,255,255,0.3)', PAID: '#3B82F6', IN_PRODUCTION: '#F59E0B',
  SHIPPED: '#8B5CF6', DELIVERED: '#10B981', CANCELLED: '#EF4444',
};

import type { OrderStatus } from './types';

export const CONFIRMED_ORDER_STATUSES: OrderStatus[] = ['PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'];
export const OPEN_ORDER_STATUSES: OrderStatus[] = ['DRAFT', 'PAID', 'IN_PRODUCTION'];

export function isConfirmedOrderStatus(status: string): status is OrderStatus {
  return CONFIRMED_ORDER_STATUSES.includes(status as OrderStatus);
}

export function isOpenOrderStatus(status: string): status is OrderStatus {
  return OPEN_ORDER_STATUSES.includes(status as OrderStatus);
}

// Customer-facing labels/colors live in lib/types (used by admin too);
// re-exported here so status logic and presentation share one import path.
export { STATUS_LABEL as ORDER_STATUS_LABEL, STATUS_COLOR as ORDER_STATUS_COLOR } from './types';

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'New',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready to pickup',
  HEADING_TO_VENDOR: 'On the way to the restaurant',
  OUT_FOR_DELIVERY: 'On the way',
  DELIVERED: 'Complete',
  CANCELLED: 'Cancelled',
};

export const VENDOR_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'HEADING_TO_VENDOR',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const;

export type AppOrderStatus = (typeof VENDOR_ORDER_STATUSES)[number];

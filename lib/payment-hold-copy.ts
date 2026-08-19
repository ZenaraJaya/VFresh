export const PAYMENT_HOLD_MS = 60 * 60 * 1000;
export const PAYMENT_HOLD_EXPIRED = 'PAYMENT_HOLD_EXPIRED';

export function paymentHoldCustomerMessage(orderNumber: string) {
  return `Your order ${orderNumber} was cancelled because payment was not completed within 1 hour. Those dishes are back on the menu — order them again if you still want them, or pick something else.`;
}

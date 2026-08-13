export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'COMPANY_ACCOUNT' | 'CREDIT_CARD';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  badges: string[];
  available: boolean;
  vendorId?: string | null;
  vendor?: {
    id: string;
    businessName: string;
    slug: string;
    isOpen?: boolean;
    followSchedule?: boolean | null;
    scheduleMode?: string | null;
    closesAt?: string | Date | null;
    closedUntil?: string | Date | null;
    openTime?: string | null;
    closeTime?: string | null;
    weeklyHours?: unknown;
  } | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface VendorPublic {
  id: string;
  businessName: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  phone?: string | null;
  address?: string | null;
  isOpen?: boolean;
  followSchedule?: boolean | null;
  scheduleMode?: string | null;
  closesAt?: string | Date | null;
  closedUntil?: string | Date | null;
  openTime?: string | null;
  closeTime?: string | null;
  weeklyHours?: unknown;
  _count?: { menuItems: number };
}

export interface Company {
  id: string;
  name: string;
  billingEmail: string;
  billingAddress?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  notes?: string | null;
  menuItemId: string;
  orderId: string;
  menuItem?: MenuItem;
}

export interface Order {
  id: string;
  orderNumber: string;
  companyId: string;
  employeeName: string;
  employeeEmail?: string | null;
  employeePhone?: string | null;
  department?: string | null;
  deliveryLocation: string;
  deliveryDate: string;
  deliveryTime?: string | null;
  specialInstructions?: string | null;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: string | null;
  invoiceId?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  items?: OrderItem[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  orders?: Order[];
}

/** A menu item plus the quantity/notes the customer picked. */
export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

/** Shape the checkout form posts to POST /api/orders. */
export interface CreateOrderPayload {
  companyId: string;
  employeeName: string;
  employeeEmail?: string;
  employeePhone?: string;
  department?: string;
  deliveryLocation: string;
  deliveryDate: string;
  deliveryTime?: string;
  specialInstructions?: string;
  paymentMethod: PaymentMethod;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }[];
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  activeCompanies: number;
  menuItemCount: number;
  recentOrders: Order[];
  revenueByDay: { date: string; revenue: number }[];
}

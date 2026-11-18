export interface CustomerProfileTag {
  id: string;
  name: string;
  color: string;
}

export interface CustomerProfileNote {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

export interface CustomerProfileOrder {
  id: string;
  orderNumber: string;
  status: { key: string; name: string; color: string };
  total: number;
  paid: number;
  createdAt: string;
}

export interface CustomerProfileAddress {
  id: string;
  street: string;
  detail: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string | null;
  isDefault: boolean;
}

export interface CustomerProfileAutomation {
  id: string;
  automationName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WAITING' | string;
  createdAt: string;
}

/** Response of GET /customer-profiles/:customerId (all figures computed live by the server). */
export interface CustomerProfile {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  hasHiddenNumber: boolean;
  whatsappLinked: boolean;
  email: string | null;
  customerSince: string;
  optedOut: boolean;
  whatsapp: {
    conversationsCount: number;
    firstMessageAt: string | null;
    lastMessageAt: string | null;
    messagesFromCustomer: number;
    messagesToCustomer: number;
    lastInboundText: string | null;
  };
  orders: {
    count: number;
    totalSpent: number;
    totalPaid: number;
    pendingBalance: number;
    recent: CustomerProfileOrder[];
  };
  addresses: CustomerProfileAddress[];
  tags: CustomerProfileTag[];
  notes: CustomerProfileNote[];
  automations: CustomerProfileAutomation[];
}

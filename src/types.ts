// Balance response types
export interface BalanceItem {
  id: string;
  amount: number;
  currency: string;
}

export interface BalanceResponse {
  entity: "balance";
  item: BalanceItem;
}

// API response type
export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

// API client configuration
export interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

// Reward request parameters
export interface RewardsRequestParams {
  count?: string; // Number of rewards per page (default: 30)
  page_id?: string; // ID of the last reward on previous page
  brand_name?: string; // Filter by brand name
  category?: string; // Filter by category
  denomination?: string; // Filter by specific denomination (unit is paisa not rupees)
  expiry_by?: number; // Filter by number of days until expiry
  min_price?: string; // Filter by minimum denomination
  max_price?: string; // Filter by maximum denomination
  type?: "gift_card" | "membership" | "offer"; // Filter by reward type
  sort_by?: "gmv" | "units_sold"; // Sort by highest GMV or units sold
  featured?: boolean; // Filter for featured rewards
}

// Reward interfaces
export interface Brand {
  name: string;
  website: string;
  description?: string;
  background_color?: string;
  logo_url: string;
}

export interface DisplayParameters {
  name: string;
  description: string;
  terms: string;
  redemption_channels: string[];
  redemption_url: string;
  redemption_instructions?: string;
  image_url?: string;
}

export interface Discount {
  type?: "percentage" | "fixed";
  value?: number;
  discount_value?: number;
}

// Base reward interface with common properties
export interface BaseReward {
  id: string;
  entity: "rewards";
  type: "gift_card" | "membership" | "offer";
  currency: string;
  status: "active" | "inactive" | string;
  start_date: string;
  end_date: string;
  featured?: boolean;
  categories?: string[];
  category?: string[];
  display_parameters: DisplayParameters;
  brand: Brand;
  discount: Discount;
}

// Gift Card specific properties
export interface GiftCardReward extends BaseReward {
  type: "gift_card";
  denomination_type: "fixed" | "range";
  eligible_fixed_denomination?: number[];
  eligible_range_denomination?: number[];
  interval?: string;
  offer_has_code?: string;
}

// Membership specific properties
export interface MembershipReward extends BaseReward {
  type: "membership";
  interval: string;
  amount: number;
  denomination_type?: string;
  eligible_fixed_denomination?: string;
  eligible_range_denomination?: string;
  offer_has_code?: string;
}

// Offer specific properties
export interface OfferReward extends BaseReward {
  type: "offer";
  offer_has_code: string;
  denomination_type?: string;
  eligible_fixed_denomination?: string;
  eligible_range_denomination?: string;
  interval?: string;
  amount?: string;
}

// Union type for all reward types
export type Reward = GiftCardReward | MembershipReward | OfferReward;

// Response for listing rewards
export interface RewardsListResponse {
  entity: "collection";
  count: number;
  next_page_id?: string;
  items: Reward[];
}

// Order creation request types
export interface CustomerDetails {
  name?: string;
  email?: string;
  contact?: number;
}

export interface OrderReward {
  id: string;
  denomination?: number; // in paise
  interval?: string;
  quantity: number;
}

export interface CreateOrderRequest {
  reference_no: string;
  rewards: OrderReward[];
  customer?: CustomerDetails;
}

// Order response types
export interface Voucher {
  pin: string;
  validity: number;
  code: string;
}

export interface OrderItem {
  reward_id: string;
  reward_type: "gift_card" | "membership" | "offer";
  denomination?: number; // in paise
  currency?: string;
  quantity: number;
  status: "success" | "failed";
  failed_reason?: string;
  interval?: string;
  created_at: number;
  updated_at: number;
  vouchers?: Voucher[];
}

export interface OrderResponse {
  order_id: string;
  entity: "orders";
  reference_no: string;
  status: "success" | "partial_success" | "failure";
  created_at: number;
  order_amount?: number; // Not included in get order response but in create order
  order_success_amount: number; // Not included in get order response but in create order
  order: {
    entity: "collection";
    count: number;
    order_items?: OrderItem[]; // Field name in create order endpoint
  };
}

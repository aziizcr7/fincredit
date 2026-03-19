export interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'admin';
  phone?: string;
  cin?: string;
  address?: string;
  profession?: string;
  income?: number;
  credit_score?: number;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface SimulationParams {
  amount: number;
  duration_months: number;
  interest_rate: number;
  insurance_monthly?: number;
}

export interface AmortizationRow {
  month: number;
  monthly_payment: number;
  capital: number;
  interest: number;
  remaining: number;
}

export interface SimulationResult {
  principal: number;
  duration_months: number;
  interest_rate: number;
  monthly_payment: number;
  monthly_with_insurance: number;
  total_cost: number;
  total_interest: number;
  insurance_total: number;
  schedule: AmortizationRow[];
}

export interface Credit {
  id: string;
  credit_type: string;
  amount: number;
  duration_months: number;
  interest_rate: number;
  monthly_payment: number;
  total_cost: number;
  total_interest: number;
  remaining_amount: number;
  status: 'active' | 'closed' | 'defaulted';
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface CreditRequest {
  id: string;
  user_id?: string;
  credit_type: string;
  amount: number;
  duration_months: number;
  interest_rate: number;
  purpose?: string;
  monthly_payment: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  documents?: any[];
  request_date: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  credit_score?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  is_read: boolean;
  created_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  total_amount: number;
  avg_amount: number;
  avg_duration: number;
  approval_rate: number;
  total_clients: number;
  by_type: { credit_type: string; count: number; total_amount: number }[];
  monthly_trend: { month: string; requests: number; approved: number; amount_approved: number }[];
}

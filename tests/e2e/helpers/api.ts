import type { APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface LoginResponse {
  token?: string;
  data?: { token?: string; accessToken?: string };
  accessToken?: string;
}

interface ApiResponse<T = unknown> {
  status: number;
  data: T;
}

export class ApiHelper {
  private token: string | null = null;
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async login(email = 'admin@conversation-platform.com', password = 'Admin123!'): Promise<string> {
    const response = await this.request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: { email, password },
    });

    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
    }

    const body: LoginResponse = await response.json();
    this.token = body.token || body.data?.token || body.data?.accessToken || body.accessToken || '';

    if (!this.token) {
      throw new Error('No token in login response');
    }

    return this.token;
  }

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async get<T = unknown>(path: string): Promise<ApiResponse<T>> {
    const response = await this.request.get(`${BASE_URL}${path}`, { headers: this.authHeaders() });
    const data = await response.json().catch(() => null);
    return { status: response.status(), data: data as T };
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const response = await this.request.post(`${BASE_URL}${path}`, { headers: this.authHeaders(), data: body });
    const data = await response.json().catch(() => null);
    return { status: response.status(), data: data as T };
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const response = await this.request.put(`${BASE_URL}${path}`, { headers: this.authHeaders(), data: body });
    const data = await response.json().catch(() => null);
    return { status: response.status(), data: data as T };
  }

  async delete<T = unknown>(path: string): Promise<ApiResponse<T>> {
    const response = await this.request.delete(`${BASE_URL}${path}`, { headers: this.authHeaders() });
    const data = await response.json().catch(() => null);
    return { status: response.status(), data: data as T };
  }

  async createCampaign(campaignData: Record<string, unknown>): Promise<ApiResponse> {
    return this.post('/api/v1/campaigns', campaignData);
  }

  async getCampaigns(): Promise<ApiResponse> {
    return this.get('/api/v1/campaigns');
  }

  async getCampaign(id: string): Promise<ApiResponse> {
    return this.get(`/api/v1/campaigns/${id}`);
  }

  async deleteCampaign(id: string): Promise<ApiResponse> {
    return this.delete(`/api/v1/campaigns/${id}`);
  }

  async importBusinesses(campaignId: string, businesses: Record<string, unknown>[]): Promise<ApiResponse> {
    return this.post(`/api/v1/campaigns/${campaignId}/businesses/import`, { businesses });
  }

  async createOutreachJob(campaignId: string, jobData: Record<string, unknown>): Promise<ApiResponse> {
    return this.post(`/api/v1/campaigns/${campaignId}/outreach-jobs`, jobData);
  }

  async getOutreachJobs(campaignId: string): Promise<ApiResponse> {
    return this.get(`/api/v1/campaigns/${campaignId}/outreach-jobs`);
  }

  async getQueue(campaignId: string): Promise<ApiResponse> {
    return this.get(`/api/v1/campaigns/${campaignId}/queue`);
  }

  async getDeliveryTracking(campaignId: string): Promise<ApiResponse> {
    return this.get(`/api/v1/campaigns/${campaignId}/deliveries`);
  }

  async getAnalytics(campaignId: string): Promise<ApiResponse> {
    return this.get(`/api/v1/campaigns/${campaignId}/analytics`);
  }

  async queueWhatsAppMessage(messageData: Record<string, unknown>): Promise<ApiResponse> {
    return this.post('/api/v1/whatsapp/messages', messageData);
  }

  async sendWhatsAppMessage(messageId: string): Promise<ApiResponse> {
    return this.post(`/api/v1/whatsapp/messages/${messageId}/send`);
  }

  async simulateWebhookEvent(eventData: Record<string, unknown>): Promise<ApiResponse> {
    return this.post('/api/v1/webhooks/whatsapp', eventData);
  }

  async getConversations(): Promise<ApiResponse> {
    return this.get('/api/v1/conversations');
  }

  async getConversation(id: string): Promise<ApiResponse> {
    return this.get(`/api/v1/conversations/${id}`);
  }

  async closeConversation(id: string): Promise<ApiResponse> {
    return this.post(`/api/v1/conversations/${id}/close`);
  }

  async handoffConversation(id: string, agentData: Record<string, unknown>): Promise<ApiResponse> {
    return this.post(`/api/v1/conversations/${id}/handoff`, agentData);
  }

  async getDashboardStats(): Promise<ApiResponse> {
    return this.get('/api/v1/dashboard/stats');
  }

  async getUsers(): Promise<ApiResponse> {
    return this.get('/api/v1/admin/users');
  }

  async createUser(userData: Record<string, unknown>): Promise<ApiResponse> {
    return this.post('/api/v1/admin/users', userData);
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.delete(`/api/v1/admin/users/${id}`);
  }

  getToken(): string | null {
    return this.token;
  }
}

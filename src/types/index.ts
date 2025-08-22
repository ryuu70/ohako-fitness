export interface StripeCustomer {
  id: string;
  email: string;
  metadata: {
    lineId?: string;
  };
}

export interface LineConnectRequest {
  email: string;
  lineId: string;
}

// LINEログイン用の型定義
export interface LineLoginRequest {
  email: string;
  authorizationCode: string;
  state: string;
}

export interface LineConnectResponse {
  success: boolean;
  message: string;
  customerId?: string;
}

export interface StripeCustomerSearchResponse {
  success: boolean;
  customers: StripeCustomer[];
  message?: string;
}

// LINEプロフィール情報
export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// LINEログインのトークンレスポンス
export interface LineTokenResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
}

// IDトークンのペイロード
export interface LineIdTokenPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  nonce?: string;
  name?: string;
  picture?: string;
  email?: string;
}

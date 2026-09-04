// Cliente HTTP para a API do Asaas (produção)
// Docs: https://docs.asaas.com/

// Sanitiza variavel de ambiente: remove BOM (U+FEFF), aspas envolventes e whitespace
// (Vercel UI as vezes injeta BOM ou newline ao colar a chave).
function cleanEnv(v: string | undefined): string {
  if (!v) return "";
  // Remove tudo que nao for ASCII imprimivel (mata BOM, zero-width, CR/LF, etc.)
  // e remove aspas envolventes. A chave Asaas e somente ASCII.
  return v.replace(/[^\x20-\x7E]/g, "").replace(/^["']|["']$/g, "").trim();
}

const ASAAS_API_URL = cleanEnv(process.env.ASAAS_API_URL) || "https://api.asaas.com/v3";
const ASAAS_API_KEY = cleanEnv(process.env.ASAAS_API_KEY);

export type AsaasCustomer = {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
};

export type AsaasSubscription = {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  billingType: string;
  status: string;
  description?: string;
};

export type AsaasPayment = {
  id: string;
  customer: string;
  subscription?: string;
  value: number;
  netValue?: number;
  status: string;
  billingType: string;
  dueDate: string;
  paymentDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  description?: string;
};

function assertConfigured() {
  if (!ASAAS_API_KEY) {
    throw new Error("ASAAS_API_KEY nao configurada. Defina a variavel de ambiente.");
  }
}

async function asaasFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  assertConfigured();
  const res = await fetch(`${ASAAS_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const msg = body?.errors?.[0]?.description || body?.message || res.statusText;
    throw new Error(`Asaas ${res.status}: ${msg}`);
  }
  return body as T;
}

export async function createCustomer(input: {
  name: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  postalCode?: string;
  externalReference?: string;
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCustomer(id: string): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(`/customers/${id}`);
}

export type AsaasPixQrCode = {
  encodedImage: string;
  payload: string;
  expirationDate: string;
};

export async function createSubscription(input: {
  customer: string;
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle?: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
  billingType?: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
  description?: string;
  externalReference?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode?: string;
    addressNumber?: string;
    phone?: string;
  };
}): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      cycle: "MONTHLY",
      billingType: "UNDEFINED",
      ...input,
    }),
  });
}

export async function getSubscription(id: string): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${id}`);
}

export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  return asaasFetch<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
}

export async function cancelSubscription(id: string): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${id}`, { method: "DELETE" });
}

export async function listSubscriptionPayments(subscriptionId: string): Promise<{ data: AsaasPayment[] }> {
  return asaasFetch<{ data: AsaasPayment[] }>(`/subscriptions/${subscriptionId}/payments`);
}

export async function getPayment(id: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${id}`);
}

export function asaasIsConfigured() {
  return !!ASAAS_API_KEY;
}

export function asaasEnvironment() {
  return ASAAS_API_URL.includes("sandbox") ? "SANDBOX" : "PRODUCAO";
}

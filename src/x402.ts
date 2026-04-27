export interface X402Config {
  asset: string;
  network: string;
  payTo: string;
  facilitatorUrl: string;
  amount: string;
  facilitatorApiKey?: string;
  tokenName?: string;
  tokenVersion?: string;
  paymentHeader?: string;
}

export interface PaymentRequirement {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: {
    name: string;
    version: string;
    assetTransferMethod: string;
  };
}

export interface PaymentRequirementsResponse {
  paymentRequirements: PaymentRequirement[];
  x402Version: number;
}

export type PaymentOutcome =
  | { status: 'no-payment'; requirements: PaymentRequirementsResponse }
  | { status: 'invalid-header' }
  | { status: 'verify-failed'; detail: unknown }
  | { status: 'verify-unreachable'; detail: string }
  | { status: 'settle-failed'; detail: unknown }
  | { status: 'settle-unreachable'; detail: string }
  | { status: 'settled'; txHash?: string; verifyMs: number; settleMs: number; totalMs: number };

interface FacilitatorResponseDetails {
  ok: boolean;
  status: number;
  statusText: string;
  url: string;
  contentType: string | null;
  data: unknown;
  text: string;
  parseError?: string;
}

export function buildPaymentRequirements(config: X402Config): PaymentRequirementsResponse {
  return {
    paymentRequirements: [
      {
        scheme: 'exact',
        network: config.network,
        amount: config.amount,
        asset: config.asset,
        payTo: config.payTo,
        maxTimeoutSeconds: 300,
        extra: {
          name: config.tokenName ?? 'Stable Coin',
          version: config.tokenVersion ?? '1',
          assetTransferMethod: 'permit2',
        },
      },
    ],
    x402Version: 2,
  };
}

export function corsHeaders(config?: Partial<X402Config>): Record<string, string> {
  const header = config?.paymentHeader ?? 'X-Payment';
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': `Content-Type, ${header}`,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Expose-Headers': '*',
  };
}

function decodePaymentHeader(paymentHeader: string): unknown {
  return JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf8'));
}

async function readFacilitatorResponse(res: Response): Promise<FacilitatorResponseDetails> {
  const text = await res.text();
  const contentType = res.headers.get('content-type');
  if (!text) {
    return { ok: res.ok, status: res.status, statusText: res.statusText, url: res.url, contentType, data: null, text };
  }

  try {
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      url: res.url,
      contentType,
      data: JSON.parse(text),
      text,
    };
  } catch (error) {
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      url: res.url,
      contentType,
      data: null,
      text,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

function logFacilitatorFailure(
  phase: 'verify' | 'settle',
  config: X402Config,
  details: FacilitatorResponseDetails,
) {
  console.error(
    JSON.stringify({
      event: `facilitator_${phase}_failure`,
      facilitatorUrl: config.facilitatorUrl,
      network: config.network,
      upstream: details,
    }),
  );
}

function getRecordValue(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined;
}

export async function processPayment(
  config: X402Config,
  headers: Headers,
): Promise<PaymentOutcome> {
  const headerName = config.paymentHeader ?? 'X-Payment';
  const paymentHeader = headers.get(headerName);
  if (!paymentHeader) return { status: 'no-payment', requirements: buildPaymentRequirements(config) };

  let paymentPayload: unknown;
  try {
    paymentPayload = decodePaymentHeader(paymentHeader);
  } catch {
    return { status: 'invalid-header' };
  }

  const facilitatorHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.facilitatorApiKey) facilitatorHeaders['X-API-Key'] = config.facilitatorApiKey;

  const facilitatorBody = JSON.stringify({
    x402Version: 2,
    paymentPayload,
    paymentRequirements: buildPaymentRequirements(config).paymentRequirements[0],
  });

  const t0 = Date.now();
  let verifyRes: Response;
  try {
    verifyRes = await fetch(`${config.facilitatorUrl}/verify`, {
      method: 'POST',
      headers: facilitatorHeaders,
      body: facilitatorBody,
    });
  } catch (error) {
    return { status: 'verify-unreachable', detail: error instanceof Error ? error.message : String(error) };
  }

  const verifyMs = Date.now() - t0;
  const verifyDetails = await readFacilitatorResponse(verifyRes);
  if (!verifyDetails.data || getRecordValue(verifyDetails.data, 'isValid') !== true) {
    logFacilitatorFailure('verify', config, verifyDetails);
    return { status: 'verify-failed', detail: verifyDetails.data ?? verifyDetails };
  }

  const t1 = Date.now();
  let settleRes: Response;
  try {
    settleRes = await fetch(`${config.facilitatorUrl}/settle`, {
      method: 'POST',
      headers: facilitatorHeaders,
      body: facilitatorBody,
    });
  } catch (error) {
    return { status: 'settle-unreachable', detail: error instanceof Error ? error.message : String(error) };
  }

  const settleMs = Date.now() - t1;
  const settleDetails = await readFacilitatorResponse(settleRes);
  if (!settleDetails.data || getRecordValue(settleDetails.data, 'success') !== true) {
    logFacilitatorFailure('settle', config, settleDetails);
    return { status: 'settle-failed', detail: settleDetails.data ?? settleDetails };
  }

  const txHash =
    getRecordValue(settleDetails.data, 'transaction') ??
    getRecordValue(settleDetails.data, 'txHash') ??
    getRecordValue(settleDetails.data, 'transactionHash') ??
    getRecordValue(settleDetails.data, 'hash');

  return {
    status: 'settled',
    txHash: typeof txHash === 'string' ? txHash : undefined,
    verifyMs,
    settleMs,
    totalMs: Date.now() - t0,
  };
}

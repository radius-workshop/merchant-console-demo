import http from 'node:http';
import { URL } from 'node:url';
import { ENDPOINTS, baselineMetrics, buildPaidPayload, getEndpointDefinition } from './demo-data.js';
import { getFrontendHtml } from './frontend.js';
import {
  DEFAULT_NETWORK_KEY,
  getNetworkKeyFromUrl,
  getPublicNetworkConfigs,
  getRuntimeNetworkConfigs,
  toX402Config,
} from './network-config.js';
import { getStatsSnapshot, recordPaidEvent } from './stats.js';
import { corsHeaders, processPayment, type X402Config } from './x402.js';
import { getSwarmModuleJs } from './swarm.js';

const PORT = Number(process.env.PORT ?? 3000);

interface JsonResponseOptions {
  status?: number;
  headers?: Record<string, string>;
  x402Config?: Partial<X402Config>;
}

function sendText(
  res: http.ServerResponse,
  body: string,
  status = 200,
  headers: Record<string, string> = {},
) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    ...headers,
  });
  res.end(body);
}

function sendHtml(res: http.ServerResponse, body: string) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}

function sendJs(res: http.ServerResponse, body: string) {
  res.writeHead(200, {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendJson(res: http.ServerResponse, data: unknown, options: JsonResponseOptions = {}) {
  res.writeHead(options.status ?? 200, {
    ...corsHeaders(options.x402Config),
    'Content-Type': 'application/json; charset=utf-8',
    ...(options.headers ?? {}),
  });
  res.end(JSON.stringify(data));
}

function requestHeaders(req: http.IncomingMessage): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) headers.set(key, value.join(', '));
    else if (typeof value === 'string') headers.set(key, value);
  }
  return headers;
}

function getOrigin(req: http.IncomingMessage): string {
  const proto = req.headers['x-forwarded-proto'] ?? 'http';
  const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? `localhost:${PORT}`;
  return `${Array.isArray(proto) ? proto[0] : proto}://${Array.isArray(host) ? host[0] : host}`;
}

function paymentErrorBody(status: string, detail?: unknown) {
  return {
    error: status,
    detail,
    message: 'This endpoint is available through x402 paid access. Send a valid X-Payment header to receive the API response.',
  };
}

async function handlePaidEndpoint(
  res: http.ServerResponse,
  headers: Headers,
  url: URL,
  endpoint: string,
  query: string,
) {
  const networkKey = getNetworkKeyFromUrl(url);
  const networkConfig = getRuntimeNetworkConfigs(process.env)[networkKey];
  const endpointDefinition = getEndpointDefinition(endpoint);
  const x402Config = toX402Config(networkConfig, endpointDefinition.amountRaw);
  const outcome = await processPayment(x402Config, headers);

  switch (outcome.status) {
    case 'no-payment':
      sendJson(res, outcome.requirements, { status: 402, x402Config });
      return;
    case 'invalid-header':
      sendJson(res, paymentErrorBody('Invalid X-Payment header'), { status: 400, x402Config });
      return;
    case 'verify-failed':
    case 'settle-failed':
      sendJson(res, paymentErrorBody(outcome.status, outcome.detail), { status: 402, x402Config });
      return;
    case 'verify-unreachable':
    case 'settle-unreachable':
      sendJson(res, paymentErrorBody(outcome.status, outcome.detail), { status: 502, x402Config });
      return;
    case 'settled': {
      recordPaidEvent({
        endpoint,
        query,
        network: networkKey,
        amountRaw: Number(endpointDefinition.amountRaw),
        latencyMs: outcome.totalMs,
        verifyMs: outcome.verifyMs,
        settleMs: outcome.settleMs,
        txHash: outcome.txHash,
      });

      sendJson(
        res,
        buildPaidPayload(
          endpoint,
          query,
          networkKey,
          networkConfig,
          outcome.totalMs,
          outcome.verifyMs,
          outcome.settleMs,
          outcome.txHash,
        ),
        { x402Config },
      );
      return;
    }
    default: {
      const exhaustive: never = outcome;
      sendJson(res, { error: 'Unexpected payment state', detail: exhaustive }, { status: 500, x402Config });
    }
  }
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', getOrigin(req));

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, { error: 'Method not allowed' }, { status: 405 });
    return;
  }

  if (url.pathname === '/') {
    sendHtml(
      res,
      getFrontendHtml({
        defaultNetwork: DEFAULT_NETWORK_KEY,
        networks: getPublicNetworkConfigs(process.env),
        endpoints: ENDPOINTS,
      }),
    );
    return;
  }

  if (url.pathname === '/modules/swarm.js') {
    sendJs(res, getSwarmModuleJs());
    return;
  }

  if (url.pathname === '/api/health') {
    sendJson(res, {
      status: 'ok',
      service: 'merchant-console-demo',
      runtime: 'node',
      defaultNetwork: DEFAULT_NETWORK_KEY,
      stats: getStatsSnapshot(),
    });
    return;
  }

  if (url.pathname === '/api/catalog') {
    sendJson(res, { endpoints: ENDPOINTS, networks: getPublicNetworkConfigs(process.env) });
    return;
  }

  if (url.pathname === '/api/baseline') {
    sendJson(res, baselineMetrics());
    return;
  }

  if (url.pathname === '/api/stats') {
    sendJson(res, getStatsSnapshot());
    return;
  }

  const threatMatch = url.pathname.match(/^\/api\/x402\/threat\/(.+)$/);
  if (threatMatch) {
    await handlePaidEndpoint(res, requestHeaders(req), url, 'threat', decodeURIComponent(threatMatch[1]));
    return;
  }

  const botScoreMatch = url.pathname.match(/^\/api\/x402\/bot-score\/(.+)$/);
  if (botScoreMatch) {
    await handlePaidEndpoint(res, requestHeaders(req), url, 'bot-score', decodeURIComponent(botScoreMatch[1]));
    return;
  }

  const reputationMatch = url.pathname.match(/^\/api\/x402\/reputation\/(.+)$/);
  if (reputationMatch) {
    await handlePaidEndpoint(res, requestHeaders(req), url, 'reputation', decodeURIComponent(reputationMatch[1]));
    return;
  }

  if (url.pathname === '/api/x402/url-risk') {
    const target = url.searchParams.get('url');
    if (!target) {
      sendJson(res, { error: 'Missing url query parameter' }, { status: 400 });
      return;
    }
    await handlePaidEndpoint(res, requestHeaders(req), url, 'url-risk', target);
    return;
  }

  sendJson(res, { error: 'Not found' }, { status: 404 });
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error(error);
    if (!res.headersSent) sendJson(res, { error: 'Internal server error' }, { status: 500 });
    else res.end();
  });
});

server.listen(PORT, () => {
  console.log(`merchant-console-demo listening on :${PORT}`);
});

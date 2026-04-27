export function getSwarmModuleJs(): string {
  return `
import { createPublicClient, http, encodeFunctionData, decodeFunctionResult, defineChain } from 'https://esm.sh/viem';
import { privateKeyToAccount } from 'https://esm.sh/viem/accounts';

const RADIUS_DEFAULTS = {
  chainId: 723487,
  chainName: 'Radius Mainnet',
  tokenAddress: '0x33ad9e4bd16b69b5bfded37d8b5d9ff9aba014fb',
  tokenName: 'Stable Coin',
  tokenVersion: '1',
  tokenDecimals: 6,
  permit2Address: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  x402Permit2Proxy: '0x402085c248EeA27D92E8b30b2C58ed07f9E20001',
  batchContractAddress: '0x71e14b65a8305a9a95a675abccb993f929b53885',
  rpcUrl: 'https://rpc.radiustech.xyz',
  explorerBaseUrl: 'https://network.radiustech.xyz',
  nativeCurrencyName: 'RUSD',
  nativeCurrencySymbol: 'RUSD',
  nativeCurrencyDecimals: 18,
  amountPerRequest: '100',
  maxRetries: 3,
};

const balanceOfData = (addr) => encodeFunctionData({
  abi: [{ name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' }],
  functionName: 'balanceOf', args: [addr],
});

const noncesData = (addr) => encodeFunctionData({
  abi: [{ name: 'nonces', type: 'function', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' }],
  functionName: 'nonces', args: [addr],
});

const decodeUint = (data) => decodeFunctionResult({
  abi: [{ name: 'x', type: 'function', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' }],
  functionName: 'x', data,
});

const approveData = (spender, amount) => encodeFunctionData({
  abi: [{ name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' }],
  functionName: 'approve', args: [spender, amount],
});

const batchTransferCallData = (token, recipients, amounts) => encodeFunctionData({
  abi: [{ name: 'batchTransfer', type: 'function', inputs: [{ name: 'token', type: 'address' }, { name: 'recipients', type: 'address[]' }, { name: 'amounts', type: 'uint256[]' }], outputs: [], stateMutability: 'nonpayable' }],
  functionName: 'batchTransfer', args: [token, recipients, amounts],
});

function randomPermit2Nonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
}

async function probeFor402(url) {
  let probeRes;
  try {
    probeRes = await fetch(url);
  } catch {
    throw new Error('Could not reach endpoint for payment probe.');
  }
  if (probeRes.status !== 402) {
    throw new Error('Probe returned ' + probeRes.status + ', expected 402.');
  }
  let probeBody;
  try {
    probeBody = await probeRes.json();
  } catch {
    throw new Error('Could not parse 402 probe response as JSON.');
  }
  const requirement = (probeBody.paymentRequirements && probeBody.paymentRequirements[0])
    || (probeBody.accepts && probeBody.accepts[0]);
  if (!requirement) throw new Error('Probe response missing payment requirements.');
  if (!requirement.payTo) throw new Error('Probe requirement missing payTo address.');
  if (!requirement.amount && requirement.maxAmountRequired) requirement.amount = requirement.maxAmountRequired;
  return requirement;
}

async function estimateGasWithFallback(publicClient, txParams, fallbackGas) {
  try {
    const estimate = await publicClient.estimateGas({ account: txParams.from, to: txParams.to, data: txParams.data });
    return estimate + estimate / BigInt(5);
  } catch {
    return BigInt(fallbackGas);
  }
}

async function waitForTx(publicClient, txHash) {
  for (let i = 0; i < 90; i++) {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash }).catch(() => null);
    if (receipt) {
      if (receipt.status === 'reverted') throw new Error('Transaction reverted (' + txHash.slice(0, 10) + '...)');
      return receipt;
    }
    await new Promise(r => setTimeout(r, 750));
  }
  throw new Error('Transaction not confirmed after 67s');
}

export async function signX402Payment({ signTypedData, owner, permitNonce, resource, accepted, config }) {
  const cfg = { ...RADIUS_DEFAULTS, ...config };
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);
  const amount = accepted ? accepted.amount : cfg.amountPerRequest;
  const payTo = (accepted && accepted.payTo) || cfg.paymentAddress;

  const eip2612Signature = await signTypedData({
    domain: { name: cfg.tokenName, version: cfg.tokenVersion, chainId: cfg.chainId, verifyingContract: cfg.tokenAddress },
    types: {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Permit',
    message: { owner, spender: cfg.permit2Address, value: BigInt(amount), nonce: permitNonce, deadline },
  });

  const p2Nonce = randomPermit2Nonce();
  const permit2Signature = await signTypedData({
    domain: { name: 'Permit2', chainId: cfg.chainId, verifyingContract: cfg.permit2Address },
    types: {
      PermitWitnessTransferFrom: [
        { name: 'permitted', type: 'TokenPermissions' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'witness', type: 'Witness' },
      ],
      TokenPermissions: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      Witness: [
        { name: 'to', type: 'address' },
        { name: 'validAfter', type: 'uint256' },
      ],
    },
    primaryType: 'PermitWitnessTransferFrom',
    message: {
      permitted: { token: cfg.tokenAddress, amount: BigInt(amount) },
      spender: cfg.x402Permit2Proxy,
      nonce: p2Nonce,
      deadline,
      witness: { to: payTo, validAfter: BigInt(0) },
    },
  });

  const acceptedReq = accepted || {
    scheme: 'exact',
    network: 'eip155:' + cfg.chainId,
    amount: cfg.amountPerRequest,
    asset: cfg.tokenAddress,
    payTo: cfg.paymentAddress,
    maxTimeoutSeconds: 300,
    extra: { name: cfg.tokenName, version: cfg.tokenVersion, assetTransferMethod: 'permit2' },
  };

  const payload = {
    x402Version: 2,
    scheme: 'exact',
    network: 'eip155:' + cfg.chainId,
    resource: {
      url: resource.url,
      description: resource.description || '',
      mimeType: resource.mimeType || 'application/json',
    },
    accepted: acceptedReq,
    payload: {
      signature: permit2Signature,
      permit2Authorization: {
        permitted: { token: cfg.tokenAddress, amount: amount.toString() },
        from: owner,
        spender: cfg.x402Permit2Proxy,
        nonce: p2Nonce.toString(),
        deadline: deadline.toString(),
        witness: { to: payTo, validAfter: '0' },
      },
    },
    extensions: {
      eip2612GasSponsoring: {
        info: { amount: amount.toString(), deadline: deadline.toString(), signature: eip2612Signature },
      },
    },
  };

  return { payload, xPayment: btoa(JSON.stringify(payload)) };
}

export function createSwarm(userConfig) {
  if (!userConfig.paymentAddress) throw new Error('paymentAddress is required');
  if (!userConfig.rpcUrl) throw new Error('rpcUrl is required');
  const cfg = { ...RADIUS_DEFAULTS, ...userConfig };
  const chain = defineChain({
    id: cfg.chainId,
    name: cfg.chainName,
    nativeCurrency: { name: cfg.nativeCurrencyName, symbol: cfg.nativeCurrencySymbol, decimals: cfg.nativeCurrencyDecimals },
    rpcUrls: { default: { http: [cfg.rpcUrl] } },
    blockExplorers: { default: { name: cfg.chainName + ' Explorer', url: cfg.explorerBaseUrl } },
  });
  const publicClient = createPublicClient({ chain, transport: http(cfg.rpcUrl) });
  let abortFlag = false;
  let running = false;
  let currentCallbacks = null;

  async function getNonce(addr) {
    const data = await publicClient.call({ to: cfg.tokenAddress, data: noncesData(addr) });
    return decodeUint(data.data);
  }

  async function getBalance(addr) {
    const data = await publicClient.call({ to: cfg.tokenAddress, data: balanceOfData(addr) });
    return decodeUint(data.data);
  }

  async function launch({ numAgents, requestsPerAgent, generateRequests, callbacks, walletClient, address }) {
    if (running) throw new Error('Swarm is already running');
    const cb = callbacks || {};
    currentCallbacks = cb;
    abortFlag = false;
    running = true;
    const agentCount = Math.min(100, Math.max(1, numAgents || 8));
    const perAgent = Math.max(1, requestsPerAgent || 4);
    try {
      cb.onStatus?.('Generating ' + agentCount + ' agent wallets...');
      const agents = [];
      for (let i = 0; i < agentCount; i++) {
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        const hex = '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        agents.push({ account: privateKeyToAccount(hex) });
      }

      cb.onStatus?.('Planning endpoint-specific swarm funding...');
      const agentPlans = agents.map((agent, agentIdx) => {
        const requests = generateRequests(agentIdx, perAgent);
        const plannedCost = requests.reduce((sum, req) => sum + BigInt(req.amountRaw || cfg.amountPerRequest), BigInt(0));
        return { agent, agentIdx, requests, plannedCost };
      });
      const totalFunding = agentPlans.reduce((sum, plan) => sum + plan.plannedCost, BigInt(0));

      cb.onStatus?.('Approving agent funding allowance...');
      cb.onFundingStep?.('approve', 'pending');
      const approveCallData = approveData(cfg.batchContractAddress, totalFunding);
      const approveGas = await estimateGasWithFallback(publicClient, { from: address, to: cfg.tokenAddress, data: approveCallData }, 200000);
      const approveTxHash = await walletClient.sendTransaction({ account: address, to: cfg.tokenAddress, data: approveCallData, gas: approveGas, chain });
      await waitForTx(publicClient, approveTxHash);
      cb.onFundingStep?.('approve', 'confirmed');

      cb.onStatus?.('Batch funding ' + agentCount + ' agents...');
      cb.onFundingStep?.('batch-transfer', 'pending');
      const batchCallData = batchTransferCallData(
        cfg.tokenAddress,
        agentPlans.map(p => p.agent.account.address),
        agentPlans.map(p => p.plannedCost),
      );
      const batchGas = await estimateGasWithFallback(publicClient, { from: address, to: cfg.batchContractAddress, data: batchCallData }, 200000 + agentCount * 100000);
      const batchTxHash = await walletClient.sendTransaction({ account: address, to: cfg.batchContractAddress, data: batchCallData, gas: batchGas, chain });
      await waitForTx(publicClient, batchTxHash);
      cb.onFundingStep?.('batch-transfer', 'confirmed');

      cb.onStatus?.('Agent swarm live');
      let totalReqs = 0;
      let totalSpent = 0;
      const startTime = Date.now();

      const agentWork = async (plan) => {
        const { agent, agentIdx, requests } = plan;
        let currentPermitNonce = await getNonce(agent.account.address);
        for (let i = 0; i < requests.length; i++) {
          if (abortFlag) return;
          const req = requests[i];
          let success = false;
          for (let attempt = 0; attempt < cfg.maxRetries && !success && !abortFlag; attempt++) {
            try {
              if (attempt > 0) currentPermitNonce = await getNonce(agent.account.address).catch(() => currentPermitNonce);
              const accepted = await probeFor402(req.url);
              const amount = BigInt(accepted.amount || req.amountRaw || cfg.amountPerRequest);
              const { xPayment } = await signX402Payment({
                signTypedData: (params) => agent.account.signTypedData(params),
                owner: agent.account.address,
                permitNonce: currentPermitNonce,
                resource: req,
                accepted,
                config: cfg,
              });
              const t0 = Date.now();
              const res = await fetch(req.url, { headers: { 'X-Payment': xPayment } });
              const latencyMs = Date.now() - t0;
              const text = await res.text();
              let data = null;
              try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
              if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + text.slice(0, 240));
              currentPermitNonce = currentPermitNonce + BigInt(1);
              success = true;
              totalReqs++;
              totalSpent += Number(amount);
              const elapsed = (Date.now() - startTime) / 1000;
              cb.onStatsUpdate?.({
                totalRequests: totalReqs,
                totalSpentRaw: totalSpent,
                elapsedMs: Date.now() - startTime,
                requestsPerSecond: elapsed > 0 ? totalReqs / elapsed : 0,
              });
              cb.onAgentLog?.({ agentIndex: agentIdx, requestId: req.description || req.url, isError: false, txHash: data && data.tx_hash, responseData: data, latencyMs });
            } catch (err) {
              if (attempt >= cfg.maxRetries - 1) {
                cb.onAgentLog?.({ agentIndex: agentIdx, requestId: req.description || req.url, message: err.message || String(err), isError: true });
              } else {
                await new Promise(r => setTimeout(r, 350 * Math.pow(2, attempt)));
              }
            }
          }
        }
      };

      await Promise.all(agentPlans.map((plan) => agentWork(plan)));
      const elapsed = (Date.now() - startTime) / 1000;
      const finalStats = {
        totalRequests: totalReqs,
        totalSpentRaw: totalSpent,
        elapsedMs: Date.now() - startTime,
        requestsPerSecond: elapsed > 0 ? totalReqs / elapsed : 0,
      };
      cb.onComplete?.(finalStats);
      return finalStats;
    } finally {
      running = false;
      currentCallbacks = null;
    }
  }

  function stop() {
    abortFlag = true;
    currentCallbacks?.onStatus?.('Stopping...');
  }

  return { launch, stop, isRunning: () => running, getBalance, getNonce, chain, config: cfg };
}
`;
}

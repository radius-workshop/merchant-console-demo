import type { NetworkKey, PublicNetworkConfig } from './network-config.js';
import type { EndpointDefinition } from './demo-data.js';

interface FrontendBootData {
  defaultNetwork: NetworkKey;
  networks: Record<NetworkKey, PublicNetworkConfig>;
  endpoints: EndpointDefinition[];
}

function toInlineJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function getFrontendHtml(boot: FrontendBootData): string {
  const bootJson = toInlineJson(boot);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EdgeMeter · Production · Overview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root {
  --bg-0: #0A0C10;
  --bg-1: #0F1319;
  --bg-2: #141A22;
  --bg-3: #1A2230;
  --line: rgba(255,255,255,0.08);
  --line-2: rgba(255,255,255,0.14);
  --line-3: rgba(255,255,255,0.22);
  --ink: #E6EBF2;
  --muted: #8A95A5;
  --dim: #5B6472;
  --ch-human: #6AA3D6;
  --ch-apikey: #3FB8A8;
  --ch-unmon: #D4A84A;
  --ch-x402: #FF7A1A;
  --ok: #4ADE80;
  --warn: #FACC15;
  --err: #F87171;
  --mono: "Geist Mono", ui-monospace, SFMono-Regular, "JetBrains Mono", monospace;
  --sans: "Geist", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
* { box-sizing: border-box; }
html, body { margin: 0; }
html { overflow-x: hidden; }
body {
  color: var(--ink);
  background:
    radial-gradient(ellipse at 75% -10%, rgba(255,122,26,0.06), transparent 50%),
    radial-gradient(ellipse at 0% 100%, rgba(106,163,214,0.04), transparent 60%),
    var(--bg-0);
  background-attachment: fixed;
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.45;
  font-feature-settings: "ss01", "cv11";
  min-height: 100vh;
  overflow-x: hidden;
}
body::before {
  content: "";
  position: fixed; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
  z-index: 0;
}
button, input, select { font: inherit; color: inherit; }
a { color: inherit; text-decoration: none; }

/* ─── app frame ───────────────────────────────────────────── */
.app { position: relative; z-index: 1; min-height: 100vh; }
.canvas-col { display: flex; flex-direction: column; min-width: 0; min-height: 100vh; }

/* ─── top bar ──────────────────────────────────────────────── */
.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--line);
  background: rgba(15,19,25,0.72);
  backdrop-filter: blur(12px);
  position: sticky; top: 0; z-index: 20;
}
.crumb { display: flex; align-items: center; gap: 12px; font-size: 13px; }
.mark {
  width: 26px; height: 26px; border-radius: 6px;
  background:
    linear-gradient(135deg, #FF7A1A 0%, #FF9A4D 40%, #D4A84A 100%);
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
}
.mark::after {
  content: ""; position: absolute; inset: 6px;
  border-radius: 2px;
  background: var(--bg-0);
}
.crumb .wordmark { font-weight: 600; letter-spacing: -0.01em; font-size: 14px; }
.crumb .sep { color: var(--dim); }
.crumb .workspace { color: var(--muted); }
.crumb .page { color: var(--ink); font-weight: 500; }

.topbar-mid {
  display: flex; align-items: center; gap: 18px; justify-content: center;
  color: var(--muted); font-size: 12px; font-family: var(--mono);
}
.live-dot {
  width: 7px; height: 7px; border-radius: 999px;
  background: var(--ok); box-shadow: 0 0 8px rgba(74,222,128,0.5);
  animation: breathe 2.2s ease-in-out infinite;
}
@keyframes breathe {
  0%,100% { opacity: 0.55; transform: scale(0.9); }
  50%     { opacity: 1;    transform: scale(1.05); }
}

.topbar-right { display: flex; align-items: center; gap: 10px; }
.seg {
  display: inline-flex;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  padding: 2px;
  background: var(--bg-1);
}
.seg button {
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--mono);
  letter-spacing: 0.02em;
  transition: color 120ms, background 120ms;
}
.seg button:hover { color: var(--ink); }
.seg button.active { background: var(--bg-3); color: var(--ink); }

.time-chip {
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid var(--line); padding: 6px 10px; border-radius: 6px;
  background: var(--bg-1); color: var(--muted); font-size: 12px;
  font-family: var(--mono);
}

.wallet-pill {
  display: inline-flex; align-items: center; gap: 10px;
  border: 1px solid var(--line-2);
  background: var(--bg-1);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-family: var(--mono);
  color: var(--muted);
  cursor: pointer;
  transition: border-color 120ms, color 120ms;
}
.wallet-pill:hover { border-color: var(--line-3); color: var(--ink); }
.wallet-pill.connected { border-color: rgba(74,222,128,0.35); color: var(--ink); }
.wallet-pill .wdot { width: 6px; height: 6px; border-radius: 999px; background: var(--dim); }
.wallet-pill.connected .wdot { background: var(--ok); box-shadow: 0 0 6px rgba(74,222,128,0.6); }
.wallet-pill .addr { color: var(--ink); }
.wallet-pill .bal { color: var(--ch-x402); font-weight: 500; }
.wallet-pill[disabled] { opacity: 0.6; cursor: wait; }

/* ─── main split (canvas + rail) ──────────────────────────── */
.main-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 0;
  min-height: 100vh;
}
.canvas {
  padding: 28px 28px 48px;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
/* Default order: page-head, kpi-strip, chart-panel, live-panel (hidden), table-stream */
.canvas > .page-head    { order: 0; }
.canvas > .kpi-strip    { order: 1; }
.canvas > .chart-panel  { order: 2; }
.canvas > .x402-live-panel { order: 3; }
.canvas > .row-2.table-stream { order: 4; }
/* When x402 is ON, live-panel jumps above chart-panel — live story leads */
body.x402-on .canvas > .x402-live-panel { order: 2; }
body.x402-on .canvas > .chart-panel     { order: 3; }
.rail {
  --rail-bg: #F2EBDC;
  --rail-bg-2: #FBF6EC;
  --rail-ink: #181E27;
  --rail-muted: #5C5747;
  --rail-dim: #8A8470;
  --rail-line: rgba(0, 0, 0, 0.10);
  --rail-line-2: rgba(0, 0, 0, 0.18);
  border-left: 1px solid rgba(0, 0, 0, 0.18);
  background:
    repeating-linear-gradient(45deg, rgba(0,0,0,0.012) 0 4px, transparent 4px 8px),
    radial-gradient(circle at 20% 0%, rgba(255,122,26,0.06), transparent 40%),
    var(--rail-bg);
  color: var(--rail-ink);
  padding: 18px 20px 28px;
  position: sticky; top: 0;
  align-self: start;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
  box-shadow: inset 8px 0 24px -12px rgba(0,0,0,0.45);
}
.rail-seg {
  display: flex;
  border: 1px solid var(--rail-line-2);
  border-radius: 6px;
  padding: 2px;
  background: var(--rail-bg-2);
  overflow: hidden;
}
.rail-seg button {
  flex: 1;
  border: 0;
  background: transparent;
  color: var(--rail-muted);
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  transition: background 120ms, color 120ms;
}
.rail-seg button:hover { color: var(--rail-ink); }
.rail-seg button.active {
  background: var(--rail-ink);
  color: #FFFAF1;
  box-shadow: 0 1px 2px rgba(0,0,0,0.15);
}

/* ─── canvas: page head ───────────────────────────────────── */
.page-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-bottom: 20px;
}
.page-head h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.01em;
}
.page-head .sub {
  color: var(--muted);
  font-size: 13px;
  font-family: var(--mono);
}
.page-head-right {
  display: inline-flex; align-items: center; gap: 14px;
}
.refresh-chip {
  display: inline-flex; align-items: center; gap: 8px;
  color: var(--muted); font-size: 12px; font-family: var(--mono);
}

/* ─── x402 master toggle ─────────────────────────────── */
.x402-toggle {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 8px 14px;
  background: var(--bg-1);
  border: 1px solid var(--line-2);
  border-radius: 8px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 200ms ease-out;
}
.x402-toggle:hover { border-color: var(--line-3); color: var(--ink); }
.x402-toggle.on {
  background: rgba(255,122,26,0.10);
  border-color: var(--ch-x402);
  color: var(--ch-x402);
  box-shadow: 0 0 0 1px var(--ch-x402), 0 0 16px rgba(255,122,26,0.15);
}
.x402-toggle .switch {
  width: 30px; height: 16px;
  background: var(--bg-3);
  border-radius: 999px;
  position: relative;
  transition: background 200ms;
  flex-shrink: 0;
}
.x402-toggle .switch::before {
  content: ""; position: absolute;
  width: 12px; height: 12px;
  background: var(--muted);
  border-radius: 999px;
  top: 2px; left: 2px;
  transition: all 200ms ease-out;
}
.x402-toggle.on .switch { background: var(--ch-x402); }
.x402-toggle.on .switch::before { left: 16px; background: #160800; }

/* ─── panels ──────────────────────────────────────────────── */
.panel {
  background: var(--bg-1);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}
.panel-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  font-size: 12px;
  font-family: var(--mono);
  color: var(--muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.panel-head .title { color: var(--ink); font-weight: 500; }
.panel-body { padding: 16px; }

/* ─── KPI strip ───────────────────────────────────────────── */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.kpi {
  background: var(--bg-1);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px 18px;
  display: flex; flex-direction: column; gap: 10px;
  min-width: 0;
  position: relative;
  overflow: hidden;
}
.kpi::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
  background: var(--dot);
  opacity: 0.8;
}
.kpi.human   { --dot: var(--ch-human); }
.kpi.unmon   { --dot: var(--ch-unmon); }
.kpi.x402    { --dot: var(--ch-x402); }
.kpi.plain   { --dot: var(--line-3); }

.kpi .label {
  display: flex; align-items: center; gap: 8px;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.kpi .label .cdot {
  width: 7px; height: 7px; border-radius: 999px;
  background: var(--dot);
}
.kpi .label .tag {
  margin-left: auto;
  color: var(--ch-unmon);
  background: rgba(212,168,74,0.08);
  border: 1px solid rgba(212,168,74,0.22);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  letter-spacing: 0.04em;
}
.kpi .value {
  font-family: var(--mono);
  font-size: 30px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--ink);
  min-height: 30px;
  display: flex; align-items: baseline; gap: 6px;
}
.kpi .unit {
  font-size: 13px; color: var(--muted); font-weight: 400;
}
.kpi .foot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  color: var(--muted); font-size: 11px; font-family: var(--mono);
}
.kpi .spark { height: 22px; width: 100%; }
.kpi .delta.up   { color: var(--ok); }
.kpi .delta.down { color: var(--err); }

/* ─── two-column rows ────────────────────────────────────── */
.row-2 {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
}
.row-2.table-stream { grid-template-columns: 1.5fr 1fr; }
.chart-panel { margin-bottom: 20px; }

/* ─── chart panel ─────────────────────────────────────────── */
.chart-wrap {
  position: relative;
  height: 240px;
}
.chart-svg { width: 100%; height: 100%; display: block; }
.chart-head-caption {
  font-family: var(--mono); font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.04em;
  text-transform: none;
  display: inline-flex; align-items: center; gap: 8px;
}
.chart-head-caption strong {
  color: var(--ink); font-weight: 500;
  display: inline-flex; align-items: center; gap: 6px;
}
.chart-head-caption strong::before {
  content: ""; width: 8px; height: 8px; border-radius: 2px;
  background: var(--ch-unmon);
}
body:not(.x402-on) .chart-head-caption strong::before {
  background: transparent;
  border: 1px dashed rgba(212,168,74,0.55);
}
.chart-x-axis-traffic {
  left: 8px; right: 8px; bottom: 4px;
  height: 14px;
}
.legend {
  display: flex; flex-wrap: wrap; gap: 14px 18px;
  padding: 10px 16px 14px;
  border-top: 1px solid var(--line);
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}
.legend .item { display: inline-flex; align-items: center; gap: 7px; }
.legend .swatch { width: 10px; height: 10px; border-radius: 2px; }
.legend .swatch.hatch {
  background: repeating-linear-gradient(45deg,
    var(--ch-x402) 0 2px,
    transparent 2px 4px
  ), rgba(255,122,26,0.10);
  border: 1px solid rgba(255,122,26,0.5);
}
.legend .count { color: var(--ink); font-weight: 500; }

/* ─── endpoint table ──────────────────────────────────────── */
table.endpoint-tbl {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
table.endpoint-tbl th {
  text-align: left; color: var(--muted);
  font-family: var(--mono); font-size: 10px;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 10px 14px; border-bottom: 1px solid var(--line);
  font-weight: 500;
  background: var(--bg-1);
}
table.endpoint-tbl th.num, table.endpoint-tbl td.num { text-align: right; }
table.endpoint-tbl tbody tr {
  border-bottom: 1px solid var(--line);
  transition: background 120ms;
  position: relative;
}
table.endpoint-tbl tbody tr:last-child { border-bottom: 0; }
table.endpoint-tbl tbody tr:hover {
  background: var(--bg-2);
  box-shadow: inset 2px 0 0 var(--ch-x402);
}
table.endpoint-tbl td {
  padding: 12px 14px;
  vertical-align: middle;
}
table.endpoint-tbl .ep-name { color: var(--ink); font-weight: 500; }
table.endpoint-tbl .ep-path { color: var(--muted); font-family: var(--mono); font-size: 11px; margin-top: 2px; }
table.endpoint-tbl .num { font-family: var(--mono); color: var(--ink); }
table.endpoint-tbl .num.muted { color: var(--muted); }
table.endpoint-tbl .num.x402 { color: var(--ch-x402); }
table.endpoint-tbl .spark-mini { display: inline-block; vertical-align: middle; }
.tbl-footnote {
  color: var(--muted); font-size: 11px; font-family: var(--mono);
  padding: 10px 14px; border-top: 1px dashed var(--line);
  background: var(--bg-1);
}
.panel-head .ops-pills { display: inline-flex; gap: 6px; }
.ops-pill {
  display: inline-flex; align-items: center; gap: 4px;
  border: 1px solid var(--line); background: var(--bg-2);
  color: var(--muted); padding: 2px 8px; border-radius: 3px;
  font-size: 10px; font-family: var(--mono);
  cursor: default; letter-spacing: 0.04em;
}

/* ─── paid stream ─────────────────────────────────────────── */
.stream {
  max-height: 380px;
  overflow-y: auto;
  position: relative;
  background:
    repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 3px),
    var(--bg-1);
}
.stream-empty {
  padding: 40px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  color: var(--muted); text-align: center;
}
.stream-empty .icon {
  width: 28px; height: 28px; border-radius: 999px;
  border: 1px dashed var(--line-2);
  display: flex; align-items: center; justify-content: center;
  color: var(--dim); font-size: 14px;
  animation: breathe 2.5s ease-in-out infinite;
}
.stream-empty .msg { font-size: 13px; color: var(--ink); }
.stream-empty .sub { font-size: 11px; font-family: var(--mono); max-width: 28ch; line-height: 1.5; }
.stream-row {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  grid-template-areas:
    "dot tm  tag  amt"
    "dot net tx   tx";
  align-items: center;
  gap: 2px 10px;
  padding: 9px 14px 11px 14px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
  animation: slide-in 280ms ease-out;
  position: relative;
  min-width: 0;
}
.stream-row .sdot { grid-area: dot; align-self: center; }
.stream-row .tm   { grid-area: tm; }
.stream-row .ep-tag { grid-area: tag; justify-self: start; }
.stream-row .amt  { grid-area: amt; justify-self: end; white-space: nowrap; }
.stream-row .net  { grid-area: net; justify-self: start; }
.stream-row .tx   { grid-area: tx; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right; }
.stream-row::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
  background: var(--ch-x402);
  animation: edge-pulse 1.4s ease-out;
}
@keyframes edge-pulse {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes slide-in {
  0% { transform: translateY(-6px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
.stream-row .tm { color: var(--muted); font-family: var(--mono); font-size: 12px; }
.stream-row .sdot { width: 6px; height: 6px; border-radius: 999px; background: var(--ok); }
.stream-row .sdot.err { background: var(--err); }
.stream-row .ep-tag {
  font-family: var(--mono); font-size: 11px;
  padding: 2px 8px; border-radius: 3px;
  border: 1px solid var(--line-2);
  color: var(--ink);
  text-transform: lowercase;
}
.stream-row .ep-tag.threat    { color: #F4B266; border-color: rgba(244,178,102,0.35); }
.stream-row .ep-tag.bot-score { color: #7BC5BA; border-color: rgba(123,197,186,0.35); }
.stream-row .ep-tag.reputation { color: #B9A3E4; border-color: rgba(185,163,228,0.35); }
.stream-row .ep-tag.url-risk  { color: #E98C8C; border-color: rgba(233,140,140,0.35); }
.stream-row .amt {
  font-family: var(--mono); color: var(--ch-x402); font-size: 13px; font-weight: 500;
}
.stream-row .net {
  font-family: var(--mono); font-size: 10px; padding: 2px 6px; border-radius: 3px;
  background: var(--bg-2); color: var(--muted); border: 1px solid var(--line);
}
.stream-row .tx {
  font-family: var(--mono); font-size: 12px; color: var(--muted);
  transition: color 120ms;
}
.stream-row .tx:hover { color: var(--ch-human); }

/* ─── operator rail (cream / paper theme) ─────────────────── */
.rail-badge {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  border: 1px dashed rgba(189, 76, 0, 0.55);
  background:
    repeating-linear-gradient(45deg, rgba(255, 165, 0, 0.18) 0 6px, transparent 6px 12px),
    rgba(255, 165, 0, 0.06);
  color: #8B3F00;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 4px;
  margin-bottom: 18px;
  font-weight: 600;
}
.rail-badge .dotp { width: 7px; height: 7px; border-radius: 999px; background: #BD4C00; animation: breathe 2.4s ease-in-out infinite; flex-shrink: 0; }
.rail h3 {
  margin: 0 0 10px;
  font-size: 10px;
  font-weight: 600;
  font-family: var(--mono);
  color: var(--rail-muted, #5C5747);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.rail-section { padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px dashed var(--rail-line, rgba(0,0,0,0.10)); }
.rail-section:last-child { border-bottom: 0; }
.rail-hint {
  color: var(--rail-muted, #5C5747); font-size: 11px; line-height: 1.5; margin: 0 0 12px;
  font-family: var(--mono);
}
.rail-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: var(--rail-ink, #181E27); }
.rail .btn {
  border: 1px solid var(--rail-line-2, rgba(0,0,0,0.18));
  background: var(--rail-bg-2, #FBF6EC);
  color: var(--rail-ink, #181E27);
}
.rail .btn:hover { background: #fff; border-color: rgba(0,0,0,0.30); }
.rail .btn.primary {
  background: var(--ch-x402);
  border-color: #BD4C00;
  color: #160800;
  box-shadow: 0 1px 0 #BD4C00;
}
.rail .btn.primary:hover { background: #FF8A33; }
.rail .btn.ghost { background: transparent; border-color: rgba(0,0,0,0.16); color: var(--rail-muted, #5C5747); }
.rail .btn.ghost:hover { color: var(--err); border-color: rgba(189,49,49,0.45); background: rgba(189,49,49,0.04); }
.rail .btn.icon { color: var(--rail-muted, #5C5747); }
.rail .field label { color: var(--rail-muted, #5C5747); }
.rail .field input, .rail .field select {
  background: var(--rail-bg-2, #FBF6EC);
  border: 1px solid var(--rail-line-2, rgba(0,0,0,0.18));
  color: var(--rail-ink, #181E27);
}
.rail .field input:focus, .rail .field select:focus {
  border-color: var(--ch-x402);
  box-shadow: 0 0 0 2px rgba(255,122,26,0.20);
}
.rail .cost-row { color: var(--rail-muted, #5C5747); }
.rail .cost-row .v { color: var(--rail-ink, #181E27); }
.rail .swarm-status { color: var(--rail-muted, #5C5747); }
.rail .swarm-status.error { color: #BD3131; }
.swarm-warning {
  margin: 0 0 12px;
  padding: 9px 10px;
  border: 1px solid rgba(189, 76, 0, 0.38);
  border-left: 3px solid #BD4C00;
  border-radius: 6px;
  background: rgba(255, 122, 26, 0.08);
  color: #7A3200;
  font-family: var(--mono);
  font-size: 10px;
  line-height: 1.45;
}
.swarm-warning.testnet {
  border-color: rgba(37, 99, 235, 0.22);
  border-left-color: #2563EB;
  background: rgba(37, 99, 235, 0.06);
  color: var(--rail-muted, #5C5747);
}
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border: 1px solid var(--line-2);
  background: var(--bg-1);
  color: var(--ink);
  padding: 9px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-family: var(--sans);
  font-weight: 500;
  transition: background 120ms, border-color 120ms, color 120ms;
}
.btn:hover { border-color: var(--line-3); background: var(--bg-2); }
.btn.primary {
  background: var(--ch-x402);
  border-color: var(--ch-x402);
  color: #160800;
}
.btn.primary:hover { background: #FF8A33; border-color: #FF8A33; }
.btn.ghost { border-color: var(--line); color: var(--muted); background: transparent; }
.btn.ghost:hover { color: var(--err); border-color: rgba(248,113,113,0.45); }
.btn.icon { padding: 9px 10px; color: var(--muted); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.swarm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
.swarm-grid.full { grid-template-columns: 1fr; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field label {
  font-size: 10px; font-family: var(--mono); color: var(--muted);
  letter-spacing: 0.06em; text-transform: uppercase;
}
.field input, .field select {
  background: var(--bg-2);
  border: 1px solid var(--line-2);
  color: var(--ink);
  padding: 7px 10px;
  border-radius: 5px;
  font-family: var(--mono);
  font-size: 12px;
  min-width: 0;
}
.field input:focus, .field select:focus {
  outline: none;
  border-color: var(--ch-x402);
  box-shadow: 0 0 0 2px rgba(255,122,26,0.16);
}
.cost-row {
  display: flex; align-items: baseline; justify-content: space-between;
  margin: 6px 0 10px;
  font-family: var(--mono); font-size: 11px; color: var(--muted);
  letter-spacing: 0.04em;
}
.cost-row .v { color: var(--ink); font-size: 13px; }
.swarm-actions { display: flex; gap: 8px; }
.swarm-actions .btn { flex: 1; }
.swarm-status {
  margin-top: 10px;
  color: var(--muted);
  font-size: 11px;
  font-family: var(--mono);
  min-height: 1.5em;
  line-height: 1.5;
}
.swarm-status.error { color: var(--err); }
.swarm-status .rdot {
  display: inline-block;
  width: 7px; height: 7px; border-radius: 999px;
  background: var(--ch-x402);
  margin-right: 6px;
  animation: breathe 1.2s ease-in-out infinite;
}
.swarm-log {
  margin-top: 10px;
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
  display: block;
  padding-right: 2px;
  min-width: 0;
  width: 100%;
}
.swarm-log-row {
  display: block;
  padding: 6px 8px;
  margin-bottom: 4px;
  font-family: var(--mono);
  font-size: 11px;
  background: var(--bg-2);
  border-left: 2px solid var(--ch-x402);
  border-radius: 2px;
  color: var(--ink);
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
.swarm-log-row.error { border-left-color: var(--err); color: var(--err); }
.swarm-log-row .dim { color: var(--muted); }

/* ─── x402 visibility tied to master toggle ────────────── */
.x402-live-panel { display: none; }
body.x402-on .x402-live-panel { display: block; animation: panel-fade-in 400ms ease-out; }
@keyframes panel-fade-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
body:not(.x402-on) .stream-side { display: none; }
body:not(.x402-on) .row-2.table-stream { grid-template-columns: 1fr; }
.kpi.x402 { transition: opacity 300ms ease-out; }
body:not(.x402-on) .kpi.x402 { opacity: 0.42; }
.endpoint-tbl th.x402-col, .endpoint-tbl td.x402-col { transition: opacity 300ms; }
body:not(.x402-on) .endpoint-tbl th.x402-col, body:not(.x402-on) .endpoint-tbl td.x402-col { opacity: 0.42; }

/* ─── x402 live channel panel ─────────────────────────── */
.x402-live-panel {
  background: linear-gradient(180deg, rgba(255,122,26,0.04), transparent 70%), var(--bg-1);
}
.x402-live-chart {
  position: relative;
  height: 240px;
  padding: 14px 10px 0;
}
.chart-y-axis, .chart-x-axis {
  position: absolute;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  pointer-events: none;
}
.chart-y-axis {
  left: 0; top: 14px; bottom: 28px;
  width: 56px;
}
.chart-y-axis span {
  position: absolute;
  right: 12px;
  transform: translateY(-50%);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.chart-y-axis .y-unit {
  top: -4px;
  right: 12px;
  color: var(--ch-x402);
  font-weight: 500;
}
.chart-x-axis {
  left: 56px; right: 56px; bottom: 4px;
  height: 16px;
}
.chart-x-axis span {
  position: absolute;
  transform: translateX(-50%);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.x402-live-chart svg { width: 100%; height: 100%; display: block; }
.x402-live-empty {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  text-align: center; padding: 20px 36px;
  color: var(--muted); font-family: var(--mono); font-size: 12px;
  line-height: 1.6;
}
.x402-live-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 12px 18px 14px;
  border-top: 1px solid var(--line);
}
.x402-live-stat .num {
  display: block; color: var(--ch-x402); font-size: 16px; font-weight: 500;
  font-family: var(--mono); margin-bottom: 4px; letter-spacing: -0.02em;
}
.x402-live-stat .lab {
  font-family: var(--mono); font-size: 10px; color: var(--muted);
  letter-spacing: 0.06em; text-transform: uppercase;
}

/* ─── chart SVG accents ───────────────────────────────────── */
.chart-svg .grid-line { stroke: var(--line); stroke-width: 1; }
.chart-svg .axis-tick { fill: var(--dim); font-family: var(--mono); font-size: 10px; }
.chart-svg .band-human   { fill: var(--ch-human);  opacity: 0.78; }
.chart-svg .band-apikey  { fill: var(--ch-apikey); opacity: 0.78; }
.chart-svg .band-unmon   { fill: var(--ch-unmon);  opacity: 0.78; }
.chart-svg .band-unmon, .chart-svg .band-unmon-hidden {
  fill: var(--ch-unmon);
  transition: opacity 600ms ease-out, fill 600ms ease-out;
}
.chart-svg .band-unmon-hidden {
  fill: rgba(255,255,255,0.04);
  stroke: rgba(212,168,74,0.20);
  stroke-width: 1;
  stroke-dasharray: 3 4;
  opacity: 0.5;
}
.chart-svg .band-x402 { fill: var(--ch-x402); }

/* ─── catalog drawer ─────────────────────────────────── */
.catalog-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--bg-1);
  border: 1px solid var(--line-2);
  color: var(--ink);
  padding: 6px 12px;
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 120ms, background 120ms;
}
.catalog-btn:hover { border-color: var(--line-3); background: var(--bg-2); }
.catalog-btn::before {
  content: ""; width: 6px; height: 6px; border-radius: 1px;
  background: var(--ch-x402); display: inline-block;
}
.drawer-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 30;
  display: none;
}
.drawer-backdrop.open { display: block; animation: fade-in 200ms; }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-from-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 520px; max-width: 92vw;
  background: var(--bg-1);
  border-left: 1px solid var(--line-2);
  z-index: 31;
  display: none;
  flex-direction: column;
  box-shadow: -20px 0 60px rgba(0,0,0,0.55);
}
.drawer.open { display: flex; animation: slide-from-right 240ms cubic-bezier(0.2, 0.8, 0.2, 1); }
.drawer-head {
  padding: 18px 24px;
  border-bottom: 1px solid var(--line);
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.drawer-head h2 { margin: 0; font-size: 16px; font-weight: 500; letter-spacing: -0.01em; }
.drawer-head .sub { color: var(--muted); font-size: 12px; font-family: var(--mono); margin-top: 2px; }
.drawer-close {
  border: 1px solid var(--line-2); background: transparent; color: var(--muted);
  padding: 6px 10px; border-radius: 4px; cursor: pointer;
  font-family: var(--mono); font-size: 12px;
}
.drawer-close:hover { color: var(--ink); border-color: var(--line-3); }
.drawer-body { padding: 18px 24px 32px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px; }
.endpoint-card {
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px 18px;
  position: relative;
}
.endpoint-card .top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 4px; padding-right: 70px; }
.endpoint-card h3 { margin: 0; font-size: 15px; font-weight: 500; }
.endpoint-card .price-pill {
  font-family: var(--mono); color: var(--ch-x402); font-size: 12px; font-weight: 500;
  background: rgba(255,122,26,0.10);
  border: 1px solid rgba(255,122,26,0.30);
  padding: 3px 8px; border-radius: 4px;
  white-space: nowrap;
}
.endpoint-card .desc { color: var(--muted); font-size: 13px; line-height: 1.55; margin: 6px 0 12px; }
.endpoint-card .meta {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px;
  font-family: var(--mono); font-size: 11px; color: var(--muted);
}
.endpoint-card .meta strong { color: var(--ink); font-weight: 500; }
.endpoint-card .ex {
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(0,0,0,0.30);
  border-radius: 4px;
  border: 1px solid var(--line);
  font-family: var(--mono); font-size: 11px; color: var(--ch-human);
  word-break: break-all;
  line-height: 1.5;
}
.endpoint-card .actions {
  margin-top: 12px;
  display: flex; gap: 8px; flex-wrap: wrap;
}
.endpoint-card .actions button {
  border: 1px solid var(--line-2); background: transparent; color: var(--muted);
  padding: 5px 10px; border-radius: 4px; cursor: pointer;
  font-family: var(--mono); font-size: 11px;
  transition: color 120ms, border-color 120ms;
}
.endpoint-card .actions button:hover { border-color: var(--line-3); color: var(--ink); }
.endpoint-card .badge-active {
  position: absolute; top: 16px; right: 16px;
  display: inline-flex; align-items: center; gap: 5px;
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--ok);
}
.endpoint-card .badge-active::before {
  content: ""; width: 6px; height: 6px; border-radius: 999px; background: var(--ok);
  box-shadow: 0 0 6px rgba(74,222,128,0.5);
}

@media (max-width: 1200px) {
  .row-2.table-stream { grid-template-columns: 1fr; }
}
@media (max-width: 980px) {
  .main-wrap { grid-template-columns: 1fr; }
  .rail { border-left: 0; border-top: 1px dashed var(--line-2); position: static; max-height: none; }
  .kpi-strip { grid-template-columns: repeat(2, 1fr); }
  .topbar-mid { display: none; }
  .x402-live-stats { grid-template-columns: 1fr; gap: 8px; }
}
</style>
</head>
<body>
<div class="app">
  <div class="main-wrap">
    <div class="canvas-col">
      <header class="topbar">
        <div class="crumb">
          <div class="mark"></div>
          <span class="wordmark">EdgeMeter</span>
          <span class="sep">/</span>
          <span class="workspace">Production</span>
          <span class="sep">/</span>
          <span class="page">Overview</span>
        </div>
        <div class="topbar-mid">
          <span class="live-dot"></span>
          <span>~2s refresh</span>
          <span class="sep">·</span>
          <span>Radius facilitator</span>
          <span class="sep">·</span>
          <span id="activeNetworkLabel">Radius Mainnet</span>
        </div>
        <div class="topbar-right">
          <button class="x402-toggle" data-x402-toggle onclick="toggleX402()" aria-pressed="false">
            <span class="switch"></span>
            <span data-x402-label>x402 OFF</span>
          </button>
          <button class="catalog-btn" onclick="openCatalog()">Catalog</button>
          <div class="time-chip">Last 24h</div>
        </div>
      </header>

    <main class="canvas">
      <div class="page-head">
        <div>
          <h1>Overview</h1>
          <div class="sub">Real-time traffic &amp; monetization</div>
        </div>
        <div class="page-head-right">
          <div class="refresh-chip">
            <span class="live-dot"></span>
            <span id="lastUpdated">—</span>
          </div>
        </div>
      </div>

      <section class="kpi-strip" id="kpiStrip">
        <div class="kpi plain">
          <div class="label"><span class="cdot"></span>Requests 24h</div>
          <div class="value" id="kpiTotalReqs">—</div>
          <div class="foot">
            <svg class="spark" id="sparkTotal" viewBox="0 0 120 24" preserveAspectRatio="none"></svg>
            <span class="delta up">+4.2%</span>
          </div>
        </div>
        <div class="kpi unmon">
          <div class="label"><span class="cdot"></span>Unmonetized agents 24h<span class="tag">no channel</span></div>
          <div class="value" id="kpiUnmon">—</div>
          <div class="foot">
            <svg class="spark" id="sparkUnmon" viewBox="0 0 120 24" preserveAspectRatio="none"></svg>
            <span class="delta up">+11.6%</span>
          </div>
        </div>
        <div class="kpi x402">
          <div class="label"><span class="cdot"></span>x402 paid · live</div>
          <div class="value" id="paidRequests"><span style="color:var(--dim)">—</span></div>
          <div class="foot">
            <svg class="spark" id="sparkPaid" viewBox="0 0 120 24" preserveAspectRatio="none"></svg>
            <span id="x402SettleFoot">p50 —ms · <span id="swarmRps">0.0</span> rps</span>
          </div>
        </div>
        <div class="kpi x402">
          <div class="label"><span class="cdot"></span>x402 revenue · today</div>
          <div class="value"><span id="liveRevenue" style="color:var(--dim)">—</span> <span class="unit">SBC</span></div>
          <div class="foot">
            <svg class="spark" id="sparkRev" viewBox="0 0 120 24" preserveAspectRatio="none"></svg>
            <span id="x402AvgFoot"><span id="avgSettlement">—</span></span>
          </div>
        </div>
      </section>

      <section class="panel chart-panel">
        <div class="panel-head">
          <span class="title">Traffic by channel · last 36 min</span>
          <span class="chart-head-caption" id="chartAnnot"></span>
        </div>
        <div class="panel-body" style="padding: 12px 16px 0;">
          <div class="chart-wrap">
            <svg class="chart-svg" id="trafficChart" viewBox="0 0 720 240" preserveAspectRatio="none">
              <defs>
                <pattern id="hatch-orange" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="rgba(255,122,26,0.12)"/>
                  <rect width="3" height="6" fill="rgba(255,122,26,0.88)"/>
                </pattern>
              </defs>
            </svg>
            <div class="chart-x-axis chart-x-axis-traffic" id="trafficXLabels"></div>
          </div>
        </div>
        <div class="legend" id="chartLegend"></div>
      </section>

      <section class="panel x402-live-panel" id="x402LivePanel" style="margin-bottom: 20px;">
        <div class="panel-head">
          <span class="title">x402 channel · live session</span>
          <span id="x402LiveStatus">awaiting traffic</span>
        </div>
        <div class="x402-live-chart">
          <svg id="x402LiveChart" viewBox="0 0 720 240" preserveAspectRatio="none"></svg>
          <div class="chart-y-axis" id="x402LiveYLabels"></div>
          <div class="chart-x-axis" id="x402LiveXLabels"></div>
          <div class="x402-live-empty" id="x402LiveEmpty">Launch the traffic generator to fill this chart with cumulative paid x402 requests and revenue.</div>
        </div>
      </section>

      <section class="row-2 table-stream">
        <div class="panel">
          <div class="panel-head">
            <span class="title">Endpoint performance</span>
            <div class="ops-pills">
              <span class="ops-pill">Filter</span>
              <span class="ops-pill">Sort ↓</span>
            </div>
          </div>
          <table class="endpoint-tbl">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th class="num">Price</th>
                <th class="num">Requests 24h</th>
                <th class="num x402-col">x402 paid</th>
                <th class="num x402-col">Revenue</th>
                <th class="num x402-col">Avg settle</th>
                <th class="num">Trend</th>
              </tr>
            </thead>
            <tbody id="endpointTblBody"></tbody>
          </table>
          <div class="tbl-footnote">Endpoints return stubbed security intelligence; the 402 challenge and settlement path are real.</div>
        </div>

        <div class="panel stream-side">
          <div class="panel-head">
            <span class="title">Paid settlement stream</span>
            <span id="streamCount">0 events</span>
          </div>
          <div class="stream" id="paidStream">
            <div class="stream-empty" id="streamEmpty">
              <div class="icon">◌</div>
              <div class="msg">Awaiting paid settlements.</div>
              <div class="sub">Launch the traffic generator to fire signed x402 requests at your endpoints.</div>
            </div>
          </div>
        </div>
      </section>
    </main>
    </div><!-- /canvas-col -->

    <aside class="rail">
      <div class="rail-badge"><span class="dotp"></span>Demo controls · not in prod</div>

      <div class="rail-section">
        <h3>Network</h3>
        <div class="rail-seg" id="networkToggle">
          <button data-network="mainnet" onclick="setNetwork('mainnet')" class="active">Mainnet</button>
          <button data-network="testnet" onclick="setNetwork('testnet')">Testnet</button>
        </div>
      </div>

      <div class="rail-section">
        <h3>Wallet</h3>
        <p class="rail-hint">MetaMask on Radius. Funds ephemeral agent keys via Permit2 for the swarm run.</p>
        <button class="btn" id="connectBtn" onclick="connectWallet()">Connect wallet</button>
        <div id="walletPanel" style="display:none; margin-top: 10px;">
          <div class="rail-row" style="font-family: var(--mono); font-size: 12px;">
            <span style="color: var(--rail-muted, #5C5747)">addr</span>
            <span id="walletAddrRail" style="color: var(--rail-ink, #181E27)">—</span>
          </div>
          <div class="rail-row" style="font-family: var(--mono); font-size: 12px;">
            <span style="color: var(--rail-muted, #5C5747)">bal</span>
            <span id="walletBalRail" style="color: #BD4C00; font-weight: 600;">— SBC</span>
          </div>
        </div>
      </div>

      <div class="rail-section">
        <h3>Traffic generator</h3>
        <p class="rail-hint">Simulate autonomous agents paying via x402 to drive live events into the dashboard.</p>
        <div class="swarm-warning" id="swarmNetworkWarning"></div>
        <div class="swarm-grid">
          <div class="field">
            <label>Agents</label>
            <input id="swarmAgents" type="number" min="1" max="100" value="8" oninput="updateCost()">
          </div>
          <div class="field">
            <label>Req / agent</label>
            <input id="swarmCount" type="number" min="1" max="1000" value="4" oninput="updateCost()">
          </div>
        </div>
        <div class="swarm-grid full">
          <div class="field">
            <label>Endpoint mix</label>
            <select id="endpointMix" onchange="updateCost()">
              <option value="all">All endpoints</option>
              <option value="threat">Threat intel</option>
              <option value="bot-score">Bot score</option>
              <option value="reputation">Reputation</option>
              <option value="url-risk">URL risk</option>
            </select>
          </div>
        </div>
        <div class="cost-row">
          <span>Est. spend</span><span class="v" id="swarmCost">0.00000 SBC</span>
        </div>
        <div class="swarm-actions">
          <button class="btn primary" id="swarmBtn" onclick="launchSwarm()">Launch</button>
          <button class="btn ghost" id="stopBtn" onclick="stopSwarm()" style="display:none">Stop</button>
          <button class="btn icon" onclick="refreshStats()" title="Refresh stats">↻</button>
        </div>
        <div class="swarm-status" id="swarmStatus"></div>
        <div class="swarm-log" id="swarmLog"></div>
      </div>
    </aside>
  </div>
</div>

<div class="drawer-backdrop" id="drawerBackdrop" onclick="closeCatalog()"></div>
<aside class="drawer" id="catalogDrawer" role="dialog" aria-label="API catalog">
  <div class="drawer-head">
    <div>
      <h2>API catalog</h2>
      <div class="sub">4 paid endpoints · priced per request · settles in SBC on Radius</div>
    </div>
    <button class="drawer-close" onclick="closeCatalog()">Close ✕</button>
  </div>
  <div class="drawer-body" id="catalogBody"></div>
</aside>

<script type="module">
const BOOT = ${bootJson};

let currentNetworkKey = new URLSearchParams(location.search).get('network') === 'testnet' ? 'testnet' : BOOT.defaultNetwork;
let currentConfig = BOOT.networks[currentNetworkKey];
let x402On = false; // master toggle: reveals unmon band + live x402 panel
let baseline = null;
let lastStats = null;
let connectedAddress = null;
let walletClient = null;
let walletProvider = null;
let swarm = null;
let walletConnecting = false;
let createSwarmFn = null;
let createWalletClientFn = null;
let customTransportFn = null;
let dependencyLoadPromise = null;
let tweenCurrent = {}; // id → current number for counter tween

/* ─── util ─────────────────────────────────────────────── */
function fmtNum(n) { return new Intl.NumberFormat('en-US').format(Math.round(n)); }
function fmtCompact(n) {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 1 : 2) + 'K';
  return String(Math.round(n));
}
function fmtUsd(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(n >= 10_000 ? 1 : 2) + 'k';
  if (n >= 1) return '$' + n.toFixed(2);
  return '$' + n.toFixed(4);
}
function short(addr) { return addr ? addr.slice(0, 6) + '…' + addr.slice(-4) : ''; }
function errorMessage(err) {
  if (err && typeof err === 'object' && 'message' in err) return err.message;
  return String(err);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function getWalletProvider() {
  if (!window.ethereum) return null;
  if (Array.isArray(window.ethereum.providers)) {
    return window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
  }
  return window.ethereum;
}
function apiUrl(path) {
  const url = new URL(path, location.origin);
  url.searchParams.set('network', currentNetworkKey);
  return url;
}
function clampNumberInput(id, min, max, fallback) {
  const el = document.getElementById(id);
  const value = parseInt(el.value, 10);
  const clamped = Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback));
  el.value = String(clamped);
  return clamped;
}

/* Ease-out counter tween */
function tweenNumber(id, target, ms = 400, formatter = fmtNum) {
  const el = document.getElementById(id);
  if (!el) return;
  const from = Number(tweenCurrent[id] || 0);
  const to = Number(target);
  if (from === to) { el.textContent = formatter(to); tweenCurrent[id] = to; return; }
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / ms);
    const v = from + (to - from) * (1 - Math.pow(1 - t, 3));
    el.textContent = formatter(v);
    if (t < 1) requestAnimationFrame(step);
    else tweenCurrent[id] = to;
  }
  requestAnimationFrame(step);
}

/* ─── wallet dependency loader ─────────────────────────── */
function networkToSwarmConfig(config) {
  return {
    chainId: config.chainId,
    chainName: config.chainName,
    tokenAddress: config.tokenAddress,
    tokenName: config.tokenName,
    tokenVersion: config.tokenVersion,
    tokenDecimals: config.tokenDecimals,
    permit2Address: config.permit2Address,
    x402Permit2Proxy: config.x402Permit2Proxy,
    batchContractAddress: config.batchContractAddress,
    rpcUrl: config.rpcUrl,
    explorerBaseUrl: config.explorerBaseUrl,
    nativeCurrencyName: config.nativeCurrency.name,
    nativeCurrencySymbol: config.nativeCurrency.symbol,
    nativeCurrencyDecimals: config.nativeCurrency.decimals,
    amountPerRequest: config.amountPerRequest,
    paymentAddress: config.paymentAddress,
  };
}

async function loadWalletDependencies() {
  if (!dependencyLoadPromise) {
    dependencyLoadPromise = Promise.all([
      import('https://esm.sh/viem'),
      import('/modules/swarm.js'),
    ]).then(([viem, swarmModule]) => {
      createWalletClientFn = viem.createWalletClient;
      customTransportFn = viem.custom;
      createSwarmFn = swarmModule.createSwarm;
    });
  }
  await dependencyLoadPromise;
}

async function ensureSwarm() {
  await loadWalletDependencies();
  if (!swarm) swarm = createSwarmFn(networkToSwarmConfig(currentConfig));
  return swarm;
}

/* ─── baseline + chart ────────────────────────────────── */
async function loadBaseline() {
  const res = await fetch('/api/baseline');
  baseline = await res.json();
  tweenNumber('kpiTotalReqs', baseline.totalRequests24h || baseline.humanVisitors + baseline.apiKeyRequests24h + baseline.estimatedUnmonetizedAgentRequests24h, 600, fmtCompact);
  tweenNumber('kpiUnmon', baseline.estimatedUnmonetizedAgentRequests24h, 600, fmtCompact);
  drawSparkFromSeries('sparkTotal', baseline.series, p => (p.human + p.apiKey + p.unmonetizedAgent), 'var(--ink)');
  drawSparkFromSeries('sparkUnmon', baseline.series, p => p.unmonetizedAgent, 'var(--ch-unmon)');
  drawChart();
  renderEndpointTable();
}

function drawSparkFromSeries(id, series, pick, strokeVar) {
  const el = document.getElementById(id);
  if (!el) return;
  const max = Math.max(1, ...series.map(pick));
  const pts = series.map((p, i) => {
    const x = (i / (series.length - 1)) * 120;
    const y = 22 - (pick(p) / max) * 20;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  el.innerHTML =
    '<polyline points="' + pts + '" fill="none" stroke="' + strokeVar + '" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/>';
}

/* ── stacked area chart ─────────────────────────────── */
function drawChart() {
  if (!baseline || !baseline.series) return;
  const svg = document.getElementById('trafficChart');
  const W = 720, H = 240, padT = 14, padB = 22, padL = 8, padR = 8;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const series = baseline.series;
  const n = series.length;
  const rows = series.map(p => ({
    human: p.human,
    apikey: p.apiKey,
    unmon: p.unmonetizedAgent,
  }));
  const totals = rows.map(r => r.human + r.apikey + r.unmon);
  const maxTotal = Math.max(1, ...totals);

  const x = i => padL + (i / (n - 1)) * plotW;
  const y = v => padT + plotH - (v / maxTotal) * plotH;

  function bandPath(heights, baseOffsetFn) {
    let top = '';
    let bot = '';
    for (let i = 0; i < n; i++) {
      top += (i === 0 ? 'M' : 'L') + x(i).toFixed(1) + ',' + y(baseOffsetFn(i) + heights[i]).toFixed(1) + ' ';
    }
    for (let i = n - 1; i >= 0; i--) {
      bot += 'L' + x(i).toFixed(1) + ',' + y(baseOffsetFn(i)).toFixed(1) + ' ';
    }
    return top + bot + 'Z';
  }

  const humanBase  = i => 0;
  const apikeyBase = i => rows[i].human;
  const unmonBase  = i => rows[i].human + rows[i].apikey;

  const humanHeights  = rows.map(r => r.human);
  const apikeyHeights = rows.map(r => r.apikey);
  const unmonHeights  = rows.map(r => r.unmon);

  let gridSvg = '';
  for (let g = 1; g < 5; g++) {
    const gy = padT + (plotH * g) / 5;
    gridSvg += '<line class="grid-line" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '"/>';
  }

  const defs = svg.querySelector('defs')?.outerHTML || '';
  // Unmon band class swaps based on x402On state — CSS handles fade
  const unmonClass = x402On ? 'band-unmon' : 'band-unmon-hidden';

  svg.innerHTML =
    defs +
    gridSvg +
    '<path class="band-human" d="' + bandPath(humanHeights, humanBase) + '"/>' +
    '<path class="band-apikey" d="' + bandPath(apikeyHeights, apikeyBase) + '"/>' +
    '<path class="' + unmonClass + '" d="' + bandPath(unmonHeights, unmonBase) + '"/>';

  // HTML overlay x-axis labels (not stretched by SVG aspect)
  const xLabels = document.getElementById('trafficXLabels');
  if (xLabels) {
    let html = '';
    const nowT = series[n - 1].t;
    for (let g = 0; g <= 6; g++) {
      const idx = Math.round((g / 6) * (n - 1));
      const minsAgo = Math.round((nowT - series[idx].t) / 60000);
      const label = minsAgo === 0 ? 'now' : '-' + minsAgo + 'm';
      const pct = ((x(idx) - padL) / plotW) * 100;
      html += '<span style="left: ' + pct.toFixed(1) + '%">' + label + '</span>';
    }
    xLabels.innerHTML = html;
  }

  updateChartAnnotation();
  renderLegend();
}

function updateChartAnnotation() {
  const el = document.getElementById('chartAnnot');
  if (!el) return;
  const unmon = baseline ? baseline.estimatedUnmonetizedAgentRequests24h : 0;
  if (!x402On) {
    el.innerHTML = '<strong>Hidden agent traffic</strong> · ' + fmtCompact(unmon) + '/d unserved · toggle x402 to reveal';
  } else {
    el.innerHTML = '<strong>Unmonetized agent traffic</strong> · ' + fmtCompact(unmon) + '/d · ready for x402 channel';
  }
}

function renderLegend() {
  const el = document.getElementById('chartLegend');
  if (!el) return;
  const last = baseline ? baseline.series[baseline.series.length - 1] : { human: 0, apiKey: 0, unmonetizedAgent: 0 };
  const paid = lastStats ? Number(lastStats.paidRequests || 0) : 0;
  const items = [
    { sw: 'var(--ch-human)', label: 'human', count: fmtCompact(last.human) + '/min' },
    { sw: 'var(--ch-apikey)', label: 'api-key', count: fmtCompact(last.apiKey) + '/min' },
  ];
  if (x402On) {
    items.push({ sw: 'var(--ch-unmon)', label: 'unmonetized agents', count: fmtCompact(last.unmonetizedAgent) + '/min' });
    items.push({ sw: 'var(--ch-x402)', label: 'x402 paid (live)', count: fmtNum(paid) });
  }
  el.innerHTML = items.map(it =>
    '<span class="item"><span class="swatch" style="background:' + it.sw + '"></span>' + it.label + ' <span class="count">' + it.count + '</span></span>'
  ).join('');
}

/* ─── x402 live channel chart ────────────────────────── */
const x402LiveBuffer = []; // { ts, paid, revSbc }
let x402PeakRps = 0;
let x402SessionStart = 0;
let x402PrevSnapshot = null;

const X402_Y_FLOOR_SBC = 0.10;

function renderX402LiveChart() {
  const svg = document.getElementById('x402LiveChart');
  const empty = document.getElementById('x402LiveEmpty');
  const status = document.getElementById('x402LiveStatus');
  const yLabelsEl = document.getElementById('x402LiveYLabels');
  const xLabelsEl = document.getElementById('x402LiveXLabels');
  if (!svg || !empty || !status || !lastStats) return;

  const paid = Number(lastStats.paidRequests || 0);
  const rev = Number(lastStats.totalRevenueSbc || 0);
  const ts = Date.now();

  if (paid > 0 && x402SessionStart === 0) x402SessionStart = ts;

  const last = x402LiveBuffer[x402LiveBuffer.length - 1];
  if (!last || last.paid !== paid || last.revSbc !== rev) {
    if (x402PrevSnapshot && paid > x402PrevSnapshot.paid) {
      const dt = (ts - x402PrevSnapshot.ts) / 1000;
      if (dt > 0) {
        const rps = (paid - x402PrevSnapshot.paid) / dt;
        if (rps > x402PeakRps) x402PeakRps = rps;
      }
    }
    x402LiveBuffer.push({ ts, paid, revSbc: rev });
    x402PrevSnapshot = { ts, paid };
  }

  if (paid === 0) {
    empty.style.display = 'flex';
    svg.innerHTML = '';
    if (yLabelsEl) yLabelsEl.innerHTML = '';
    if (xLabelsEl) xLabelsEl.innerHTML = '';
    status.textContent = 'awaiting traffic';
    return;
  }
  empty.style.display = 'none';

  const elapsedMs = ts - x402SessionStart;
  const elapsedS = Math.max(1, Math.floor(elapsedMs / 1000));
  const elapsedLabel = elapsedS < 60 ? elapsedS + 's' : Math.floor(elapsedS / 60) + 'm ' + (elapsedS % 60) + 's';
  status.textContent = 'session ' + elapsedLabel + ' · ' + fmtNum(paid) + ' paid · ' + rev.toFixed(5) + ' SBC · peak ' + x402PeakRps.toFixed(1) + ' rps';

  const buf = x402LiveBuffer;
  const W = 720, H = 240, padT = 18, padB = 28, padL = 56, padR = 56;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  // Full-session X axis: t0 (session start) to now
  const t0 = x402SessionStart || buf[0].ts;
  const span = Math.max(1000, ts - t0);
  // Y axis: floor at 0.10 SBC so small revenue stays visually small
  const maxRev = Math.max(X402_Y_FLOOR_SBC, rev);
  const x = t => padL + ((t - t0) / span) * plotW;
  const y = v => padT + plotH - (v / maxRev) * plotH;

  // Build polyline + area for cumulative revenue
  const revPts = buf.map(p => x(p.ts).toFixed(1) + ',' + y(p.revSbc).toFixed(1)).join(' ');
  const lastPt = buf[buf.length - 1];
  const lastX = x(lastPt.ts).toFixed(1);
  const baseY = (padT + plotH).toFixed(1);
  // Area stops at the LAST data point — no orange slab extending to "now" while idle
  const areaPts = revPts + ' ' + lastX + ',' + baseY + ' ' + padL.toFixed(1) + ',' + baseY;

  // Horizontal grid lines only (no SVG text — moved to HTML overlay)
  let grid = '';
  for (let g = 0; g <= 4; g++) {
    const gy = padT + (plotH * g) / 4;
    const stroke = g === 4 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)';
    grid += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="' + stroke + '" stroke-width="1"/>';
  }

  const dotX = lastX;
  const dotY = y(lastPt.revSbc).toFixed(1);

  svg.innerHTML =
    '<defs><linearGradient id="x402-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#FF7A1A" stop-opacity="0.40"/><stop offset="100%" stop-color="#FF7A1A" stop-opacity="0"/></linearGradient></defs>' +
    grid +
    '<polyline points="' + areaPts + '" fill="url(#x402-area)" stroke="none"/>' +
    '<polyline points="' + revPts + '" fill="none" stroke="#FF7A1A" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
    '<circle cx="' + dotX + '" cy="' + dotY + '" r="4" fill="#FF7A1A"><animate attributeName="r" values="4;6;4" dur="1.4s" repeatCount="indefinite"/></circle>';

  // HTML overlay y labels (5 ticks: 100% to 0%)
  if (yLabelsEl) {
    let html = '<span class="y-unit" style="top: 0">SBC</span>';
    for (let g = 0; g <= 4; g++) {
      const v = maxRev * (1 - g / 4);
      const pct = (g / 4) * 100;
      html += '<span style="top: ' + pct + '%">' + v.toFixed(2) + '</span>';
    }
    yLabelsEl.innerHTML = html;
  }
  // HTML overlay x labels (6 ticks)
  if (xLabelsEl) {
    let html = '';
    for (let g = 0; g <= 5; g++) {
      const gt = t0 + (span * g) / 5;
      const ds = Math.max(0, Math.floor((gt - t0) / 1000));
      const lbl = ds < 60 ? ds + 's' : Math.floor(ds / 60) + 'm ' + (ds % 60 ? (ds % 60) + 's' : '');
      const pct = (g / 5) * 100;
      html += '<span style="left: ' + pct + '%">' + lbl.trim() + '</span>';
    }
    xLabelsEl.innerHTML = html;
  }

}

/* ─── endpoint table ─────────────────────────────────── */
function endpointTrafficFor(id) {
  return (baseline && baseline.endpointTraffic24h && Number(baseline.endpointTraffic24h[id])) || 0;
}
function endpointColorClass(id) { return id; }

function endpointMiniSpark(id, paidPct) {
  // 12-bucket bar chart, deterministic pseudo-random from id
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) | 0;
  const bars = [];
  for (let i = 0; i < 12; i++) {
    seed = Math.imul(seed + 1, 1103515245) + 12345;
    const h = 3 + Math.abs(seed % 14);
    const highlight = i >= 10 && paidPct > 0; // last 2 buckets highlight if active
    bars.push('<rect x="' + (i * 5) + '" y="' + (18 - h) + '" width="3" height="' + h + '" fill="' + (highlight ? 'var(--ch-x402)' : 'var(--dim)') + '" opacity="' + (highlight ? 0.9 : 0.55) + '"/>');
  }
  return '<svg class="spark-mini" width="60" height="20" viewBox="0 0 60 20">' + bars.join('') + '</svg>';
}

function renderEndpointTable() {
  const tbody = document.getElementById('endpointTblBody');
  if (!tbody) return;
  const counts = (lastStats && lastStats.endpointCounts) || {};
  const eventsByEp = {}; // latency sums per endpoint
  const events = (lastStats && lastStats.events) || [];
  events.forEach(ev => {
    if (!eventsByEp[ev.endpoint]) eventsByEp[ev.endpoint] = { sum: 0, n: 0, rev: 0 };
    eventsByEp[ev.endpoint].sum += Number(ev.latencyMs || 0);
    eventsByEp[ev.endpoint].n += 1;
    eventsByEp[ev.endpoint].rev += Number(ev.amountRaw || 0);
  });
  const rows = BOOT.endpoints.map(ep => {
    const paid = Number(counts[ep.id] || 0);
    const trafficTotal = endpointTrafficFor(ep.id);
    const rec = eventsByEp[ep.id];
    const avgSettle = rec && rec.n > 0 ? Math.round(rec.sum / rec.n) : null;
    const revSbc = rec ? rec.rev / 1_000_000 : 0;
    return (
      '<tr>' +
        '<td>' +
          '<div class="ep-name">' + escapeHtml(ep.label) + '</div>' +
          '<div class="ep-path">' + escapeHtml(ep.method + ' ' + ep.path) + '</div>' +
        '</td>' +
        '<td class="num">' + escapeHtml(ep.priceSbc) + '</td>' +
        '<td class="num">' + fmtCompact(trafficTotal) + '</td>' +
        '<td class="num x402-col ' + (paid > 0 ? 'x402' : 'muted') + '">' + (paid > 0 ? fmtNum(paid) : '—') + '</td>' +
        '<td class="num x402-col ' + (revSbc > 0 ? 'x402' : 'muted') + '">' + (revSbc > 0 ? revSbc.toFixed(5) : '—') + '</td>' +
        '<td class="num x402-col muted">' + (avgSettle != null ? avgSettle + 'ms' : '—') + '</td>' +
        '<td class="num">' + endpointMiniSpark(ep.id, paid) + '</td>' +
      '</tr>'
    );
  }).join('');
  tbody.innerHTML = rows;
}

/* ─── paid stream ─────────────────────────────────────── */
let streamLastKey = '';
function renderPaidStream() {
  const wrap = document.getElementById('paidStream');
  const empty = document.getElementById('streamEmpty');
  const events = (lastStats && lastStats.events) || [];
  document.getElementById('streamCount').textContent = events.length + ' event' + (events.length === 1 ? '' : 's');
  if (events.length === 0) {
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  // events from backend are newest-last in stats snapshot? Check stats.ts — it pushes and we slice.
  // We render newest-first. Use a key of last ts to avoid needless re-render.
  const ordered = events.slice().sort((a, b) => b.ts - a.ts);
  const key = ordered.length + ':' + ordered[0].ts;
  if (key === streamLastKey) return;
  streamLastKey = key;

  const rows = ordered.map(ev => {
    const tm = new Date(ev.ts).toLocaleTimeString([], { hour12: false });
    const net = ev.network || currentNetworkKey;
    const amt = (Number(ev.amountRaw) / 1_000_000).toFixed(5);
    const tx = ev.txHash
      ? '<a class="tx" href="' + escapeHtml(currentConfig.explorerBaseUrl + '/tx/' + ev.txHash) + '" target="_blank" rel="noopener">' + ev.txHash.slice(0, 10) + '…</a>'
      : '<span class="tx">—</span>';
    const cls = endpointColorClass(ev.endpoint);
    return (
      '<div class="stream-row">' +
        '<span class="sdot"></span>' +
        '<span class="tm">' + tm + '</span>' +
        '<span class="ep-tag ' + cls + '">' + escapeHtml(ev.endpoint) + '</span>' +
        '<span class="amt">' + amt + ' SBC</span>' +
        '<span class="net">' + escapeHtml(net) + '</span>' +
        tx +
      '</div>'
    );
  }).join('');
  // preserve empty element
  wrap.innerHTML = rows;
}

/* ─── x402 master toggle ─────────────────────────────── */
window.toggleX402 = function() {
  x402On = !x402On;
  syncX402Toggle();
};
function syncX402Toggle() {
  document.querySelectorAll('[data-x402-toggle]').forEach(b => b.classList.toggle('on', x402On));
  document.querySelectorAll('[data-x402-label]').forEach(el => { el.textContent = x402On ? 'x402 ON' : 'x402 OFF'; });
  document.body.classList.toggle('x402-on', x402On);
  drawChart();
  renderLegend();
  renderX402LiveChart();
  renderEndpointTable();
}

/* ─── network ─────────────────────────────────────────── */
async function switchWalletNetwork() {
  const provider = walletProvider || getWalletProvider();
  if (!provider) return;
  const chainIdHex = '0x' + currentConfig.chainId.toString(16);
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainIdHex }] });
  } catch (err) {
    if (err && err.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: currentConfig.chainName,
          nativeCurrency: currentConfig.nativeCurrency,
          rpcUrls: [currentConfig.rpcUrl],
          blockExplorerUrls: [currentConfig.explorerBaseUrl],
        }],
      });
    } else {
      throw err;
    }
  }
}

function syncWalletClient() {
  if (!swarm || !createWalletClientFn || !customTransportFn) {
    throw new Error('Wallet dependencies are not loaded yet.');
  }
  walletClient = createWalletClientFn({ chain: swarm.chain, transport: customTransportFn(walletProvider) });
}

function updateNetworkWarning() {
  const warning = document.getElementById('swarmNetworkWarning');
  if (!warning) return;
  if (currentNetworkKey === 'mainnet') {
    warning.className = 'swarm-warning';
    warning.textContent = 'Mainnet uses real SBC. Batch funding transfers the estimated spend from your wallet to generated agent wallets before requests run.';
  } else {
    warning.className = 'swarm-warning testnet';
    warning.textContent = 'Testnet mode uses test SBC. Batch funding still moves tokens, but no mainnet SBC is spent.';
  }
}

window.setNetwork = async function(networkKey) {
  if (!BOOT.networks[networkKey]) return;
  if (swarm && swarm.isRunning()) swarm.stop();
  currentNetworkKey = networkKey;
  currentConfig = BOOT.networks[currentNetworkKey];
  swarm = null;
  document.querySelectorAll('#networkToggle button').forEach(btn => btn.classList.toggle('active', btn.dataset.network === currentNetworkKey));
  document.getElementById('activeNetworkLabel').textContent = currentConfig.label;
  updateNetworkWarning();
  window.updateCost();
  const url = new URL(location.href);
  url.searchParams.set('network', currentNetworkKey);
  history.replaceState(null, '', url);
  if (connectedAddress) {
    const status = document.getElementById('swarmStatus');
    try { await switchWalletNetwork(); } catch (err) {
      status.className = 'swarm-status error';
      status.textContent = 'Wallet remains connected, but switching to ' + currentConfig.label + ' failed: ' + errorMessage(err);
      console.error(err);
    }
    try {
      await ensureSwarm();
      syncWalletClient();
    } catch (err) {
      status.className = 'swarm-status error';
      status.textContent = 'Wallet remains connected, but swarm setup failed: ' + errorMessage(err);
      console.error(err);
    }
    await refreshBalance();
  }
};

/* ─── wallet ──────────────────────────────────────────── */
window.connectWallet = async function() {
  if (walletConnecting) return;
  const status = document.getElementById('swarmStatus');
  const connectBtn = document.getElementById('connectBtn');
  walletProvider = getWalletProvider();
  if (!walletProvider) {
    status.className = 'swarm-status error';
    status.textContent = 'No injected wallet detected. Use MetaMask for the live demo.';
    return;
  }
  walletConnecting = true;
  if (connectBtn) {
    connectBtn.disabled = true;
    connectBtn.textContent = 'Connecting…';
  }
  status.className = 'swarm-status';
  status.textContent = 'Requesting wallet account…';
  try {
    const accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
    connectedAddress = accounts[0];
    status.textContent = 'Switching wallet to ' + currentConfig.label + '…';
    await switchWalletNetwork();
    status.textContent = 'Loading swarm runtime…';
    await ensureSwarm();
    syncWalletClient();

    document.getElementById('walletPanel').style.display = '';
    document.getElementById('walletAddrRail').textContent = short(connectedAddress);
    if (connectBtn) {
      connectBtn.textContent = 'Connected';
      connectBtn.disabled = true;
    }
    await refreshBalance();
    status.className = 'swarm-status';
    status.textContent = 'Wallet ready. Launch the traffic generator to drive x402 events.';
  } catch (err) {
    connectedAddress = null;
    walletClient = null;
    if (connectBtn) {
      connectBtn.disabled = false;
      connectBtn.textContent = 'Connect wallet';
    }
    status.className = 'swarm-status error';
    status.textContent = 'Wallet connection failed: ' + errorMessage(err);
    console.error(err);
  } finally {
    walletConnecting = false;
  }
};

async function refreshBalance() {
  if (!connectedAddress || !swarm) return;
  const balRail = document.getElementById('walletBalRail');
  try {
    const bal = await swarm.getBalance(connectedAddress);
    const txt = (Number(bal) / 1_000_000).toFixed(4) + ' SBC';
    if (balRail) balRail.textContent = txt;
  } catch {
    if (balRail) balRail.textContent = '— SBC';
  }
}

/* ─── swarm / cost ────────────────────────────────────── */
function selectedEndpointIds() {
  const mix = document.getElementById('endpointMix').value;
  return mix === 'all' ? BOOT.endpoints.map(e => e.id) : [mix];
}
function endpointById(id) {
  const ep = BOOT.endpoints.find(e => e.id === id);
  if (!ep) throw new Error('Unknown endpoint ' + id);
  return ep;
}
function plannedEndpointFor(agentIdx, reqIdx, endpointIds) {
  return endpointIds[(agentIdx + reqIdx) % endpointIds.length];
}
function estimateSwarmCostRaw(agents, perAgent, endpointIds) {
  let total = 0;
  for (let a = 0; a < agents; a++) {
    for (let r = 0; r < perAgent; r++) {
      total += Number(endpointById(plannedEndpointFor(a, r, endpointIds)).amountRaw);
    }
  }
  return total;
}
window.updateCost = function() {
  const agents = clampNumberInput('swarmAgents', 1, 100, 1);
  const perAgent = clampNumberInput('swarmCount', 1, 1000, 1);
  const raw = estimateSwarmCostRaw(agents, perAgent, selectedEndpointIds());
  document.getElementById('swarmCost').textContent = (raw / 1_000_000).toFixed(5) + ' SBC';
  return raw;
};

function sampleQueries(endpoint, i) {
  const ips = ['203.0.113.42', '198.51.100.17', '192.0.2.88', '45.79.21.113'];
  const domains = ['merchant.example', 'docs.example', 'agent-index.example', 'api.example'];
  const indicators = ['agentfleet-17', '0xabc4...91ef', 'crawler-lab', 'proxy-cluster-4'];
  const urls = ['https://example.com/login', 'https://merchant.example/pricing', 'https://docs.example/api', 'https://edge.example/download'];
  if (endpoint === 'threat') return ips[i % ips.length];
  if (endpoint === 'bot-score') return domains[i % domains.length];
  if (endpoint === 'reputation') return indicators[i % indicators.length];
  return urls[i % urls.length];
}

function requestFor(endpoint, index) {
  const query = sampleQueries(endpoint, index);
  const ep = endpointById(endpoint);
  if (endpoint === 'url-risk') {
    return {
      url: apiUrl('/api/x402/url-risk').toString() + '&url=' + encodeURIComponent(query),
      description: 'URL risk: ' + query,
      amountRaw: ep.amountRaw,
    };
  }
  const path = endpoint === 'bot-score' ? '/api/x402/bot-score/' : endpoint === 'reputation' ? '/api/x402/reputation/' : '/api/x402/threat/';
  return { url: apiUrl(path + encodeURIComponent(query)).toString(), description: endpoint + ': ' + query, amountRaw: ep.amountRaw };
}

function addLog(row) {
  const el = document.getElementById('swarmLog');
  const msg = row.requestId || row.message || '';
  const lat = row.latencyMs ? ' · ' + row.latencyMs + 'ms' : '';
  const tx = row.txHash ? ' · tx ' + row.txHash.slice(0, 8) + '…' : '';
  const text = (row.isError ? 'ERR ' : '✓ ') + msg + lat + tx;
  const div = document.createElement('div');
  div.className = 'swarm-log-row' + (row.isError ? ' error' : '');
  div.title = text;
  div.textContent = text;
  el.insertBefore(div, el.firstChild);
  while (el.children.length > 40) el.lastElementChild.remove();
}

window.launchSwarm = async function() {
  if (!connectedAddress) {
    await window.connectWallet();
    if (!connectedAddress) return;
  }
  if (!swarm || !walletClient) {
    const status = document.getElementById('swarmStatus');
    try {
      status.className = 'swarm-status';
      status.textContent = 'Loading swarm runtime…';
      await ensureSwarm();
      syncWalletClient();
    } catch (err) {
      status.className = 'swarm-status error';
      status.textContent = 'Swarm setup failed: ' + errorMessage(err);
      return;
    }
  }
  window.updateCost();
  const agents = clampNumberInput('swarmAgents', 1, 100, 8);
  const perAgent = clampNumberInput('swarmCount', 1, 1000, 4);
  const endpointIds = selectedEndpointIds();
  const status = document.getElementById('swarmStatus');
  document.getElementById('swarmBtn').style.display = 'none';
  document.getElementById('stopBtn').style.display = '';

  try {
    await swarm.launch({
      numAgents: agents,
      requestsPerAgent: perAgent,
      generateRequests: (agentIdx, count) => Array.from({ length: count }, (_, i) => {
        const endpoint = plannedEndpointFor(agentIdx, i, endpointIds);
        return requestFor(endpoint, agentIdx * count + i);
      }),
      callbacks: {
        onStatus: msg => {
          status.className = 'swarm-status';
          status.innerHTML = '<span class="rdot"></span>' + escapeHtml(msg);
        },
        onStatsUpdate: s => {
          const rpsEl = document.getElementById('swarmRps');
          if (rpsEl) rpsEl.textContent = s.requestsPerSecond.toFixed(1);
          refreshStats();
        },
        onAgentLog: addLog,
        onComplete: s => {
          status.className = 'swarm-status';
          status.innerHTML = '<span class="rdot" style="background:var(--ok); animation:none;"></span>Complete · ' + s.totalRequests + ' paid requests';
          refreshStats();
          refreshBalance();
        },
      },
      walletClient,
      address: connectedAddress,
    });
  } catch (err) {
    status.className = 'swarm-status error';
    status.textContent = err && err.message ? err.message : String(err);
  } finally {
    document.getElementById('swarmBtn').style.display = '';
    document.getElementById('stopBtn').style.display = 'none';
  }
};

window.stopSwarm = function() {
  if (swarm) swarm.stop();
  document.getElementById('stopBtn').style.display = 'none';
  document.getElementById('swarmBtn').style.display = '';
};

/* ─── stats polling ──────────────────────────────────── */
window.refreshStats = async function() {
  try {
    const res = await fetch('/api/stats');
    const stats = await res.json();
    lastStats = stats;
    const paid = Number(stats.paidRequests || 0);
    const rev = Number(stats.totalRevenueSbc || 0);
    const avg = Number(stats.averageSettlementMs || 0);

    if (paid > 0) {
      tweenNumber('paidRequests', paid, 400, fmtNum);
      tweenNumber('liveRevenue', rev, 400, n => n.toFixed(5));
      document.getElementById('avgSettlement').textContent = 'avg ' + Math.round(avg) + 'ms';
      document.getElementById('x402SettleFoot').innerHTML = 'p50 ' + Math.round(avg) + 'ms · <span id="swarmRps">' + (document.getElementById('swarmRps')?.textContent || '0.0') + '</span> rps';
    }
    document.getElementById('lastUpdated').textContent = 'updated ' + new Date().toLocaleTimeString([], { hour12: false });

    renderPaidStream();
    renderEndpointTable();
    renderLegend();
    renderX402LiveChart();
  } catch (err) {
    console.error('refreshStats failed', err);
  }
};

/* ─── catalog drawer ─────────────────────────────────── */
window.openCatalog = function() {
  renderCatalogDrawer();
  document.getElementById('drawerBackdrop').classList.add('open');
  document.getElementById('catalogDrawer').classList.add('open');
};
window.closeCatalog = function() {
  document.getElementById('drawerBackdrop').classList.remove('open');
  document.getElementById('catalogDrawer').classList.remove('open');
};
function renderCatalogDrawer() {
  const body = document.getElementById('catalogBody');
  if (!body) return;
  const counts = (lastStats && lastStats.endpointCounts) || {};
  body.innerHTML = BOOT.endpoints.map(ep => {
    const traffic = endpointTrafficFor(ep.id);
    const paid = Number(counts[ep.id] || 0);
    return (
      '<div class="endpoint-card">' +
        '<span class="badge-active">Active</span>' +
        '<div class="top">' +
          '<h3>' + escapeHtml(ep.label) + '</h3>' +
          '<span class="price-pill">' + escapeHtml(ep.priceSbc) + ' SBC · ' + escapeHtml(ep.priceUsdLabel) + '</span>' +
        '</div>' +
        '<div class="desc">' + escapeHtml(ep.description) + '</div>' +
        '<div class="meta">' +
          '<div>Method · <strong>' + escapeHtml(ep.method) + '</strong></div>' +
          '<div>24h traffic · <strong>' + fmtCompact(traffic) + '</strong></div>' +
          '<div>Path · <strong>' + escapeHtml(ep.path) + '</strong></div>' +
          '<div>x402 paid (live) · <strong>' + (paid ? fmtNum(paid) : '—') + '</strong></div>' +
        '</div>' +
        '<div class="ex">' + escapeHtml(ep.example) + '</div>' +
        '<div class="actions">' +
          '<button>✎ Edit pricing</button>' +
          '<button>↗ View metrics</button>' +
          '<button>⊘ Disable</button>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeCatalog(); });

/* ─── boot ────────────────────────────────────────────── */
(async function boot() {
  await loadBaseline();
  window.setNetwork(currentNetworkKey);
  window.updateCost();
  await window.refreshStats();
  setInterval(window.refreshStats, 2500);
})();
</script>
</body>
</html>`;
}

# MarketPing MCP server

[![smithery badge](https://smithery.ai/badge/marketping/marketping)](https://smithery.ai/servers/marketping/marketping)

Indian stock-market research for AI assistants: NSE/BSE corporate filings read by AI with the
**measured price reaction** after each one, fundamentals for 5,000+ companies, page-cited reads of
annual reports and earnings calls, a 108-metric screener, the IPO pipeline, FPI flows, the results
calendar and the daily market briefing.

- **Endpoint:** `https://mcp.marketping.in/mcp` — remote, Streamable HTTP, JSON-RPC 2.0, MCP protocol `2025-06-18`
- **Auth:** none for 20 of the 24 tools. No API key, no sign-up. Four account tools use OAuth 2.1.
- **Writes:** exactly one tool (`watchlist_add`), annotated `readOnlyHint: false`. Everything else is read-only.
- **Advice:** none. MarketPing publishes what companies filed and what the stock did next — no buy/sell calls, no price targets, no ratings, no grey-market premium.
- **Product page:** https://marketping.in/mcp · **Operator:** MarketPing, India · **Contact:** support@marketping.in

This repository is the server's public contract: the exact tool catalogue the server returns from
`tools/list` (`tools.json`), a registry manifest (`server.json`), and a small open-source stdio bridge
for clients that cannot speak Streamable HTTP directly. The server itself runs on MarketPing's
infrastructure; its handlers are thin read-only wrappers over the same code paths that serve
marketping.in.

## Connect

**Claude (claude.ai / Claude Desktop) — Settings › Connectors › Add custom connector**

```
https://mcp.marketping.in/mcp
```

**ChatGPT (Developer mode / Apps) — add MCP server:** same URL.

**Cursor / VS Code / Windsurf (`mcp.json`):**

```json
{
  "mcpServers": {
    "marketping": { "url": "https://mcp.marketping.in/mcp" }
  }
}
```

**Clients that only speak stdio** — the bridge in this repo wraps the remote endpoint with
[`mcp-remote`](https://www.npmjs.com/package/mcp-remote):

```json
{
  "mcpServers": {
    "marketping": { "command": "npx", "args": ["-y", "@marketping/mcp"] }
  }
}
```

`npx -y @marketping/mcp` runs `bin/marketping-mcp.js`, which execs `mcp-remote` against the endpoint
above and nothing else. It stores no credentials of its own; `mcp-remote` keeps OAuth tokens in its
standard location (`~/.mcp-auth`) only if you link an account.

## The 24 tools

Exact schemas and annotations: [`tools.json`](tools.json) (the live `tools/list` response, captured
19 Sep 2026). Every description ends with the no-advice line — that is part of the contract the
consuming model reads.

| Tool | What it returns | Auth |
|---|---|---|
| `search` | Companies, filings, IPOs and documents matching a query (ChatGPT search contract) | none |
| `fetch` | The full content of one search result by id | none |
| `resolve_company` | A listed company by name/ticker/partial match, with candidates | none |
| `company_snapshot` | Latest fundamentals and valuation for one company | none |
| `recent_alerts` | Recent NSE/BSE filings with AI subject, category, importance, sentiment | none |
| `alert_reaction` | The measured move after ONE filing: 5 min … 3 months | none |
| `search_filings` | Full-text search across every document page MarketPing holds | none |
| `list_documents` | The documents held for a company, newest first | none |
| `doc_contents` | A document's table of contents with page ranges | none |
| `read_pages` | The text of a page range (max 12 pages) — the only quotable source | none |
| `audit_report` | Auditor opinions, key audit matters, CARO exceptions per fiscal year | none |
| `screener_fields` | The 108 metrics available to `run_screener` | none |
| `run_screener` | Filter the 5,000+ company universe on fundamentals | none |
| `ipo_pipeline` | Open / upcoming / closed / listed IPOs with issue data and subscription | none |
| `fpi_flows` | FPI/FII flows as NSDL publishes them | none |
| `results_calendar` | Who reports results on which dates | none |
| `daily_briefing` | The latest trading day's briefing: score, indices, sectors, flows, movers | none |
| `list_stacks` | MarketPing's curated stacks (public daily-rebuilt company lists) | none |
| `run_stack` | The members of one stack as of today's snapshot | none |
| `stack_changes` | What entered/left a stack since a date | none |
| `list_models` | The valuation models saved to the linked account | linked account |
| `run_model` | Recompute one saved model with overrides | linked account |
| `watchlist_list` | The companies the linked account follows | linked account |
| `watchlist_add` | **Write.** Add a company to the linked account's watchlist | linked account |

## Data handling

- A tool call sends only the tool's arguments (a company name, a query, a date range) to
  `mcp.marketping.in` over HTTPS. Nothing else leaves the client; the bridge adds no telemetry.
- Anonymous calls are metered by caller class: a direct end-user IP gets its own daily budget
  (200 tool calls per IST day, the same as the Free plan); hosted assistants (claude.ai, ChatGPT)
  call from vendor egress ranges and share a bounded pool. Quota exhaustion is a normal tool
  result with a message, never an auth error.
- Linking a MarketPing account (OAuth 2.1; discovery at `https://mcp.marketping.in/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource`)
  unlocks the four account tools and the account's plan budget (Investor 1,000 / Trader 2,000
  calls per day). Tokens are issued by MarketPing's own authorization server and can be revoked
  from the account's settings.
- Every result carries a `marketping.in` URL so the assistant can cite the page. Document text
  comes only from `read_pages`, page-anchored, so quotes are checkable.
- No tool fetches arbitrary URLs, runs code, or reads anything outside MarketPing's database.

## Verify it yourself

```bash
curl -s -X POST https://mcp.marketping.in/mcp \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}'

curl -s -X POST https://mcp.marketping.in/mcp \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

The second response is `tools.json`.

## License

The bridge and the files in this repository are MIT-licensed (see `LICENSE`). The MarketPing
service and its data are proprietary; use of the endpoint is subject to https://marketping.in/terms.

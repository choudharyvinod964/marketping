# Security

**Scope.** This repository holds the public contract of the MarketPing MCP server (the tool
catalogue, registry manifests) and a stdio bridge that forwards a client to
`https://mcp.marketping.in/mcp` via `mcp-remote`. The server's own code runs on MarketPing's
infrastructure and is not in this repository.

**What the bridge does and does not do.** It spawns `mcp-remote` with one fixed URL. It reads no
environment variables, writes no files, and opens no other connections. OAuth tokens for the four
account tools are handled by `mcp-remote` (stored under `~/.mcp-auth` on the user's machine) and
issued by MarketPing's authorization server; they can be revoked from the account's settings.

**What a tool call sends.** Only the tool's arguments, over HTTPS, to `mcp.marketping.in`. No tool
fetches arbitrary URLs, executes code, or reads outside MarketPing's own database. The single
write tool, `watchlist_add`, is annotated `readOnlyHint: false` so clients ask before running it.

**Reporting.** Email security@marketping.in (or support@marketping.in) with the details. We
acknowledge within two working days. Please do not test against other users' accounts.

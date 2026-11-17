# Banking API gateway: path rewriting

A simple Node.js demo with no packages to install. Requires Node.js 18 or later.

## Run

In this folder, run:

```powershell
npm.cmd start
```

Open http://localhost:8080 to create and list accounts. 

## Routes

| Method | Public gateway (8080) | Target account service (8081) |
| --- | --- | --- |
| GET | `/accounts` | `/internal/accounts` |
| POST | `/accounts` | `/internal/accounts` |
| GET | `/accounts/1` | `/internal/accounts/1` |

`gateway.js` contains the rewrite rule. It removes `/accounts` and prepends `/internal/accounts`. This is a rewrite rather than a pure strip, because the target needs its internal prefix. Query strings, methods, and request bodies are forwarded. The browser calls only the gateway.

`account-service.js` exposes the target routes on its own port. Both servers bind to the local machine. `start.js` starts both with a single command; they can also run separately with `node account-service.js` and `node gateway.js` in two terminals.

The target uses `/internal/accounts`, as specified in step 1. To use `/api/v1/internal/accounts` instead, change the target route strings in both service and gateway files.

## Try from PowerShell

```powershell
Invoke-RestMethod http://localhost:8080/accounts
Invoke-RestMethod http://localhost:8080/accounts -Method Post -ContentType 'application/json' -Body '{"name":"Charan","balance":1000}'
Invoke-RestMethod http://localhost:8080/accounts/1
```

Inspect the response headers `X-Gateway-Original-Path`, `X-Gateway-Rewritten-Path`, and `X-Service-Path` to verify forwarding. The terminal also logs each rewrite.

This is a local learning demo. Accounts are stored in memory. No database, authentication, or real banking transactions are included.

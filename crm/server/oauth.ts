import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import type { CrmData } from "../shared/schema.ts";
import { getAuthSecret } from "./config.ts";
import { authenticateUser, readData } from "./dataStore.ts";

const accessTokenTtlSeconds = 60 * 60;
const refreshTokenTtlSeconds = 60 * 60 * 24 * 30;
const authorizationCodeTtlSeconds = 60 * 5;
const clientTtlSeconds = 60 * 60 * 24 * 365;
const scopes = ["crm:read", "crm:write"];

type SignedKind = "authorization_code" | "access_token" | "refresh_token" | "oauth_client";

type SignedPayload = {
  kind: SignedKind;
  exp: number;
  iat: number;
  jti: string;
  userId?: string;
  clientId?: string;
  redirectUri?: string;
  scope?: string;
  codeChallenge?: string;
  redirectUris?: string[];
  clientName?: string;
};

type AuthorizationParams = {
  responseType: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
};

type OAuthClient = {
  clientId: string;
  clientName: string;
  redirectUris: string[];
};

export function oauthProtectedResourceMetadata(request: Request) {
  return {
    resource: mcpResourceUrl(request),
    authorization_servers: [baseUrl(request)],
    scopes_supported: scopes,
    bearer_methods_supported: ["header"],
    resource_name: "Oakbase CRM MCP",
  };
}

export function oauthAuthorizationServerMetadata(request: Request) {
  const base = baseUrl(request);
  return {
    issuer: base,
    authorization_endpoint: `${base}/api/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    registration_endpoint: `${base}/api/oauth/register`,
    scopes_supported: [...scopes, "offline_access"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    client_id_metadata_document_supported: true,
  };
}

export function mcpAuthenticationChallenge(request: Request, error = "invalid_token"): string {
  return `Bearer error="${error}", resource_metadata="${baseUrl(request)}/.well-known/oauth-protected-resource", scope="${scopes.join(" ")}"`;
}

export async function oauthUserFromAccessToken(token: string): Promise<CrmData["users"][number] | undefined> {
  const payload = verifySignedPayload(token, "access_token");
  if (!payload?.userId) return undefined;
  const user = (await readData()).users.find((item) => item.id === payload.userId);
  return user;
}

export async function handleOAuthRegister(request: Request, response: Response): Promise<void> {
  const body = (request.body ?? {}) as Record<string, unknown>;
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.map((item) => String(item)).filter(Boolean) : [];
  if (redirectUris.length === 0) {
    response.status(400).json({ error: "invalid_client_metadata", error_description: "redirect_uris is required." });
    return;
  }

  const clientName = String(body.client_name ?? "Claude MCP Client").slice(0, 120);
  const clientId = signPayload({
    kind: "oauth_client",
    clientName,
    redirectUris,
    exp: unixNow() + clientTtlSeconds,
    iat: unixNow(),
    jti: randomId(),
  });

  response.status(201).json({
    client_id: clientId,
    client_id_issued_at: unixNow(),
    client_name: clientName,
    redirect_uris: redirectUris,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
  });
}

export async function handleOAuthAuthorizeGet(request: Request, response: Response): Promise<void> {
  const params = authorizationParamsFromRequest(request);
  const validation = await validateAuthorizationParams(request, params);
  if (!validation.ok) {
    response.status(400).type("html").send(renderOAuthError(validation.error));
    return;
  }
  response.type("html").send(renderAuthorizeForm(params, validation.client));
}

export async function handleOAuthAuthorizePost(request: Request, response: Response): Promise<void> {
  const params = authorizationParamsFromBody(request.body as Record<string, unknown>);
  const validation = await validateAuthorizationParams(request, params);
  if (!validation.ok) {
    response.status(400).type("html").send(renderOAuthError(validation.error));
    return;
  }

  try {
    const auth = await authenticateUser(String((request.body as Record<string, unknown>).email ?? ""), String((request.body as Record<string, unknown>).password ?? ""));
    const code = signPayload({
      kind: "authorization_code",
      userId: auth.user.id,
      clientId: params.clientId,
      redirectUri: params.redirectUri,
      scope: normalizeScope(params.scope),
      codeChallenge: params.codeChallenge,
      exp: unixNow() + authorizationCodeTtlSeconds,
      iat: unixNow(),
      jti: randomId(),
    });
    const redirect = new URL(params.redirectUri);
    redirect.searchParams.set("code", code);
    if (params.state) redirect.searchParams.set("state", params.state);
    response.redirect(302, redirect.toString());
  } catch {
    response.status(401).type("html").send(renderAuthorizeForm(params, validation.client, "Email o contraseña incorrectos."));
  }
}

export async function handleOAuthToken(request: Request, response: Response): Promise<void> {
  const body = request.body as Record<string, unknown>;
  const grantType = String(body.grant_type ?? "");
  if (grantType === "authorization_code") {
    await exchangeAuthorizationCode(body, response);
    return;
  }
  if (grantType === "refresh_token") {
    await exchangeRefreshToken(body, response);
    return;
  }
  response.status(400).json({ error: "unsupported_grant_type" });
}

async function exchangeAuthorizationCode(body: Record<string, unknown>, response: Response): Promise<void> {
  const code = String(body.code ?? "");
  const clientId = String(body.client_id ?? "");
  const redirectUri = String(body.redirect_uri ?? "");
  const codeVerifier = String(body.code_verifier ?? "");
  const payload = verifySignedPayload(code, "authorization_code");

  if (!payload?.userId || payload.clientId !== clientId || payload.redirectUri !== redirectUri || !verifyPkce(codeVerifier, payload.codeChallenge)) {
    response.status(400).json({ error: "invalid_grant" });
    return;
  }

  const user = (await readData()).users.find((item) => item.id === payload.userId);
  if (!user) {
    response.status(400).json({ error: "invalid_grant" });
    return;
  }

  response.json(issueTokenResponse(payload.userId, clientId, normalizeScope(payload.scope)));
}

async function exchangeRefreshToken(body: Record<string, unknown>, response: Response): Promise<void> {
  const refreshToken = String(body.refresh_token ?? "");
  const payload = verifySignedPayload(refreshToken, "refresh_token");
  if (!payload?.userId || !payload.clientId) {
    response.status(400).json({ error: "invalid_grant" });
    return;
  }
  const user = (await readData()).users.find((item) => item.id === payload.userId);
  if (!user) {
    response.status(400).json({ error: "invalid_grant" });
    return;
  }
  response.json(issueTokenResponse(payload.userId, payload.clientId, normalizeScope(payload.scope)));
}

function issueTokenResponse(userId: string, clientId: string, scope: string) {
  return {
    access_token: signPayload({
      kind: "access_token",
      userId,
      clientId,
      scope,
      exp: unixNow() + accessTokenTtlSeconds,
      iat: unixNow(),
      jti: randomId(),
    }),
    token_type: "Bearer",
    expires_in: accessTokenTtlSeconds,
    refresh_token: signPayload({
      kind: "refresh_token",
      userId,
      clientId,
      scope,
      exp: unixNow() + refreshTokenTtlSeconds,
      iat: unixNow(),
      jti: randomId(),
    }),
    scope,
  };
}

function authorizationParamsFromRequest(request: Request): AuthorizationParams {
  return {
    responseType: String(request.query.response_type ?? ""),
    clientId: String(request.query.client_id ?? ""),
    redirectUri: String(request.query.redirect_uri ?? ""),
    scope: String(request.query.scope ?? scopes.join(" ")),
    state: String(request.query.state ?? ""),
    codeChallenge: String(request.query.code_challenge ?? ""),
    codeChallengeMethod: String(request.query.code_challenge_method ?? ""),
  };
}

function authorizationParamsFromBody(body: Record<string, unknown>): AuthorizationParams {
  return {
    responseType: String(body.response_type ?? ""),
    clientId: String(body.client_id ?? ""),
    redirectUri: String(body.redirect_uri ?? ""),
    scope: String(body.scope ?? scopes.join(" ")),
    state: String(body.state ?? ""),
    codeChallenge: String(body.code_challenge ?? ""),
    codeChallengeMethod: String(body.code_challenge_method ?? ""),
  };
}

async function validateAuthorizationParams(
  request: Request,
  params: AuthorizationParams,
): Promise<{ ok: true; client: OAuthClient } | { ok: false; error: string }> {
  if (params.responseType !== "code") return { ok: false, error: "response_type must be code." };
  if (!params.clientId) return { ok: false, error: "client_id is required." };
  if (!params.redirectUri) return { ok: false, error: "redirect_uri is required." };
  if (!params.codeChallenge || params.codeChallengeMethod !== "S256") return { ok: false, error: "PKCE S256 is required." };

  const client = await resolveOAuthClient(params.clientId, request);
  if (!client) return { ok: false, error: "client_id is not valid." };
  if (!client.redirectUris.some((allowed) => redirectUriAllowed(allowed, params.redirectUri))) {
    return { ok: false, error: "redirect_uri is not allowed for this client." };
  }
  return { ok: true, client };
}

async function resolveOAuthClient(clientId: string, request: Request): Promise<OAuthClient | undefined> {
  const registered = verifySignedPayload(clientId, "oauth_client");
  if (registered?.redirectUris?.length) {
    return {
      clientId,
      clientName: registered.clientName ?? "Registered MCP Client",
      redirectUris: registered.redirectUris,
    };
  }

  if (!clientId.startsWith("https://") && !clientId.startsWith("http://localhost") && !clientId.startsWith("http://127.0.0.1")) {
    return undefined;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const result = await fetch(clientId, { signal: controller.signal });
    if (!result.ok) return undefined;
    const metadata = (await result.json()) as Record<string, unknown>;
    const redirectUris = Array.isArray(metadata.redirect_uris) ? metadata.redirect_uris.map((item) => String(item)).filter(Boolean) : [];
    if (metadata.client_id !== clientId || redirectUris.length === 0) return undefined;
    return {
      clientId,
      clientName: String(metadata.client_name ?? new URL(clientId).host),
      redirectUris,
    };
  } catch {
    if (isLocalDevelopment(request)) {
      return {
        clientId,
        clientName: "Local MCP Client",
        redirectUris: ["http://localhost/callback", "http://127.0.0.1/callback"],
      };
    }
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

function redirectUriAllowed(allowed: string, actual: string): boolean {
  if (allowed === actual) return true;
  try {
    const allowedUrl = new URL(allowed);
    const actualUrl = new URL(actual);
    const loopbackHost = ["localhost", "127.0.0.1", "[::1]"];
    if (loopbackHost.includes(allowedUrl.hostname) && loopbackHost.includes(actualUrl.hostname)) {
      return allowedUrl.protocol === actualUrl.protocol && allowedUrl.pathname === actualUrl.pathname;
    }
  } catch {
    return false;
  }
  return false;
}

function verifyPkce(verifier: string, challenge?: string): boolean {
  if (!verifier || !challenge) return false;
  const actualChallenge = createHash("sha256").update(verifier).digest("base64url");
  return actualChallenge === challenge;
}

function signPayload(input: SignedPayload): string {
  const payload = Buffer.from(JSON.stringify(input)).toString("base64url");
  const signature = createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySignedPayload(token: string, kind: SignedKind): SignedPayload | undefined {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return undefined;
  const expected = createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SignedPayload;
    if (parsed.kind !== kind || parsed.exp < unixNow()) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function safeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function normalizeScope(value?: string): string {
  const requested = new Set(String(value ?? "").split(/\s+/).filter(Boolean));
  const granted = scopes.filter((scope) => requested.size === 0 || requested.has(scope));
  return granted.length ? granted.join(" ") : scopes.join(" ");
}

function renderAuthorizeForm(params: AuthorizationParams, client: OAuthClient, error = ""): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Conectar Oakbase CRM con Claude</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: "Helvetica Neue", Arial, sans-serif; background: #f3f0e8; color: #111512; }
      main { width: min(440px, calc(100vw - 32px)); overflow: hidden; border: 1px solid rgba(17,21,18,.22); border-top: 4px solid #bb694a; border-radius: 8px; background: #fbfaf6; box-shadow: 0 20px 54px rgba(10,23,18,.14); }
      header { padding: 24px 24px 16px; border-bottom: 1px solid #ded9ce; }
      h1 { margin: 0 0 8px; font-size: 24px; font-weight: 500; letter-spacing: -.025em; line-height: 1.1; }
      p { margin: 0; color: #696d67; font-size: 14px; line-height: 1.45; }
      form { display: grid; gap: 12px; padding: 20px 24px 24px; }
      label { display: grid; gap: 6px; color: #696d67; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
      input { min-height: 40px; border: 1px solid #c8c3b8; border-radius: 4px; padding: 7px 9px; color: #111512; background: #fff; font: inherit; }
      input:focus { outline: 2px solid #bb694a; outline-offset: 2px; }
      button { min-height: 42px; border: 1px solid #10251d; border-radius: 4px; color: #fbfaf6; background: #10251d; font-weight: 700; cursor: pointer; }
      button:hover { border-color: #bb694a; background: #bb694a; }
      .error { padding: 10px 12px; border-radius: 4px; color: #a53e28; background: #fbefec; font-size: 13px; font-weight: 700; }
      .scope { margin-top: 10px; font-size: 12px; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Conectar Oakbase CRM</h1>
        <p>Claude solicita acceso al MCP del CRM para <strong>${escapeHtml(client.clientName)}</strong>.</p>
        <p class="scope">Permisos: ${escapeHtml(normalizeScope(params.scope))}</p>
      </header>
      <form method="post" action="/api/oauth/authorize">
        ${hiddenFields(params)}
        ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
        <label>Email<input name="email" type="email" autocomplete="email" required /></label>
        <label>Contraseña<input name="password" type="password" autocomplete="current-password" required /></label>
        <button type="submit">Autorizar Claude</button>
      </form>
    </main>
  </body>
</html>`;
}

function renderOAuthError(error: string): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8" /><title>Error OAuth</title></head><body><h1>No se pudo iniciar OAuth</h1><p>${escapeHtml(error)}</p></body></html>`;
}

function hiddenFields(params: AuthorizationParams): string {
  const fields: Array<[string, string]> = [
    ["response_type", params.responseType],
    ["client_id", params.clientId],
    ["redirect_uri", params.redirectUri],
    ["scope", params.scope],
    ["state", params.state],
    ["code_challenge", params.codeChallenge],
    ["code_challenge_method", params.codeChallengeMethod],
  ];
  return fields.map(([name, value]) => `<input type="hidden" name="${name}" value="${escapeHtml(value)}" />`).join("");
}

function baseUrl(request: Request): string {
  const proto = request.header("x-forwarded-proto") ?? request.protocol ?? "http";
  const host = request.header("x-forwarded-host") ?? request.header("host") ?? "localhost:4000";
  return `${proto.split(",")[0]}://${host.split(",")[0]}`;
}

function mcpResourceUrl(request: Request): string {
  return `${baseUrl(request)}/api/mcp`;
}

function isLocalDevelopment(request: Request): boolean {
  const host = request.header("host") ?? "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function unixNow(): number {
  return Math.floor(Date.now() / 1000);
}

function randomId(): string {
  return randomBytes(16).toString("base64url");
}

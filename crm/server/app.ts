import { timingSafeEqual } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { fieldConfigs, objectKeys, objectLabels, pathObjects, picklists, type CrmData, type CrmRecord, type ObjectKey } from "../shared/schema.ts";
import { createCrmMcpServer } from "../mcp/tools.ts";
import {
  assertObjectKey,
  authenticateUser,
  convertLead,
  createRecord,
  deleteRecord,
  getRecord,
  getStoreInfo,
  importRecords,
  listRecords,
  readData,
  resetData,
  updatePathConfig,
  updateRecord,
  userFromToken,
} from "./dataStore.ts";

export function createCrmApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_request: Request, response: Response) => {
    response.json({ ok: true, storage: getStoreInfo() });
  });

  const handleDemoRequest = async (request: Request, response: Response) => {
    const demoRequest = parseDemoRequest(request.body ?? {});
    if (demoRequest.honeypot) {
      response.status(202).json({ ok: true });
      return;
    }

    const lead = await createRecord("leads", {
      firstName: demoRequest.firstName,
      lastName: demoRequest.lastName,
      company: demoRequest.company,
      email: demoRequest.email,
      phone: demoRequest.phone,
      status: "Open - Not Contacted",
      leadSource: "Web",
      rating: "Warm",
      isConverted: false,
      description: [
        "Demo request from agentialabs.ai",
        `Industry: ${demoRequest.industry}`,
        demoRequest.operation ? `First operation to explore: ${demoRequest.operation}` : undefined,
        demoRequest.pageUrl ? `Page: ${demoRequest.pageUrl}` : undefined,
        demoRequest.language ? `Language: ${demoRequest.language}` : undefined,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    response.status(201).json({ ok: true, leadId: lead.id });
  };

  app.post("/api/public", handleDemoRequest);
  app.post("/api/public/demo-request", handleDemoRequest);

  app.post("/api/auth/login", async (request: Request, response: Response) => {
    const { email, password } = request.body ?? {};
    const result = await authenticateUser(String(email ?? ""), String(password ?? ""));
    response.json({ token: result.token, user: sanitizeUser(result.user) });
  });

  app.all("/api/mcp", async (request: Request, response: Response) => {
    const authError = getMcpAuthError(request);
    if (authError) {
      response.status(authError.status).json({ error: authError.message });
      return;
    }

    const server = createCrmMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    response.on("close", () => {
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(request, response, request.body);
  });

  app.use(async (request: Request, response: Response, next: express.NextFunction) => {
    if (request.path === "/api/health" || request.path === "/api/auth/login") {
      next();
      return;
    }
    const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      response.status(401).json({ error: "Login requerido." });
      return;
    }
    try {
      response.locals.currentUser = await userFromToken(token);
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sesion no valida.";
      response.status(401).json({ error: message });
    }
  });

  app.get("/api/auth/me", (_request: Request, response: Response) => {
    response.json({ user: sanitizeUser(response.locals.currentUser as CrmData["users"][number]) });
  });

  app.get("/api/metadata", (_request: Request, response: Response) => {
    response.json({ objectKeys, objectLabels, fieldConfigs, picklists, pathObjects });
  });

  app.get("/api/state", async (_request: Request, response: Response) => {
    response.json(sanitizeData(await readData()));
  });

  app.post("/api/reset", async (_request: Request, response: Response) => {
    response.json(sanitizeData(await resetData()));
  });

  app.get("/api/:object", async (request: Request, response: Response) => {
    const object = assertObjectKey(routeParam(request.params.object));
    response.json(sanitizeRecords(object, await listRecords(object)));
  });

  app.post("/api/:object/import", async (request: Request, response: Response) => {
    const object = assertObjectKey(routeParam(request.params.object));
    const rows = Array.isArray(request.body?.rows) ? request.body.rows : [];
    response.status(201).json(sanitizeRecords(object, await importRecords(object, rows)));
  });

  app.post("/api/leads/:id/convert", async (request: Request, response: Response) => {
    const result = await convertLead(routeParam(request.params.id), request.body ?? {});
    response.status(201).json({
      ...result,
      lead: sanitizeRecord("leads", result.lead),
      account: sanitizeRecord("accounts", result.account),
      contact: sanitizeRecord("contacts", result.contact),
      opportunity: result.opportunity ? sanitizeRecord("opportunities", result.opportunity) : undefined,
    });
  });

  app.put("/api/setup/path/:object", async (request: Request, response: Response) => {
    const object = routeParam(request.params.object);
    if (!pathObjects.includes(object as (typeof pathObjects)[number])) {
      response.status(400).json({ error: `Path no soportado: ${object}` });
      return;
    }
    response.json(sanitizeData(await updatePathConfig(object as (typeof pathObjects)[number], request.body?.steps ?? [])));
  });

  app.get("/api/:object/:id", async (request: Request, response: Response) => {
    const object = assertObjectKey(routeParam(request.params.object));
    response.json(sanitizeRecord(object, await getRecord(object, routeParam(request.params.id))));
  });

  app.post("/api/:object", async (request: Request, response: Response) => {
    const object = assertObjectKey(routeParam(request.params.object));
    response.status(201).json(sanitizeRecord(object, await createRecord(object, request.body ?? {})));
  });

  app.put("/api/:object/:id", async (request: Request, response: Response) => {
    const object = assertObjectKey(routeParam(request.params.object));
    response.json(sanitizeRecord(object, await updateRecord(object, routeParam(request.params.id), request.body ?? {})));
  });

  app.delete("/api/:object/:id", async (request: Request, response: Response) => {
    const object = assertObjectKey(routeParam(request.params.object));
    response.json(await deleteRecord(object, routeParam(request.params.id)));
  });

  app.use((error: unknown, _request: Request, response: Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Error desconocido";
    response.status(400).json({ error: message });
  });

  return app;
}

function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : String(value ?? "");
}

function sanitizeUser(user: CrmData["users"][number]): Omit<CrmData["users"][number], "passwordHash" | "passwordSalt"> {
  const { passwordHash: _passwordHash, passwordSalt: _passwordSalt, ...safeUser } = user;
  return safeUser;
}

function sanitizeData(data: CrmData): CrmData {
  return {
    ...data,
    users: data.users.map((user) => sanitizeUser(user) as CrmData["users"][number]),
  };
}

function sanitizeRecord(object: ObjectKey, record: CrmRecord): CrmRecord {
  if (object !== "users") return record;
  return sanitizeUser(record as CrmData["users"][number]) as CrmRecord;
}

function sanitizeRecords(object: ObjectKey, records: CrmRecord[]): CrmRecord[] {
  return records.map((record) => sanitizeRecord(object, record));
}

function getMcpAuthError(request: Request): { status: number; message: string } | undefined {
  const expectedToken = process.env.CRM_MCP_TOKEN;
  if (!expectedToken) {
    if (process.env.NODE_ENV === "production") {
      return { status: 503, message: "CRM_MCP_TOKEN no esta configurado." };
    }
    return undefined;
  }
  const actualToken = request.header("authorization")?.replace(/^Bearer\s+/i, "") ?? request.header("x-agentia-mcp-token") ?? "";
  if (!safeTokenEqual(actualToken, expectedToken)) {
    return { status: 401, message: "Token MCP no valido." };
  }
  return undefined;
}

function safeTokenEqual(actualToken: string, expectedToken: string): boolean {
  const actual = Buffer.from(actualToken);
  const expected = Buffer.from(expectedToken);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function parseDemoRequest(body: Record<string, unknown>) {
  const honeypot = cleanText(body.websiteUrl, 200);
  const firstName = cleanText(body.firstName, 80);
  const lastName = cleanText(body.lastName, 120);
  const company = cleanText(body.company, 160);
  const email = cleanText(body.email, 180).toLowerCase();
  const phone = cleanText(body.phone, 60);
  const industry = cleanText(body.industry, 120);
  const operation = cleanText(body.operation, 1200);
  const pageUrl = cleanText(body.pageUrl, 500);
  const language = cleanText(body.language, 12);

  if (honeypot) return { honeypot: true };
  if (!firstName) throw new Error("Nombre requerido.");
  if (!lastName) throw new Error("Apellidos requeridos.");
  if (!company) throw new Error("Empresa requerida.");
  if (!isValidEmail(email)) throw new Error("Email no valido.");
  if (!phone) throw new Error("Telefono requerido.");
  if (!industry) throw new Error("Industria requerida.");

  return {
    honeypot: false,
    firstName,
    lastName,
    company,
    email,
    phone,
    industry,
    operation,
    pageUrl,
    language,
  };
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

import fs from "node:fs";
import path from "node:path";
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import {
  type CrmData,
  type CrmRecord,
  type LeadConversionOptions,
  type ObjectKey,
  type PathObjectKey,
  type RevenueType,
  createId,
  defaultPathConfigs,
  objectKeys,
  pathFieldByObject,
} from "../shared/schema.ts";
import { createSeedData } from "../shared/seed.ts";

export type LooseRecord = Record<string, unknown> & { id: string; createdAt?: string; updatedAt?: string };
type MutableData = CrmData & Record<string, unknown>;

export const defaultPassword = "Agentia2026!";
const dataFile = process.env.CRM_DATA_FILE ?? defaultDataFilePath();
const authSecret = process.env.CRM_AUTH_SECRET ?? "agentia-crm-local-development-secret";
const tokenTtlMs = 1000 * 60 * 60 * 12;
export const idPrefixes: Record<ObjectKey, string> = {
  leads: "lea",
  accounts: "acc",
  contacts: "con",
  opportunities: "opp",
  opportunityLineItems: "oli",
  proposals: "quo",
  proposalLineItems: "qli",
  invoices: "inv",
  invoiceLines: "inl",
  tasks: "tsk",
  cases: "cas",
  products: "prd",
  users: "usr",
};

export function getDataFilePath(): string {
  return dataFile;
}

function defaultDataFilePath(): string {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
  const baseDir = isServerless ? path.join(process.env.TMPDIR ?? "/tmp", "agentia-crm") : path.join(process.cwd(), "data");
  return path.join(baseDir, "agentia-crm.json");
}

export function ensureDataFile(): void {
  if (fs.existsSync(dataFile)) return;
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  writeData(recalculateAll(createSeedData()));
}

export function readData(): CrmData {
  ensureDataFile();
  const raw = fs.readFileSync(dataFile, "utf8");
  const parsed = JSON.parse(raw) as CrmData;
  parsed.tasks = parsed.tasks ?? [];
  parsed.pathConfigs = {
    ...defaultPathConfigs,
    ...(parsed.pathConfigs ?? {}),
  };
  return ensureAuthDefaults(recalculateAll(parsed));
}

export function writeData(data: CrmData): void {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, `${JSON.stringify(data, null, 2)}\n`);
}

export function resetData(): CrmData {
  const data = ensureAuthDefaults(recalculateAll(createSeedData()));
  writeData(data);
  return data;
}

export function authenticateUser(email: string, password: string): { token: string; user: CrmData["users"][number] } {
  const data = readData();
  const user = data.users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new Error("Email o contraseña incorrectos.");
  }
  return { token: createAuthToken(user.id), user };
}

export function userFromToken(token: string): CrmData["users"][number] {
  const payload = verifyAuthToken(token);
  const user = readData().users.find((item) => item.id === payload.userId);
  if (!user) throw new Error("Sesion no valida.");
  return user;
}

export function assertObjectKey(value: string): ObjectKey {
  if (!objectKeys.includes(value as ObjectKey)) {
    throw new Error(`Objeto no soportado: ${value}`);
  }
  return value as ObjectKey;
}

export function listRecords(object: ObjectKey): CrmRecord[] {
  const data = readData();
  return getCollection(data, object) as unknown as CrmRecord[];
}

export function getRecord(object: ObjectKey, id: string): CrmRecord {
  const record = (listRecords(object) as unknown as LooseRecord[]).find((item) => item.id === id);
  if (!record) throw new Error(`No existe ${object}/${id}`);
  return record as unknown as CrmRecord;
}

export function createRecord(object: ObjectKey, input: Record<string, unknown>): CrmRecord {
  const data = readData();
  const collection = getCollection(data, object);
  const now = new Date().toISOString();
  const record = normalizeRecord(data, object, {
    ...input,
    id: typeof input.id === "string" && input.id ? input.id : createId(idPrefixes[object]),
    createdAt: now,
    updatedAt: now,
  });
  collection.unshift(record);
  const next = recalculateAll(data);
  writeData(next);
  return record as unknown as CrmRecord;
}

export function updateRecord(object: ObjectKey, id: string, input: Record<string, unknown>): CrmRecord {
  const data = readData();
  const collection = getCollection(data, object);
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) throw new Error(`No existe ${object}/${id}`);
  const current = collection[index];
  const record = normalizeRecord(data, object, {
    ...current,
    ...input,
    id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  });
  collection[index] = record;
  const next = recalculateAll(data);
  writeData(next);
  return record as unknown as CrmRecord;
}

export function deleteRecord(object: ObjectKey, id: string): { id: string; deleted: boolean } {
  const data = readData();
  const collection = getCollection(data, object);
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) throw new Error(`No existe ${object}/${id}`);
  collection.splice(index, 1);
  cascadeDelete(data, object, id);
  const next = recalculateAll(data);
  writeData(next);
  return { id, deleted: true };
}

export function importRecords(object: ObjectKey, rows: Record<string, unknown>[]): CrmRecord[] {
  const data = readData();
  const collection = getCollection(data, object);
  const now = new Date().toISOString();
  const created = rows
    .filter((row) => Object.values(row).some((value) => value !== undefined && value !== null && String(value).trim() !== ""))
    .map((row) =>
      normalizeRecord(data, object, {
        ...row,
        id: typeof row.id === "string" && row.id ? row.id : createId(idPrefixes[object]),
        createdAt: now,
        updatedAt: now,
      }),
    );
  collection.unshift(...created);
  const next = recalculateAll(data);
  writeData(next);
  return created as unknown as CrmRecord[];
}

export function updatePathConfig(object: PathObjectKey, steps: { value: string; label?: string; probability?: number }[]): CrmData {
  const data = readData();
  const cleanSteps = steps
    .map((step) => ({
      value: String(step.value ?? "").trim(),
      label: String(step.label ?? step.value ?? "").trim(),
      probability: typeof step.probability === "number" ? step.probability : undefined,
    }))
    .filter((step) => step.value);
  if (cleanSteps.length < 2) throw new Error("Un path necesita al menos dos pasos.");
  data.pathConfigs[object] = cleanSteps;
  const field = pathFieldByObject[object];
  const allowed = new Set(cleanSteps.map((step) => step.value));
  const collection = getCollection(data, object);
  for (const record of collection) {
    if (!allowed.has(String(record[field] ?? ""))) {
      record[field] = cleanSteps[0].value;
      record.updatedAt = new Date().toISOString();
    }
  }
  const next = recalculateAll(data);
  writeData(next);
  return next;
}

export function convertLead(
  leadId: string,
  options: LeadConversionOptions = {},
): { lead: CrmRecord; account: CrmRecord; contact: CrmRecord; opportunity?: CrmRecord } {
  const data = readData();
  const lead = data.leads.find((item) => item.id === leadId);
  if (!lead) throw new Error(`No existe leads/${leadId}`);
  if (lead.isConverted) throw new Error("Este lead ya esta convertido.");

  const now = new Date().toISOString();
  const accountName = stringOr(options.accountName, lead.company);
  let account = data.accounts.find((item) => item.name.toLowerCase() === accountName.toLowerCase());
  if (!account) {
    account = normalizeRecord(data, "accounts", {
      id: createId("acc"),
      name: accountName,
      type: "Prospect",
      industry: "Other",
      rating: lead.rating,
      website: lead.website,
      phone: lead.phone,
      ownerId: lead.ownerId,
      createdAt: now,
      updatedAt: now,
    }) as unknown as CrmData["accounts"][number];
    data.accounts.unshift(account);
  }

  const contact = normalizeRecord(data, "contacts", {
    id: createId("con"),
    firstName: stringOr(options.contactFirstName, lead.firstName ?? ""),
    lastName: stringOr(options.contactLastName, lead.lastName),
    accountId: account.id,
    email: lead.email,
    phone: lead.phone,
    leadSource: lead.leadSource,
    ownerId: lead.ownerId,
    createdAt: now,
    updatedAt: now,
  }) as unknown as CrmData["contacts"][number];
  data.contacts.unshift(contact);

  let opportunity: CrmData["opportunities"][number] | undefined;
  if (options.createOpportunity !== false) {
    const defaultCloseDate = addDays(new Date(), 30);
    opportunity = normalizeRecord(data, "opportunities", {
      id: createId("opp"),
      name: stringOr(options.opportunityName, `${account.name} - New Business`),
      accountId: account.id,
      contactId: contact.id,
      stageName: data.pathConfigs.opportunities[0]?.value ?? "Prospecting",
      closeDate: stringOr(options.closeDate, defaultCloseDate),
      oneOffAmount: toNumber(options.oneOffAmount, 0),
      mrrAmount: toNumber(options.mrrAmount, 0),
      amount: 0,
      amountMode: "manual",
      probability: data.pathConfigs.opportunities[0]?.probability ?? 10,
      type: "New Business",
      leadSource: lead.leadSource,
      currencyIsoCode: "EUR",
      ownerId: lead.ownerId,
      createdAt: now,
      updatedAt: now,
    }) as unknown as CrmData["opportunities"][number];
    data.opportunities.unshift(opportunity);
  }

  lead.status = "Closed - Converted";
  lead.isConverted = true;
  lead.convertedDate = now;
  lead.convertedAccountId = account.id;
  lead.convertedContactId = contact.id;
  lead.convertedOpportunityId = opportunity?.id;
  lead.updatedAt = now;

  const next = recalculateAll(data);
  writeData(next);
  return { lead, account, contact, opportunity };
}

export function recalculateAll(data: CrmData): CrmData {
  for (const product of data.products) {
    product.revenueType = normalizeRevenueType(product.revenueType, product.family);
  }

  for (const line of data.opportunityLineItems) {
    line.revenueType = normalizeRevenueType(line.revenueType, data.products.find((product) => product.id === line.productId)?.family);
    line.quantity = toNumber(line.quantity, 1);
    line.unitPrice = toNumber(line.unitPrice, 0);
    line.discountPercent = toNumber(line.discountPercent, 0);
    line.totalPrice = lineTotal(line.quantity, line.unitPrice, line.discountPercent);
  }

  for (const line of data.proposalLineItems) {
    line.revenueType = normalizeRevenueType(line.revenueType, data.products.find((product) => product.id === line.productId)?.family);
    line.quantity = toNumber(line.quantity, 1);
    line.unitPrice = toNumber(line.unitPrice, 0);
    line.discountPercent = toNumber(line.discountPercent, 0);
    line.totalPrice = lineTotal(line.quantity, line.unitPrice, line.discountPercent);
  }

  for (const line of data.invoiceLines) {
    line.quantity = toNumber(line.quantity, 1);
    line.unitPrice = toNumber(line.unitPrice, 0);
    line.totalAmount = lineTotal(line.quantity, line.unitPrice, 0);
  }

  for (const proposal of data.proposals) {
    proposal.totalPrice = sum(data.proposalLineItems.filter((line) => line.proposalId === proposal.id).map((line) => line.totalPrice));
  }

  for (const invoice of data.invoices) {
    invoice.totalAmount = sum(data.invoiceLines.filter((line) => line.invoiceId === invoice.id).map((line) => line.totalAmount));
  }

  for (const opportunity of data.opportunities) {
    const step = data.pathConfigs.opportunities.find((item) => item.value === opportunity.stageName);
    if (step?.probability !== undefined) opportunity.probability = step.probability;
    opportunity.oneOffAmount = toNumber(opportunity.oneOffAmount, toNumber(opportunity.amount, 0));
    opportunity.mrrAmount = toNumber(opportunity.mrrAmount, 0);
    if (opportunity.amountMode === "syncProducts") {
      const split = splitLineRevenue(data.opportunityLineItems.filter((line) => line.opportunityId === opportunity.id));
      opportunity.oneOffAmount = split.oneOffAmount;
      opportunity.mrrAmount = split.mrrAmount;
    }
    if (opportunity.amountMode === "syncPrimaryProposal") {
      const proposal =
        data.proposals.find((item) => item.id === opportunity.syncedProposalId) ??
        data.proposals.find((item) => item.opportunityId === opportunity.id && item.isSyncing) ??
        data.proposals.find((item) => item.opportunityId === opportunity.id);
      opportunity.syncedProposalId = proposal?.id;
      const split = proposal ? splitLineRevenue(data.proposalLineItems.filter((line) => line.proposalId === proposal.id)) : { oneOffAmount: 0, mrrAmount: 0 };
      opportunity.oneOffAmount = split.oneOffAmount;
      opportunity.mrrAmount = split.mrrAmount;
    }
    opportunity.amount = annualizedAmount(opportunity.oneOffAmount, opportunity.mrrAmount);
  }

  for (const caseRecord of data.cases) {
    const isClosed = data.pathConfigs.cases.find((step) => step.value === caseRecord.status)?.isClosed ?? caseRecord.status === "Closed";
    if (isClosed && !caseRecord.closedDate) caseRecord.closedDate = new Date().toISOString();
    if (!isClosed) caseRecord.closedDate = undefined;
    caseRecord.isEscalated = caseRecord.status === "Escalated" || Boolean(caseRecord.isEscalated);
  }

  return data;
}

export function getCollection(data: CrmData, object: ObjectKey): LooseRecord[] {
  return (data as MutableData)[object] as unknown as LooseRecord[];
}

export function normalizeRecord(data: CrmData, object: ObjectKey, input: Record<string, unknown>): LooseRecord {
  const record = { ...input } as LooseRecord;
  record.id = String(record.id || createId(idPrefixes[object]));
  record.createdAt = String(record.createdAt || new Date().toISOString());
  record.updatedAt = String(record.updatedAt || new Date().toISOString());
  if (!record.ownerId && data.users[0]) record.ownerId = data.users[0].id;

  normalizeRelations(data, object, record);

  if (object === "leads") {
    record.status = stringOr(record.status, data.pathConfigs.leads[0]?.value ?? "Open - Not Contacted");
    record.leadSource = stringOr(record.leadSource, "Web");
    record.rating = stringOr(record.rating, "Warm");
    record.isConverted = toBoolean(record.isConverted);
  }
  if (object === "accounts") {
    record.type = stringOr(record.type, "Prospect");
    record.industry = stringOr(record.industry, "Other");
    record.rating = stringOr(record.rating, "Warm");
  }
  if (object === "contacts") {
    record.lastName = stringOr(record.lastName, "Sin apellido");
  }
  if (object === "opportunities") {
    record.stageName = stringOr(record.stageName, data.pathConfigs.opportunities[0]?.value ?? "Prospecting");
    record.closeDate = stringOr(record.closeDate, addDays(new Date(), 30));
    record.oneOffAmount = toNumber(record.oneOffAmount, toNumber(record.amount, 0));
    record.mrrAmount = toNumber(record.mrrAmount, 0);
    record.amount = annualizedAmount(record.oneOffAmount as number, record.mrrAmount as number);
    record.amountMode = stringOr(record.amountMode, "manual");
    record.probability = toNumber(record.probability, data.pathConfigs.opportunities[0]?.probability ?? 10);
    record.type = stringOr(record.type, "New Business");
    record.currencyIsoCode = "EUR";
  }
  if (object === "opportunityLineItems" || object === "proposalLineItems") {
    record.revenueType = normalizeRevenueType(record.revenueType, data.products.find((product) => product.id === record.productId)?.family);
    record.quantity = toNumber(record.quantity, 1);
    record.unitPrice = toNumber(record.unitPrice, 0);
    record.discountPercent = toNumber(record.discountPercent, 0);
    record.totalPrice = lineTotal(record.quantity as number, record.unitPrice as number, record.discountPercent as number);
  }
  if (object === "products") {
    record.family = stringOr(record.family, "Agentic Ops");
    record.revenueType = normalizeRevenueType(record.revenueType, record.family);
    record.isActive = record.isActive === undefined ? true : toBoolean(record.isActive);
    record.listPrice = toNumber(record.listPrice, 0);
    record.currencyIsoCode = "EUR";
  }
  if (object === "proposals") {
    record.proposalNumber = stringOr(record.proposalNumber, nextNumber(data.proposals as unknown as Record<string, unknown>[], "proposalNumber", "Q"));
    record.status = stringOr(record.status, "Draft");
    record.totalPrice = toNumber(record.totalPrice, 0);
    record.currencyIsoCode = "EUR";
    record.isSyncing = toBoolean(record.isSyncing);
  }
  if (object === "invoices") {
    record.invoiceNumber = stringOr(record.invoiceNumber, nextNumber(data.invoices as unknown as Record<string, unknown>[], "invoiceNumber", "INV"));
    record.status = stringOr(record.status, "Draft");
    record.settlementStatus = stringOr(record.settlementStatus, "Not Settled");
    record.invoiceDate = stringOr(record.invoiceDate, new Date().toISOString().slice(0, 10));
    record.totalAmount = toNumber(record.totalAmount, 0);
    record.currencyIsoCode = "EUR";
  }
  if (object === "invoiceLines") {
    record.description = stringOr(record.description, "Servicio");
    record.quantity = toNumber(record.quantity, 1);
    record.unitPrice = toNumber(record.unitPrice, 0);
    record.totalAmount = lineTotal(record.quantity as number, record.unitPrice as number, 0);
  }
  if (object === "tasks") {
    record.subject = stringOr(record.subject, "Nueva tarea");
    record.status = stringOr(record.status, "Not Started");
  }
  if (object === "cases") {
    record.caseNumber = stringOr(record.caseNumber, nextCaseNumber(data.cases));
    record.status = stringOr(record.status, data.pathConfigs.cases[0]?.value ?? "New");
    record.priority = stringOr(record.priority, "Medium");
    record.origin = stringOr(record.origin, "Email");
    record.type = stringOr(record.type, "Question");
    record.isEscalated = toBoolean(record.isEscalated) || record.status === "Escalated";
  }
  if (object === "users") {
    record.role = stringOr(record.role, "Ventas");
    record.isAdmin = toBoolean(record.isAdmin) || record.role === "Admin";
    const temporaryPassword = typeof record.temporaryPassword === "string" ? record.temporaryPassword.trim() : "";
    if (temporaryPassword) {
      const password = hashPassword(temporaryPassword);
      record.passwordSalt = password.salt;
      record.passwordHash = password.hash;
      record.passwordUpdatedAt = new Date().toISOString();
    }
    delete record.temporaryPassword;
  }

  return record;
}

function normalizeRelations(data: CrmData, object: ObjectKey, record: LooseRecord): void {
  const accountFields = ["accountId", "parentAccountId"];
  for (const field of accountFields) {
    if (typeof record[field] === "string" && record[field] && !record[field].startsWith("acc_")) {
      record[field] = findByName(data.accounts, record[field] as string)?.id ?? record[field];
    }
  }
  if (typeof record.contactId === "string" && record.contactId && !record.contactId.startsWith("con_")) {
    record.contactId = findContact(data, record.contactId)?.id ?? record.contactId;
  }
  if (typeof record.productId === "string" && record.productId && !record.productId.startsWith("prd_")) {
    record.productId = findByName(data.products, record.productId)?.id ?? record.productId;
  }
  if (typeof record.opportunityId === "string" && record.opportunityId && !record.opportunityId.startsWith("opp_")) {
    record.opportunityId = findByName(data.opportunities, record.opportunityId)?.id ?? record.opportunityId;
  }
  if (typeof record.proposalId === "string" && record.proposalId && !record.proposalId.startsWith("quo_")) {
    record.proposalId = findByName(data.proposals, record.proposalId)?.id ?? record.proposalId;
  }
  if (typeof record.invoiceId === "string" && record.invoiceId && !record.invoiceId.startsWith("inv_")) {
    record.invoiceId = findInvoice(data, record.invoiceId)?.id ?? record.invoiceId;
  }
  if (object !== "users" && typeof record.ownerId === "string" && record.ownerId && !record.ownerId.startsWith("usr_")) {
    record.ownerId = findByName(data.users, record.ownerId)?.id ?? record.ownerId;
  }
}

export function cascadeDelete(data: CrmData, object: ObjectKey, id: string): void {
  if (object === "opportunities") {
    data.opportunityLineItems = data.opportunityLineItems.filter((line) => line.opportunityId !== id);
    data.proposals = data.proposals.filter((proposal) => proposal.opportunityId !== id);
    data.invoices = data.invoices.filter((invoice) => invoice.opportunityId !== id);
  }
  if (object === "proposals") {
    data.proposalLineItems = data.proposalLineItems.filter((line) => line.proposalId !== id);
    for (const opportunity of data.opportunities) {
      if (opportunity.syncedProposalId === id) opportunity.syncedProposalId = undefined;
    }
  }
  if (object === "invoices") {
    data.invoiceLines = data.invoiceLines.filter((line) => line.invoiceId !== id);
  }
  if (object === "accounts") {
    for (const contact of data.contacts) if (contact.accountId === id) contact.accountId = undefined;
    for (const opportunity of data.opportunities) if (opportunity.accountId === id) opportunity.accountId = undefined;
    for (const caseRecord of data.cases) if (caseRecord.accountId === id) caseRecord.accountId = undefined;
  }
}

function findByName<T extends { id: string; name?: string; subject?: string }>(items: T[], value: string): T | undefined {
  const target = value.trim().toLowerCase();
  return items.find((item) => (item.name ?? item.subject ?? item.id).toLowerCase() === target);
}

function findContact(data: CrmData, value: string): CrmData["contacts"][number] | undefined {
  const target = value.trim().toLowerCase();
  return data.contacts.find((contact) => `${contact.firstName ?? ""} ${contact.lastName}`.trim().toLowerCase() === target || contact.email?.toLowerCase() === target);
}

function findInvoice(data: CrmData, value: string): CrmData["invoices"][number] | undefined {
  const target = value.trim().toLowerCase();
  return data.invoices.find((invoice) => invoice.invoiceNumber.toLowerCase() === target || invoice.id === value);
}

function normalizeRevenueType(value: unknown, family?: unknown): RevenueType {
  if (value === "mrr" || value === "oneOff") return value;
  const familyText = String(family ?? "").toLowerCase();
  if (familyText.includes("workspace") || familyText.includes("support")) return "mrr";
  return "oneOff";
}

function splitLineRevenue(lines: { revenueType?: RevenueType; totalPrice: number }[]): { oneOffAmount: number; mrrAmount: number } {
  return {
    oneOffAmount: sum(lines.filter((line) => line.revenueType !== "mrr").map((line) => line.totalPrice)),
    mrrAmount: sum(lines.filter((line) => line.revenueType === "mrr").map((line) => line.totalPrice)),
  };
}

function annualizedAmount(oneOffAmount: number, mrrAmount: number): number {
  return roundCurrency(toNumber(oneOffAmount, 0) + toNumber(mrrAmount, 0) * 12);
}

function lineTotal(quantity: number, unitPrice: number, discountPercent: number): number {
  return roundCurrency(quantity * unitPrice * (1 - discountPercent / 100));
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sum(values: number[]): number {
  return roundCurrency(values.reduce((total, value) => total + toNumber(value, 0), 0));
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return ["true", "1", "yes", "si", "sí", "y"].includes(value.trim().toLowerCase());
  return false;
}

function stringOr(value: unknown, fallback: string): string {
  if (value === undefined || value === null) return fallback;
  const stringValue = String(value).trim();
  return stringValue || fallback;
}

function nextNumber(records: Record<string, unknown>[], field: string, prefix: string): string {
  const max = records.reduce((currentMax, record) => {
    const value = String(record[field] ?? "");
    const numeric = Number(value.replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(currentMax, numeric) : currentMax;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(5, "0")}`;
}

function nextCaseNumber(records: { caseNumber: string }[]): string {
  const max = records.reduce((currentMax, record) => {
    const numeric = Number(record.caseNumber.replace(/\D/g, ""));
    return Number.isFinite(numeric) ? Math.max(currentMax, numeric) : currentMax;
  }, 1000);
  return String(max + 1).padStart(8, "0");
}

function addDays(date: Date, days: number): string {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy.toISOString().slice(0, 10);
}

function ensureAuthDefaults(data: CrmData): CrmData {
  let changed = false;
  for (const user of data.users) {
    if (!user.passwordHash || !user.passwordSalt) {
      const password = hashPassword(defaultPassword);
      user.passwordSalt = password.salt;
      user.passwordHash = password.hash;
      user.passwordUpdatedAt = user.passwordUpdatedAt ?? new Date().toISOString();
      changed = true;
    }
  }
  if (changed) writeData(data);
  return data;
}

export function hashPassword(password: string, salt = randomBytes(16).toString("base64url")): { salt: string; hash: string } {
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("base64url");
  return { salt, hash };
}

export function verifyPassword(password: string, salt?: string, expectedHash?: string): boolean {
  if (!salt || !expectedHash) return false;
  const actual = Buffer.from(hashPassword(password, salt).hash);
  const expected = Buffer.from(expectedHash);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function createAuthToken(userId: string): string {
  const expiresAt = Date.now() + tokenTtlMs;
  const payload = `${userId}.${expiresAt}`;
  const signature = createHmac("sha256", authSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAuthToken(token: string): { userId: string } {
  const [userId, expiresAtRaw, signature] = token.split(".");
  if (!userId || !expiresAtRaw || !signature) throw new Error("Sesion no valida.");
  const payload = `${userId}.${expiresAtRaw}`;
  const expected = createHmac("sha256", authSecret).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("Sesion no valida.");
  }
  if (Number(expiresAtRaw) < Date.now()) throw new Error("Sesion expirada.");
  return { userId };
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  type CrmData,
  type CrmRecord,
  type LeadConversionOptions,
  type ObjectKey,
  type PathObjectKey,
  type PathStep,
  createId,
  defaultPathConfigs,
  pathFieldByObject,
} from "../shared/schema.ts";
import { createSeedData } from "../shared/seed.ts";
import {
  cascadeDelete,
  createAuthToken,
  defaultPassword,
  getCollection,
  hashPassword,
  idPrefixes,
  normalizeRecord,
  recalculateAll,
  verifyAuthToken,
  verifyPassword,
} from "./store.ts";

type DbRow = Record<string, unknown> & { id?: string };

const tableByObject: Record<ObjectKey, string> = {
  users: "crm_users",
  accounts: "crm_accounts",
  contacts: "crm_contacts",
  leads: "crm_leads",
  opportunities: "crm_opportunities",
  opportunityLineItems: "crm_opportunity_line_items",
  proposals: "crm_proposals",
  proposalLineItems: "crm_proposal_line_items",
  invoices: "crm_invoices",
  invoiceLines: "crm_invoice_lines",
  projects: "crm_projects",
  projectMembers: "crm_project_members",
  projectMilestones: "crm_project_milestones",
  tasks: "crm_tasks",
  taskDependencies: "crm_task_dependencies",
  cases: "crm_cases",
  products: "crm_products",
};

const columnsByObject: Record<ObjectKey, string[]> = {
  users: ["id", "authUserId", "name", "email", "role", "isAdmin", "passwordHash", "passwordSalt", "passwordUpdatedAt", "ownerId", "createdAt", "updatedAt"],
  accounts: ["id", "name", "parentAccountId", "type", "industry", "rating", "phone", "website", "billingCity", "billingCountry", "description", "ownerId", "createdAt", "updatedAt"],
  contacts: ["id", "firstName", "lastName", "accountId", "title", "email", "phone", "leadSource", "description", "ownerId", "createdAt", "updatedAt"],
  leads: [
    "id",
    "firstName",
    "lastName",
    "company",
    "status",
    "leadSource",
    "rating",
    "email",
    "phone",
    "website",
    "isConverted",
    "convertedDate",
    "convertedAccountId",
    "convertedContactId",
    "convertedOpportunityId",
    "description",
    "ownerId",
    "createdAt",
    "updatedAt",
  ],
  opportunities: [
    "id",
    "name",
    "accountId",
    "contactId",
    "stageName",
    "closeDate",
    "oneOffAmount",
    "mrrAmount",
    "amount",
    "amountMode",
    "syncedProposalId",
    "probability",
    "type",
    "leadSource",
    "currencyIsoCode",
    "description",
    "ownerId",
    "createdAt",
    "updatedAt",
  ],
  opportunityLineItems: ["id", "opportunityId", "productId", "revenueType", "quantity", "unitPrice", "discountPercent", "totalPrice", "serviceDate", "ownerId", "createdAt", "updatedAt"],
  proposals: ["id", "name", "proposalNumber", "opportunityId", "accountId", "contactId", "status", "expirationDate", "totalPrice", "currencyIsoCode", "isSyncing", "description", "ownerId", "createdAt", "updatedAt"],
  proposalLineItems: ["id", "proposalId", "productId", "revenueType", "quantity", "unitPrice", "discountPercent", "totalPrice", "serviceDate", "ownerId", "createdAt", "updatedAt"],
  invoices: ["id", "invoiceNumber", "accountId", "opportunityId", "proposalId", "status", "settlementStatus", "invoiceDate", "dueDate", "totalAmount", "currencyIsoCode", "description", "ownerId", "createdAt", "updatedAt"],
  invoiceLines: ["id", "invoiceId", "productId", "description", "quantity", "unitPrice", "totalAmount", "ownerId", "createdAt", "updatedAt"],
  projects: ["id", "name", "accountId", "opportunityId", "primaryContactId", "status", "health", "startDate", "targetGoLiveDate", "actualGoLiveDate", "deploymentType", "description", "ownerId", "createdAt", "updatedAt"],
  projectMembers: ["id", "projectId", "userId", "role", "allocationPercent", "isActive", "ownerId", "createdAt", "updatedAt"],
  projectMilestones: ["id", "projectId", "name", "status", "startDate", "dueDate", "completedDate", "sortOrder", "description", "ownerId", "createdAt", "updatedAt"],
  tasks: ["id", "subject", "accountId", "contactId", "opportunityId", "projectId", "milestoneId", "status", "priority", "dueDate", "completedDate", "blockedReason", "description", "ownerId", "secondaryOwnerId", "createdAt", "updatedAt"],
  taskDependencies: ["id", "projectId", "predecessorTaskId", "successorTaskId", "relationship", "description", "ownerId", "createdAt", "updatedAt"],
  cases: ["id", "caseNumber", "subject", "accountId", "contactId", "status", "priority", "origin", "type", "isEscalated", "closedDate", "description", "ownerId", "createdAt", "updatedAt"],
  products: ["id", "name", "productCode", "family", "revenueType", "isActive", "listPrice", "currencyIsoCode", "description", "ownerId", "createdAt", "updatedAt"],
};

const upsertOrder: ObjectKey[] = [
  "users",
  "accounts",
  "contacts",
  "products",
  "opportunities",
  "leads",
  "opportunityLineItems",
  "proposals",
  "proposalLineItems",
  "invoices",
  "invoiceLines",
  "projects",
  "projectMembers",
  "projectMilestones",
  "tasks",
  "taskDependencies",
  "cases",
];
const preOpportunityUpsertOrder: ObjectKey[] = upsertOrder.filter((object) => object !== "opportunities");
const deleteOrder: ObjectKey[] = [
  "taskDependencies",
  "tasks",
  "projectMembers",
  "projectMilestones",
  "projects",
  "invoiceLines",
  "proposalLineItems",
  "opportunityLineItems",
  "cases",
  "invoices",
  "proposals",
  "leads",
  "opportunities",
  "contacts",
  "products",
  "accounts",
  "users",
];

let cachedClient: SupabaseClient | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

export function getSupabaseProjectUrl(): string | undefined {
  return process.env.SUPABASE_URL;
}

export async function readData(): Promise<CrmData> {
  const [
    users,
    accounts,
    contacts,
    leads,
    opportunities,
    opportunityLineItems,
    proposals,
    proposalLineItems,
    invoices,
    invoiceLines,
    projects,
    projectMembers,
    projectMilestones,
    tasks,
    taskDependencies,
    cases,
    products,
    pathRows,
  ] = await Promise.all([
    selectObject("users"),
    selectObject("accounts"),
    selectObject("contacts"),
    selectObject("leads"),
    selectObject("opportunities"),
    selectObject("opportunityLineItems"),
    selectObject("proposals"),
    selectObject("proposalLineItems"),
    selectObject("invoices"),
    selectObject("invoiceLines"),
    selectObject("projects"),
    selectObject("projectMembers"),
    selectObject("projectMilestones"),
    selectObject("tasks"),
    selectObject("taskDependencies"),
    selectObject("cases"),
    selectObject("products"),
    selectPathRows(),
  ]);

  return recalculateAll({
    version: 1,
    users: users as CrmData["users"],
    accounts: accounts as CrmData["accounts"],
    contacts: contacts as CrmData["contacts"],
    leads: leads as CrmData["leads"],
    opportunities: opportunities as CrmData["opportunities"],
    opportunityLineItems: opportunityLineItems as CrmData["opportunityLineItems"],
    products: products as CrmData["products"],
    proposals: proposals as CrmData["proposals"],
    proposalLineItems: proposalLineItems as CrmData["proposalLineItems"],
    invoices: invoices as CrmData["invoices"],
    invoiceLines: invoiceLines as CrmData["invoiceLines"],
    projects: projects as CrmData["projects"],
    projectMembers: projectMembers as CrmData["projectMembers"],
    projectMilestones: projectMilestones as CrmData["projectMilestones"],
    tasks: tasks as CrmData["tasks"],
    taskDependencies: taskDependencies as CrmData["taskDependencies"],
    cases: cases as CrmData["cases"],
    pathConfigs: pathConfigsFromRows(pathRows),
  });
}

export async function replaceData(data: CrmData): Promise<CrmData> {
  const next = ensureUserPasswords(recalculateAll(data));
  for (const object of upsertOrder) {
    await upsertObject(object, getCollection(next, object), object === "opportunities");
  }
  await replacePathConfigs(next.pathConfigs);
  await upsertObject("opportunities", next.opportunities as unknown as Record<string, unknown>[]);
  for (const object of deleteOrder) {
    await deleteMissing(object, new Set(getCollection(next, object).map((record) => record.id)));
  }
  return next;
}

export async function resetData(): Promise<CrmData> {
  return replaceData(createSeedData());
}

export async function authenticateUser(email: string, password: string): Promise<{ token: string; user: CrmData["users"][number] }> {
  const users = (await selectObject("users")) as unknown as CrmData["users"];
  const user = users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new Error("Email o contraseña incorrectos.");
  }
  return { token: createAuthToken(user.id), user };
}

export async function userFromToken(token: string): Promise<CrmData["users"][number]> {
  const payload = verifyAuthToken(token);
  const user = await selectUserById(payload.userId);
  if (!user) throw new Error("Sesion no valida.");
  return user;
}

export async function listRecords(object: ObjectKey): Promise<CrmRecord[]> {
  return getCollection(await readData(), object) as unknown as CrmRecord[];
}

export async function getRecord(object: ObjectKey, id: string): Promise<CrmRecord> {
  const record = (await listRecords(object)).find((item) => item.id === id);
  if (!record) throw new Error(`No existe ${object}/${id}`);
  return record;
}

export async function createRecord(object: ObjectKey, input: Record<string, unknown>): Promise<CrmRecord> {
  const data = await readData();
  const previous = cloneData(data);
  const collection = getCollection(data, object);
  const now = new Date().toISOString();
  const record = normalizeRecord(data, object, {
    ...input,
    id: typeof input.id === "string" && input.id ? input.id : createId(idPrefixes[object]),
    createdAt: now,
    updatedAt: now,
  });
  collection.unshift(record);
  const next = await persistCrudChanges(previous, data);
  return getCollection(next, object).find((item) => item.id === record.id) as unknown as CrmRecord;
}

export async function updateRecord(object: ObjectKey, id: string, input: Record<string, unknown>): Promise<CrmRecord> {
  const data = await readData();
  const previous = cloneData(data);
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
  const next = await persistCrudChanges(previous, data);
  return getCollection(next, object).find((item) => item.id === id) as unknown as CrmRecord;
}

export async function deleteRecord(object: ObjectKey, id: string): Promise<{ id: string; deleted: boolean }> {
  const data = await readData();
  const previous = cloneData(data);
  const collection = getCollection(data, object);
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) throw new Error(`No existe ${object}/${id}`);
  if (object === "users" && collection.length <= 1) throw new Error("No puedes eliminar el ultimo usuario del CRM.");
  collection.splice(index, 1);
  cascadeDelete(data, object, id);
  await persistCrudChanges(previous, data);
  return { id, deleted: true };
}

export async function importRecords(object: ObjectKey, rows: Record<string, unknown>[]): Promise<CrmRecord[]> {
  const data = await readData();
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
  await replaceData(data);
  return created as unknown as CrmRecord[];
}

export async function updatePathConfig(object: PathObjectKey, steps: { value: string; label?: string; probability?: number }[]): Promise<CrmData> {
  const data = await readData();
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
  return replaceData(data);
}

export async function convertLead(
  leadId: string,
  options: LeadConversionOptions = {},
): Promise<{ lead: CrmRecord; account: CrmRecord; contact: CrmRecord; opportunity?: CrmRecord }> {
  const data = await readData();
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

  await replaceData(data);
  return { lead, account, contact, opportunity };
}

function getSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL y SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY.");
  }
  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

async function selectObject(object: ObjectKey): Promise<CrmRecord[]> {
  const { data, error } = await getSupabase().from(tableByObject[object]).select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => fromDbRow(row as DbRow)) as unknown as CrmRecord[];
}

async function selectUserById(id: string): Promise<CrmData["users"][number] | undefined> {
  const { data, error } = await getSupabase().from(tableByObject.users).select("*").eq("id", id).limit(1);
  if (error) throw new Error(error.message);
  const row = data?.[0];
  return row ? (fromDbRow(row as DbRow) as unknown as CrmData["users"][number]) : undefined;
}

async function selectPathRows(): Promise<DbRow[]> {
  const { data, error } = await getSupabase().from("crm_path_steps").select("*").order("object_key", { ascending: true }).order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as DbRow[];
}

async function upsertObject(object: ObjectKey, records: Record<string, unknown>[], clearSyncedProposal = false): Promise<void> {
  if (records.length === 0) return;
  const rows = records.map((record) => {
    const row = toDbRow(object, record);
    if (clearSyncedProposal) row.synced_proposal_id = null;
    return row;
  });
  const { error } = await getSupabase().from(tableByObject[object]).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

async function deleteMissing(object: ObjectKey, ids: Set<string>): Promise<void> {
  const table = tableByObject[object];
  const { data, error } = await getSupabase().from(table).select("id");
  if (error) throw new Error(error.message);
  const idsToDelete = ((data ?? []) as { id: string }[]).map((row) => row.id).filter((id) => !ids.has(id));
  if (idsToDelete.length === 0) return;
  const { error: deleteError } = await getSupabase().from(table).delete().in("id", idsToDelete);
  if (deleteError) throw new Error(deleteError.message);
}

async function persistCrudChanges(previous: CrmData, data: CrmData): Promise<CrmData> {
  const next = ensureUserPasswords(recalculateAll(data));
  const changedByObject = new Map<ObjectKey, Record<string, unknown>[]>();
  const deletedIdsByObject = new Map<ObjectKey, string[]>();

  for (const object of upsertOrder) {
    const previousRecords = getCollection(previous, object);
    const nextRecords = getCollection(next, object);
    const previousById = new Map(previousRecords.map((record) => [record.id, record]));
    const nextIds = new Set(nextRecords.map((record) => record.id));
    const changedRecords = nextRecords.filter((record) => {
      const previousRecord = previousById.get(record.id);
      return !previousRecord || !recordsEqual(object, previousRecord, record);
    });
    const deletedIds = previousRecords.map((record) => record.id).filter((id) => !nextIds.has(id));
    if (changedRecords.length > 0) changedByObject.set(object, changedRecords);
    if (deletedIds.length > 0) deletedIdsByObject.set(object, deletedIds);
  }

  for (const object of preOpportunityUpsertOrder) {
    await upsertObject(object, changedByObject.get(object) ?? []);
  }
  for (const object of deleteOrder) {
    await deleteObjectIds(object, deletedIdsByObject.get(object) ?? []);
  }
  await upsertObject("opportunities", changedByObject.get("opportunities") ?? []);
  return next;
}

async function deleteObjectIds(object: ObjectKey, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await getSupabase().from(tableByObject[object]).delete().in("id", ids);
  if (error) throw new Error(error.message);
}

async function replacePathConfigs(pathConfigs: CrmData["pathConfigs"]): Promise<void> {
  const { error: deleteError } = await getSupabase().from("crm_path_steps").delete().in("object_key", ["leads", "opportunities", "cases"]);
  if (deleteError) throw new Error(deleteError.message);
  const rows = Object.entries(pathConfigs).flatMap(([object, steps]) =>
    steps.map((step, index) => ({
      object_key: object,
      position: index,
      value: step.value,
      label: step.label,
      probability: step.probability ?? null,
      is_closed: step.isClosed ?? null,
      is_won: step.isWon ?? null,
      is_converted: step.isConverted ?? null,
    })),
  );
  if (rows.length === 0) return;
  const { error: insertError } = await getSupabase().from("crm_path_steps").insert(rows);
  if (insertError) throw new Error(insertError.message);
}

function toDbRow(object: ObjectKey, record: Record<string, unknown>): DbRow {
  return Object.fromEntries(columnsByObject[object].map((field) => [camelToSnake(field), record[field] ?? null]));
}

function recordsEqual(object: ObjectKey, previous: Record<string, unknown>, next: Record<string, unknown>): boolean {
  return columnsByObject[object].every((field) => valuesEqual(previous[field], next[field]));
}

function valuesEqual(previous: unknown, next: unknown): boolean {
  const left = previous ?? null;
  const right = next ?? null;
  return left === right;
}

function cloneData(data: CrmData): CrmData {
  return structuredClone(data);
}

function fromDbRow(row: DbRow): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "auth_user_id" && value === null) continue;
    record[snakeToCamel(key)] = value === null ? undefined : value;
  }
  return record;
}

function pathConfigsFromRows(rows: DbRow[]): CrmData["pathConfigs"] {
  const pathConfigs: CrmData["pathConfigs"] = {
    leads: [...defaultPathConfigs.leads],
    opportunities: [...defaultPathConfigs.opportunities],
    cases: [...defaultPathConfigs.cases],
  };
  for (const object of Object.keys(pathConfigs) as PathObjectKey[]) {
    const steps = rows.filter((row) => row.object_key === object).map(pathStepFromRow);
    if (steps.length > 0) pathConfigs[object] = steps;
  }
  return pathConfigs;
}

function pathStepFromRow(row: DbRow): PathStep {
  return {
    value: String(row.value ?? ""),
    label: String(row.label ?? row.value ?? ""),
    probability: typeof row.probability === "number" ? row.probability : row.probability ? Number(row.probability) : undefined,
    isClosed: row.is_closed === null ? undefined : Boolean(row.is_closed),
    isWon: row.is_won === null ? undefined : Boolean(row.is_won),
    isConverted: row.is_converted === null ? undefined : Boolean(row.is_converted),
  };
}

function ensureUserPasswords(data: CrmData): CrmData {
  for (const user of data.users) {
    if (!user.passwordHash || !user.passwordSalt) {
      const password = hashPassword(defaultPassword);
      user.passwordSalt = password.salt;
      user.passwordHash = password.hash;
      user.passwordUpdatedAt = user.passwordUpdatedAt ?? new Date().toISOString();
    }
  }
  return data;
}

function camelToSnake(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function stringOr(value: unknown, fallback: string): string {
  if (value === undefined || value === null) return fallback;
  const stringValue = String(value).trim();
  return stringValue || fallback;
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

function addDays(date: Date, days: number): string {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy.toISOString().slice(0, 10);
}

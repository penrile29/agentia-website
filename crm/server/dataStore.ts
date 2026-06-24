import type { CrmData, CrmRecord, LeadConversionOptions, ObjectKey, PathObjectKey } from "../shared/schema.ts";
import * as jsonStore from "./store.ts";
import * as supabaseStore from "./supabaseStore.ts";

type StoreBackend = "json" | "supabase";

type StoreApi = {
  authenticateUser(email: string, password: string): Promise<{ token: string; user: CrmData["users"][number] }>;
  convertLead(leadId: string, options?: LeadConversionOptions): Promise<{ lead: CrmRecord; account: CrmRecord; contact: CrmRecord; opportunity?: CrmRecord }>;
  createRecord(object: ObjectKey, input: Record<string, unknown>): Promise<CrmRecord>;
  deleteRecord(object: ObjectKey, id: string): Promise<{ id: string; deleted: boolean }>;
  getRecord(object: ObjectKey, id: string): Promise<CrmRecord>;
  importRecords(object: ObjectKey, rows: Record<string, unknown>[]): Promise<CrmRecord[]>;
  listRecords(object: ObjectKey): Promise<CrmRecord[]>;
  readData(): Promise<CrmData>;
  resetData(): Promise<CrmData>;
  updatePathConfig(object: PathObjectKey, steps: { value: string; label?: string; probability?: number }[]): Promise<CrmData>;
  updateRecord(object: ObjectKey, id: string, input: Record<string, unknown>): Promise<CrmRecord>;
  userFromToken(token: string): Promise<CrmData["users"][number]>;
};

const jsonAdapter: StoreApi = {
  authenticateUser: async (email, password) => jsonStore.authenticateUser(email, password),
  convertLead: async (leadId, options) => jsonStore.convertLead(leadId, options),
  createRecord: async (object, input) => jsonStore.createRecord(object, input),
  deleteRecord: async (object, id) => jsonStore.deleteRecord(object, id),
  getRecord: async (object, id) => jsonStore.getRecord(object, id),
  importRecords: async (object, rows) => jsonStore.importRecords(object, rows),
  listRecords: async (object) => jsonStore.listRecords(object),
  readData: async () => jsonStore.readData(),
  resetData: async () => jsonStore.resetData(),
  updatePathConfig: async (object, steps) => jsonStore.updatePathConfig(object, steps),
  updateRecord: async (object, id, input) => jsonStore.updateRecord(object, id, input),
  userFromToken: async (token) => jsonStore.userFromToken(token),
};

export const assertObjectKey = jsonStore.assertObjectKey;

export function getStoreBackend(): StoreBackend {
  return process.env.CRM_DATA_BACKEND === "supabase" ? "supabase" : "json";
}

export function getStoreInfo(): { backend: StoreBackend; dataFile?: string; supabaseUrl?: string } {
  if (getStoreBackend() === "supabase") {
    return { backend: "supabase", supabaseUrl: supabaseStore.getSupabaseProjectUrl() };
  }
  return { backend: "json", dataFile: jsonStore.getDataFilePath() };
}

function activeStore(): StoreApi {
  if (getStoreBackend() === "supabase") {
    if (!supabaseStore.isSupabaseConfigured()) {
      throw new Error("CRM_DATA_BACKEND=supabase requiere SUPABASE_URL y SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY.");
    }
    return supabaseStore;
  }
  return jsonAdapter;
}

export async function authenticateUser(email: string, password: string) {
  return activeStore().authenticateUser(email, password);
}

export async function userFromToken(token: string) {
  return activeStore().userFromToken(token);
}

export async function readData() {
  return activeStore().readData();
}

export async function resetData() {
  return activeStore().resetData();
}

export async function listRecords(object: ObjectKey) {
  return activeStore().listRecords(object);
}

export async function getRecord(object: ObjectKey, id: string) {
  return activeStore().getRecord(object, id);
}

export async function createRecord(object: ObjectKey, input: Record<string, unknown>) {
  return activeStore().createRecord(object, input);
}

export async function updateRecord(object: ObjectKey, id: string, input: Record<string, unknown>) {
  return activeStore().updateRecord(object, id, input);
}

export async function deleteRecord(object: ObjectKey, id: string) {
  return activeStore().deleteRecord(object, id);
}

export async function importRecords(object: ObjectKey, rows: Record<string, unknown>[]) {
  return activeStore().importRecords(object, rows);
}

export async function updatePathConfig(object: PathObjectKey, steps: { value: string; label?: string; probability?: number }[]) {
  return activeStore().updatePathConfig(object, steps);
}

export async function convertLead(leadId: string, options: LeadConversionOptions = {}) {
  return activeStore().convertLead(leadId, options);
}

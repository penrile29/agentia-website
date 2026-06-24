import fs from "node:fs";
import path from "node:path";
import type { CrmData } from "../shared/schema.ts";
import { objectKeys } from "../shared/schema.ts";
import { readData, replaceData } from "../server/supabaseStore.ts";

const filePath = process.argv[2] ?? process.env.CRM_DATA_FILE ?? path.join(process.cwd(), "data", "agentia-crm.json");
const raw = fs.readFileSync(filePath, "utf8");
const data = JSON.parse(raw) as CrmData;

await replaceData(data);

const uploaded = await readData();
const counts = Object.fromEntries(objectKeys.map((object) => [object, uploaded[object].length]));

console.log(`CRM data loaded into Supabase from ${filePath}`);
console.log(JSON.stringify(counts, null, 2));

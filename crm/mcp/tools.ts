import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fieldConfigs, objectKeys, objectLabels } from "../shared/schema.ts";
import {
  assertObjectKey,
  convertLead,
  createRecord,
  deleteRecord,
  getRecord,
  importRecords,
  listRecords,
  readData,
  updateRecord,
} from "../server/dataStore.ts";

function textJson(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

export function createCrmMcpServer() {
  const server = new McpServer({
    name: "agentia-crm",
    version: "0.1.0",
  });

  server.registerTool(
    "crm_list_objects",
    {
      title: "List CRM objects",
      description: "Lista los objetos disponibles en el CRM Agentia, con etiquetas y campos.",
    },
    async () => textJson({ objects: objectKeys, labels: objectLabels, fields: fieldConfigs }),
  );

  server.registerTool(
    "crm_get_dashboard",
    {
      title: "Get CRM dashboard",
      description: "Devuelve los totales principales del CRM.",
    },
    async () => {
      const data = await readData();
      const openOpportunities = data.opportunities.filter((opportunity) => !opportunity.stageName.startsWith("Closed"));
      const wonOpportunities = data.opportunities.filter((opportunity) => opportunity.stageName === "Closed Won");
      return textJson({
        leadsTotal: data.leads.length,
        opportunitiesTotal: data.opportunities.length,
        pipelineOneOffEur: openOpportunities.reduce((total, opportunity) => total + opportunity.oneOffAmount, 0),
        pipelineMrrEur: openOpportunities.reduce((total, opportunity) => total + opportunity.mrrAmount, 0),
        closedWonOneOffEur: wonOpportunities.reduce((total, opportunity) => total + opportunity.oneOffAmount, 0),
        closedWonMrrEur: wonOpportunities.reduce((total, opportunity) => total + opportunity.mrrAmount, 0),
        opportunitiesAmountEur: data.opportunities.reduce((total, opportunity) => total + opportunity.amount, 0),
        openCases: data.cases.filter((caseRecord) => caseRecord.status !== "Closed").length,
      });
    },
  );

  server.registerTool(
    "crm_list_records",
    {
      title: "List CRM records",
      description: "Lista registros de cualquier objeto. Opcionalmente filtra con texto.",
      inputSchema: {
        object: z.string().describe("Objeto plural, por ejemplo leads, accounts, opportunities."),
        query: z.string().optional().describe("Texto a buscar en el JSON del registro."),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    async ({ object, query, limit }) => {
      const objectKey = assertObjectKey(object);
      const target = query?.toLowerCase();
      const records = (await listRecords(objectKey))
        .filter((record) => !target || JSON.stringify(record).toLowerCase().includes(target))
        .slice(0, limit ?? 50);
      return textJson(records);
    },
  );

  server.registerTool(
    "crm_get_record",
    {
      title: "Get CRM record",
      description: "Obtiene un registro por objeto e id.",
      inputSchema: {
        object: z.string(),
        id: z.string(),
      },
    },
    async ({ object, id }) => textJson(await getRecord(assertObjectKey(object), id)),
  );

  server.registerTool(
    "crm_create_record",
    {
      title: "Create CRM record",
      description: "Crea un registro CRM. El payload debe usar los nombres de campo del CRM.",
      inputSchema: {
        object: z.string(),
        fields: z.record(z.string(), z.unknown()),
      },
    },
    async ({ object, fields }) => textJson(await createRecord(assertObjectKey(object), fields)),
  );

  server.registerTool(
    "crm_update_record",
    {
      title: "Update CRM record",
      description: "Actualiza un registro CRM por objeto e id.",
      inputSchema: {
        object: z.string(),
        id: z.string(),
        fields: z.record(z.string(), z.unknown()),
      },
    },
    async ({ object, id, fields }) => textJson(await updateRecord(assertObjectKey(object), id, fields)),
  );

  server.registerTool(
    "crm_delete_record",
    {
      title: "Delete CRM record",
      description: "Borra un registro CRM por objeto e id.",
      inputSchema: {
        object: z.string(),
        id: z.string(),
      },
    },
    async ({ object, id }) => textJson(await deleteRecord(assertObjectKey(object), id)),
  );

  server.registerTool(
    "crm_import_records",
    {
      title: "Import CRM records",
      description: "Importa varias filas ya parseadas para cualquier objeto.",
      inputSchema: {
        object: z.string(),
        rows: z.array(z.record(z.string(), z.unknown())),
      },
    },
    async ({ object, rows }) => textJson(await importRecords(assertObjectKey(object), rows)),
  );

  server.registerTool(
    "crm_convert_lead",
    {
      title: "Convert lead",
      description: "Convierte un lead en cuenta, contacto y opcionalmente oportunidad.",
      inputSchema: {
        leadId: z.string(),
        createOpportunity: z.boolean().optional().describe("Si es true crea cuenta, contacto y oportunidad. Si es false crea solo cuenta y contacto."),
        accountName: z.string().optional().describe("Nombre de la cuenta a crear o reutilizar."),
        contactFirstName: z.string().optional().describe("Nombre del contacto convertido."),
        contactLastName: z.string().optional().describe("Apellidos del contacto convertido."),
        opportunityName: z.string().optional().describe("Nombre de la oportunidad, si createOpportunity es true."),
        closeDate: z.string().optional().describe("Fecha de cierre de la oportunidad en formato YYYY-MM-DD."),
        oneOffAmount: z.number().optional().describe("Importe one-off de la oportunidad en EUR."),
        mrrAmount: z.number().optional().describe("MRR de la oportunidad en EUR."),
      },
    },
    async ({ leadId, createOpportunity, accountName, contactFirstName, contactLastName, opportunityName, closeDate, oneOffAmount, mrrAmount }) =>
      textJson(
        await convertLead(leadId, {
          createOpportunity,
          accountName,
          contactFirstName,
          contactLastName,
          opportunityName,
          closeDate,
          oneOffAmount,
          mrrAmount,
        }),
      ),
  );

  return server;
}

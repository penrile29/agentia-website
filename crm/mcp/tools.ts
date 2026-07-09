import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fieldConfigs, objectKeys, objectLabels, recordDisplayName, type CrmData, type ObjectKey } from "../shared/schema.ts";
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

function relatedName(data: CrmData, object: ObjectKey, id?: string): string | undefined {
  return id ? recordDisplayName(data, object, id) : undefined;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function matchesQuery(value: unknown, query?: string): boolean {
  const target = query ? normalizeText(query) : "";
  return !target || JSON.stringify(value).toLowerCase().includes(target);
}

function isClosedOpportunity(data: CrmData, opportunity: CrmData["opportunities"][number]): boolean {
  return data.pathConfigs.opportunities.find((step) => step.value === opportunity.stageName)?.isClosed ?? opportunity.stageName.startsWith("Closed");
}

function resolveAccountId(data: CrmData, value?: string): string | undefined {
  if (!value) return undefined;
  const target = normalizeText(value);
  const account = data.accounts.find((item) => item.id === value || normalizeText(item.name) === target);
  if (!account) throw new Error(`No existe cuenta: ${value}`);
  return account.id;
}

function resolveOwnerId(data: CrmData, value?: string): string | undefined {
  if (!value) return undefined;
  const target = normalizeText(value);
  const owner = data.users.find((item) => item.id === value || normalizeText(item.name) === target || normalizeText(item.email) === target);
  if (!owner) throw new Error(`No existe owner: ${value}`);
  return owner.id;
}

function resolveContactId(data: CrmData, value?: string): string | undefined {
  if (!value) return undefined;
  const target = normalizeText(value);
  const contact = data.contacts.find((item) => item.id === value || normalizeText(recordDisplayName(data, "contacts", item.id)) === target || normalizeText(item.email ?? "") === target);
  if (!contact) throw new Error(`No existe contacto: ${value}`);
  return contact.id;
}

function resolveOpportunity(data: CrmData, value: string): CrmData["opportunities"][number] {
  const target = normalizeText(value);
  const opportunity = data.opportunities.find((item) => item.id === value || normalizeText(item.name) === target);
  if (!opportunity) throw new Error(`No existe oportunidad: ${value}`);
  return opportunity;
}

function resolveOpportunityStage(data: CrmData, value: string): CrmData["pathConfigs"]["opportunities"][number] {
  const target = normalizeText(value);
  const stage = data.pathConfigs.opportunities.find((step) => normalizeText(step.value) === target || normalizeText(step.label) === target);
  if (!stage) {
    const allowed = data.pathConfigs.opportunities.map((step) => step.value).join(", ");
    throw new Error(`Etapa de oportunidad no soportada: ${value}. Etapas validas: ${allowed}`);
  }
  return stage;
}

function resolveProduct(data: CrmData, value: string): CrmData["products"][number] {
  const target = normalizeText(value);
  const product = data.products.find((item) => item.id === value || normalizeText(item.name) === target || normalizeText(item.productCode) === target);
  if (!product) throw new Error(`No existe producto: ${value}`);
  return product;
}

function enrichLineItem(data: CrmData, line: CrmData["opportunityLineItems"][number]) {
  const product = data.products.find((item) => item.id === line.productId);
  return {
    ...line,
    productName: product?.name ?? line.productId,
    productCode: product?.productCode,
    productFamily: product?.family,
    ownerName: relatedName(data, "users", line.ownerId),
  };
}

function enrichOpportunity(data: CrmData, opportunity: CrmData["opportunities"][number]) {
  const stage = data.pathConfigs.opportunities.find((step) => step.value === opportunity.stageName);
  const lineItems = data.opportunityLineItems.filter((line) => line.opportunityId === opportunity.id).map((line) => enrichLineItem(data, line));
  return {
    ...opportunity,
    accountName: relatedName(data, "accounts", opportunity.accountId),
    contactName: relatedName(data, "contacts", opportunity.contactId),
    ownerName: relatedName(data, "users", opportunity.ownerId),
    stage: stage
      ? {
          value: stage.value,
          label: stage.label,
          probability: stage.probability,
          isClosed: Boolean(stage.isClosed),
          isWon: Boolean(stage.isWon),
        }
      : undefined,
    isClosed: isClosedOpportunity(data, opportunity),
    products: lineItems,
    productCount: lineItems.length,
  };
}

function enrichTask(data: CrmData, task: CrmData["tasks"][number]) {
  return {
    ...task,
    accountName: relatedName(data, "accounts", task.accountId),
    contactName: relatedName(data, "contacts", task.contactId),
    opportunityName: relatedName(data, "opportunities", task.opportunityId),
    ownerName: relatedName(data, "users", task.ownerId),
  };
}

function enrichAccount(data: CrmData, account: CrmData["accounts"][number]) {
  const contacts = data.contacts.filter((contact) => contact.accountId === account.id);
  const opportunities = data.opportunities.filter((opportunity) => opportunity.accountId === account.id);
  const openOpportunities = opportunities.filter((opportunity) => !isClosedOpportunity(data, opportunity));
  return {
    ...account,
    parentAccountName: relatedName(data, "accounts", account.parentAccountId),
    ownerName: relatedName(data, "users", account.ownerId),
    contactCount: contacts.length,
    contacts: contacts.map((contact) => ({
      id: contact.id,
      name: recordDisplayName(data, "contacts", contact.id),
      title: contact.title,
      email: contact.email,
      phone: contact.phone,
    })),
    opportunityCount: opportunities.length,
    openOpportunityCount: openOpportunities.length,
    pipelineOneOffEur: openOpportunities.reduce((total, opportunity) => total + opportunity.oneOffAmount, 0),
    pipelineMrrEur: openOpportunities.reduce((total, opportunity) => total + opportunity.mrrAmount, 0),
    pipelineAnnualizedEur: openOpportunities.reduce((total, opportunity) => total + opportunity.amount, 0),
    opportunities: opportunities.map((opportunity) => ({
      id: opportunity.id,
      name: opportunity.name,
      stageName: opportunity.stageName,
      closeDate: opportunity.closeDate,
      amount: opportunity.amount,
      ownerName: relatedName(data, "users", opportunity.ownerId),
    })),
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
    "crm_list_tasks",
    {
      title: "List CRM tasks",
      description: "Lista tareas CRM con ownerName enriquecido. Permite filtrar por estado, owner, vencimiento o texto.",
      inputSchema: {
        query: z.string().optional().describe("Texto a buscar en la tarea enriquecida."),
        status: z.string().optional().describe("Estado exacto, por ejemplo Not Started, In Progress o Completed."),
        ownerId: z.string().optional().describe("ID, nombre o email del owner."),
        accountId: z.string().optional().describe("ID o nombre de la cuenta relacionada."),
        contactId: z.string().optional().describe("ID, nombre o email del contacto relacionado."),
        opportunityId: z.string().optional().describe("ID o nombre exacto de la oportunidad relacionada."),
        dueFrom: z.string().optional().describe("Fecha minima de vencimiento YYYY-MM-DD."),
        dueTo: z.string().optional().describe("Fecha maxima de vencimiento YYYY-MM-DD."),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    async ({ query, status, ownerId, accountId, contactId, opportunityId, dueFrom, dueTo, limit }) => {
      const data = await readData();
      const resolvedOwnerId = resolveOwnerId(data, ownerId);
      const resolvedAccountId = resolveAccountId(data, accountId);
      const resolvedContactId = resolveContactId(data, contactId);
      const resolvedOpportunityId = opportunityId ? resolveOpportunity(data, opportunityId).id : undefined;
      const targetStatus = status ? normalizeText(status) : "";
      const tasks = data.tasks
        .map((task) => enrichTask(data, task))
        .filter((task) => !targetStatus || normalizeText(task.status) === targetStatus)
        .filter((task) => !resolvedOwnerId || task.ownerId === resolvedOwnerId)
        .filter((task) => !resolvedAccountId || task.accountId === resolvedAccountId)
        .filter((task) => !resolvedContactId || task.contactId === resolvedContactId)
        .filter((task) => !resolvedOpportunityId || task.opportunityId === resolvedOpportunityId)
        .filter((task) => !dueFrom || (task.dueDate ?? "") >= dueFrom)
        .filter((task) => !dueTo || (task.dueDate ?? "") <= dueTo)
        .filter((task) => matchesQuery(task, query))
        .sort((left, right) => (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31"))
        .slice(0, limit ?? 50);
      return textJson(tasks);
    },
  );

  server.registerTool(
    "crm_list_opportunities",
    {
      title: "List CRM opportunities",
      description: "Lista oportunidades con nombres de cuenta, contacto, owner, etapa y productos relacionados.",
      inputSchema: {
        query: z.string().optional().describe("Texto a buscar en la oportunidad enriquecida."),
        stageName: z.string().optional().describe("Etapa exacta o etiqueta del path de oportunidades."),
        accountId: z.string().optional().describe("ID o nombre de la cuenta."),
        ownerId: z.string().optional().describe("ID, nombre o email del owner."),
        includeClosed: z.boolean().optional().describe("Si es true incluye Closed Won y Closed Lost. Por defecto se listan solo abiertas."),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    async ({ query, stageName, accountId, ownerId, includeClosed, limit }) => {
      const data = await readData();
      const resolvedStageName = stageName ? resolveOpportunityStage(data, stageName).value : undefined;
      const resolvedAccountId = resolveAccountId(data, accountId);
      const resolvedOwnerId = resolveOwnerId(data, ownerId);
      const opportunities = data.opportunities
        .map((opportunity) => enrichOpportunity(data, opportunity))
        .filter((opportunity) => includeClosed || !opportunity.isClosed)
        .filter((opportunity) => !resolvedStageName || opportunity.stageName === resolvedStageName)
        .filter((opportunity) => !resolvedAccountId || opportunity.accountId === resolvedAccountId)
        .filter((opportunity) => !resolvedOwnerId || opportunity.ownerId === resolvedOwnerId)
        .filter((opportunity) => matchesQuery(opportunity, query))
        .sort((left, right) => left.closeDate.localeCompare(right.closeDate))
        .slice(0, limit ?? 50);
      return textJson({
        stages: data.pathConfigs.opportunities,
        opportunities,
      });
    },
  );

  server.registerTool(
    "crm_list_accounts",
    {
      title: "List CRM accounts",
      description: "Lista cuentas con ownerName, contactos y resumen de oportunidades/pipeline.",
      inputSchema: {
        query: z.string().optional().describe("Texto a buscar en la cuenta enriquecida."),
        ownerId: z.string().optional().describe("ID, nombre o email del owner."),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    async ({ query, ownerId, limit }) => {
      const data = await readData();
      const resolvedOwnerId = resolveOwnerId(data, ownerId);
      const accounts = data.accounts
        .map((account) => enrichAccount(data, account))
        .filter((account) => !resolvedOwnerId || account.ownerId === resolvedOwnerId)
        .filter((account) => matchesQuery(account, query))
        .sort((left, right) => left.name.localeCompare(right.name))
        .slice(0, limit ?? 50);
      return textJson(accounts);
    },
  );

  server.registerTool(
    "crm_move_opportunity_stage",
    {
      title: "Move opportunity stage",
      description: "Mueve una oportunidad a una etapa valida de pathConfigs.opportunities y deja que el CRM recalcule probability.",
      inputSchema: {
        opportunityId: z.string().describe("ID o nombre exacto de la oportunidad."),
        stageName: z.string().describe("Valor o etiqueta de etapa en pathConfigs.opportunities."),
      },
    },
    async ({ opportunityId, stageName }) => {
      const data = await readData();
      const opportunity = resolveOpportunity(data, opportunityId);
      const stage = resolveOpportunityStage(data, stageName);
      await updateRecord("opportunities", opportunity.id, { stageName: stage.value });
      const next = await readData();
      const updated = next.opportunities.find((item) => item.id === opportunity.id);
      if (!updated) throw new Error(`No existe oportunidad tras actualizar: ${opportunity.id}`);
      return textJson({
        opportunity: enrichOpportunity(next, updated),
        movedTo: stage,
      });
    },
  );

  server.registerTool(
    "crm_add_opportunity_product",
    {
      title: "Add opportunity product",
      description: "Anade un producto a una oportunidad usando defaults del producto y opcionalmente sincroniza el importe de la oportunidad con productos.",
      inputSchema: {
        opportunityId: z.string().describe("ID o nombre exacto de la oportunidad."),
        productId: z.string().describe("ID, nombre o codigo del producto."),
        quantity: z.number().positive().optional().describe("Cantidad. Por defecto 1."),
        unitPrice: z.number().nonnegative().optional().describe("Precio unitario EUR. Por defecto usa Product.listPrice."),
        discountPercent: z.number().min(0).max(100).optional().describe("Descuento porcentual. Por defecto 0."),
        revenueType: z.enum(["oneOff", "mrr"]).optional().describe("Tipo de revenue. Por defecto usa Product.revenueType."),
        serviceDate: z.string().optional().describe("Fecha de servicio YYYY-MM-DD."),
        syncOpportunityAmount: z.boolean().optional().describe("Si es true o se omite, cambia amountMode a syncProducts para que el importe se recalcule desde productos."),
      },
    },
    async ({ opportunityId, productId, quantity, unitPrice, discountPercent, revenueType, serviceDate, syncOpportunityAmount }) => {
      const data = await readData();
      const opportunity = resolveOpportunity(data, opportunityId);
      const product = resolveProduct(data, productId);
      const shouldSyncAmount = syncOpportunityAmount ?? true;
      const lineItem = await createRecord("opportunityLineItems", {
        opportunityId: opportunity.id,
        productId: product.id,
        quantity: quantity ?? 1,
        unitPrice: unitPrice ?? product.listPrice,
        discountPercent: discountPercent ?? 0,
        revenueType: revenueType ?? product.revenueType,
        serviceDate,
        ownerId: opportunity.ownerId,
      });

      if (shouldSyncAmount && opportunity.amountMode !== "syncProducts") {
        await updateRecord("opportunities", opportunity.id, { amountMode: "syncProducts" });
      }

      const next = await readData();
      const updatedOpportunity = next.opportunities.find((item) => item.id === opportunity.id);
      const updatedLineItem = next.opportunityLineItems.find((item) => item.id === lineItem.id);
      if (!updatedOpportunity || !updatedLineItem) throw new Error("No se pudo leer el producto de oportunidad tras crearlo.");
      const warnings =
        !shouldSyncAmount && updatedOpportunity.amountMode !== "syncProducts"
          ? [`La oportunidad mantiene amountMode=${updatedOpportunity.amountMode}; el importe no se recalcula desde opportunityLineItems.`]
          : [];
      return textJson({
        lineItem: enrichLineItem(next, updatedLineItem),
        opportunity: enrichOpportunity(next, updatedOpportunity),
        warnings,
      });
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

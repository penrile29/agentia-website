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

function resolveTask(data: CrmData, value: string): CrmData["tasks"][number] {
  const target = normalizeText(value);
  const task = data.tasks.find((item) => item.id === value || normalizeText(item.subject) === target);
  if (!task) throw new Error(`No existe tarea: ${value}`);
  return task;
}

function resolveOpportunity(data: CrmData, value: string): CrmData["opportunities"][number] {
  const target = normalizeText(value);
  const opportunity = data.opportunities.find((item) => item.id === value || normalizeText(item.name) === target);
  if (!opportunity) throw new Error(`No existe oportunidad: ${value}`);
  return opportunity;
}

function resolveProject(data: CrmData, value: string): CrmData["projects"][number] {
  const target = normalizeText(value);
  const project = data.projects.find((item) => item.id === value || normalizeText(item.name) === target);
  if (!project) throw new Error(`No existe proyecto: ${value}`);
  return project;
}

function resolveMilestone(data: CrmData, value: string): CrmData["projectMilestones"][number] {
  const target = normalizeText(value);
  const milestone = data.projectMilestones.find((item) => item.id === value || normalizeText(item.name) === target);
  if (!milestone) throw new Error(`No existe milestone: ${value}`);
  return milestone;
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
    projectName: relatedName(data, "projects", task.projectId),
    milestoneName: relatedName(data, "projectMilestones", task.milestoneId),
    ownerName: relatedName(data, "users", task.ownerId),
    secondaryOwnerName: relatedName(data, "users", task.secondaryOwnerId),
  };
}

function enrichProject(data: CrmData, project: CrmData["projects"][number]) {
  const tasks = data.tasks.filter((task) => task.projectId === project.id);
  const milestones = data.projectMilestones.filter((milestone) => milestone.projectId === project.id).sort((left, right) => left.sortOrder - right.sortOrder || (left.dueDate ?? "").localeCompare(right.dueDate ?? ""));
  const members = data.projectMembers.filter((member) => member.projectId === project.id);
  const taskIds = new Set(tasks.map((task) => task.id));
  const dependencies = data.taskDependencies.filter((dependency) => dependency.projectId === project.id || taskIds.has(dependency.predecessorTaskId) || taskIds.has(dependency.successorTaskId));
  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  return {
    ...project,
    accountName: relatedName(data, "accounts", project.accountId),
    opportunityName: relatedName(data, "opportunities", project.opportunityId),
    primaryContactName: relatedName(data, "contacts", project.primaryContactId),
    ownerName: relatedName(data, "users", project.ownerId),
    progressPercent: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
    taskCount: tasks.length,
    completedTaskCount: completedTasks,
    blockedTaskCount: tasks.filter((task) => task.status === "Waiting" || task.blockedReason).length,
    milestoneCount: milestones.length,
    completedMilestoneCount: milestones.filter((milestone) => milestone.status === "Completed").length,
    members: members.map((member) => ({
      ...member,
      userName: relatedName(data, "users", member.userId),
      ownerName: relatedName(data, "users", member.ownerId),
    })),
    milestones: milestones.map((milestone) => enrichMilestone(data, milestone)),
    tasks: tasks.map((task) => enrichTask(data, task)),
    dependencies: dependencies.map((dependency) => enrichTaskDependency(data, dependency)),
  };
}

function enrichMilestone(data: CrmData, milestone: CrmData["projectMilestones"][number]) {
  const tasks = data.tasks.filter((task) => task.milestoneId === milestone.id);
  return {
    ...milestone,
    projectName: relatedName(data, "projects", milestone.projectId),
    ownerName: relatedName(data, "users", milestone.ownerId),
    taskCount: tasks.length,
    completedTaskCount: tasks.filter((task) => task.status === "Completed").length,
  };
}

function enrichTaskDependency(data: CrmData, dependency: CrmData["taskDependencies"][number]) {
  return {
    ...dependency,
    projectName: relatedName(data, "projects", dependency.projectId),
    predecessorTaskSubject: relatedName(data, "tasks", dependency.predecessorTaskId),
    successorTaskSubject: relatedName(data, "tasks", dependency.successorTaskId),
    ownerName: relatedName(data, "users", dependency.ownerId),
  };
}

type TaskToolInput = {
  subject?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  completedDate?: string;
  blockedReason?: string;
  description?: string;
  ownerId?: string | null;
  secondaryOwnerId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  opportunityId?: string | null;
  projectId?: string | null;
  milestoneId?: string | null;
};

function taskPatchFromInput(data: CrmData, input: TaskToolInput): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (input.subject !== undefined) patch.subject = input.subject;
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate || undefined;
  if (input.completedDate !== undefined) patch.completedDate = input.completedDate || undefined;
  if (input.blockedReason !== undefined) patch.blockedReason = input.blockedReason;
  if (input.description !== undefined) patch.description = input.description;
  applyOptionalReference(patch, "ownerId", input.ownerId, (value) => resolveOwnerId(data, value));
  applyOptionalReference(patch, "secondaryOwnerId", input.secondaryOwnerId, (value) => resolveOwnerId(data, value));
  applyOptionalReference(patch, "accountId", input.accountId, (value) => resolveAccountId(data, value));
  applyOptionalReference(patch, "contactId", input.contactId, (value) => resolveContactId(data, value));
  applyOptionalReference(patch, "opportunityId", input.opportunityId, (value) => resolveOpportunity(data, value).id);
  applyOptionalReference(patch, "projectId", input.projectId, (value) => resolveProject(data, value).id);
  applyOptionalReference(patch, "milestoneId", input.milestoneId, (value) => resolveMilestone(data, value).id);
  return patch;
}

function applyOptionalReference(patch: Record<string, unknown>, key: string, value: string | null | undefined, resolver: (value: string) => string | undefined): void {
  if (value === undefined) return;
  if (value === null || value.trim() === "") {
    patch[key] = undefined;
    return;
  }
  patch[key] = resolver(value);
}

type ProjectToolInput = {
  name?: string;
  status?: string;
  health?: string;
  startDate?: string;
  targetGoLiveDate?: string;
  actualGoLiveDate?: string;
  deploymentType?: string;
  description?: string;
  ownerId?: string | null;
  accountId?: string | null;
  opportunityId?: string | null;
  primaryContactId?: string | null;
};

function projectPatchFromInput(data: CrmData, input: ProjectToolInput): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.status !== undefined) patch.status = input.status;
  if (input.health !== undefined) patch.health = input.health;
  if (input.startDate !== undefined) patch.startDate = input.startDate || undefined;
  if (input.targetGoLiveDate !== undefined) patch.targetGoLiveDate = input.targetGoLiveDate || undefined;
  if (input.actualGoLiveDate !== undefined) patch.actualGoLiveDate = input.actualGoLiveDate || undefined;
  if (input.deploymentType !== undefined) patch.deploymentType = input.deploymentType;
  if (input.description !== undefined) patch.description = input.description;
  applyOptionalReference(patch, "ownerId", input.ownerId, (value) => resolveOwnerId(data, value));
  applyOptionalReference(patch, "accountId", input.accountId, (value) => resolveAccountId(data, value));
  applyOptionalReference(patch, "opportunityId", input.opportunityId, (value) => resolveOpportunity(data, value).id);
  applyOptionalReference(patch, "primaryContactId", input.primaryContactId, (value) => resolveContactId(data, value));
  return patch;
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
        priority: z.string().optional().describe("Prioridad exacta: Low, Medium, High o Critical."),
        ownerId: z.string().optional().describe("ID, nombre o email del owner."),
        secondaryOwnerId: z.string().optional().describe("ID, nombre o email del segundo asignado."),
        assignedUserId: z.string().optional().describe("ID, nombre o email de cualquier asignado; busca en owner y segundo asignado."),
        accountId: z.string().optional().describe("ID o nombre de la cuenta relacionada."),
        contactId: z.string().optional().describe("ID, nombre o email del contacto relacionado."),
        opportunityId: z.string().optional().describe("ID o nombre exacto de la oportunidad relacionada."),
        projectId: z.string().optional().describe("ID o nombre exacto del proyecto relacionado."),
        milestoneId: z.string().optional().describe("ID o nombre exacto del milestone relacionado."),
        dueFrom: z.string().optional().describe("Fecha minima de vencimiento YYYY-MM-DD."),
        dueTo: z.string().optional().describe("Fecha maxima de vencimiento YYYY-MM-DD."),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    async ({ query, status, priority, ownerId, secondaryOwnerId, assignedUserId, accountId, contactId, opportunityId, projectId, milestoneId, dueFrom, dueTo, limit }) => {
      const data = await readData();
      const resolvedOwnerId = resolveOwnerId(data, ownerId);
      const resolvedSecondaryOwnerId = resolveOwnerId(data, secondaryOwnerId);
      const resolvedAssignedUserId = resolveOwnerId(data, assignedUserId);
      const resolvedAccountId = resolveAccountId(data, accountId);
      const resolvedContactId = resolveContactId(data, contactId);
      const resolvedOpportunityId = opportunityId ? resolveOpportunity(data, opportunityId).id : undefined;
      const resolvedProjectId = projectId ? resolveProject(data, projectId).id : undefined;
      const resolvedMilestoneId = milestoneId ? resolveMilestone(data, milestoneId).id : undefined;
      const targetStatus = status ? normalizeText(status) : "";
      const targetPriority = priority ? normalizeText(priority) : "";
      const tasks = data.tasks
        .map((task) => enrichTask(data, task))
        .filter((task) => !targetStatus || normalizeText(task.status) === targetStatus)
        .filter((task) => !targetPriority || normalizeText(task.priority) === targetPriority)
        .filter((task) => !resolvedOwnerId || task.ownerId === resolvedOwnerId)
        .filter((task) => !resolvedSecondaryOwnerId || task.secondaryOwnerId === resolvedSecondaryOwnerId)
        .filter((task) => !resolvedAssignedUserId || task.ownerId === resolvedAssignedUserId || task.secondaryOwnerId === resolvedAssignedUserId)
        .filter((task) => !resolvedAccountId || task.accountId === resolvedAccountId)
        .filter((task) => !resolvedContactId || task.contactId === resolvedContactId)
        .filter((task) => !resolvedOpportunityId || task.opportunityId === resolvedOpportunityId)
        .filter((task) => !resolvedProjectId || task.projectId === resolvedProjectId)
        .filter((task) => !resolvedMilestoneId || task.milestoneId === resolvedMilestoneId)
        .filter((task) => !dueFrom || (task.dueDate ?? "") >= dueFrom)
        .filter((task) => !dueTo || (task.dueDate ?? "") <= dueTo)
        .filter((task) => matchesQuery(task, query))
        .sort((left, right) => (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31"))
        .slice(0, limit ?? 50);
      return textJson(tasks);
    },
  );

  server.registerTool(
    "crm_create_task",
    {
      title: "Create CRM task",
      description: "Crea una tarea y permite asignarla a owner, segundo asignado, cuenta, contacto y/u oportunidad usando ids, nombres o emails. Si hay oportunidad o contacto, el CRM autocompleta la cuenta.",
      inputSchema: {
        subject: z.string().describe("Asunto de la tarea."),
        status: z.string().optional().describe("Estado, por ejemplo Not Started, In Progress, Waiting, Completed o Deferred."),
        priority: z.string().optional().describe("Prioridad: Low, Medium, High o Critical."),
        dueDate: z.string().optional().describe("Fecha de vencimiento YYYY-MM-DD."),
        completedDate: z.string().optional().describe("Fecha de completado YYYY-MM-DD."),
        blockedReason: z.string().optional().describe("Motivo del bloqueo, si aplica."),
        description: z.string().optional().describe("Descripcion de la tarea."),
        ownerId: z.string().nullable().optional().describe("ID, nombre o email del owner principal."),
        secondaryOwnerId: z.string().nullable().optional().describe("ID, nombre o email del segundo asignado."),
        accountId: z.string().nullable().optional().describe("ID o nombre de la cuenta relacionada."),
        contactId: z.string().nullable().optional().describe("ID, nombre o email del contacto relacionado."),
        opportunityId: z.string().nullable().optional().describe("ID o nombre exacto de la oportunidad relacionada."),
        projectId: z.string().nullable().optional().describe("ID o nombre exacto del proyecto relacionado."),
        milestoneId: z.string().nullable().optional().describe("ID o nombre exacto del milestone relacionado."),
      },
    },
    async (input) => {
      const data = await readData();
      const created = await createRecord("tasks", taskPatchFromInput(data, input));
      const next = await readData();
      const task = next.tasks.find((item) => item.id === created.id);
      if (!task) throw new Error(`No se pudo leer la tarea creada: ${created.id}`);
      return textJson(enrichTask(next, task));
    },
  );

  server.registerTool(
    "crm_update_task",
    {
      title: "Update CRM task",
      description: "Actualiza una tarea existente y sus relaciones/asignados usando ids, nombres o emails. Usa cadena vacia o null para limpiar una relacion opcional.",
      inputSchema: {
        taskId: z.string().describe("ID o asunto exacto de la tarea."),
        subject: z.string().optional().describe("Nuevo asunto."),
        status: z.string().optional().describe("Nuevo estado."),
        priority: z.string().optional().describe("Nueva prioridad."),
        dueDate: z.string().optional().describe("Fecha de vencimiento YYYY-MM-DD. Cadena vacia para limpiar."),
        completedDate: z.string().optional().describe("Fecha de completado YYYY-MM-DD. Cadena vacia para limpiar."),
        blockedReason: z.string().optional().describe("Motivo del bloqueo. Cadena vacia para limpiar."),
        description: z.string().optional().describe("Descripcion."),
        ownerId: z.string().nullable().optional().describe("ID, nombre o email del owner principal. Null/cadena vacia para limpiar."),
        secondaryOwnerId: z.string().nullable().optional().describe("ID, nombre o email del segundo asignado. Null/cadena vacia para limpiar."),
        accountId: z.string().nullable().optional().describe("ID o nombre de la cuenta. Null/cadena vacia para limpiar; oportunidad/contacto pueden autocompletarla."),
        contactId: z.string().nullable().optional().describe("ID, nombre o email del contacto. Null/cadena vacia para limpiar."),
        opportunityId: z.string().nullable().optional().describe("ID o nombre exacto de la oportunidad. Null/cadena vacia para limpiar."),
        projectId: z.string().nullable().optional().describe("ID o nombre exacto del proyecto. Null/cadena vacia para limpiar."),
        milestoneId: z.string().nullable().optional().describe("ID o nombre exacto del milestone. Null/cadena vacia para limpiar."),
      },
    },
    async ({ taskId, ...input }) => {
      const data = await readData();
      const task = resolveTask(data, taskId);
      const updated = await updateRecord("tasks", task.id, taskPatchFromInput(data, input));
      const next = await readData();
      const nextTask = next.tasks.find((item) => item.id === updated.id);
      if (!nextTask) throw new Error(`No se pudo leer la tarea actualizada: ${updated.id}`);
      return textJson(enrichTask(next, nextTask));
    },
  );

  server.registerTool(
    "crm_list_projects",
    {
      title: "List CRM projects",
      description: "Lista proyectos/deployments con cuenta, oportunidad, equipo, milestones, tareas, progreso y dependencias.",
      inputSchema: {
        query: z.string().optional().describe("Texto a buscar en el proyecto enriquecido."),
        status: z.string().optional().describe("Estado exacto del proyecto."),
        health: z.string().optional().describe("Health exacto: Green, Yellow o Red."),
        accountId: z.string().optional().describe("ID o nombre de la cuenta."),
        opportunityId: z.string().optional().describe("ID o nombre exacto de la oportunidad origen."),
        ownerId: z.string().optional().describe("ID, nombre o email del owner."),
        includeCompleted: z.boolean().optional().describe("Si es true incluye proyectos Completed y Cancelled."),
        limit: z.number().int().positive().max(100).optional(),
      },
    },
    async ({ query, status, health, accountId, opportunityId, ownerId, includeCompleted, limit }) => {
      const data = await readData();
      const resolvedAccountId = resolveAccountId(data, accountId);
      const resolvedOpportunityId = opportunityId ? resolveOpportunity(data, opportunityId).id : undefined;
      const resolvedOwnerId = resolveOwnerId(data, ownerId);
      const targetStatus = status ? normalizeText(status) : "";
      const targetHealth = health ? normalizeText(health) : "";
      const projects = data.projects
        .map((project) => enrichProject(data, project))
        .filter((project) => includeCompleted || !["Completed", "Cancelled"].includes(project.status))
        .filter((project) => !targetStatus || normalizeText(project.status) === targetStatus)
        .filter((project) => !targetHealth || normalizeText(project.health) === targetHealth)
        .filter((project) => !resolvedAccountId || project.accountId === resolvedAccountId)
        .filter((project) => !resolvedOpportunityId || project.opportunityId === resolvedOpportunityId)
        .filter((project) => !resolvedOwnerId || project.ownerId === resolvedOwnerId)
        .filter((project) => matchesQuery(project, query))
        .sort((left, right) => (left.targetGoLiveDate ?? "9999-12-31").localeCompare(right.targetGoLiveDate ?? "9999-12-31"))
        .slice(0, limit ?? 50);
      return textJson(projects);
    },
  );

  server.registerTool(
    "crm_create_project",
    {
      title: "Create CRM project",
      description: "Crea un proyecto/deployment relacionado con cuenta, oportunidad y contacto principal usando ids o nombres.",
      inputSchema: {
        name: z.string().describe("Nombre del proyecto."),
        accountId: z.string().nullable().optional().describe("ID o nombre de la cuenta."),
        opportunityId: z.string().nullable().optional().describe("ID o nombre exacto de la oportunidad origen."),
        primaryContactId: z.string().nullable().optional().describe("ID, nombre o email del contacto principal."),
        status: z.string().optional().describe("Estado del proyecto."),
        health: z.string().optional().describe("Health: Green, Yellow o Red."),
        startDate: z.string().optional().describe("Fecha de inicio YYYY-MM-DD."),
        targetGoLiveDate: z.string().optional().describe("Fecha objetivo de go-live YYYY-MM-DD."),
        actualGoLiveDate: z.string().optional().describe("Fecha real de go-live YYYY-MM-DD."),
        deploymentType: z.string().optional().describe("Tipo: Pilot, Production, Expansion o Internal."),
        ownerId: z.string().nullable().optional().describe("ID, nombre o email del owner del proyecto."),
        description: z.string().optional().describe("Descripcion."),
      },
    },
    async (input) => {
      const data = await readData();
      const created = await createRecord("projects", projectPatchFromInput(data, input));
      const next = await readData();
      const project = next.projects.find((item) => item.id === created.id);
      if (!project) throw new Error(`No se pudo leer el proyecto creado: ${created.id}`);
      return textJson(enrichProject(next, project));
    },
  );

  server.registerTool(
    "crm_update_project",
    {
      title: "Update CRM project",
      description: "Actualiza estado, health, fechas y relaciones de un proyecto/deployment. Null o cadena vacia limpian relaciones opcionales.",
      inputSchema: {
        projectId: z.string().describe("ID o nombre exacto del proyecto."),
        name: z.string().optional().describe("Nuevo nombre."),
        accountId: z.string().nullable().optional().describe("ID o nombre de la cuenta. Null/cadena vacia para limpiar."),
        opportunityId: z.string().nullable().optional().describe("ID o nombre exacto de oportunidad. Null/cadena vacia para limpiar."),
        primaryContactId: z.string().nullable().optional().describe("ID, nombre o email del contacto principal. Null/cadena vacia para limpiar."),
        status: z.string().optional().describe("Nuevo estado."),
        health: z.string().optional().describe("Nuevo health."),
        startDate: z.string().optional().describe("Fecha de inicio YYYY-MM-DD. Cadena vacia para limpiar."),
        targetGoLiveDate: z.string().optional().describe("Fecha objetivo de go-live YYYY-MM-DD. Cadena vacia para limpiar."),
        actualGoLiveDate: z.string().optional().describe("Fecha real de go-live YYYY-MM-DD. Cadena vacia para limpiar."),
        deploymentType: z.string().optional().describe("Tipo de deployment."),
        ownerId: z.string().nullable().optional().describe("ID, nombre o email del owner. Null/cadena vacia para limpiar."),
        description: z.string().optional().describe("Descripcion."),
      },
    },
    async ({ projectId, ...input }) => {
      const data = await readData();
      const project = resolveProject(data, projectId);
      const updated = await updateRecord("projects", project.id, projectPatchFromInput(data, input));
      const next = await readData();
      const nextProject = next.projects.find((item) => item.id === updated.id);
      if (!nextProject) throw new Error(`No se pudo leer el proyecto actualizado: ${updated.id}`);
      return textJson(enrichProject(next, nextProject));
    },
  );

  server.registerTool(
    "crm_add_project_member",
    {
      title: "Add CRM project member",
      description: "Anade un usuario interno a un proyecto con rol y porcentaje de dedicacion.",
      inputSchema: {
        projectId: z.string().describe("ID o nombre exacto del proyecto."),
        userId: z.string().describe("ID, nombre o email del usuario."),
        role: z.string().optional().describe("Rol del miembro, por ejemplo Project Lead, Developer o CSM."),
        allocationPercent: z.number().min(0).max(100).optional().describe("Dedicacion porcentual."),
      },
    },
    async ({ projectId, userId, role, allocationPercent }) => {
      const data = await readData();
      const project = resolveProject(data, projectId);
      const resolvedUserId = resolveOwnerId(data, userId);
      const created = await createRecord("projectMembers", {
        projectId: project.id,
        userId: resolvedUserId,
        role: role ?? "Project Lead",
        allocationPercent: allocationPercent ?? 100,
        ownerId: project.ownerId,
      });
      const next = await readData();
      return textJson({
        member: created,
        project: enrichProject(next, next.projects.find((item) => item.id === project.id) ?? project),
      });
    },
  );

  server.registerTool(
    "crm_create_project_milestone",
    {
      title: "Create CRM project milestone",
      description: "Crea un milestone/hito dentro de un proyecto de deployment.",
      inputSchema: {
        projectId: z.string().describe("ID o nombre exacto del proyecto."),
        name: z.string().describe("Nombre del milestone."),
        status: z.string().optional().describe("Estado del milestone."),
        startDate: z.string().optional().describe("Fecha de inicio YYYY-MM-DD."),
        dueDate: z.string().optional().describe("Fecha de vencimiento YYYY-MM-DD."),
        ownerId: z.string().nullable().optional().describe("ID, nombre o email del owner."),
        sortOrder: z.number().int().optional().describe("Orden dentro del proyecto."),
        description: z.string().optional().describe("Descripcion."),
      },
    },
    async ({ projectId, ownerId, ...input }) => {
      const data = await readData();
      const project = resolveProject(data, projectId);
      const created = await createRecord("projectMilestones", {
        ...input,
        projectId: project.id,
        ownerId: ownerId ? resolveOwnerId(data, ownerId) : project.ownerId,
      });
      const next = await readData();
      const milestone = next.projectMilestones.find((item) => item.id === created.id);
      if (!milestone) throw new Error(`No se pudo leer el milestone creado: ${created.id}`);
      return textJson(enrichMilestone(next, milestone));
    },
  );

  server.registerTool(
    "crm_add_task_dependency",
    {
      title: "Add CRM task dependency",
      description: "Crea una dependencia entre dos tareas de proyecto usando ids o asuntos exactos.",
      inputSchema: {
        predecessorTaskId: z.string().describe("ID o asunto exacto de la tarea predecesora."),
        successorTaskId: z.string().describe("ID o asunto exacto de la tarea sucesora."),
        projectId: z.string().nullable().optional().describe("ID o nombre exacto del proyecto. Si se omite se infiere de las tareas."),
        relationship: z.string().optional().describe("Finish to Start, Start to Start o Blocks."),
        description: z.string().optional().describe("Descripcion de la dependencia."),
      },
    },
    async ({ predecessorTaskId, successorTaskId, projectId, relationship, description }) => {
      const data = await readData();
      const predecessor = resolveTask(data, predecessorTaskId);
      const successor = resolveTask(data, successorTaskId);
      if (predecessor.id === successor.id) throw new Error("Una tarea no puede depender de si misma.");
      const created = await createRecord("taskDependencies", {
        predecessorTaskId: predecessor.id,
        successorTaskId: successor.id,
        projectId: projectId ? resolveProject(data, projectId).id : successor.projectId ?? predecessor.projectId,
        relationship: relationship ?? "Finish to Start",
        description,
      });
      const next = await readData();
      const dependency = next.taskDependencies.find((item) => item.id === created.id);
      if (!dependency) throw new Error(`No se pudo leer la dependencia creada: ${created.id}`);
      return textJson(enrichTaskDependency(next, dependency));
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

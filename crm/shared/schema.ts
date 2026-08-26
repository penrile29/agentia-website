export const objectKeys = [
  "leads",
  "accounts",
  "contacts",
  "opportunities",
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
  "products",
  "users",
] as const;

export type ObjectKey = (typeof objectKeys)[number];
export type PathObjectKey = "leads" | "opportunities" | "cases";
export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "url"
  | "password"
  | "date"
  | "datetime"
  | "number"
  | "currency"
  | "percent"
  | "picklist"
  | "reference"
  | "boolean";

export type RevenueType = "oneOff" | "mrr";

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
}

export interface User extends BaseRecord {
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  passwordHash?: string;
  passwordSalt?: string;
  passwordUpdatedAt?: string;
}

export interface Account extends BaseRecord {
  name: string;
  parentAccountId?: string;
  type: string;
  industry: string;
  rating: string;
  phone?: string;
  website?: string;
  billingCity?: string;
  billingCountry?: string;
  description?: string;
}

export interface Contact extends BaseRecord {
  firstName?: string;
  lastName: string;
  accountId?: string;
  title?: string;
  email?: string;
  phone?: string;
  leadSource?: string;
  description?: string;
}

export interface Lead extends BaseRecord {
  firstName?: string;
  lastName: string;
  company: string;
  status: string;
  leadSource: string;
  rating: string;
  email?: string;
  phone?: string;
  website?: string;
  isConverted: boolean;
  convertedDate?: string;
  convertedAccountId?: string;
  convertedContactId?: string;
  convertedOpportunityId?: string;
  description?: string;
}

export interface LeadConversionOptions {
  createOpportunity?: boolean;
  accountName?: string;
  contactFirstName?: string;
  contactLastName?: string;
  opportunityName?: string;
  closeDate?: string;
  oneOffAmount?: number;
  mrrAmount?: number;
}

export interface Opportunity extends BaseRecord {
  name: string;
  accountId?: string;
  contactId?: string;
  stageName: string;
  closeDate: string;
  oneOffAmount: number;
  mrrAmount: number;
  amount: number;
  amountMode: "manual" | "syncProducts" | "syncPrimaryProposal";
  syncedProposalId?: string;
  probability: number;
  type: string;
  leadSource?: string;
  currencyIsoCode: "EUR";
  description?: string;
}

export interface OpportunityLineItem extends BaseRecord {
  opportunityId: string;
  productId: string;
  revenueType: RevenueType;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  totalPrice: number;
  serviceDate?: string;
}

export interface Product extends BaseRecord {
  name: string;
  productCode: string;
  family: string;
  revenueType: RevenueType;
  isActive: boolean;
  listPrice: number;
  currencyIsoCode: "EUR";
  description?: string;
}

export interface Proposal extends BaseRecord {
  name: string;
  proposalNumber: string;
  opportunityId?: string;
  accountId?: string;
  contactId?: string;
  status: string;
  expirationDate?: string;
  totalPrice: number;
  currencyIsoCode: "EUR";
  isSyncing: boolean;
  description?: string;
}

export interface ProposalLineItem extends BaseRecord {
  proposalId: string;
  productId: string;
  revenueType: RevenueType;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  totalPrice: number;
  serviceDate?: string;
}

export interface Invoice extends BaseRecord {
  invoiceNumber: string;
  accountId?: string;
  opportunityId?: string;
  proposalId?: string;
  status: string;
  settlementStatus: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  currencyIsoCode: "EUR";
  description?: string;
}

export interface InvoiceLine extends BaseRecord {
  invoiceId: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface CaseRecord extends BaseRecord {
  caseNumber: string;
  subject: string;
  accountId?: string;
  contactId?: string;
  status: string;
  priority: string;
  origin: string;
  type: string;
  isEscalated: boolean;
  closedDate?: string;
  description?: string;
}

export interface Project extends BaseRecord {
  name: string;
  accountId?: string;
  opportunityId?: string;
  primaryContactId?: string;
  status: string;
  health: string;
  startDate?: string;
  targetGoLiveDate?: string;
  actualGoLiveDate?: string;
  deploymentType: string;
  description?: string;
}

export interface ProjectMember extends BaseRecord {
  projectId: string;
  userId: string;
  role: string;
  allocationPercent: number;
  isActive: boolean;
}

export interface ProjectMilestone extends BaseRecord {
  projectId: string;
  name: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  sortOrder: number;
  description?: string;
}

export interface Task extends BaseRecord {
  subject: string;
  accountId?: string;
  contactId?: string;
  opportunityId?: string;
  projectId?: string;
  milestoneId?: string;
  status: string;
  priority: string;
  secondaryOwnerId?: string;
  dueDate?: string;
  completedDate?: string;
  blockedReason?: string;
  description?: string;
}

export interface TaskDependency extends BaseRecord {
  projectId?: string;
  predecessorTaskId: string;
  successorTaskId: string;
  relationship: string;
  description?: string;
}

export interface PathStep {
  value: string;
  label: string;
  probability?: number;
  isClosed?: boolean;
  isWon?: boolean;
  isConverted?: boolean;
}

export interface CrmData {
  version: number;
  users: User[];
  accounts: Account[];
  contacts: Contact[];
  leads: Lead[];
  opportunities: Opportunity[];
  opportunityLineItems: OpportunityLineItem[];
  products: Product[];
  proposals: Proposal[];
  proposalLineItems: ProposalLineItem[];
  invoices: Invoice[];
  invoiceLines: InvoiceLine[];
  projects: Project[];
  projectMembers: ProjectMember[];
  projectMilestones: ProjectMilestone[];
  tasks: Task[];
  taskDependencies: TaskDependency[];
  cases: CaseRecord[];
  pathConfigs: Record<PathObjectKey, PathStep[]>;
}

export type CrmRecord =
  | User
  | Account
  | Contact
  | Lead
  | Opportunity
  | OpportunityLineItem
  | Product
  | Proposal
  | ProposalLineItem
  | Invoice
  | InvoiceLine
  | Project
  | ProjectMember
  | ProjectMilestone
  | Task
  | TaskDependency
  | CaseRecord;

export type CollectionRecord = {
  users: User;
  accounts: Account;
  contacts: Contact;
  leads: Lead;
  opportunities: Opportunity;
  opportunityLineItems: OpportunityLineItem;
  products: Product;
  proposals: Proposal;
  proposalLineItems: ProposalLineItem;
  invoices: Invoice;
  invoiceLines: InvoiceLine;
  projects: Project;
  projectMembers: ProjectMember;
  projectMilestones: ProjectMilestone;
  tasks: Task;
  taskDependencies: TaskDependency;
  cases: CaseRecord;
};

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  picklist?: string;
  relation?: ObjectKey;
  table?: boolean;
  readOnly?: boolean;
  importable?: boolean;
  detail?: boolean;
}

export interface ObjectLabel {
  singular: string;
  plural: string;
  apiName: string;
  description: string;
}

export const objectLabels: Record<ObjectKey, ObjectLabel> = {
  leads: {
    singular: "Lead",
    plural: "Leads",
    apiName: "Lead",
    description: "Persona o empresa interesada, antes de convertirla en cuenta, contacto y oportunidad.",
  },
  accounts: {
    singular: "Cuenta",
    plural: "Cuentas",
    apiName: "Account",
    description: "Empresa u organizacion con la que Oakbase mantiene relacion comercial.",
  },
  contacts: {
    singular: "Contacto",
    plural: "Contactos",
    apiName: "Contact",
    description: "Persona asociada a una cuenta.",
  },
  opportunities: {
    singular: "Oportunidad",
    plural: "Oportunidades",
    apiName: "Opportunity",
    description: "Venta o deal potencial asociado normalmente a una cuenta.",
  },
  opportunityLineItems: {
    singular: "Producto de oportunidad",
    plural: "Productos de oportunidad",
    apiName: "OpportunityLineItem",
    description: "Linea de producto asociada a una oportunidad.",
  },
  proposals: {
    singular: "Propuesta",
    plural: "Propuestas",
    apiName: "Quote",
    description: "Precio propuesto para productos y servicios, equivalente funcional a Quote.",
  },
  proposalLineItems: {
    singular: "Linea de propuesta",
    plural: "Lineas de propuesta",
    apiName: "QuoteLineItem",
    description: "Linea de producto asociada a una propuesta.",
  },
  invoices: {
    singular: "Factura",
    plural: "Facturas",
    apiName: "Invoice",
    description: "Factura generada para una cuenta, oportunidad o propuesta.",
  },
  invoiceLines: {
    singular: "Linea de factura",
    plural: "Lineas de factura",
    apiName: "InvoiceLine",
    description: "Importe a pagar por producto, servicio o fee.",
  },
  projects: {
    singular: "Proyecto",
    plural: "Proyectos",
    apiName: "Project",
    description: "Deployment de cliente asociado a cuenta, oportunidad, equipo, milestones y tareas.",
  },
  projectMembers: {
    singular: "Miembro de proyecto",
    plural: "Miembros de proyecto",
    apiName: "ProjectMember",
    description: "Persona interna asignada a un proyecto con rol y dedicacion.",
  },
  projectMilestones: {
    singular: "Milestone",
    plural: "Milestones",
    apiName: "ProjectMilestone",
    description: "Fase o hito de delivery dentro de un deployment de cliente.",
  },
  tasks: {
    singular: "Tarea",
    plural: "Tareas",
    apiName: "Task",
    description: "Actividad o accion pendiente asignada a un owner, con estado y fecha de vencimiento.",
  },
  taskDependencies: {
    singular: "Dependencia de tarea",
    plural: "Dependencias de tareas",
    apiName: "TaskDependency",
    description: "Relacion de bloqueo o secuencia entre tareas de proyecto.",
  },
  cases: {
    singular: "Caso",
    plural: "Casos",
    apiName: "Case",
    description: "Incidencia, pregunta o solicitud de cliente.",
  },
  products: {
    singular: "Producto",
    plural: "Productos",
    apiName: "Product2",
    description: "Producto o servicio que Oakbase vende.",
  },
  users: {
    singular: "Usuario",
    plural: "Usuarios",
    apiName: "User",
    description: "Usuario interno con rol editable por administradores.",
  },
};

export const picklists = {
  roles: ["Admin", "Ventas", "Customer Success", "Finanzas", "Operaciones"],
  accountTypes: ["Prospect", "Customer", "Partner", "Competitor", "Other"],
  industries: ["Technology", "Professional Services", "Healthcare", "Finance", "Retail", "Manufacturing", "Other"],
  ratings: ["Hot", "Warm", "Cold"],
  leadSources: ["Web", "Referral", "LinkedIn", "Partner", "Event", "Outbound", "Other"],
  opportunityTypes: ["New Business", "Existing Business", "Renewal", "Expansion"],
  proposalStatuses: ["Draft", "In Review", "Approved", "Presented", "Accepted", "Rejected", "Expired"],
  invoiceStatuses: ["Draft", "Pending", "Posted", "Voided", "Canceled"],
  settlementStatuses: ["Not Applicable", "Not Settled", "Partially Settled", "Settled"],
  casePriorities: ["Low", "Medium", "High", "Critical"],
  caseOrigins: ["Email", "Phone", "Web", "LinkedIn", "Portal"],
  caseTypes: ["Question", "Feature Request", "Problem", "Implementation", "Billing"],
  taskStatuses: ["Not Started", "In Progress", "Waiting", "Completed", "Deferred"],
  taskPriorities: ["Low", "Medium", "High", "Critical"],
  projectStatuses: ["Not Started", "Planning", "In Progress", "Blocked", "At Risk", "Completed", "Cancelled"],
  projectHealth: ["Green", "Yellow", "Red"],
  deploymentTypes: ["Pilot", "Production", "Expansion", "Internal"],
  projectMemberRoles: ["Project Lead", "Solution Engineer", "Developer", "CSM", "Sales", "QA", "Sponsor"],
  milestoneStatuses: ["Not Started", "In Progress", "Blocked", "Completed", "Skipped"],
  dependencyRelationships: ["Finish to Start", "Start to Start", "Blocks"],
  productFamilies: ["Agentic Ops", "Consulting", "Workspace", "Support", "Training"],
  revenueTypes: ["oneOff", "mrr"],
};

const sharedFields: FieldConfig[] = [
  { key: "ownerId", label: "Owner", type: "reference", relation: "users", importable: true },
  { key: "createdAt", label: "Created Date", type: "datetime", readOnly: true, table: false },
  { key: "updatedAt", label: "Last Modified Date", type: "datetime", readOnly: true, table: false },
];

export const fieldConfigs: Record<ObjectKey, FieldConfig[]> = {
  leads: [
    { key: "firstName", label: "First Name", type: "text", importable: true },
    { key: "lastName", label: "Last Name", type: "text", required: true, table: true, importable: true },
    { key: "company", label: "Company", type: "text", required: true, table: true, importable: true },
    { key: "status", label: "Status", type: "picklist", picklist: "leadPath", required: true, table: true, importable: true },
    { key: "leadSource", label: "Lead Source", type: "picklist", picklist: "leadSources", table: true, importable: true },
    { key: "rating", label: "Rating", type: "picklist", picklist: "ratings", table: true, importable: true },
    { key: "email", label: "Email", type: "email", table: true, importable: true },
    { key: "phone", label: "Phone", type: "phone", importable: true },
    { key: "website", label: "Website", type: "url", importable: true },
    { key: "isConverted", label: "Converted", type: "boolean", readOnly: true, table: true },
    { key: "convertedAccountId", label: "Converted Account", type: "reference", relation: "accounts", readOnly: true, table: false },
    { key: "convertedContactId", label: "Converted Contact", type: "reference", relation: "contacts", readOnly: true, table: false },
    { key: "convertedOpportunityId", label: "Converted Opportunity", type: "reference", relation: "opportunities", readOnly: true, table: false },
    { key: "description", label: "Description", type: "textarea", importable: true, table: false },
    ...sharedFields,
  ],
  accounts: [
    { key: "name", label: "Account Name", type: "text", required: true, table: true, importable: true },
    { key: "parentAccountId", label: "Parent Account", type: "reference", relation: "accounts", importable: true },
    { key: "type", label: "Type", type: "picklist", picklist: "accountTypes", table: true, importable: true },
    { key: "industry", label: "Industry", type: "picklist", picklist: "industries", table: true, importable: true },
    { key: "rating", label: "Rating", type: "picklist", picklist: "ratings", table: true, importable: true },
    { key: "phone", label: "Phone", type: "phone", importable: true },
    { key: "website", label: "Website", type: "url", importable: true },
    { key: "billingCity", label: "Billing City", type: "text", importable: true },
    { key: "billingCountry", label: "Billing Country", type: "text", importable: true },
    { key: "description", label: "Description", type: "textarea", importable: true, table: false },
    ...sharedFields,
  ],
  contacts: [
    { key: "firstName", label: "First Name", type: "text", importable: true },
    { key: "lastName", label: "Last Name", type: "text", required: true, table: true, importable: true },
    { key: "accountId", label: "Account", type: "reference", relation: "accounts", table: true, importable: true },
    { key: "title", label: "Title", type: "text", table: true, importable: true },
    { key: "email", label: "Email", type: "email", table: true, importable: true },
    { key: "phone", label: "Phone", type: "phone", importable: true },
    { key: "leadSource", label: "Lead Source", type: "picklist", picklist: "leadSources", importable: true },
    { key: "description", label: "Description", type: "textarea", importable: true, table: false },
    ...sharedFields,
  ],
  opportunities: [
    { key: "name", label: "Opportunity Name", type: "text", required: true, table: true, importable: true },
    { key: "accountId", label: "Account", type: "reference", relation: "accounts", table: true, importable: true },
    { key: "contactId", label: "Primary Contact", type: "reference", relation: "contacts", importable: true },
    { key: "stageName", label: "Stage", type: "picklist", picklist: "opportunityPath", required: true, table: true, importable: true },
    { key: "closeDate", label: "Close Date", type: "date", required: true, table: true, importable: true },
    { key: "oneOffAmount", label: "One-off Amount", type: "currency", table: true, importable: true },
    { key: "mrrAmount", label: "MRR", type: "currency", table: true, importable: true },
    { key: "amount", label: "Annualized Amount", type: "currency", readOnly: true, table: true },
    { key: "amountMode", label: "Amount Source", type: "picklist", picklist: "amountModes", importable: true },
    { key: "syncedProposalId", label: "Synced Proposal", type: "reference", relation: "proposals", importable: true },
    { key: "probability", label: "Probability", type: "percent", table: true, importable: true },
    { key: "type", label: "Type", type: "picklist", picklist: "opportunityTypes", importable: true },
    { key: "leadSource", label: "Lead Source", type: "picklist", picklist: "leadSources", importable: true },
    { key: "currencyIsoCode", label: "Currency", type: "text", readOnly: true, table: false },
    { key: "description", label: "Description", type: "textarea", importable: true, table: false },
    ...sharedFields,
  ],
  opportunityLineItems: [
    { key: "opportunityId", label: "Opportunity", type: "reference", relation: "opportunities", required: true, table: true, importable: true },
    { key: "productId", label: "Product", type: "reference", relation: "products", required: true, table: true, importable: true },
    { key: "revenueType", label: "Revenue Type", type: "picklist", picklist: "revenueTypes", table: true, importable: true },
    { key: "quantity", label: "Quantity", type: "number", required: true, table: true, importable: true },
    { key: "unitPrice", label: "Unit Price", type: "currency", required: true, table: true, importable: true },
    { key: "discountPercent", label: "Discount %", type: "percent", table: true, importable: true },
    { key: "totalPrice", label: "Total Price", type: "currency", readOnly: true, table: true },
    { key: "serviceDate", label: "Service Date", type: "date", importable: true },
    ...sharedFields,
  ],
  proposals: [
    { key: "name", label: "Proposal Name", type: "text", required: true, table: true, importable: true },
    { key: "proposalNumber", label: "Proposal Number", type: "text", readOnly: true, table: true, importable: true },
    { key: "opportunityId", label: "Opportunity", type: "reference", relation: "opportunities", table: true, importable: true },
    { key: "accountId", label: "Account", type: "reference", relation: "accounts", table: true, importable: true },
    { key: "contactId", label: "Contact", type: "reference", relation: "contacts", importable: true },
    { key: "status", label: "Status", type: "picklist", picklist: "proposalStatuses", table: true, importable: true },
    { key: "expirationDate", label: "Expiration Date", type: "date", importable: true },
    { key: "totalPrice", label: "Total Price", type: "currency", readOnly: true, table: true },
    { key: "currencyIsoCode", label: "Currency", type: "text", readOnly: true, table: false },
    { key: "isSyncing", label: "Syncing", type: "boolean", table: true, importable: true },
    { key: "description", label: "Description", type: "textarea", importable: true, table: false },
    ...sharedFields,
  ],
  proposalLineItems: [
    { key: "proposalId", label: "Proposal", type: "reference", relation: "proposals", required: true, table: true, importable: true },
    { key: "productId", label: "Product", type: "reference", relation: "products", required: true, table: true, importable: true },
    { key: "revenueType", label: "Revenue Type", type: "picklist", picklist: "revenueTypes", table: true, importable: true },
    { key: "quantity", label: "Quantity", type: "number", required: true, table: true, importable: true },
    { key: "unitPrice", label: "Unit Price", type: "currency", required: true, table: true, importable: true },
    { key: "discountPercent", label: "Discount %", type: "percent", table: true, importable: true },
    { key: "totalPrice", label: "Total Price", type: "currency", readOnly: true, table: true },
    { key: "serviceDate", label: "Service Date", type: "date", importable: true },
    ...sharedFields,
  ],
  invoices: [
    { key: "invoiceNumber", label: "Invoice Number", type: "text", readOnly: true, table: true, importable: true },
    { key: "accountId", label: "Account", type: "reference", relation: "accounts", table: true, importable: true },
    { key: "opportunityId", label: "Opportunity", type: "reference", relation: "opportunities", importable: true },
    { key: "proposalId", label: "Proposal", type: "reference", relation: "proposals", importable: true },
    { key: "status", label: "Status", type: "picklist", picklist: "invoiceStatuses", table: true, importable: true },
    { key: "settlementStatus", label: "Settlement Status", type: "picklist", picklist: "settlementStatuses", table: true, importable: true },
    { key: "invoiceDate", label: "Invoice Date", type: "date", table: true, importable: true },
    { key: "dueDate", label: "Due Date", type: "date", importable: true },
    { key: "totalAmount", label: "Total Amount", type: "currency", readOnly: true, table: true },
    { key: "currencyIsoCode", label: "Currency", type: "text", readOnly: true, table: false },
    { key: "description", label: "Description", type: "textarea", importable: true, table: false },
    ...sharedFields,
  ],
  invoiceLines: [
    { key: "invoiceId", label: "Invoice", type: "reference", relation: "invoices", required: true, table: true, importable: true },
    { key: "productId", label: "Product", type: "reference", relation: "products", table: true, importable: true },
    { key: "description", label: "Description", type: "text", required: true, table: true, importable: true },
    { key: "quantity", label: "Quantity", type: "number", required: true, table: true, importable: true },
    { key: "unitPrice", label: "Unit Price", type: "currency", required: true, table: true, importable: true },
    { key: "totalAmount", label: "Total Amount", type: "currency", readOnly: true, table: true },
    ...sharedFields,
  ],
  projects: [
    { key: "name", label: "Project Name", type: "text", required: true, table: true, importable: true },
    { key: "accountId", label: "Account", type: "reference", relation: "accounts", table: true, importable: true },
    { key: "opportunityId", label: "Source Opportunity", type: "reference", relation: "opportunities", table: true, importable: true },
    { key: "primaryContactId", label: "Primary Contact", type: "reference", relation: "contacts", importable: true },
    { key: "status", label: "Status", type: "picklist", picklist: "projectStatuses", required: true, table: true, importable: true },
    { key: "health", label: "Health", type: "picklist", picklist: "projectHealth", required: true, table: true, importable: true },
    { key: "deploymentType", label: "Deployment Type", type: "picklist", picklist: "deploymentTypes", table: true, importable: true },
    { key: "startDate", label: "Start Date", type: "date", table: true, importable: true },
    { key: "targetGoLiveDate", label: "Target Go-live", type: "date", table: true, importable: true },
    { key: "actualGoLiveDate", label: "Actual Go-live", type: "date", importable: true },
    { key: "description", label: "Description", type: "textarea", table: false, importable: true },
    ...sharedFields,
  ],
  projectMembers: [
    { key: "projectId", label: "Project", type: "reference", relation: "projects", required: true, table: true, importable: true },
    { key: "userId", label: "User", type: "reference", relation: "users", required: true, table: true, importable: true },
    { key: "role", label: "Project Role", type: "picklist", picklist: "projectMemberRoles", required: true, table: true, importable: true },
    { key: "allocationPercent", label: "Allocation %", type: "percent", table: true, importable: true },
    { key: "isActive", label: "Active", type: "boolean", table: true, importable: true },
    ...sharedFields,
  ],
  projectMilestones: [
    { key: "projectId", label: "Project", type: "reference", relation: "projects", required: true, table: true, importable: true },
    { key: "name", label: "Milestone Name", type: "text", required: true, table: true, importable: true },
    { key: "status", label: "Status", type: "picklist", picklist: "milestoneStatuses", required: true, table: true, importable: true },
    { key: "startDate", label: "Start Date", type: "date", table: true, importable: true },
    { key: "dueDate", label: "Due Date", type: "date", table: true, importable: true },
    { key: "completedDate", label: "Completed Date", type: "date", table: true, importable: true },
    { key: "sortOrder", label: "Order", type: "number", table: true, importable: true },
    { key: "description", label: "Description", type: "textarea", table: false, importable: true },
    ...sharedFields,
  ],
  tasks: [
    { key: "subject", label: "Subject", type: "text", required: true, table: true, importable: true },
    { key: "accountId", label: "Account", type: "reference", relation: "accounts", table: true, importable: true },
    { key: "contactId", label: "Contact", type: "reference", relation: "contacts", table: true, importable: true },
    { key: "opportunityId", label: "Opportunity", type: "reference", relation: "opportunities", table: true, importable: true },
    { key: "projectId", label: "Project", type: "reference", relation: "projects", table: true, importable: true },
    { key: "milestoneId", label: "Milestone", type: "reference", relation: "projectMilestones", table: true, importable: true },
    { key: "ownerId", label: "Owner", type: "reference", relation: "users", table: true, importable: true },
    { key: "secondaryOwnerId", label: "Second Assignee", type: "reference", relation: "users", table: true, importable: true },
    { key: "status", label: "Status", type: "picklist", picklist: "taskStatuses", required: true, table: true, importable: true },
    { key: "priority", label: "Priority", type: "picklist", picklist: "taskPriorities", table: true, importable: true },
    { key: "dueDate", label: "Due Date", type: "date", table: true, importable: true },
    { key: "completedDate", label: "Completed Date", type: "date", importable: true },
    { key: "blockedReason", label: "Blocked Reason", type: "textarea", table: false, importable: true },
    { key: "description", label: "Description", type: "textarea", table: false, importable: true },
    { key: "createdAt", label: "Created Date", type: "datetime", readOnly: true, table: false },
    { key: "updatedAt", label: "Last Modified Date", type: "datetime", readOnly: true, table: false },
  ],
  taskDependencies: [
    { key: "projectId", label: "Project", type: "reference", relation: "projects", table: true, importable: true },
    { key: "predecessorTaskId", label: "Predecessor Task", type: "reference", relation: "tasks", required: true, table: true, importable: true },
    { key: "successorTaskId", label: "Successor Task", type: "reference", relation: "tasks", required: true, table: true, importable: true },
    { key: "relationship", label: "Relationship", type: "picklist", picklist: "dependencyRelationships", required: true, table: true, importable: true },
    { key: "description", label: "Description", type: "textarea", table: false, importable: true },
    ...sharedFields,
  ],
  cases: [
    { key: "caseNumber", label: "Case Number", type: "text", readOnly: true, table: true, importable: true },
    { key: "subject", label: "Subject", type: "text", required: true, table: true, importable: true },
    { key: "accountId", label: "Account", type: "reference", relation: "accounts", table: true, importable: true },
    { key: "contactId", label: "Contact", type: "reference", relation: "contacts", table: true, importable: true },
    { key: "status", label: "Status", type: "picklist", picklist: "casePath", required: true, table: true, importable: true },
    { key: "priority", label: "Priority", type: "picklist", picklist: "casePriorities", table: true, importable: true },
    { key: "origin", label: "Case Origin", type: "picklist", picklist: "caseOrigins", table: true, importable: true },
    { key: "type", label: "Type", type: "picklist", picklist: "caseTypes", importable: true },
    { key: "isEscalated", label: "Escalated", type: "boolean", table: true, importable: true },
    { key: "closedDate", label: "Closed Date", type: "datetime", readOnly: true, table: false },
    { key: "description", label: "Description", type: "textarea", importable: true, table: false },
    ...sharedFields,
  ],
  products: [
    { key: "name", label: "Product Name", type: "text", required: true, table: true, importable: true },
    { key: "productCode", label: "Product Code", type: "text", table: true, importable: true },
    { key: "family", label: "Product Family", type: "picklist", picklist: "productFamilies", table: true, importable: true },
    { key: "revenueType", label: "Revenue Type", type: "picklist", picklist: "revenueTypes", table: true, importable: true },
    { key: "isActive", label: "Active", type: "boolean", table: true, importable: true },
    { key: "listPrice", label: "List Price", type: "currency", table: true, importable: true },
    { key: "currencyIsoCode", label: "Currency", type: "text", readOnly: true, table: false },
    { key: "description", label: "Description", type: "textarea", importable: true, table: false },
    ...sharedFields,
  ],
  users: [
    { key: "name", label: "Name", type: "text", required: true, table: true, importable: true },
    { key: "email", label: "Email", type: "email", required: true, table: true, importable: true },
    { key: "temporaryPassword", label: "Password", type: "password", table: false },
    { key: "role", label: "Role", type: "picklist", picklist: "roles", table: true, importable: true },
    { key: "isAdmin", label: "Admin", type: "boolean", table: true, importable: true },
    { key: "createdAt", label: "Created Date", type: "datetime", readOnly: true, table: false },
    { key: "updatedAt", label: "Last Modified Date", type: "datetime", readOnly: true, table: false },
  ],
};

export const pathObjects: PathObjectKey[] = ["leads", "opportunities", "cases"];

export const defaultPathConfigs: Record<PathObjectKey, PathStep[]> = {
  leads: [
    { value: "Open - Not Contacted", label: "Open - Not Contacted" },
    { value: "Working - Contacted", label: "Working - Contacted" },
    { value: "Closed - Converted", label: "Closed - Converted", isConverted: true, isClosed: true },
    { value: "Closed - Not Converted", label: "Closed - Not Converted", isClosed: true },
  ],
  opportunities: [
    { value: "Prospecting", label: "Prospecting", probability: 10 },
    { value: "Qualification", label: "Qualification", probability: 20 },
    { value: "Needs Analysis", label: "Needs Analysis", probability: 25 },
    { value: "Value Proposition", label: "Value Proposition", probability: 40 },
    { value: "Proposal/Price Quote", label: "Proposal/Price Quote", probability: 60 },
    { value: "Negotiation/Review", label: "Negotiation/Review", probability: 80 },
    { value: "Closed Won", label: "Closed Won", probability: 100, isClosed: true, isWon: true },
    { value: "Closed Lost", label: "Closed Lost", probability: 0, isClosed: true },
  ],
  cases: [
    { value: "New", label: "New" },
    { value: "Working", label: "Working" },
    { value: "Escalated", label: "Escalated" },
    { value: "Closed", label: "Closed", isClosed: true },
  ],
};

export const amountModes = [
  { value: "manual", label: "Manual" },
  { value: "syncProducts", label: "Sincronizar productos" },
  { value: "syncPrimaryProposal", label: "Sincronizar propuesta" },
];

export const pathFieldByObject: Record<PathObjectKey, string> = {
  leads: "status",
  opportunities: "stageName",
  cases: "status",
};

export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function money(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function recordDisplayName(data: CrmData, object: ObjectKey, id?: string): string {
  if (!id) return "-";
  const collection = data[object] as CrmRecord[];
  const record = collection.find((item) => item.id === id) as unknown as Record<string, unknown> | undefined;
  if (!record) return id;
  if (typeof record.name === "string") return record.name;
  if (typeof record.subject === "string") return record.subject;
  if (typeof record.invoiceNumber === "string") return record.invoiceNumber;
  if (typeof record.proposalNumber === "string") return record.proposalNumber;
  if (typeof record.caseNumber === "string") return record.caseNumber;
  if (typeof record.predecessorTaskId === "string" && typeof record.successorTaskId === "string") {
    return `${recordDisplayName(data, "tasks", record.predecessorTaskId)} -> ${recordDisplayName(data, "tasks", record.successorTaskId)}`;
  }
  if (typeof record.projectId === "string" && typeof record.userId === "string") {
    return `${recordDisplayName(data, "users", record.userId)} · ${recordDisplayName(data, "projects", record.projectId)}`;
  }
  if (typeof record.email === "string" && typeof record.name !== "string") return record.email;
  const firstName = typeof record.firstName === "string" ? record.firstName : "";
  const lastName = typeof record.lastName === "string" ? record.lastName : "";
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || id;
}

export function getPicklistValues(data: CrmData, picklistName?: string): string[] {
  if (!picklistName) return [];
  if (picklistName === "leadPath") return data.pathConfigs.leads.map((step) => step.value);
  if (picklistName === "opportunityPath") return data.pathConfigs.opportunities.map((step) => step.value);
  if (picklistName === "casePath") return data.pathConfigs.cases.map((step) => step.value);
  if (picklistName === "amountModes") return amountModes.map((item) => item.value);
  if (picklistName === "revenueTypes") return picklists.revenueTypes;
  return (picklists as Record<string, string[]>)[picklistName] ?? [];
}

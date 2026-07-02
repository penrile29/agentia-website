import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import Papa from "papaparse";
import readXlsxFile from "read-excel-file/browser";
import {
  ArrowLeft,
  ArrowRightLeft,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Database,
  Filter,
  FileText,
  Home,
  LifeBuoy,
  ListChecks,
  LogOut,
  Package,
  PanelRight,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Search,
  Settings,
  Target,
  TrendingUp,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import {
  amountModes,
  fieldConfigs,
  getPicklistValues,
  money,
  objectLabels,
  pathFieldByObject,
  pathObjects,
  recordDisplayName,
} from "../shared/schema.ts";
import type { CrmData, CrmRecord, FieldConfig, ObjectKey, PathObjectKey, PathStep, RevenueType } from "../shared/schema.ts";

type PageState =
  | { type: "home" }
  | { type: "setup" }
  | { type: "list"; object: ObjectKey }
  | { type: "record"; object: ObjectKey; id: string };
type DashboardPeriod = "all" | "thisQuarter" | "next90" | "thisYear";
type DashboardOpportunityScope = "open" | "all" | "won";
type RecordMap = Record<string, unknown>;
type AuthSession = { token: string; user: CrmData["users"][number] };
type SetCrmData = Dispatch<SetStateAction<CrmData | null>>;
type InlineSaveStatus = { state: "saving" | "saved" | "error"; message?: string };
type ModalState =
  | { type: "record"; object: ObjectKey; record?: CrmRecord }
  | { type: "import"; object: ObjectKey }
  | { type: "convertLead"; lead: CrmData["leads"][number] }
  | null;

const navObjects: ObjectKey[] = ["leads", "accounts", "contacts", "opportunities", "tasks", "proposals", "invoices", "cases", "products"];
const authStorageKey = "agentia-crm-session";

const objectIcons: Record<ObjectKey, React.ComponentType<{ size?: number }>> = {
  leads: User,
  accounts: Building2,
  contacts: Users,
  opportunities: Target,
  opportunityLineItems: ListChecks,
  proposals: FileText,
  proposalLineItems: ListChecks,
  invoices: Receipt,
  invoiceLines: ListChecks,
  tasks: ListChecks,
  cases: LifeBuoy,
  products: Package,
  users: Users,
};

const inlineReadOnlyFields = new Set(["id", "createdAt", "updatedAt"]);
const inlineEditableTypes = new Set<FieldConfig["type"]>(["text", "email", "phone", "url", "date", "datetime", "number", "currency", "percent", "picklist", "boolean", "reference"]);

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getStoredSession()?.token;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Error en la API");
  return payload;
}

function App() {
  const [data, setData] = useState<CrmData | null>(null);
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [activePage, setActivePage] = useState<PageState>({ type: "home" });
  const [modal, setModal] = useState<ModalState>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      setData(await apiRequest<CrmData>("/api/state"));
      setError(null);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "No se pudo cargar el CRM";
      if (message.includes("Login") || message.includes("Sesion")) {
        clearStoredSession();
        setSession(null);
        setData(null);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) {
      void loadData();
    } else {
      setLoading(false);
    }
  }, [session?.token]);

  async function handleLogin(email: string, password: string) {
    const result = await apiRequest<AuthSession>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    storeSession(result);
    setSession(result);
    setActivePage({ type: "home" });
  }

  function handleLogout() {
    clearStoredSession();
    setSession(null);
    setData(null);
    setActivePage({ type: "home" });
  }

  async function handleReset() {
    if (!window.confirm("Esto reinicia la demo con datos de ejemplo. Continuar?")) return;
    setData(await apiRequest<CrmData>("/api/reset", { method: "POST", body: "{}" }));
  }

  if (!session) {
    return <LoginScreen error={error} onLogin={handleLogin} />;
  }

  if (loading && !data) {
    return (
      <main className="loading-shell">
        <div className="spinner" />
        <p>Cargando Agentia CRM...</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="loading-shell">
        <p>{error ?? "CRM no disponible"}</p>
        <button className="slds-button primary" type="button" onClick={() => void loadData()}>
          <RefreshCw size={16} /> Reintentar
        </button>
      </main>
    );
  }

  return (
    <div className="crm-shell">
      <header className="global-header">
        <button className="app-launcher" type="button" aria-label="App launcher">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </button>
        <div className="brand-lockup">
          <img src="/agentia-mark-h.svg" alt="" />
          <div>
            <strong>Agentia CRM</strong>
            <span>Sales Workspace</span>
          </div>
        </div>
        <div className="global-search">
          <Search size={16} />
          <input placeholder="Buscar en Agentia CRM" />
        </div>
        <button className="icon-button" type="button" onClick={() => void loadData()} title="Actualizar">
          <RefreshCw size={17} />
        </button>
        <button className="icon-button" type="button" onClick={() => setActivePage({ type: "setup" })} title="Setup">
          <Settings size={17} />
        </button>
        <button className="user-menu" type="button" onClick={handleLogout} title="Cerrar sesion">
          <span>{session.user.name}</span>
          <LogOut size={16} />
        </button>
      </header>

      <nav className="object-tabs" aria-label="CRM objects">
        <button className={activePage.type === "home" ? "active" : ""} type="button" onClick={() => setActivePage({ type: "home" })}>
          <Home size={16} /> Home
        </button>
        {navObjects.map((object) => {
          const Icon = objectIcons[object];
          return (
            <button
              className={(activePage.type === "list" || activePage.type === "record") && activePage.object === object ? "active" : ""}
              key={object}
              type="button"
              onClick={() => setActivePage({ type: "list", object })}
            >
              <Icon size={16} /> {objectLabels[object].plural}
            </button>
          );
        })}
        <button className={activePage.type === "setup" ? "active" : ""} type="button" onClick={() => setActivePage({ type: "setup" })}>
          <Settings size={16} /> Setup
        </button>
      </nav>

      {error ? <div className="toast">{error}</div> : null}

      <main className="workspace">
        {activePage.type === "home" ? (
          <Dashboard data={data} setActivePage={setActivePage} openImport={(object) => setModal({ type: "import", object })} />
        ) : activePage.type === "setup" ? (
          <Setup currentUserId={session.user.id} data={data} reload={loadData} reset={handleReset} />
        ) : activePage.type === "list" ? (
          <ObjectListPage
            data={data}
            object={activePage.object}
            reload={loadData}
            setData={setData}
            openModal={setModal}
            openRecord={(object, id) => setActivePage({ type: "record", object, id })}
          />
        ) : (
          <RecordPage
            data={data}
            object={activePage.object}
            recordId={activePage.id}
            reload={loadData}
            setData={setData}
            openModal={setModal}
            openList={(object) => setActivePage({ type: "list", object })}
            openRecord={(object, id) => setActivePage({ type: "record", object, id })}
          />
        )}
      </main>

      {modal?.type === "record" ? <RecordModal data={data} object={modal.object} record={modal.record} close={() => setModal(null)} reload={loadData} /> : null}
      {modal?.type === "import" ? <ImportModal object={modal.object} close={() => setModal(null)} reload={loadData} /> : null}
      {modal?.type === "convertLead" ? <ConvertLeadModal lead={modal.lead} close={() => setModal(null)} reload={loadData} /> : null}
    </div>
  );
}

function LoginScreen({ error, onLogin }: { error: string | null; onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("nuria@agentialabs.ai");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setLoginError(null);
    try {
      await onLogin(email, password);
    } catch (submitError) {
      setLoginError(submitError instanceof Error ? submitError.message : "No se pudo iniciar sesion.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-label="Agentia CRM login">
        <div className="login-brand">
          <img src="/agentia-mark-h.svg" alt="" />
          <div>
            <strong>Agentia CRM</strong>
            <span>Sales Workspace</span>
          </div>
        </div>
        <div className="login-copy">
          <p className="eyebrow">Login</p>
          <h1>Accede a tu workspace comercial</h1>
        </div>
        <form className="login-form" onSubmit={(event) => void submit(event)}>
          <label>
            Email
            <input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Contraseña
            <input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {loginError || error ? <div className="login-error">{loginError ?? error}</div> : null}
          <button className="slds-button primary login-submit" type="submit" disabled={busy}>
            {busy ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="login-hint">
          <span>Demo</span>
          <code>nuria@agentialabs.ai / Agentia2026!</code>
        </div>
      </section>
    </main>
  );
}

function Dashboard({
  data,
  setActivePage,
  openImport,
}: {
  data: CrmData;
  setActivePage: (page: PageState) => void;
  openImport: (object: ObjectKey) => void;
}) {
  const [period, setPeriod] = useState<DashboardPeriod>("next90");
  const [ownerId, setOwnerId] = useState("all");
  const [opportunityScope, setOpportunityScope] = useState<DashboardOpportunityScope>("open");
  const [leadSource, setLeadSource] = useState("all");
  const periodBounds = useMemo(() => dashboardPeriodBounds(period), [period]);
  const ownerMatches = (recordOwnerId?: string) => ownerId === "all" || recordOwnerId === ownerId;
  const periodMatches = (date?: string) => isWithinDashboardPeriod(date, periodBounds);
  const sourceMatches = (source?: string) => leadSource === "all" || source === leadSource;
  const leadSources = Array.from(new Set([...getPicklistValues(data, "leadSources"), ...data.leads.map((lead) => lead.leadSource), ...data.opportunities.map((opportunity) => opportunity.leadSource ?? "")])).filter(Boolean);

  const filteredLeads = data.leads.filter((lead) => ownerMatches(lead.ownerId) && periodMatches(lead.createdAt) && sourceMatches(lead.leadSource));
  const filteredOpportunities = data.opportunities.filter((opportunity) => ownerMatches(opportunity.ownerId) && periodMatches(opportunity.closeDate) && sourceMatches(opportunity.leadSource));
  const openOpportunities = filteredOpportunities.filter((opportunity) => !isClosedOpportunity(data, opportunity));
  const wonOpportunities = filteredOpportunities.filter((opportunity) => isWonOpportunity(data, opportunity));
  const scopedOpportunities = filteredOpportunities.filter((opportunity) => opportunityScopeMatches(data, opportunity, opportunityScope));
  const filteredCases = data.cases.filter((caseRecord) => ownerMatches(caseRecord.ownerId) && periodMatches(caseRecord.createdAt));
  const openCases = filteredCases.filter((caseRecord) => caseRecord.status !== "Closed");
  const pipelineOneOff = sumCurrency(openOpportunities.map((opportunity) => opportunity.oneOffAmount));
  const pipelineMrr = sumCurrency(openOpportunities.map((opportunity) => opportunity.mrrAmount));
  const wonOneOff = sumCurrency(wonOpportunities.map((opportunity) => opportunity.oneOffAmount));
  const wonMrr = sumCurrency(wonOpportunities.map((opportunity) => opportunity.mrrAmount));
  const weightedForecast = sumCurrency(openOpportunities.map((opportunity) => opportunity.amount * (opportunity.probability / 100)));
  const funnelRows = data.pathConfigs.opportunities.map((step) => {
    const opportunities = scopedOpportunities.filter((opportunity) => opportunity.stageName === step.value);
    const annualized = sumCurrency(opportunities.map((opportunity) => opportunity.amount));
    return {
      stage: step.label,
      probability: step.probability ?? 0,
      count: opportunities.length,
      oneOff: sumCurrency(opportunities.map((opportunity) => opportunity.oneOffAmount)),
      mrr: sumCurrency(opportunities.map((opportunity) => opportunity.mrrAmount)),
      annualized,
    };
  });
  const maxFunnelAnnualized = Math.max(...funnelRows.map((row) => row.annualized), 1);
  const maxRevenueBar = Math.max(pipelineOneOff, pipelineMrr * 12, weightedForecast, wonOneOff + wonMrr * 12, 1);
  const sourceRows = leadSources
    .map((source) => {
      const leads = filteredLeads.filter((lead) => lead.leadSource === source);
      const opportunities = filteredOpportunities.filter((opportunity) => opportunity.leadSource === source);
      const converted = leads.filter((lead) => lead.isConverted).length;
      return {
        source,
        leads: leads.length,
        converted,
        conversionRate: leads.length ? Math.round((converted / leads.length) * 100) : 0,
        opportunities: opportunities.length,
        pipeline: sumCurrency(opportunities.filter((opportunity) => !isClosedOpportunity(data, opportunity)).map((opportunity) => opportunity.amount)),
      };
    })
    .filter((row) => leadSource !== "all" || row.leads || row.opportunities)
    .sort((a, b) => b.pipeline - a.pipeline || b.leads - a.leads);
  const topOpportunities = openOpportunities
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const caseRows = data.pathConfigs.cases.map((step) => {
    const cases = filteredCases.filter((caseRecord) => caseRecord.status === step.value);
    return {
      status: step.label,
      count: cases.length,
      highPriority: cases.filter((caseRecord) => ["High", "Critical"].includes(caseRecord.priority)).length,
    };
  });
  const highPriorityCases = openCases.filter((caseRecord) => ["High", "Critical"].includes(caseRecord.priority)).length;

  return (
    <section className="home-grid">
      <div className="page-heading full-width">
        <div>
          <p className="eyebrow">Home</p>
          <h1>Agentia Labs Sales Command Center</h1>
          <span className="subtle-text">{periodBounds.label}</span>
        </div>
        <div className="heading-actions">
          <button className="slds-button" type="button" onClick={() => openImport("leads")}>
            <Upload size={16} /> Importar
          </button>
          <button className="slds-button primary" type="button" onClick={() => setActivePage({ type: "list", object: "opportunities" })}>
            <Target size={16} /> Ver pipeline
          </button>
        </div>
      </div>

      <section className="panel dashboard-filters">
        <div className="filter-heading">
          <Filter size={16} />
          <div>
            <p className="eyebrow">Filtros</p>
            <h2>Vista comercial</h2>
          </div>
        </div>
        <div className="filter-grid">
          <label>
            Periodo
            <select value={period} onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}>
              <option value="next90">Proximos 90 dias</option>
              <option value="thisQuarter">Trimestre actual</option>
              <option value="thisYear">Ano actual</option>
              <option value="all">Todo</option>
            </select>
          </label>
          <label>
            Owner
            <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
              <option value="all">Todos</option>
              {data.users.map((userRecord) => (
                <option value={userRecord.id} key={userRecord.id}>
                  {userRecord.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Funnel
            <select value={opportunityScope} onChange={(event) => setOpportunityScope(event.target.value as DashboardOpportunityScope)}>
              <option value="open">Oportunidades abiertas</option>
              <option value="all">Todas las oportunidades</option>
              <option value="won">Closed Won</option>
            </select>
          </label>
          <label>
            Lead Source
            <select value={leadSource} onChange={(event) => setLeadSource(event.target.value)}>
              <option value="all">Todos</option>
              {leadSources.map((source) => (
                <option value={source} key={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
          <button
            className="slds-button compact"
            type="button"
            onClick={() => {
              setPeriod("next90");
              setOwnerId("all");
              setOpportunityScope("open");
              setLeadSource("all");
            }}
          >
            <RefreshCw size={14} /> Reset
          </button>
        </div>
      </section>

      <MetricCard icon={User} label="Leads" value={String(filteredLeads.length)} helper={`${filteredLeads.filter((lead) => !lead.isConverted).length} abiertos en filtro`} />
      <MetricCard icon={Target} label="Oportunidades" value={String(filteredOpportunities.length)} helper={`${openOpportunities.length} abiertas`} />
      <MetricCard icon={Receipt} label="Pipeline one-off" value={money(pipelineOneOff)} helper="Abiertas filtradas" />
      <MetricCard icon={RefreshCw} label="Pipeline MRR" value={`${money(pipelineMrr)}/mes`} helper="MRR abierto filtrado" />
      <MetricCard icon={TrendingUp} label="Forecast ponderado" value={money(weightedForecast)} helper="Annualized por probabilidad" />
      <MetricCard icon={CheckCircle2} label="Closed Won one-offs" value={money(wonOneOff)} helper={`${wonOpportunities.length} ganadas`} />
      <MetricCard icon={CheckCircle2} label="Closed Won MRR" value={`${money(wonMrr)}/mes`} helper="MRR ganado filtrado" />
      <MetricCard icon={LifeBuoy} label="Casos abiertos" value={String(openCases.length)} helper={`${highPriorityCases} alta prioridad`} />

      <section className="panel dashboard-panel funnel-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Funnel</p>
            <h2>Oportunidades por etapa</h2>
          </div>
          <span className="panel-stat">{scopedOpportunities.length} deals</span>
        </div>
        <div className="funnel-list">
          {funnelRows.map((row) => {
            const width = row.annualized ? Math.max(18, (row.annualized / maxFunnelAnnualized) * 100) : 8;
            return (
              <button className={row.count ? "funnel-row" : "funnel-row muted-row"} key={row.stage} type="button" onClick={() => setActivePage({ type: "list", object: "opportunities" })}>
                <div className="funnel-meta">
                  <strong>{row.stage}</strong>
                  <span>{row.count} opps · {row.probability}% prob.</span>
                </div>
                <div className="funnel-track">
                  <div className="funnel-shape" style={{ width: `${width}%` }} />
                </div>
                <small>{money(row.oneOff)} · {money(row.mrr)}/mes</small>
                <b>{money(row.annualized)}</b>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel dashboard-panel revenue-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Revenue</p>
            <h2>Mix y forecast</h2>
          </div>
          <BarChart3 size={18} />
        </div>
        <div className="revenue-bars">
          {[
            { label: "One-off pipeline", value: pipelineOneOff, display: money(pipelineOneOff), helper: "Abiertas" },
            { label: "MRR anualizado", value: pipelineMrr * 12, display: `${money(pipelineMrr)}/mes`, helper: money(pipelineMrr * 12) },
            { label: "Forecast ponderado", value: weightedForecast, display: money(weightedForecast), helper: "Probabilidad aplicada" },
            { label: "Closed Won anualizado", value: wonOneOff + wonMrr * 12, display: money(wonOneOff + wonMrr * 12), helper: "Ganado" },
          ].map((item) => (
            <div className="revenue-row" key={item.label}>
              <div>
                <span>{item.label}</span>
                <small>{item.helper}</small>
              </div>
              <div className="bar-track">
                <div style={{ width: `${item.value ? Math.max(8, (item.value / maxRevenueBar) * 100) : 0}%` }} />
              </div>
              <strong>{item.display}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Acquisition</p>
            <h2>Lead sources</h2>
          </div>
          <CalendarDays size={18} />
        </div>
        <div className="source-list">
          {sourceRows.length ? (
            sourceRows.map((row) => (
              <div className="source-row" key={row.source}>
                <div>
                  <strong>{row.source}</strong>
                  <span>{row.leads} leads · {row.opportunities} opps</span>
                </div>
                <div className="source-conversion">
                  <div className="bar-track">
                    <div style={{ width: `${row.conversionRate}%` }} />
                  </div>
                  <small>{row.conversionRate}% conv.</small>
                </div>
                <b>{money(row.pipeline)}</b>
              </div>
            ))
          ) : (
            <p className="empty-copy">Sin datos para estos filtros.</p>
          )}
        </div>
      </section>

      <section className="panel dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Deals</p>
            <h2>Top oportunidades abiertas</h2>
          </div>
          <Target size={18} />
        </div>
        <div className="deal-list">
          {topOpportunities.length ? (
            topOpportunities.map((opportunity) => (
              <button key={opportunity.id} className="deal-row" type="button" onClick={() => setActivePage({ type: "record", object: "opportunities", id: opportunity.id })}>
                <div>
                  <strong>{opportunity.name}</strong>
                  <span>{recordDisplayName(data, "accounts", opportunity.accountId)} · {opportunity.stageName}</span>
                </div>
                <small>{opportunity.probability}%</small>
                <b>{money(opportunity.oneOffAmount)} · {money(opportunity.mrrAmount)}/mes</b>
              </button>
            ))
          ) : (
            <p className="empty-copy">No hay oportunidades abiertas con estos filtros.</p>
          )}
        </div>
      </section>

      <section className="panel dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Customer Ops</p>
            <h2>Casos por estado</h2>
          </div>
          <LifeBuoy size={18} />
        </div>
        <div className="case-status-list">
          {caseRows.map((row) => (
            <button key={row.status} className="case-status-row" type="button" onClick={() => setActivePage({ type: "list", object: "cases" })}>
              <span>{row.status}</span>
              <strong>{row.count}</strong>
              <small>{row.highPriority} alta prioridad</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Actividad</p>
            <h2>Registros recientes</h2>
          </div>
          <Database size={18} />
        </div>
        <div className="activity-list">
          {[...filteredLeads.slice(0, 2), ...filteredOpportunities.slice(0, 2), ...filteredCases.slice(0, 2)].map((record) => {
            const object = inferObject(record);
            return (
              <button key={record.id} className="activity-row" type="button" onClick={() => setActivePage({ type: "record", object, id: record.id })}>
                <Database size={15} />
                <div>
                  <strong>{recordTitle(data, object, record)}</strong>
                  <span>{objectLabels[object].singular}</span>
                </div>
              </button>
            );
          })}
          {filteredLeads.length + filteredOpportunities.length + filteredCases.length ? null : <p className="empty-copy">No hay actividad para estos filtros.</p>}
        </div>
      </section>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, helper }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string; helper: string }) {
  return (
    <section className="metric-card">
      <div className="metric-icon">
        <Icon size={20} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </section>
  );
}

function ObjectListPage({
  data,
  object,
  reload,
  setData,
  openModal,
  openRecord,
}: {
  data: CrmData;
  object: ObjectKey;
  reload: () => Promise<void>;
  setData: SetCrmData;
  openModal: (modal: ModalState) => void;
  openRecord: (object: ObjectKey, id: string) => void;
}) {
  const records = (data[object] as CrmRecord[]) ?? [];
  const [query, setQuery] = useState("");
  const Icon = objectIcons[object];
  const fields = fieldConfigs[object];
  const tableFieldLimit = object === "opportunities" ? 8 : 6;
  const tableFields = fields.filter((field) => field.table === true).slice(0, tableFieldLimit);
  const { statuses, saveInlineValue } = useInlineRecordEditing({
    setData,
    afterSave: (savedObject) => (savedObject === "opportunityLineItems" ? reload() : undefined),
  });

  useEffect(() => {
    setQuery("");
  }, [object]);

  const filteredRecords = useMemo(() => {
    const target = query.trim().toLowerCase();
    if (!target) return records;
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(target));
  }, [query, records]);

  return (
    <section className="object-list-page">
      <div className="page-heading full-width">
        <div className="object-title">
          <span className="object-icon">
            <Icon size={20} />
          </span>
          <div>
            <p className="eyebrow">{objectLabels[object].apiName}</p>
            <h1>{objectLabels[object].plural}</h1>
          </div>
        </div>
        <div className="heading-actions">
          <button className="slds-button" type="button" onClick={() => openModal({ type: "import", object })}>
            <Upload size={16} /> Importar
          </button>
          <button className="slds-button primary" type="button" onClick={() => openModal({ type: "record", object })}>
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      <section className="list-panel">
        <div className="list-toolbar">
          <div>
            <strong>{filteredRecords.length} registros</strong>
            <span>{objectLabels[object].description}</span>
          </div>
          <label className="search-box">
            <Search size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" />
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {tableFields.map((field) => (
                  <th key={field.key}>{field.label}</th>
                ))}
                <th aria-label="Abrir registro" />
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr
                  className="clickable-row"
                  key={record.id}
                  tabIndex={0}
                  onClick={() => openRecord(object, record.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") openRecord(object, record.id);
                  }}
                >
                  {tableFields.map((field) => (
                    <InlineEditableCell
                      data={data}
                      field={field}
                      key={field.key}
                      object={object}
                      record={record}
                      status={statuses[inlineCellKey(object, record.id, field.key)]}
                      onSave={saveInlineValue}
                    />
                  ))}
                  <td className="row-actions-cell">
                    <button
                      className="icon-button subtle"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openRecord(object, record.id);
                      }}
                      title="Abrir registro"
                    >
                      <PanelRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRecords.length ? null : (
          <div className="empty-state compact">
            <Database size={24} />
            <p>No hay registros para esta vista.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function RecordPage({
  data,
  object,
  recordId,
  reload,
  setData,
  openModal,
  openList,
  openRecord,
}: {
  data: CrmData;
  object: ObjectKey;
  recordId: string;
  reload: () => Promise<void>;
  setData: SetCrmData;
  openModal: (modal: ModalState) => void;
  openList: (object: ObjectKey) => void;
  openRecord: (object: ObjectKey, id: string) => void;
}) {
  const records = (data[object] as CrmRecord[]) ?? [];
  const record = records.find((item) => item.id === recordId);
  const [busy, setBusy] = useState(false);
  const Icon = objectIcons[object];

  async function remove(recordToRemove: CrmRecord) {
    if (!window.confirm(`Borrar ${recordTitle(data, object, recordToRemove)}?`)) return;
    setBusy(true);
    await apiRequest(`/api/${object}/${recordToRemove.id}`, { method: "DELETE" });
    await reload();
    setBusy(false);
    openList(object);
  }

  return (
    <section className="record-page">
      <div className="page-heading">
        <div className="object-title">
          <span className="object-icon">
            <Icon size={20} />
          </span>
          <div>
            <p className="eyebrow">{objectLabels[object].apiName}</p>
            <h1>{record ? recordTitle(data, object, record) : objectLabels[object].singular}</h1>
          </div>
        </div>
        <button className="slds-button" type="button" onClick={() => openList(object)}>
          <ArrowLeft size={16} /> Volver a {objectLabels[object].plural}
        </button>
      </div>

      <section className="record-panel record-detail-panel">
        {record ? (
          <>
            <div className="record-header">
              <div>
                <p className="eyebrow">{objectLabels[object].singular}</p>
                <h2>{recordTitle(data, object, record)}</h2>
              </div>
              <PanelRight size={18} />
            </div>

            {isPathObject(object) ? <Path data={data} object={object} record={record} reload={reload} /> : null}

            <div className="record-actions">
              <button className="slds-button" type="button" onClick={() => openModal({ type: "record", object, record })}>
                <Pencil size={15} /> Editar
              </button>
              {object === "leads" && !(record as unknown as RecordMap).isConverted ? (
                <ConvertLeadButton lead={record as CrmData["leads"][number]} openModal={openModal} />
              ) : null}
              <button className="slds-button danger" type="button" disabled={busy} onClick={() => void remove(record)}>
                <Trash2 size={15} /> Borrar
              </button>
            </div>

            <RecordFields data={data} object={object} record={record} />
            {object === "opportunities" ? (
              <OpportunityRelated data={data} opportunity={record as CrmData["opportunities"][number]} reload={reload} setData={setData} openRecord={openRecord} />
            ) : null}
            {object === "proposals" ? <ProposalRelated data={data} proposal={record as CrmData["proposals"][number]} reload={reload} setData={setData} /> : null}
            {object === "invoices" ? <InvoiceRelated data={data} invoice={record as CrmData["invoices"][number]} reload={reload} setData={setData} /> : null}
            {object === "accounts" ? <AccountRelated data={data} account={record as CrmData["accounts"][number]} openRecord={openRecord} /> : null}
            {object === "contacts" ? <ContactRelated data={data} contact={record as CrmData["contacts"][number]} openRecord={openRecord} /> : null}
          </>
        ) : (
          <div className="empty-state">
            <Database size={28} />
            <p>No se ha encontrado este registro.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function Path({ data, object, record, reload }: { data: CrmData; object: PathObjectKey; record: CrmRecord; reload: () => Promise<void> }) {
  const steps = data.pathConfigs[object];
  const field = pathFieldByObject[object];
  const current = String((record as unknown as RecordMap)[field] ?? "");
  const currentIndex = Math.max(0, steps.findIndex((step) => step.value === current));
  const [saving, setSaving] = useState(false);

  async function setStep(step: PathStep) {
    setSaving(true);
    await apiRequest(`/api/${object}/${record.id}`, {
      method: "PUT",
      body: JSON.stringify({ [field]: step.value }),
    });
    await reload();
    setSaving(false);
  }

  return (
    <div className="path">
      {steps.map((step, index) => (
        <button
          className={index < currentIndex ? "done" : index === currentIndex ? "current" : ""}
          disabled={saving}
          key={step.value}
          type="button"
          onClick={() => void setStep(step)}
        >
          {index < currentIndex ? <CheckCircle2 size={14} /> : null}
          <span>{step.label}</span>
        </button>
      ))}
    </div>
  );
}

function ConvertLeadButton({ lead, openModal }: { lead: CrmData["leads"][number]; openModal: (modal: ModalState) => void }) {
  return (
    <button className="slds-button success" type="button" onClick={() => openModal({ type: "convertLead", lead })}>
      <ArrowRightLeft size={15} /> Convertir
    </button>
  );
}

function ConvertLeadModal({ lead, close, reload }: { lead: CrmData["leads"][number]; close: () => void; reload: () => Promise<void> }) {
  const fullName = `${lead.firstName ?? ""} ${lead.lastName}`.trim();
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [accountName, setAccountName] = useState(lead.company);
  const [contactFirstName, setContactFirstName] = useState(lead.firstName ?? "");
  const [contactLastName, setContactLastName] = useState(lead.lastName);
  const [opportunityName, setOpportunityName] = useState(`${lead.company} - New Business`);
  const [closeDate, setCloseDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [oneOffAmount, setOneOffAmount] = useState("0");
  const [mrrAmount, setMrrAmount] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const annualizedAmount = Number(oneOffAmount || 0) + Number(mrrAmount || 0) * 12;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/api/leads/${lead.id}/convert`, {
        method: "POST",
        body: JSON.stringify({
          createOpportunity,
          accountName,
          contactFirstName,
          contactLastName,
          opportunityName: createOpportunity ? opportunityName : undefined,
          closeDate: createOpportunity ? closeDate : undefined,
          oneOffAmount: createOpportunity ? Number(oneOffAmount || 0) : undefined,
          mrrAmount: createOpportunity ? Number(mrrAmount || 0) : undefined,
        }),
      });
      await reload();
      close();
    } catch (conversionError) {
      setError(conversionError instanceof Error ? conversionError.message : "No se pudo convertir el lead.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card conversion-card" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Lead Conversion</p>
            <h2>Convertir {fullName || lead.company}</h2>
          </div>
          <button className="icon-button" type="button" onClick={close} title="Cerrar">
            <X size={18} />
          </button>
        </div>
        <form className="conversion-body" onSubmit={(event) => void submit(event)}>
          <div className="conversion-summary">
            <div>
              <span>Lead</span>
              <strong>{fullName || lead.lastName}</strong>
            </div>
            <div>
              <span>Empresa</span>
              <strong>{lead.company}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{lead.email || "-"}</strong>
            </div>
          </div>

          <div className="conversion-choice" role="group" aria-label="Conversion type">
            <button className={createOpportunity ? "active" : ""} type="button" aria-pressed={createOpportunity} onClick={() => setCreateOpportunity(true)}>
              <Target size={16} />
              <span>Cuenta + contacto + oportunidad</span>
            </button>
            <button className={!createOpportunity ? "active" : ""} type="button" aria-pressed={!createOpportunity} onClick={() => setCreateOpportunity(false)}>
              <Users size={16} />
              <span>Solo cuenta + contacto</span>
            </button>
          </div>

          <div className="form-grid conversion-fields">
            <label>
              Account Name
              <input value={accountName} required onChange={(event) => setAccountName(event.target.value)} />
            </label>
            <label>
              Contact First Name
              <input value={contactFirstName} onChange={(event) => setContactFirstName(event.target.value)} />
            </label>
            <label>
              Contact Last Name
              <input value={contactLastName} required onChange={(event) => setContactLastName(event.target.value)} />
            </label>
            {createOpportunity ? (
              <>
                <label>
                  Opportunity Name
                  <input value={opportunityName} required onChange={(event) => setOpportunityName(event.target.value)} />
                </label>
                <label>
                  Close Date
                  <input type="date" value={closeDate} required onChange={(event) => setCloseDate(event.target.value)} />
                </label>
                <label>
                  One-off Amount
                  <input type="number" min="0" value={oneOffAmount} onChange={(event) => setOneOffAmount(event.target.value)} />
                </label>
                <label>
                  MRR
                  <input type="number" min="0" value={mrrAmount} onChange={(event) => setMrrAmount(event.target.value)} />
                </label>
                <div className="conversion-total">
                  <span>Annualized Amount</span>
                  <strong>{money(annualizedAmount)}</strong>
                </div>
              </>
            ) : null}
          </div>

          <div className="modal-footer">
            <span className={error ? "form-error" : ""}>{error ?? "Se crearan registros nuevos al confirmar."}</span>
            <div className="footer-actions">
              <button className="slds-button" type="button" onClick={close}>
                Cancelar
              </button>
              <button className="slds-button success" disabled={saving} type="submit">
                <ArrowRightLeft size={16} /> Convertir
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function RecordFields({ data, object, record }: { data: CrmData; object: ObjectKey; record: CrmRecord }) {
  return (
    <div className="field-grid">
      {fieldConfigs[object]
        .filter((field) => field.detail !== false && field.key !== "description")
        .slice(0, 16)
        .map((field) => (
          <div key={field.key} className="field-row">
            <span>{field.label}</span>
            <strong>{formatField(data, field, record)}</strong>
          </div>
        ))}
    </div>
  );
}

function OpportunityRelated({
  data,
  opportunity,
  reload,
  setData,
  openRecord,
}: {
  data: CrmData;
  opportunity: CrmData["opportunities"][number];
  reload: () => Promise<void>;
  setData: SetCrmData;
  openRecord: (object: ObjectKey, id: string) => void;
}) {
  const proposals = data.proposals.filter((proposal) => proposal.opportunityId === opportunity.id);
  const invoices = data.invoices.filter((invoice) => invoice.opportunityId === opportunity.id);
  return (
    <>
      <AmountSyncControl data={data} opportunity={opportunity} reload={reload} />
      <LineItemManager data={data} parentId={opportunity.id} lineObject="opportunityLineItems" parentField="opportunityId" reload={reload} setData={setData} />
      <RelatedList title="Propuestas" records={proposals} object="proposals" data={data} openRecord={openRecord} />
      <RelatedList title="Facturas" records={invoices} object="invoices" data={data} openRecord={openRecord} />
    </>
  );
}

function ProposalRelated({ data, proposal, reload, setData }: { data: CrmData; proposal: CrmData["proposals"][number]; reload: () => Promise<void>; setData: SetCrmData }) {
  return <LineItemManager data={data} parentId={proposal.id} lineObject="proposalLineItems" parentField="proposalId" reload={reload} setData={setData} />;
}

function InvoiceRelated({ data, invoice, reload, setData }: { data: CrmData; invoice: CrmData["invoices"][number]; reload: () => Promise<void>; setData: SetCrmData }) {
  return <LineItemManager data={data} parentId={invoice.id} lineObject="invoiceLines" parentField="invoiceId" reload={reload} setData={setData} />;
}

function AccountRelated({ data, account, openRecord }: { data: CrmData; account: CrmData["accounts"][number]; openRecord: (object: ObjectKey, id: string) => void }) {
  return (
    <>
      <RelatedList title="Contactos" records={data.contacts.filter((contact) => contact.accountId === account.id)} object="contacts" data={data} openRecord={openRecord} />
      <RelatedList title="Oportunidades" records={data.opportunities.filter((opportunity) => opportunity.accountId === account.id)} object="opportunities" data={data} openRecord={openRecord} />
      <RelatedList title="Casos" records={data.cases.filter((caseRecord) => caseRecord.accountId === account.id)} object="cases" data={data} openRecord={openRecord} />
    </>
  );
}

function ContactRelated({ data, contact, openRecord }: { data: CrmData; contact: CrmData["contacts"][number]; openRecord: (object: ObjectKey, id: string) => void }) {
  return (
    <>
      <RelatedList title="Oportunidades" records={data.opportunities.filter((opportunity) => opportunity.contactId === contact.id)} object="opportunities" data={data} openRecord={openRecord} />
      <RelatedList title="Casos" records={data.cases.filter((caseRecord) => caseRecord.contactId === contact.id)} object="cases" data={data} openRecord={openRecord} />
    </>
  );
}

function AmountSyncControl({ data, opportunity, reload }: { data: CrmData; opportunity: CrmData["opportunities"][number]; reload: () => Promise<void> }) {
  const proposals = data.proposals.filter((proposal) => proposal.opportunityId === opportunity.id);
  const firstProposalId = proposals[0]?.id ?? "";
  const [amountMode, setAmountMode] = useState(opportunity.amountMode);
  const [syncedProposalId, setSyncedProposalId] = useState(opportunity.syncedProposalId ?? firstProposalId);
  const [oneOffAmount, setOneOffAmount] = useState(String(opportunity.oneOffAmount));
  const [mrrAmount, setMrrAmount] = useState(String(opportunity.mrrAmount));

  useEffect(() => {
    setAmountMode(opportunity.amountMode);
    setSyncedProposalId(opportunity.syncedProposalId ?? firstProposalId);
    setOneOffAmount(String(opportunity.oneOffAmount));
    setMrrAmount(String(opportunity.mrrAmount));
  }, [opportunity.id, opportunity.amountMode, opportunity.syncedProposalId, opportunity.oneOffAmount, opportunity.mrrAmount, firstProposalId]);

  async function save() {
    await apiRequest(`/api/opportunities/${opportunity.id}`, {
      method: "PUT",
      body: JSON.stringify({
        amountMode,
        syncedProposalId: syncedProposalId || undefined,
        oneOffAmount: Number(oneOffAmount),
        mrrAmount: Number(mrrAmount),
      }),
    });
    await reload();
  }

  return (
    <section className="related-box">
      <div className="related-header">
        <div>
          <p className="eyebrow">Revenue</p>
          <h3>{money(opportunity.oneOffAmount)} one-off · {money(opportunity.mrrAmount)}/mes</h3>
          <span className="subtle-text">Booking anualizado: {money(opportunity.amount)}</span>
        </div>
        <button className="slds-button compact" type="button" onClick={() => void save()}>
          <Save size={14} /> Guardar
        </button>
      </div>
      <div className="inline-form revenue-form">
        <label>
          Fuente
          <select value={amountMode} onChange={(event) => setAmountMode(event.target.value as CrmData["opportunities"][number]["amountMode"])}>
            {amountModes.map((mode) => (
              <option value={mode.value} key={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          One-off
          <input type="number" value={oneOffAmount} onChange={(event) => setOneOffAmount(event.target.value)} disabled={amountMode !== "manual"} />
        </label>
        <label>
          MRR
          <input type="number" value={mrrAmount} onChange={(event) => setMrrAmount(event.target.value)} disabled={amountMode !== "manual"} />
        </label>
        <label>
          Propuesta
          <select value={syncedProposalId} onChange={(event) => setSyncedProposalId(event.target.value)} disabled={amountMode !== "syncPrimaryProposal"}>
            <option value="">Sin propuesta</option>
            {proposals.map((proposal) => (
              <option value={proposal.id} key={proposal.id}>
                {proposal.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

function LineItemManager({
  data,
  parentId,
  lineObject,
  parentField,
  reload,
  setData,
}: {
  data: CrmData;
  parentId: string;
  lineObject: "opportunityLineItems" | "proposalLineItems" | "invoiceLines";
  parentField: "opportunityId" | "proposalId" | "invoiceId";
  reload: () => Promise<void>;
  setData: SetCrmData;
}) {
  const lines = (data[lineObject] as CrmRecord[]).filter((line) => (line as unknown as RecordMap)[parentField] === parentId);
  const lineFields = fieldConfigs[lineObject].filter((field) => field.table !== false && field.key !== parentField).slice(0, 7);
  const { statuses, saveInlineValue } = useInlineRecordEditing({ setData, afterSave: () => reload() });
  const [draft, setDraft] = useState({
    productId: data.products[0]?.id ?? "",
    revenueType: data.products[0]?.revenueType ?? "oneOff",
    quantity: "1",
    unitPrice: String(data.products[0]?.listPrice ?? 0),
    description: "",
  });

  function updateProduct(productId: string) {
    const product = data.products.find((item) => item.id === productId);
    setDraft((current) => ({
      ...current,
      productId,
      revenueType: product?.revenueType ?? current.revenueType,
      unitPrice: String(product?.listPrice ?? current.unitPrice),
    }));
  }

  async function addLine() {
    const product = data.products.find((item) => item.id === draft.productId);
    const payload =
      lineObject === "invoiceLines"
        ? {
            [parentField]: parentId,
            productId: draft.productId,
            description: draft.description || product?.name || "Servicio",
            quantity: Number(draft.quantity),
            unitPrice: Number(draft.unitPrice),
          }
        : {
            [parentField]: parentId,
            productId: draft.productId,
            revenueType: draft.revenueType,
            quantity: Number(draft.quantity),
            unitPrice: Number(draft.unitPrice),
            discountPercent: 0,
    };
    await apiRequest(`/api/${lineObject}`, { method: "POST", body: JSON.stringify(payload) });
    if (lineObject === "opportunityLineItems") {
      await apiRequest(`/api/opportunities/${parentId}`, { method: "PUT", body: JSON.stringify({ amountMode: "syncProducts" }) });
    }
    setDraft({
      productId: data.products[0]?.id ?? "",
      revenueType: data.products[0]?.revenueType ?? "oneOff",
      quantity: "1",
      unitPrice: String(data.products[0]?.listPrice ?? 0),
      description: "",
    });
    await reload();
  }

  async function removeLine(id: string) {
    await apiRequest(`/api/${lineObject}/${id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <section className="related-box">
      <div className="related-header">
        <div>
          <p className="eyebrow">{objectLabels[lineObject].apiName}</p>
          <h3>{objectLabels[lineObject].plural}</h3>
        </div>
      </div>
      <div className="line-table-wrap">
        {lines.length ? (
          <table className="line-table">
            <thead>
              <tr>
                {lineFields.map((field) => (
                  <th key={field.key}>{field.label}</th>
                ))}
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  {lineFields.map((field) => (
                    <InlineEditableCell
                      data={data}
                      field={field}
                      key={field.key}
                      object={lineObject}
                      record={line}
                      status={statuses[inlineCellKey(lineObject, line.id, field.key)]}
                      onSave={saveInlineValue}
                    />
                  ))}
                  <td className="line-actions-cell">
                    <button className="icon-button subtle" type="button" onClick={() => void removeLine(line.id)} title="Borrar linea">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="related-empty">No hay lineas.</p>
        )}
      </div>
      <div className="inline-form">
        <label>
          Producto
          <select value={draft.productId} onChange={(event) => updateProduct(event.target.value)}>
            {data.products.map((product) => (
              <option value={product.id} key={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        {lineObject !== "invoiceLines" ? (
          <label>
            Revenue
            <select value={draft.revenueType} onChange={(event) => setDraft((current) => ({ ...current, revenueType: event.target.value as RevenueType }))}>
              <option value="oneOff">One-off</option>
              <option value="mrr">MRR</option>
            </select>
          </label>
        ) : null}
        {lineObject === "invoiceLines" ? (
          <label>
            Descripcion
            <input value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
          </label>
        ) : null}
        <label>
          Cantidad
          <input type="number" min="0" value={draft.quantity} onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))} />
        </label>
        <label>
          Precio
          <input type="number" min="0" value={draft.unitPrice} onChange={(event) => setDraft((current) => ({ ...current, unitPrice: event.target.value }))} />
        </label>
        <button className="slds-button primary compact" type="button" onClick={() => void addLine()}>
          <Plus size={14} /> Anadir
        </button>
      </div>
    </section>
  );
}

function RelatedList({
  title,
  records,
  object,
  data,
  openRecord,
}: {
  title: string;
  records: CrmRecord[];
  object: ObjectKey;
  data: CrmData;
  openRecord?: (object: ObjectKey, id: string) => void;
}) {
  return (
    <section className="related-box">
      <div className="related-header">
        <h3>{title}</h3>
        <span>{records.length}</span>
      </div>
      <div className="related-list">
        {records.length ? (
          records.map((record) => (
            <button key={record.id} type="button" onClick={() => openRecord?.(object, record.id)}>
              <strong>{recordTitle(data, object, record)}</strong>
              <span>{formatField(data, fieldConfigs[object].find((field) => field.table !== false) ?? fieldConfigs[object][0], record)}</span>
            </button>
          ))
        ) : (
          <p>No hay relacionados.</p>
        )}
      </div>
    </section>
  );
}

function RecordModal({
  data,
  object,
  record,
  close,
  reload,
}: {
  data: CrmData;
  object: ObjectKey;
  record?: CrmRecord;
  close: () => void;
  reload: () => Promise<void>;
}) {
  const [values, setValues] = useState<RecordMap>(() => initialValues(data, object, record));
  const [saving, setSaving] = useState(false);
  const fields = fieldConfigs[object].filter((field) => !field.readOnly && field.key !== "createdAt" && field.key !== "updatedAt");

  async function submit() {
    setSaving(true);
    const method = record ? "PUT" : "POST";
    const url = record ? `/api/${object}/${record.id}` : `/api/${object}`;
    await apiRequest(url, { method, body: JSON.stringify(values) });
    await reload();
    setSaving(false);
    close();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{objectLabels[object].apiName}</p>
            <h2>{record ? "Editar" : "Nuevo"} {objectLabels[object].singular}</h2>
          </div>
          <button className="icon-button" type="button" onClick={close} title="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="form-grid">
          {fields.map((field) => (
            <FieldInput
              data={data}
              field={field}
              key={field.key}
              value={values[field.key]}
              onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
            />
          ))}
        </div>
        <div className="modal-footer">
          <button className="slds-button" type="button" onClick={close}>
            Cancelar
          </button>
          <button className="slds-button primary" disabled={saving} type="button" onClick={() => void submit()}>
            <Save size={16} /> Guardar
          </button>
        </div>
      </section>
    </div>
  );
}

function FieldInput({ data, field, value, onChange }: { data: CrmData; field: FieldConfig; value: unknown; onChange: (value: unknown) => void }) {
  const commonProps = { required: field.required };
  return (
    <label className={field.type === "textarea" ? "wide" : ""}>
      {field.label}
      {field.type === "textarea" ? <textarea value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} /> : null}
      {field.type === "picklist" ? (
        <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          <option value="">Seleccionar</option>
          {getPicklistValues(data, field.picklist).map((option) => (
            <option value={option} key={option}>
              {amountModes.find((mode) => mode.value === option)?.label ?? option}
            </option>
          ))}
        </select>
      ) : null}
      {field.type === "reference" ? (
        <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          <option value="">Sin relacion</option>
          {field.relation
            ? ((data[field.relation] as CrmRecord[]) ?? []).map((record) => (
                <option value={record.id} key={record.id}>
                  {recordDisplayName(data, field.relation!, record.id)}
                </option>
              ))
            : null}
        </select>
      ) : null}
      {field.type === "boolean" ? (
        <span className="checkbox-line">
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /> Activo
        </span>
      ) : null}
      {["text", "email", "password", "phone", "url", "date", "datetime", "number", "currency", "percent"].includes(field.type) ? (
        <input
          {...commonProps}
          type={inputType(field.type)}
          value={String(value ?? "")}
          onChange={(event) => onChange(field.type === "number" || field.type === "currency" || field.type === "percent" ? Number(event.target.value) : event.target.value)}
        />
      ) : null}
    </label>
  );
}

function InlineEditableCell({
  data,
  object,
  record,
  field,
  status,
  onSave,
}: {
  data: CrmData;
  object: ObjectKey;
  record: CrmRecord;
  field: FieldConfig;
  status?: InlineSaveStatus;
  onSave: (object: ObjectKey, record: CrmRecord, field: FieldConfig, value: unknown) => void;
}) {
  const rawValue = (record as unknown as RecordMap)[field.key];
  const editable = isInlineEditableField(field);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => inlineDraftValue(field, rawValue));

  useEffect(() => {
    if (!editing) setDraft(inlineDraftValue(field, rawValue));
  }, [editing, field, rawValue]);

  function openEditor() {
    if (!editable || status?.state === "saving") return;
    setDraft(inlineDraftValue(field, rawValue));
    setEditing(true);
  }

  function cancel() {
    setDraft(inlineDraftValue(field, rawValue));
    setEditing(false);
  }

  function commit(nextRawValue: string | boolean = draft) {
    const nextValue = coerceInlineValue(field, nextRawValue);
    if (inlineValuesEqual(field, rawValue, nextValue)) {
      cancel();
      return;
    }
    onSave(object, record, field, nextValue);
    setEditing(false);
  }

  return (
    <td className={editable ? `inline-edit-cell ${status ? `inline-edit-${status.state}` : ""}` : ""} onClick={editable ? (event) => event.stopPropagation() : undefined} onKeyDown={editable ? (event) => event.stopPropagation() : undefined}>
      {editable && editing ? (
        <InlineCellControl data={data} field={field} draft={draft} setDraft={setDraft} commit={commit} cancel={cancel} />
      ) : editable ? (
        <button className="inline-edit-trigger" type="button" onClick={openEditor} disabled={status?.state === "saving"} title={`Editar ${field.label}`}>
          <span>{formatField(data, field, record)}</span>
          <Pencil size={12} />
        </button>
      ) : (
        formatField(data, field, record)
      )}
      {status ? (
        <span className={`inline-edit-status ${status.state}`} title={status.message}>
          {status.state === "saving" ? "Guardando" : status.state === "saved" ? "Guardado" : "Error"}
        </span>
      ) : null}
    </td>
  );
}

function InlineCellControl({
  data,
  field,
  draft,
  setDraft,
  commit,
  cancel,
}: {
  data: CrmData;
  field: FieldConfig;
  draft: string;
  setDraft: (value: string) => void;
  commit: (value?: string | boolean) => void;
  cancel: () => void;
}) {
  const commonEvents = {
    onClick: (event: React.MouseEvent) => event.stopPropagation(),
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
      event.stopPropagation();
      if (event.key === "Enter") commit();
      if (event.key === "Escape") cancel();
    },
  };

  if (field.type === "picklist") {
    return (
      <select
        autoFocus
        className="inline-edit-control"
        required={field.required}
        value={draft}
        onBlur={cancel}
        onChange={(event) => {
          setDraft(event.target.value);
          commit(event.target.value);
        }}
        onClick={commonEvents.onClick}
        onKeyDown={commonEvents.onKeyDown}
      >
        <option value="">Seleccionar</option>
        {getPicklistValues(data, field.picklist).map((option) => (
          <option value={option} key={option}>
            {picklistOptionLabel(field, option)}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "reference") {
    return (
      <select
        autoFocus
        className="inline-edit-control"
        required={field.required}
        value={draft}
        onBlur={cancel}
        onChange={(event) => {
          setDraft(event.target.value);
          commit(event.target.value);
        }}
        onClick={commonEvents.onClick}
        onKeyDown={commonEvents.onKeyDown}
      >
        <option value="">Sin relacion</option>
        {field.relation
          ? ((data[field.relation] as CrmRecord[]) ?? []).map((relatedRecord) => (
              <option value={relatedRecord.id} key={relatedRecord.id}>
                {recordDisplayName(data, field.relation!, relatedRecord.id)}
              </option>
            ))
          : null}
      </select>
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="inline-boolean-control" onClick={(event) => event.stopPropagation()}>
        <input
          autoFocus
          type="checkbox"
          checked={draft === "true"}
          onBlur={cancel}
          onChange={(event) => {
            setDraft(event.target.checked ? "true" : "false");
            commit(event.target.checked);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Escape") cancel();
          }}
        />
        <span>{draft === "true" ? "Si" : "No"}</span>
      </label>
    );
  }

  return (
    <input
      autoFocus
      className="inline-edit-control"
      max={field.type === "percent" ? 100 : undefined}
      min={field.type === "number" || field.type === "currency" || field.type === "percent" ? 0 : undefined}
      required={field.required}
      step={field.type === "currency" ? "0.01" : field.type === "number" || field.type === "percent" ? "1" : undefined}
      type={inputType(field.type)}
      value={draft}
      onBlur={() => commit()}
      onChange={(event) => setDraft(event.target.value)}
      onClick={commonEvents.onClick}
      onKeyDown={commonEvents.onKeyDown}
    />
  );
}

function useInlineRecordEditing({
  setData,
  afterSave,
}: {
  setData: SetCrmData;
  afterSave?: (object: ObjectKey, updatedRecord: CrmRecord) => Promise<void> | void;
}) {
  const [statuses, setStatuses] = useState<Record<string, InlineSaveStatus>>({});

  async function saveInlineValue(object: ObjectKey, record: CrmRecord, field: FieldConfig, value: unknown) {
    const key = inlineCellKey(object, record.id, field.key);
    const validationError = validateInlineValue(field, value);
    if (validationError) {
      setStatuses((current) => ({ ...current, [key]: { state: "error", message: validationError } }));
      return;
    }

    const previousValue = (record as unknown as RecordMap)[field.key];
    setStatuses((current) => ({ ...current, [key]: { state: "saving" } }));
    setData((current) => (current ? patchRecordInData(current, object, record.id, { [field.key]: value }) : current));

    try {
      const updatedRecord = await apiRequest<CrmRecord>(`/api/${object}/${record.id}`, {
        method: "PUT",
        body: JSON.stringify({ [field.key]: value }),
      });
      setData((current) => (current ? replaceRecordInData(current, object, updatedRecord) : current));
      setStatuses((current) => ({ ...current, [key]: { state: "saved" } }));
      window.setTimeout(() => {
        setStatuses((current) => {
          if (current[key]?.state !== "saved") return current;
          const { [key]: _removed, ...rest } = current;
          return rest;
        });
      }, 1400);
      if (afterSave) void Promise.resolve(afterSave(object, updatedRecord)).catch(() => undefined);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "No se pudo guardar.";
      setData((current) => (current ? patchRecordInData(current, object, record.id, { [field.key]: previousValue }) : current));
      setStatuses((current) => ({ ...current, [key]: { state: "error", message } }));
    }
  }

  return { statuses, saveInlineValue };
}

function ImportModal({ object, close, reload }: { object: ObjectKey; close: () => void; reload: () => Promise<void> }) {
  const importableFields = fieldConfigs[object].filter((field) => field.importable || field.required);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RecordMap[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function parseFile(file: File) {
    setMessage("");
    if (file.name.toLowerCase().endsWith(".xlsx")) {
      type CellValue = string | number | boolean | Date | null | undefined;
      const sheetRows = (await readXlsxFile(file)) as unknown as CellValue[][];
      const nextHeaders = (sheetRows[0] ?? []).map((cell: CellValue) => String(cell ?? ""));
      const nextRows = sheetRows
        .slice(1)
        .map((row: CellValue[]) => Object.fromEntries(nextHeaders.map((header: string, index: number) => [header, row[index] ?? ""])));
      prepareImport(nextHeaders, nextRows);
      return;
    }
    const text = await file.text();
    const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    prepareImport(result.meta.fields ?? [], result.data);
  }

  function prepareImport(nextHeaders: string[], nextRows: RecordMap[]) {
    setHeaders(nextHeaders);
    setRows(nextRows);
    setMapping(
      Object.fromEntries(
        nextHeaders.map((header) => {
          const match = importableFields.find((field) => normalize(field.key) === normalize(header) || normalize(field.label) === normalize(header));
          return [header, match?.key ?? ""];
        }),
      ),
    );
  }

  async function submit() {
    const mappedRows = rows.map((row) =>
      Object.fromEntries(
        headers
          .map((header) => [mapping[header], row[header]])
          .filter(([fieldKey, value]) => fieldKey && value !== undefined && value !== null && String(value).trim() !== ""),
      ),
    );
    setSaving(true);
    const created = await apiRequest<CrmRecord[]>(`/api/${object}/import`, {
      method: "POST",
      body: JSON.stringify({ rows: mappedRows }),
    });
    setMessage(`${created.length} registros importados.`);
    await reload();
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card import-card" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Import Wizard</p>
            <h2>Importar {objectLabels[object].plural}</h2>
          </div>
          <button className="icon-button" type="button" onClick={close} title="Cerrar">
            <X size={18} />
          </button>
        </div>
        <label className="file-drop">
          <Upload size={22} />
          <span>CSV o Excel .xlsx</span>
          <input type="file" accept=".csv,.xlsx" onChange={(event) => event.target.files?.[0] && void parseFile(event.target.files[0])} />
        </label>
        {headers.length ? (
          <>
            <div className="mapping-grid">
              {headers.map((header) => (
                <label key={header}>
                  {header}
                  <select value={mapping[header] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [header]: event.target.value }))}>
                    <option value="">No importar</option>
                    {importableFields.map((field) => (
                      <option value={field.key} key={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="preview-table">
              <table>
                <thead>
                  <tr>{headers.slice(0, 5).map((header) => <th key={header}>{header}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.slice(0, 4).map((row, index) => (
                    <tr key={String(index)}>
                      {headers.slice(0, 5).map((header) => <td key={header}>{String(row[header] ?? "")}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
        <div className="modal-footer">
          <span>{message}</span>
          <button className="slds-button" type="button" onClick={close}>
            Cerrar
          </button>
          <button className="slds-button primary" disabled={!rows.length || saving} type="button" onClick={() => void submit()}>
            <Upload size={16} /> Importar {rows.length || ""}
          </button>
        </div>
      </section>
    </div>
  );
}

function Setup({ currentUserId, data, reload, reset }: { currentUserId: string; data: CrmData; reload: () => Promise<void>; reset: () => Promise<void> }) {
  return (
    <section className="setup-page">
      <div className="page-heading full-width">
        <div className="object-title">
          <span className="object-icon">
            <Settings size={20} />
          </span>
          <div>
            <p className="eyebrow">Setup</p>
            <h1>Configuracion</h1>
          </div>
        </div>
        <button className="slds-button danger" type="button" onClick={() => void reset()}>
          <RefreshCw size={16} /> Reset demo
        </button>
      </div>
      <section className="panel setup-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Paths</p>
            <h2>Lead, Oportunidad y Caso</h2>
          </div>
        </div>
        <div className="path-config-grid">
          {pathObjects.map((object) => (
            <PathConfigEditor key={object} data={data} object={object} reload={reload} />
          ))}
        </div>
      </section>
      <section className="panel setup-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Usuarios</p>
            <h2>Roles simples</h2>
          </div>
        </div>
        <UserRoleEditor currentUserId={currentUserId} data={data} reload={reload} />
      </section>
    </section>
  );
}

function PathConfigEditor({ data, object, reload }: { data: CrmData; object: PathObjectKey; reload: () => Promise<void> }) {
  const [steps, setSteps] = useState(data.pathConfigs[object]);
  async function save() {
    await apiRequest(`/api/setup/path/${object}`, { method: "PUT", body: JSON.stringify({ steps }) });
    await reload();
  }
  return (
    <div className="path-config">
      <h3>{objectLabels[object].plural}</h3>
      {steps.map((step, index) => (
        <div className="path-config-row" key={`${step.value}-${index}`}>
          <input value={step.label} onChange={(event) => setSteps((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, label: event.target.value, value: event.target.value } : item)))} />
          {object === "opportunities" ? (
            <input
              type="number"
              value={step.probability ?? 0}
              onChange={(event) => setSteps((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, probability: Number(event.target.value) } : item)))}
            />
          ) : null}
          <button className="icon-button subtle" type="button" onClick={() => setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <div className="path-config-actions">
        <button className="slds-button compact" type="button" onClick={() => setSteps((current) => [...current, { label: "Nuevo paso", value: "Nuevo paso" }])}>
          <Plus size={14} /> Paso
        </button>
        <button className="slds-button compact primary" type="button" onClick={() => void save()}>
          <Save size={14} /> Guardar
        </button>
      </div>
    </div>
  );
}

function UserRoleEditor({ currentUserId, data, reload }: { currentUserId: string; data: CrmData; reload: () => Promise<void> }) {
  const roles = getPicklistValues(data, "roles");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: roles[1] ?? roles[0] ?? "Ventas",
    isAdmin: false,
    temporaryPassword: "",
  });
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function setNewUserRole(role: string) {
    setNewUser((current) => ({
      ...current,
      role,
      isAdmin: role === "Admin" ? true : current.isAdmin,
    }));
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      });
      setNewUser({
        name: "",
        email: "",
        role: roles[1] ?? roles[0] ?? "Ventas",
        isAdmin: false,
        temporaryPassword: "",
      });
      setMessage("Usuario creado correctamente.");
      await reload();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(userId: string, payload: RecordMap) {
    setMessage("");
    setError("");
    await apiRequest(`/api/users/${userId}`, { method: "PUT", body: JSON.stringify(payload) });
    await reload();
  }

  async function resetPassword(userId: string) {
    const temporaryPassword = resetPasswords[userId]?.trim();
    if (!temporaryPassword) {
      setError("Introduce una nueva contraseña temporal.");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ temporaryPassword }),
      });
      setResetPasswords((current) => ({ ...current, [userId]: "" }));
      setMessage("Contraseña actualizada correctamente.");
      await reload();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "No se pudo resetear la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(userRecord: CrmData["users"][number]) {
    if (userRecord.id === currentUserId) {
      setError("No puedes eliminar tu propio usuario desde la sesion actual.");
      return;
    }
    if (data.users.length <= 1) {
      setError("No puedes eliminar el ultimo usuario del CRM.");
      return;
    }
    if (!window.confirm(`Eliminar usuario ${userRecord.name}? Los registros asignados quedaran sin owner.`)) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await apiRequest(`/api/users/${userRecord.id}`, { method: "DELETE" });
      setResetPasswords((current) => {
        const next = { ...current };
        delete next[userRecord.id];
        return next;
      });
      setMessage("Usuario eliminado correctamente.");
      await reload();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el usuario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="user-management">
      <form className="user-admin-form" onSubmit={(event) => void createUser(event)}>
        <label>
          Nombre
          <input value={newUser.name} required onChange={(event) => setNewUser((current) => ({ ...current, name: event.target.value }))} />
        </label>
        <label>
          Email
          <input type="email" value={newUser.email} required onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))} />
        </label>
        <label>
          Rol
          <select value={newUser.role} onChange={(event) => setNewUserRole(event.target.value)}>
            {roles.map((role) => (
              <option value={role} key={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label>
          Password temporal
          <input type="password" value={newUser.temporaryPassword} required onChange={(event) => setNewUser((current) => ({ ...current, temporaryPassword: event.target.value }))} />
        </label>
        <label className="checkbox-inline user-admin-checkbox">
          <input checked={newUser.isAdmin} type="checkbox" onChange={(event) => setNewUser((current) => ({ ...current, isAdmin: event.target.checked }))} /> Admin
        </label>
        <button className="slds-button primary compact" type="submit" disabled={saving}>
          <Plus size={14} /> Crear usuario
        </button>
      </form>

      <div className="user-list-toolbar">
        <strong>{data.users.length} usuarios</strong>
        <span className={error ? "form-error" : ""}>{error || message}</span>
      </div>

      <div className="user-role-list">
        {data.users.map((userRecord) => (
          <div className="user-role-row" key={userRecord.id}>
            <div>
              <strong>{userRecord.name}</strong>
              <span>{userRecord.email}</span>
              {userRecord.id === currentUserId ? <small>Sesion actual</small> : null}
            </div>
            <select value={userRecord.role} onChange={(event) => void updateUser(userRecord.id, { role: event.target.value, isAdmin: event.target.value === "Admin" })}>
              {roles.map((role) => (
                <option value={role} key={role}>
                  {role}
                </option>
              ))}
            </select>
            <label className="checkbox-inline">
              <input checked={userRecord.isAdmin} type="checkbox" onChange={(event) => void updateUser(userRecord.id, { isAdmin: event.target.checked })} /> Admin
            </label>
            <div className="password-reset">
              <input
                type="password"
                aria-label={`Nueva contraseña para ${userRecord.name}`}
                placeholder="Nueva password"
                value={resetPasswords[userRecord.id] ?? ""}
                onChange={(event) => setResetPasswords((current) => ({ ...current, [userRecord.id]: event.target.value }))}
              />
              <button className="slds-button compact" type="button" disabled={saving} onClick={() => void resetPassword(userRecord.id)}>
                <RefreshCw size={14} /> Reset
              </button>
            </div>
            <button
              className="icon-button danger"
              type="button"
              disabled={saving || userRecord.id === currentUserId || data.users.length <= 1}
              onClick={() => void deleteUser(userRecord)}
              title={userRecord.id === currentUserId ? "No puedes eliminar tu propio usuario" : "Eliminar usuario"}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function inlineCellKey(object: ObjectKey, recordId: string, fieldKey: string): string {
  return `${object}:${recordId}:${fieldKey}`;
}

function isInlineEditableField(field: FieldConfig): boolean {
  return !field.readOnly && !inlineReadOnlyFields.has(field.key) && inlineEditableTypes.has(field.type);
}

function inlineDraftValue(field: FieldConfig, value: unknown): string {
  if (field.type === "boolean") return value ? "true" : "false";
  if (value === undefined || value === null) return "";
  const textValue = String(value);
  if (field.type === "date") return textValue.slice(0, 10);
  if (field.type === "datetime") return textValue.includes("T") ? textValue.slice(0, 16) : textValue;
  return textValue;
}

function coerceInlineValue(field: FieldConfig, value: string | boolean): unknown {
  if (field.type === "boolean") return value === true || value === "true";
  if (field.type === "number" || field.type === "currency" || field.type === "percent") {
    const parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return String(value ?? "");
}

function inlineValuesEqual(field: FieldConfig, currentValue: unknown, nextValue: unknown): boolean {
  if (field.type === "boolean") return Boolean(currentValue) === Boolean(nextValue);
  if (field.type === "number" || field.type === "currency" || field.type === "percent") return Number(currentValue ?? 0) === Number(nextValue ?? 0);
  return String(currentValue ?? "") === String(nextValue ?? "");
}

function validateInlineValue(field: FieldConfig, value: unknown): string | null {
  if (field.required && (value === undefined || value === null || String(value).trim() === "")) return `${field.label} es obligatorio.`;
  if ((field.type === "number" || field.type === "currency" || field.type === "percent") && !Number.isFinite(Number(value))) return `${field.label} debe ser numerico.`;
  return null;
}

function picklistOptionLabel(field: FieldConfig, option: string): string {
  if (field.key === "amountMode") return amountModes.find((mode) => mode.value === option)?.label ?? option;
  if (field.key === "revenueType") return formatRevenueType(option);
  return option;
}

function patchRecordInData(data: CrmData, object: ObjectKey, recordId: string, patch: RecordMap): CrmData {
  const collection = ((data[object] as CrmRecord[]) ?? []).map((record) => (record.id === recordId ? ({ ...(record as unknown as RecordMap), ...patch } as unknown as CrmRecord) : record));
  return { ...data, [object]: collection } as CrmData;
}

function replaceRecordInData(data: CrmData, object: ObjectKey, updatedRecord: CrmRecord): CrmData {
  const collection = ((data[object] as CrmRecord[]) ?? []).map((record) => (record.id === updatedRecord.id ? updatedRecord : record));
  return { ...data, [object]: collection } as CrmData;
}

function formatField(data: CrmData, field: FieldConfig, record: CrmRecord): React.ReactNode {
  const value = (record as unknown as RecordMap)[field.key];
  if (value === undefined || value === null || value === "") return <span className="muted">-</span>;
  if (field.type === "reference" && field.relation) return recordDisplayName(data, field.relation, String(value));
  if (field.type === "currency") return money(Number(value));
  if (field.type === "boolean") return <span className={value ? "pill success" : "pill"}>{value ? "Si" : "No"}</span>;
  if (field.type === "percent") return `${value}%`;
  if (field.type === "datetime") return new Date(String(value)).toLocaleDateString("es-ES");
  if (field.type === "date") return new Date(`${String(value)}T00:00:00`).toLocaleDateString("es-ES");
  if (field.key === "amountMode") return amountModes.find((mode) => mode.value === value)?.label ?? String(value);
  if (field.key === "revenueType") return formatRevenueType(value);
  return String(value);
}

function formatRevenueType(value: unknown): string {
  return value === "mrr" ? "MRR" : "One-off";
}

function sumCurrency(values: Array<number | undefined>): number {
  const total = values.reduce<number>((currentTotal, value) => currentTotal + (Number(value) || 0), 0);
  return Math.round(total * 100) / 100;
}

function isClosedOpportunity(data: CrmData, opportunity: CrmData["opportunities"][number]): boolean {
  return data.pathConfigs.opportunities.find((step) => step.value === opportunity.stageName)?.isClosed ?? opportunity.stageName.startsWith("Closed");
}

function isWonOpportunity(data: CrmData, opportunity: CrmData["opportunities"][number]): boolean {
  return data.pathConfigs.opportunities.find((step) => step.value === opportunity.stageName)?.isWon ?? opportunity.stageName === "Closed Won";
}

function opportunityScopeMatches(data: CrmData, opportunity: CrmData["opportunities"][number], scope: DashboardOpportunityScope): boolean {
  if (scope === "all") return true;
  if (scope === "won") return isWonOpportunity(data, opportunity);
  return !isClosedOpportunity(data, opportunity);
}

function dashboardPeriodBounds(period: DashboardPeriod): { label: string; start?: Date; end?: Date } {
  const now = new Date();
  if (period === "all") return { label: "Todos los registros" };
  if (period === "next90") {
    const start = startOfDashboardDay(now);
    const end = endOfDashboardDay(addDashboardDays(now, 90));
    return { label: "Cierres y actividad de los proximos 90 dias", start, end };
  }
  if (period === "thisYear") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { label: `Ano ${now.getFullYear()}`, start, end };
  }
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const start = new Date(now.getFullYear(), quarterStartMonth, 1);
  const end = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
  return { label: `Trimestre actual: ${start.toLocaleDateString("es-ES")} - ${end.toLocaleDateString("es-ES")}`, start, end };
}

function isWithinDashboardPeriod(value: string | undefined, bounds: { start?: Date; end?: Date }): boolean {
  if (!bounds.start && !bounds.end) return true;
  if (!value) return false;
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  if (bounds.start && date < bounds.start) return false;
  if (bounds.end && date > bounds.end) return false;
  return true;
}

function startOfDashboardDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDashboardDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDashboardDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function recordTitle(data: CrmData, object: ObjectKey, record: CrmRecord): string {
  return recordDisplayName(data, object, record.id);
}

function inferObject(record: CrmRecord): ObjectKey {
  if (record.id.startsWith("lea_")) return "leads";
  if (record.id.startsWith("opp_")) return "opportunities";
  if (record.id.startsWith("cas_")) return "cases";
  if (record.id.startsWith("tsk_")) return "tasks";
  if (record.id.startsWith("acc_")) return "accounts";
  if (record.id.startsWith("con_")) return "contacts";
  if (record.id.startsWith("quo_")) return "proposals";
  if (record.id.startsWith("inv_")) return "invoices";
  if (record.id.startsWith("prd_")) return "products";
  return "users";
}

function initialValues(data: CrmData, object: ObjectKey, record?: CrmRecord): RecordMap {
  if (record) return { ...record };
  const firstUser = data.users[0]?.id;
  const defaults: RecordMap = { ownerId: firstUser };
  for (const field of fieldConfigs[object]) {
    if (field.readOnly) continue;
    if (field.type === "boolean") defaults[field.key] = false;
    if (field.type === "number" || field.type === "currency" || field.type === "percent") defaults[field.key] = 0;
    if (field.type === "picklist") defaults[field.key] = getPicklistValues(data, field.picklist)[0] ?? "";
  }
  if (object === "opportunities") {
    defaults.currencyIsoCode = "EUR";
    defaults.closeDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    defaults.amountMode = "manual";
  }
  if (object === "products" || object === "proposals" || object === "invoices") defaults.currencyIsoCode = "EUR";
  if (object === "invoices") defaults.invoiceDate = new Date().toISOString().slice(0, 10);
  if (object === "tasks") defaults.dueDate = new Date().toISOString().slice(0, 10);
  return defaults;
}

function isPathObject(object: ObjectKey): object is PathObjectKey {
  return pathObjects.includes(object as PathObjectKey);
}

function inputType(type: FieldConfig["type"]): string {
  if (type === "email") return "email";
  if (type === "password") return "password";
  if (type === "phone") return "tel";
  if (type === "url") return "url";
  if (type === "date") return "date";
  if (type === "datetime") return "datetime-local";
  if (type === "number" || type === "currency" || type === "percent") return "number";
  return "text";
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(authStorageKey);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function storeSession(session: AuthSession): void {
  localStorage.setItem(authStorageKey, JSON.stringify(session));
}

function clearStoredSession(): void {
  localStorage.removeItem(authStorageKey);
}

export default App;

const translations = {
  en: {
    title: "Agentia Labs — Agentic Operations",
    description: "Agentia Workspace runs operational and administrative work for professional service firms while core expert judgement stays with their professionals.",
    strings: {
      "nav.operations": "Agentic Operations",
      "nav.industries": "Industry Blueprints",
      "nav.workspace": "The Workspace",
      "nav.method": "How we work",
      "nav.trust": "Trust",
      "nav.cta": "Book a demo",
      "hero.eyebrow": "Agentic operations",
      "hero.title": "Operations,<br />run by agents.",
      "hero.copy": "Cut through the AI noise. Put focused agents to work—without replacing professional judgement.",
      "hero.primary": "Book a demo",
      "hero.secondary": "Explore Workspace",
      "manifesto.kicker": "Our manifesto",
      "manifesto.title": "Your best people shouldn't be wasting time",
      "manifesto.copy": "Repetitive work belongs to agents. Give your teams back the time, judgement and relationships that move your business forward.",
      "workspace.title": "One platform,<br />two kinds of agents working together.",
      "workspace.copy": "General-purpose AI gives professionals a blank canvas. Agentia gives them focused agents, grounded in firm context and proven processes, to execute work faster and spend more time on judgement, clients and outcomes.",
      "workspace.headless.title": "Headless execution",
      "workspace.headless.copy": "Agents run the operational work around your professionals—always on, structured and auditable.",
      "workspace.headless.one": "Autonomous, always-on execution",
      "workspace.headless.two": "Human-in-the-loop for exceptions",
      "workspace.headless.three": "Every step monitored and auditable",
      "workspace.focused.title": "Conversational agents",
      "workspace.focused.copy": "Focused agents bring the right context, tools and process to each job—without the noise of a general-purpose chat.",
      "workspace.focused.one": "One focused agent for each job",
      "workspace.focused.two": "Grounded in firm knowledge and live data",
      "workspace.focused.three": "Human approval before action",
      "workspace.runtime.label": "Live execution",
      "workspace.runtime.live": "LIVE",
      "workspace.runtime.ready": "READY",
      "workspace.runtime.queued": "Queued",
      "workspace.demo.user": "You",
      "workspace.demo.nav": "Time capture",
      "workspace.demo.request": "I want to prepare my weekly billable hours.",
      "workspace.demo.fetch": "I’ll connect to the time and matter systems, then bring in the Time Capture Agent.",
      "workspace.demo.mcpLabel": "Time & matter systems",
      "workspace.demo.mcpRunning": "Connecting",
      "workspace.demo.mcpDone": "Connected",
      "workspace.demo.toolLabel": "Read weekly activity",
      "workspace.demo.toolRunning": "Calling tool",
      "workspace.demo.toolDone": "11 records found",
      "workspace.demo.agent": "Time Capture Agent",
      "workspace.demo.agentRunning": "Building proposal",
      "workspace.demo.ready": "Proposal ready",
      "workspace.demo.agentDetail": "Reviewed 11 time entries across calendar, matters and drafted activity.",
      "workspace.demo.proposal": "The agent has proposed 25 hours for this week. Would you like to review the details before I log them?",
      "workspace.demo.cardTitle": "Weekly billable hours",
      "workspace.demo.cardMeta": "25.0 hours · 11 entries · 4 matters",
      "workspace.demo.cardReady": "Ready to log",
      "workspace.demo.matterOne": "Matter planning & client calls",
      "workspace.demo.matterTwo": "Drafting & document review",
      "workspace.demo.matterThree": "Negotiation & follow-up",
      "workspace.demo.detailOneValue": "8.5h",
      "workspace.demo.detailTwoValue": "10.0h",
      "workspace.demo.detailThreeValue": "6.5h",
      "workspace.demo.review": "Review details",
      "workspace.demo.hide": "Hide details",
      "workspace.demo.log": "Log 25 hours",
      "workspace.demo.logged": "25 hours logged",
      "workspace.demo.loggedStatus": "Logged to the time system",
      "workspace.demo.promptLabel": "Ask Agentia to do work",
      "workspace.demo.prompt": "Ask Agentia to do work…",
      "workspace.pipeline.nav": "Pipeline monitor",
      "workspace.pipeline.request": "What needs my attention in the pipeline today?",
      "workspace.pipeline.fetch": "I’ll connect to the pipeline CRM, check the review targets and bring in the Pipeline Monitor Agent.",
      "workspace.pipeline.mcpLabel": "Pipeline CRM",
      "workspace.pipeline.mcpRunning": "Connecting",
      "workspace.pipeline.mcpDone": "Connected",
      "workspace.pipeline.toolLabel": "Check review targets",
      "workspace.pipeline.toolRunning": "Calling tool",
      "workspace.pipeline.toolDone": "8 priorities found",
      "workspace.pipeline.agent": "Pipeline Monitor Agent",
      "workspace.pipeline.agentRunning": "Preparing digest",
      "workspace.pipeline.ready": "Digest ready",
      "workspace.pipeline.agentDetail": "Scanned the connected CRM across four stages and applied the firm’s review targets.",
      "workspace.pipeline.proposal": "The agent found 8 items that need attention across 4 pipeline stages. Some are already beyond the firm’s review targets. Would you like to review the priorities before I prepare the follow-ups?",
      "workspace.pipeline.cardTitle": "Pipeline priorities",
      "workspace.pipeline.cardMeta": "8 items · 4 stages · Connected CRM",
      "workspace.pipeline.cardReady": "Ready to review",
      "workspace.pipeline.detailOneValue": "7d",
      "workspace.pipeline.detailOne": "Lead review target",
      "workspace.pipeline.detailTwoValue": "1d",
      "workspace.pipeline.detailTwo": "Proposal pending target",
      "workspace.pipeline.detailThreeValue": "1d",
      "workspace.pipeline.detailThree": "Partner review target",
      "workspace.pipeline.detailFourValue": "Weekly",
      "workspace.pipeline.detailFour": "Sent proposal follow-up",
      "workspace.pipeline.review": "Review 8 items",
      "workspace.pipeline.hide": "Hide priorities",
      "workspace.pipeline.action": "Prepare follow-ups",
      "workspace.pipeline.done": "Follow-ups prepared",
      "workspace.pipeline.doneStatus": "Follow-ups ready for review",
      "workspace.application.nav": "Application pack",
      "workspace.application.request": "Prepare the onboarding application for a new client in Portugal.",
      "workspace.application.fetch": "I’ll connect to the client data and document systems, then bring in the Application Pack Agent.",
      "workspace.application.mcpLabel": "Client data & documents",
      "workspace.application.mcpRunning": "Connecting",
      "workspace.application.mcpDone": "Connected",
      "workspace.application.toolLabel": "Validate application fields",
      "workspace.application.toolRunning": "Calling tool",
      "workspace.application.toolDone": "619 fields checked",
      "workspace.application.agent": "Application Pack Agent",
      "workspace.application.agentRunning": "Assembling draft",
      "workspace.application.ready": "Draft ready",
      "workspace.application.agentDetail": "Selected the correct forms, prefilled known data and flagged missing information.",
      "workspace.application.proposal": "The agent has prepared the 31-page application and checked all 619 fields. Would you like to review the missing-information checklist before I generate the pack?",
      "workspace.application.cardTitle": "Client application · Portugal",
      "workspace.application.cardMeta": "31 pages · 619 fields checked",
      "workspace.application.cardReady": "Ready for review",
      "workspace.application.detailOneValue": "31",
      "workspace.application.detailOne": "pages prepared",
      "workspace.application.detailTwoValue": "619",
      "workspace.application.detailTwo": "fields checked",
      "workspace.application.detailThreeValue": "Flagged",
      "workspace.application.detailThree": "missing information",
      "workspace.application.review": "Review missing information",
      "workspace.application.hide": "Hide checklist",
      "workspace.application.action": "Generate pack",
      "workspace.application.done": "Pack generated",
      "workspace.application.doneStatus": "Generated for review",
      "outcomes.jobs": "jobs completed",
      "outcomes.hours": "hours released",
      "outcomes.quality": "quality pass",
      "outcomes.exceptions": "exceptions awaiting judgement",
      "industries.kicker": "We are building the industry expertise and engineering the agents",
      "industries.title": "Industry blueprints",
      "law.title": "For law firms",
      "law.copy": "Five deployment-ready agent blueprints grounded in how a law firm actually operates.",
      "law.one.title": "Partner Intelligence Agent",
      "law.one.copy": "Prepares client meetings and gives partners a live view of pipeline, matters and firm performance.",
      "law.two.title": "Lawyer Operations Agent",
      "law.two.copy": "Orchestrates matters, tasks, documents and specialist agents from one conversation.",
      "law.three.title": "Time Capture Agent",
      "law.three.copy": "Reconstructs work and proposes billable entries by matter for approval.",
      "law.four.title": "Pipeline Monitor",
      "law.four.copy": "Flags stalled prospects and proposals, then prepares the next action.",
      "law.five.title": "Client Intake & Onboarding Agent",
      "law.five.copy": "Coordinates prospect screening, conflict checks, KYC/AML and CRM-to-matter onboarding.",
      "law.cta": "Explore law firm operations",
      "wealth.title": "For wealth management firms",
      "wealth.copy": "Five deployment-ready agent blueprints grounded in the operational client lifecycle.",
      "wealth.one.title": "Client Onboarding Agent",
      "wealth.one.copy": "Builds application packs, pre-fills known data and flags missing evidence.",
      "wealth.two.title": "Client Review Preparation Agent",
      "wealth.two.copy": "Prepares review packs from approved facts and surfaces gaps for adviser sign-off.",
      "wealth.three.title": "Signing & Records Agent",
      "wealth.three.copy": "Prepares signature packs, tracks completion and files signed evidence.",
      "wealth.four.title": "Client Data Readiness Agent",
      "wealth.four.copy": "Finds missing fields and prepares evidence-backed client record updates.",
      "wealth.five.title": "Finance & Management Reporting Agent",
      "wealth.five.copy": "Reconciles recurring data and drafts adviser statements, KPIs and board commentary.",
      "wealth.cta": "Explore wealth operations",
      "method.kicker": "From first workflow to managed operations",
      "method.title": "One useful operation in four weeks.",
      "method.copy": "We start with one high-value operational job, prove it in production, then operate and expand the agentic system with your team.",
      "method.phase.title": "Operating journey",
      "method.phase.time": "Weeks 01–04 → ongoing",
      "method.one.week": "Week 01",
      "method.one.title": "Discover",
      "method.one.copy": "Map the job, establish the baseline and define a measurable outcome.",
      "method.two.week": "Week 02",
      "method.two.title": "Design",
      "method.two.copy": "Define the target flow, permissions, human decisions and exception paths.",
      "method.three.week": "Weeks 03–04",
      "method.three.title": "Deploy",
      "method.three.copy": "Connect the systems, configure the agents and test on real work.",
      "method.four.week": "Week 04",
      "method.four.title": "Prove",
      "method.four.copy": "Run in production, measure quality and capacity, and agree the next operation.",
      "method.five.week": "Monthly",
      "method.five.title": "Operate",
      "method.five.copy": "Monitor quality, resolve exceptions, improve live agents and deploy the next operations.",
      "trust.kicker": "Built for sensitive operations",
      "trust.title": "Trust is<br />non-negotiable.",
      "trust.copy": "Agentia is built for the security, scale and privacy requirements of professional service firms—so agents can operate across sensitive workflows without compromising client confidentiality.",
      "trust.one.label": "Security",
      "trust.one.title": "Encrypted at every layer.",
      "trust.one.copy": "Data is encrypted in transit and at rest, with controlled access and complete visibility over agent activity.",
      "trust.one.proof.one": "Encryption in transit + at rest",
      "trust.one.proof.two": "Controlled access",
      "trust.one.proof.three": "Auditable activity",
      "trust.two.label": "Scalability",
      "trust.two.title": "Enterprise-grade by design.",
      "trust.two.copy": "From one workflow to agents operating across teams and systems, Agentia remains observable, governed and resilient as volume grows.",
      "trust.two.proof.one": "Resilient infrastructure",
      "trust.two.proof.two": "Central control",
      "trust.two.proof.three": "Multi-workflow",
      "trust.three.label": "Privacy",
      "trust.three.title": "Your data is not the product.",
      "trust.three.copy": "Model providers do not retain prompts, files or outputs and never use them for training. Your firm controls what operational records remain in Agentia Workspace.",
      "trust.three.proof.one": "Zero data retention",
      "trust.three.proof.two": "No training on customer data",
      "trust.three.proof.three": "Firm-controlled retention",
      "demo.kicker": "Book a demo",
      "demo.title": "Find the first operation your agents should run.",
      "demo.copy": "Tell us the minimum context. We will review where agentic operations can create useful, measurable capacity first.",
      "form.firstName": "First name",
      "form.lastName": "Last name",
      "form.company": "Company",
      "form.companyPlaceholder": "Company name",
      "form.emailPlaceholder": "paula@company.com",
      "form.phone": "Phone",
      "form.industry": "Firm type",
      "form.industryPlaceholder": "Select one",
      "form.law": "Law firm",
      "form.wealth": "Wealth management",
      "form.other": "Other professional services",
      "form.operation": "Operation to free up first",
      "form.operationPlaceholder": "Matter intake, onboarding, reporting, documents, approvals...",
      "form.submit": "Send request",
      "form.status.idle": "We will only use this data to answer your request and prepare the demo.",
      "form.status.sending": "Sending request...",
      "form.status.success": "Request sent. We will review it and get back to you shortly.",
      "form.status.error": "We could not send the request. Please try again or email hello@agentialabs.ai.",
      "footer.copy": "© 2026 Agentia Labs. Agentic operations for professional service companies."
    }
  },
  es: {
    title: "Agentia Labs — Operaciones agénticas",
    description: "Agentia Workspace ejecuta el trabajo operativo y administrativo de firmas de servicios profesionales mientras el criterio experto permanece en sus profesionales.",
    strings: {
      "nav.operations": "Operaciones agénticas",
      "nav.industries": "Blueprints por industria",
      "nav.workspace": "El Workspace",
      "nav.method": "Cómo trabajamos",
      "nav.trust": "Confianza",
      "nav.cta": "Reserva una demo",
      "hero.eyebrow": "Operaciones agénticas",
      "hero.title": "Operaciones,<br />ejecutadas por agentes.",
      "hero.copy": "Reduce el ruido de la IA. Pon agentes enfocados a trabajar sin sustituir el criterio profesional.",
      "hero.primary": "Reserva una demo",
      "hero.secondary": "Explora Workspace",
      "manifesto.kicker": "Nuestro manifiesto",
      "manifesto.title": "Tus mejores profesionales no deberían perder el tiempo",
      "manifesto.copy": "El trabajo repetitivo pertenece a los agentes. Devuelve a tus equipos el tiempo, el criterio y las relaciones que hacen avanzar el negocio.",
      "workspace.title": "Una plataforma,<br />dos tipos de agentes trabajando juntos.",
      "workspace.copy": "La IA generalista deja a los profesionales ante un lienzo en blanco. Agentia les ofrece agentes enfocados, basados en el contexto y los procesos de la firma, para ejecutar más rápido y dedicar más tiempo al criterio, los clientes y los resultados.",
      "workspace.headless.title": "Ejecución headless",
      "workspace.headless.copy": "Los agentes ejecutan el trabajo operativo que rodea a tus profesionales: siempre activos, estructurados y auditables.",
      "workspace.headless.one": "Ejecución autónoma y siempre activa",
      "workspace.headless.two": "Supervisión humana ante excepciones",
      "workspace.headless.three": "Cada paso monitorizado y auditable",
      "workspace.focused.title": "Agentes conversacionales",
      "workspace.focused.copy": "Agentes enfocados aportan el contexto, las herramientas y el proceso adecuados a cada tarea, sin el ruido de un chat generalista.",
      "workspace.focused.one": "Un agente enfocado para cada tarea",
      "workspace.focused.two": "Basados en conocimiento y datos de la firma",
      "workspace.focused.three": "Aprobación humana antes de actuar",
      "workspace.runtime.label": "Ejecución en directo",
      "workspace.runtime.live": "EN DIRECTO",
      "workspace.runtime.ready": "LISTO",
      "workspace.runtime.queued": "En cola",
      "workspace.demo.user": "Tú",
      "workspace.demo.nav": "Captura de tiempo",
      "workspace.demo.request": "Quiero preparar mis horas facturables de esta semana.",
      "workspace.demo.fetch": "Voy a conectar con los sistemas de tiempos y asuntos y a activar el Agente de Captura de Tiempo.",
      "workspace.demo.mcpLabel": "Sistemas de tiempos y asuntos",
      "workspace.demo.mcpRunning": "Conectando",
      "workspace.demo.mcpDone": "Conectado",
      "workspace.demo.toolLabel": "Leer actividad semanal",
      "workspace.demo.toolRunning": "Ejecutando herramienta",
      "workspace.demo.toolDone": "11 registros encontrados",
      "workspace.demo.agent": "Agente de Captura de Tiempo",
      "workspace.demo.agentRunning": "Preparando propuesta",
      "workspace.demo.ready": "Propuesta lista",
      "workspace.demo.agentDetail": "Ha revisado 11 registros de tiempo entre calendario, asuntos y actividad redactada.",
      "workspace.demo.proposal": "El agente ha propuesto 25 horas para esta semana. ¿Quieres revisar el detalle antes de que las registre?",
      "workspace.demo.cardTitle": "Horas facturables semanales",
      "workspace.demo.cardMeta": "25,0 horas · 11 registros · 4 asuntos",
      "workspace.demo.cardReady": "Listas para registrar",
      "workspace.demo.matterOne": "Planificación de asuntos y llamadas",
      "workspace.demo.matterTwo": "Redacción y revisión documental",
      "workspace.demo.matterThree": "Negociación y seguimiento",
      "workspace.demo.detailOneValue": "8,5h",
      "workspace.demo.detailTwoValue": "10,0h",
      "workspace.demo.detailThreeValue": "6,5h",
      "workspace.demo.review": "Revisar detalle",
      "workspace.demo.hide": "Ocultar detalle",
      "workspace.demo.log": "Registrar 25 horas",
      "workspace.demo.logged": "25 horas registradas",
      "workspace.demo.loggedStatus": "Registradas en el sistema de tiempos",
      "workspace.demo.promptLabel": "Pide a Agentia que ejecute trabajo",
      "workspace.demo.prompt": "Pide a Agentia que ejecute trabajo…",
      "workspace.pipeline.nav": "Monitor de pipeline",
      "workspace.pipeline.request": "¿Qué tengo que atender hoy en el pipeline?",
      "workspace.pipeline.fetch": "Voy a conectar con el CRM, comprobar los objetivos de revisión y activar el Agente Monitor de Pipeline.",
      "workspace.pipeline.mcpLabel": "CRM de pipeline",
      "workspace.pipeline.mcpRunning": "Conectando",
      "workspace.pipeline.mcpDone": "Conectado",
      "workspace.pipeline.toolLabel": "Comprobar objetivos de revisión",
      "workspace.pipeline.toolRunning": "Ejecutando herramienta",
      "workspace.pipeline.toolDone": "8 prioridades detectadas",
      "workspace.pipeline.agent": "Agente Monitor de Pipeline",
      "workspace.pipeline.agentRunning": "Preparando resumen",
      "workspace.pipeline.ready": "Resumen listo",
      "workspace.pipeline.agentDetail": "Ha revisado cuatro etapas en el CRM conectado y aplicado los objetivos de revisión de la firma.",
      "workspace.pipeline.proposal": "El agente ha detectado 8 elementos que requieren atención en 4 etapas del pipeline. Algunos ya han superado los objetivos de revisión de la firma. ¿Quieres revisar las prioridades antes de que prepare los seguimientos?",
      "workspace.pipeline.cardTitle": "Prioridades del pipeline",
      "workspace.pipeline.cardMeta": "8 elementos · 4 etapas · CRM conectado",
      "workspace.pipeline.cardReady": "Listo para revisar",
      "workspace.pipeline.detailOneValue": "7 d",
      "workspace.pipeline.detailOne": "Objetivo de revisión de leads",
      "workspace.pipeline.detailTwoValue": "1 d",
      "workspace.pipeline.detailTwo": "Objetivo de propuesta pendiente",
      "workspace.pipeline.detailThreeValue": "1 d",
      "workspace.pipeline.detailThree": "Objetivo de revisión de socio",
      "workspace.pipeline.detailFourValue": "Semanal",
      "workspace.pipeline.detailFour": "Seguimiento de propuestas enviadas",
      "workspace.pipeline.review": "Revisar 8 elementos",
      "workspace.pipeline.hide": "Ocultar prioridades",
      "workspace.pipeline.action": "Preparar seguimientos",
      "workspace.pipeline.done": "Seguimientos preparados",
      "workspace.pipeline.doneStatus": "Seguimientos listos para revisar",
      "workspace.application.nav": "Expediente de solicitud",
      "workspace.application.request": "Prepara la solicitud de onboarding para un nuevo cliente en Portugal.",
      "workspace.application.fetch": "Voy a conectar con los sistemas de datos y documentos del cliente y a activar el Agente de Expedientes.",
      "workspace.application.mcpLabel": "Datos y documentos del cliente",
      "workspace.application.mcpRunning": "Conectando",
      "workspace.application.mcpDone": "Conectado",
      "workspace.application.toolLabel": "Validar campos de la solicitud",
      "workspace.application.toolRunning": "Ejecutando herramienta",
      "workspace.application.toolDone": "619 campos comprobados",
      "workspace.application.agent": "Agente de Expedientes",
      "workspace.application.agentRunning": "Preparando borrador",
      "workspace.application.ready": "Borrador listo",
      "workspace.application.agentDetail": "Ha seleccionado los formularios, prerrellenado los datos conocidos y señalado la información pendiente.",
      "workspace.application.proposal": "El agente ha preparado la solicitud de 31 páginas y ha comprobado sus 619 campos. ¿Quieres revisar la información pendiente antes de que genere el expediente?",
      "workspace.application.cardTitle": "Solicitud de cliente · Portugal",
      "workspace.application.cardMeta": "31 páginas · 619 campos comprobados",
      "workspace.application.cardReady": "Lista para revisión",
      "workspace.application.detailOneValue": "31",
      "workspace.application.detailOne": "páginas preparadas",
      "workspace.application.detailTwoValue": "619",
      "workspace.application.detailTwo": "campos comprobados",
      "workspace.application.detailThreeValue": "Señalada",
      "workspace.application.detailThree": "información pendiente",
      "workspace.application.review": "Revisar información pendiente",
      "workspace.application.hide": "Ocultar checklist",
      "workspace.application.action": "Generar expediente",
      "workspace.application.done": "Expediente generado",
      "workspace.application.doneStatus": "Generado para revisión",
      "outcomes.jobs": "jobs completados",
      "outcomes.hours": "horas liberadas",
      "outcomes.quality": "quality pass",
      "outcomes.exceptions": "excepciones pendientes de criterio",
      "industries.kicker": "Estamos construyendo el conocimiento sectorial y desarrollando los agentes",
      "industries.title": "Blueprints por industria",
      "law.title": "Para despachos",
      "law.copy": "Cinco blueprints de agentes listos para desplegar, basados en cómo opera realmente un despacho.",
      "law.one.title": "Agente de inteligencia para socios",
      "law.one.copy": "Prepara reuniones y ofrece a los socios una visión actualizada del pipeline, los asuntos y la firma.",
      "law.two.title": "Agente de operaciones para abogados",
      "law.two.copy": "Orquesta asuntos, tareas, documentos y agentes especializados desde una conversación.",
      "law.three.title": "Agente de captura de tiempo",
      "law.three.copy": "Reconstruye el trabajo y propone registros facturables por asunto para aprobación.",
      "law.four.title": "Monitor de pipeline",
      "law.four.copy": "Detecta prospectos y propuestas estancadas, y prepara la siguiente acción.",
      "law.five.title": "Agente de intake y onboarding de clientes",
      "law.five.copy": "Coordina la evaluación inicial, conflictos, KYC/AML y el alta en CRM y asuntos.",
      "law.cta": "Explora operaciones legales",
      "wealth.title": "Para firmas de wealth management",
      "wealth.copy": "Cinco blueprints de agentes listos para desplegar, basados en el ciclo operativo del cliente.",
      "wealth.one.title": "Agente de onboarding de clientes",
      "wealth.one.copy": "Prepara expedientes, prerrellena datos conocidos y señala evidencias pendientes.",
      "wealth.two.title": "Agente de preparación de revisiones",
      "wealth.two.copy": "Prepara revisiones con datos aprobados y señala carencias para aprobación del asesor.",
      "wealth.three.title": "Agente de firma y archivo",
      "wealth.three.copy": "Prepara paquetes de firma, controla su finalización y archiva las evidencias.",
      "wealth.four.title": "Agente de preparación de datos de clientes",
      "wealth.four.copy": "Detecta campos incompletos y prepara actualizaciones respaldadas por evidencias.",
      "wealth.five.title": "Agente de reporting financiero y de gestión",
      "wealth.five.copy": "Concilia datos y prepara informes por asesor, KPIs y comentarios para el consejo.",
      "wealth.cta": "Explora operaciones de wealth",
      "method.kicker": "Del primer flujo de trabajo a operaciones gestionadas",
      "method.title": "Una operación útil en cuatro semanas.",
      "method.copy": "Empezamos con una operación de alto valor, la validamos en producción y después operamos y ampliamos el sistema agéntico junto a tu equipo.",
      "method.phase.title": "Recorrido operativo",
      "method.phase.time": "Semanas 01–04 → continuo",
      "method.one.week": "Semana 01",
      "method.one.title": "Descubrir",
      "method.one.copy": "Mapeamos la operación, establecemos el punto de partida y definimos un resultado medible.",
      "method.two.week": "Semana 02",
      "method.two.title": "Diseñar",
      "method.two.copy": "Definimos el flujo objetivo, los permisos, las decisiones humanas y las rutas de excepción.",
      "method.three.week": "Semanas 03–04",
      "method.three.title": "Desplegar",
      "method.three.copy": "Conectamos los sistemas, configuramos los agentes y los probamos con trabajo real.",
      "method.four.week": "Semana 04",
      "method.four.title": "Validar",
      "method.four.copy": "Ejecutamos en producción, medimos calidad y capacidad, y acordamos la siguiente operación.",
      "method.five.week": "Mensual",
      "method.five.title": "Operar",
      "method.five.copy": "Monitorizamos la calidad, resolvemos excepciones, mejoramos los agentes activos y desplegamos nuevas operaciones.",
      "trust.kicker": "Diseñado para operaciones sensibles",
      "trust.title": "La confianza no es<br />negociable.",
      "trust.copy": "Agentia está diseñada para responder a los requisitos de seguridad, escalabilidad y privacidad de las firmas de servicios profesionales, para que los agentes puedan operar en procesos sensibles sin comprometer la confidencialidad de sus clientes.",
      "trust.one.label": "Seguridad",
      "trust.one.title": "Cifrado en cada capa.",
      "trust.one.copy": "Los datos se cifran en tránsito y en reposo, con accesos controlados y visibilidad completa sobre la actividad de los agentes.",
      "trust.one.proof.one": "Cifrado en tránsito + en reposo",
      "trust.one.proof.two": "Acceso controlado",
      "trust.one.proof.three": "Actividad auditable",
      "trust.two.label": "Escalabilidad",
      "trust.two.title": "Enterprise-grade desde el diseño.",
      "trust.two.copy": "Desde un proceso hasta agentes operando entre equipos y sistemas, Agentia mantiene observabilidad, gobernanza y resiliencia a medida que crece el volumen.",
      "trust.two.proof.one": "Infraestructura resiliente",
      "trust.two.proof.two": "Control centralizado",
      "trust.two.proof.three": "Múltiples operaciones",
      "trust.three.label": "Privacidad",
      "trust.three.title": "Tus datos no son el producto.",
      "trust.three.copy": "Los proveedores de modelos no conservan prompts, archivos ni resultados y nunca los utilizan para entrenamiento. Tu firma controla qué registros operativos permanecen en Agentia Workspace.",
      "trust.three.proof.one": "Zero data retention",
      "trust.three.proof.two": "Sin entrenamiento con tus datos",
      "trust.three.proof.three": "Retención controlada por la firma",
      "demo.kicker": "Reserva una demo",
      "demo.title": "Encuentra la primera operación que tus agentes deberían ejecutar.",
      "demo.copy": "Cuéntanos el contexto mínimo. Revisaremos dónde las operaciones agénticas pueden crear primero capacidad útil y medible.",
      "form.firstName": "Nombre",
      "form.lastName": "Apellidos",
      "form.company": "Empresa",
      "form.companyPlaceholder": "Nombre de la empresa",
      "form.emailPlaceholder": "paula@empresa.com",
      "form.phone": "Teléfono",
      "form.industry": "Tipo de firma",
      "form.industryPlaceholder": "Selecciona una",
      "form.law": "Despacho de abogados",
      "form.wealth": "Wealth management",
      "form.other": "Otros servicios profesionales",
      "form.operation": "Operación a liberar primero",
      "form.operationPlaceholder": "Intake de asuntos, onboarding, reporting, documentos, aprobaciones...",
      "form.submit": "Enviar solicitud",
      "form.status.idle": "Usaremos estos datos solo para responder a tu solicitud y preparar la demo.",
      "form.status.sending": "Enviando solicitud...",
      "form.status.success": "Solicitud enviada. La revisaremos y te responderemos en breve.",
      "form.status.error": "No hemos podido enviar la solicitud. Inténtalo de nuevo o escribe a hello@agentialabs.ai.",
      "footer.copy": "© 2026 Agentia Labs. Operaciones agénticas para firmas de servicios profesionales."
    }
  }
};

const storageKey = "agentia-lang";
const supportedLanguages = ["en", "es"];
let currentLanguage = supportedLanguages.includes(document.documentElement.dataset.initialLang)
  ? document.documentElement.dataset.initialLang
  : "en";

function updateMeta(dictionary) {
  document.title = dictionary.title;
  const description = document.querySelector('meta[name="description"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  description?.setAttribute("content", dictionary.description);
  ogTitle?.setAttribute("content", dictionary.title);
  ogDescription?.setAttribute("content", dictionary.description);
  twitterTitle?.setAttribute("content", dictionary.title);
  twitterDescription?.setAttribute("content", dictionary.description);
}

function setLanguage(language, persist = true) {
  currentLanguage = supportedLanguages.includes(language) ? language : "en";
  const dictionary = translations[currentLanguage];
  document.documentElement.lang = currentLanguage;
  updateMeta(dictionary);

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = dictionary.strings[node.dataset.i18n];
    if (value) node.innerHTML = value;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const value = dictionary.strings[node.dataset.i18nPlaceholder];
    if (value) node.setAttribute("placeholder", value);
  });

  document.querySelectorAll("[data-language-toggle]").forEach((button) => {
    button.textContent = currentLanguage === "en" ? "ES" : "EN";
    button.setAttribute("aria-label", currentLanguage === "en" ? "Switch to Spanish" : "Cambiar a inglés");
  });

  if (persist) {
    try { localStorage.setItem(storageKey, currentLanguage); } catch (error) {}
  }

  document.dispatchEvent(new CustomEvent("agentia:languagechange"));
}

document.querySelectorAll("[data-language-toggle]").forEach((button) => {
  button.addEventListener("click", () => setLanguage(currentLanguage === "en" ? "es" : "en"));
});

const menuButton = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.getElementById("mobile-menu");

const workspaceSection = document.getElementById("workspace");
const industriesSection = document.getElementById("industries");
if (workspaceSection && industriesSection) workspaceSection.before(industriesSection);

function setMenu(open) {
  if (!menuButton || !mobileMenu) return;
  menuButton.setAttribute("aria-expanded", String(open));
  mobileMenu.hidden = !open;
  document.body.classList.toggle("menu-open", open);
  const icon = menuButton.querySelector(".material-symbols-outlined");
  if (icon) icon.textContent = open ? "close" : "menu";
}

menuButton?.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

document.querySelectorAll("[data-mobile-link]").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 1040) setMenu(false);
});

const observedSections = ["top", "industries", "workspace", "method", "trust"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
if ("IntersectionObserver" in window && observedSections.length) {
  const navigationObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`));
  }, { rootMargin: "-20% 0px -62% 0px", threshold: [0.05, 0.25, 0.5] });
  observedSections.forEach((section) => navigationObserver.observe(section));
}

function formStatusKey(state) {
  return `form.status.${state}`;
}

const demoForm = document.querySelector("[data-demo-form]");
if (demoForm) {
  const status = demoForm.querySelector("[data-demo-status]");
  const submit = demoForm.querySelector('button[type="submit"]');
  const endpoint = () => window.AGENTIA_CRM_DEMO_ENDPOINT || demoForm.dataset.endpoint;

  const setFormStatus = (state) => {
    if (!status) return;
    status.textContent = translations[currentLanguage].strings[formStatusKey(state)] || "";
    status.dataset.state = state;
  };

  document.addEventListener("agentia:languagechange", () => setFormStatus("idle"));

  demoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!endpoint()) {
      setFormStatus("error");
      return;
    }

    const payload = Object.fromEntries(new FormData(demoForm).entries());
    payload.pageUrl = window.location.href;
    payload.language = currentLanguage;

    setFormStatus("sending");
    if (submit) submit.disabled = true;

    try {
      const response = await fetch(endpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw new Error(data.error || "Request failed");
      demoForm.reset();
      setFormStatus("success");
    } catch (error) {
      setFormStatus("error");
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

setLanguage(currentLanguage, false);

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
const desktopMotionQuery = window.matchMedia("(min-width: 1041px)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const desktopRail = document.getElementById("desktop-rail");
const railToggle = document.querySelector("[data-rail-toggle]");
const railScrim = document.querySelector("[data-rail-scrim]");
const scrollMeter = document.querySelector(".scroll-meter");
const heroSection = document.getElementById("top");
const manifestoSpotlight = document.querySelector(".manifesto-spotlight");
const workspaceScene = document.getElementById("workspace");
const methodStory = document.querySelector("[data-method-story]");
const methodSteps = methodStory
  ? Array.from(methodStory.querySelectorAll("[data-method-step]"))
  : [];
const workspaceConversation = document.querySelector("[data-workspace-conversation]");
const workspaceConversationSteps = workspaceConversation
  ? Array.from(workspaceConversation.querySelectorAll("[data-workspace-step]"))
  : [];
const workspaceRuntime = workspaceConversation?.querySelector("[data-workspace-runtime]");
const workspaceAgentDisclosure = workspaceConversation?.querySelector("[data-agent-disclosure]");
const workspaceAgentDetail = workspaceConversation?.querySelector("[data-agent-detail]");
const workspaceReviewButton = workspaceConversation?.querySelector("[data-review-work]");
const workspaceCompleteButton = workspaceConversation?.querySelector("[data-complete-work]");
const workspaceDetails = workspaceConversation?.querySelector("[data-workspace-details]");
const workspaceResultStatus = workspaceConversation?.querySelector("[data-workspace-status]");
const workspaceComposer = workspaceConversation?.querySelector("[data-workspace-composer]");
const workspaceComposerStatus = workspaceConversation?.querySelector("[data-workspace-composer-status]");
const workspaceRequestCopy = workspaceConversation?.querySelector("[data-workspace-field='request']");
const workspaceScenarioButtons = workspaceConversation
  ? Array.from(workspaceConversation.querySelectorAll("[data-workspace-scenario]"))
  : [];
const workspaceStepDelays = [240, 1500, 3100, 5700, 7900, 8600];
const workspaceStreamSteps = {
  0: { field: "request", duration: 1050 },
  1: { field: "fetch", duration: 1500 },
  3: { field: "proposal", duration: 2100 }
};
const workspaceRuntimeDefinitions = [
  { type: "MCP", icon: "hub", labelKey: "mcpLabel", runningKey: "mcpRunning", doneKey: "mcpDone" },
  { type: "TOOL", icon: "terminal", labelKey: "toolLabel", runningKey: "toolRunning", doneKey: "toolDone" },
  { type: "AGENT", icon: "smart_toy", labelKey: "agent", runningKey: "agentRunning", doneKey: "ready" }
];
const workspaceScenarioDefinitions = [
  {
    base: "workspace.demo",
    icon: "schedule",
    actionKey: "log",
    doneKey: "logged",
    doneStatusKey: "loggedStatus",
    details: [
      ["detailOneValue", "matterOne"],
      ["detailTwoValue", "matterTwo"],
      ["detailThreeValue", "matterThree"]
    ]
  },
  {
    base: "workspace.pipeline",
    icon: "account_tree",
    actionKey: "action",
    doneKey: "done",
    doneStatusKey: "doneStatus",
    details: [
      ["detailOneValue", "detailOne"],
      ["detailTwoValue", "detailTwo"],
      ["detailThreeValue", "detailThree"],
      ["detailFourValue", "detailFour"]
    ]
  },
  {
    base: "workspace.application",
    icon: "description",
    actionKey: "action",
    doneKey: "done",
    doneStatusKey: "doneStatus",
    details: [
      ["detailOneValue", "detailOne"],
      ["detailTwoValue", "detailTwo"],
      ["detailThreeValue", "detailThree"]
    ]
  }
];
let workspaceStepTimers = [];
let workspaceReplayTimer = 0;
let workspaceConversationVisible = false;
let workspaceConversationInteracted = false;
let workspaceScenarioIndex = 0;
let railOpenedByUser = false;
let scrollFrame = 0;
let lastNarrativeScrollY = window.scrollY;
let industrySnapTimer = 0;
let industrySnapInProgress = false;

function workspaceString(key) {
  return translations[currentLanguage]?.strings[key] || "";
}

function workspaceScenarioString(field) {
  const scenario = workspaceScenarioDefinitions[workspaceScenarioIndex];
  return scenario ? workspaceString(`${scenario.base}.${field}`) : "";
}

function clearWorkspaceConversationTimers() {
  workspaceStepTimers.forEach((timer) => {
    window.clearTimeout(timer);
    window.clearInterval(timer);
  });
  workspaceStepTimers = [];
  window.clearTimeout(workspaceReplayTimer);
  workspaceReplayTimer = 0;
}

function renderWorkspaceRuntime(scenario, complete = true) {
  if (!workspaceRuntime || !scenario) return;

  const heading = document.createElement("div");
  heading.className = "workspace-runtime-heading";
  const headingLabel = document.createElement("span");
  headingLabel.textContent = workspaceString("workspace.runtime.label");
  const headingState = document.createElement("small");
  headingState.textContent = workspaceString(`workspace.runtime.${complete ? "ready" : "live"}`);
  heading.append(headingLabel, headingState);

  const rows = workspaceRuntimeDefinitions.map((definition) => {
    const row = document.createElement("div");
    row.className = "workspace-runtime-row";
    row.dataset.runtimeRow = definition.type.toLowerCase();
    if (complete) row.classList.add("is-visible", "is-complete");
    else row.classList.add("is-queued");

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined workspace-runtime-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = complete ? "check_circle" : definition.icon;

    const copy = document.createElement("span");
    copy.className = "workspace-runtime-copy";
    const type = document.createElement("small");
    type.textContent = definition.type;
    const label = document.createElement("strong");
    label.textContent = workspaceString(`${scenario.base}.${definition.labelKey}`);
    copy.append(type, label);

    const state = document.createElement("span");
    state.className = "workspace-runtime-state";
    const stateDot = document.createElement("i");
    stateDot.setAttribute("aria-hidden", "true");
    const stateCopy = document.createElement("span");
    stateCopy.textContent = complete
      ? workspaceString(`${scenario.base}.${definition.doneKey}`)
      : workspaceString("workspace.runtime.queued");
    state.append(stateDot, stateCopy);

    row.dataset.runtimeIcon = definition.icon;
    row.dataset.runningCopy = workspaceString(`${scenario.base}.${definition.runningKey}`);
    row.dataset.doneCopy = workspaceString(`${scenario.base}.${definition.doneKey}`);
    row.append(icon, copy, state);
    return row;
  });

  workspaceRuntime.classList.toggle("is-complete", complete);
  workspaceRuntime.setAttribute(
    "aria-label",
    `${workspaceString("workspace.runtime.label")}: ${workspaceString(`${scenario.base}.agent`)}`
  );
  workspaceRuntime.replaceChildren(heading, ...rows);
}

function playWorkspaceRuntime() {
  if (!workspaceRuntime) return;
  const rows = Array.from(workspaceRuntime.querySelectorAll("[data-runtime-row]"));
  workspaceRuntime.classList.remove("is-complete");

  rows.forEach((row, index) => {
    const icon = row.querySelector(".workspace-runtime-icon");
    const stateCopy = row.querySelector(".workspace-runtime-state span");
    const startTimer = window.setTimeout(() => {
      row.classList.remove("is-queued");
      row.classList.add("is-visible", "is-running");
      if (icon) icon.textContent = row.dataset.runtimeIcon || "progress_activity";
      if (stateCopy) stateCopy.textContent = row.dataset.runningCopy || "";
    }, index * 520);
    const completeTimer = window.setTimeout(() => {
      row.classList.remove("is-running", "is-queued");
      row.classList.add("is-complete");
      if (icon) icon.textContent = "check_circle";
      if (stateCopy) stateCopy.textContent = row.dataset.doneCopy || "";
      if (index === rows.length - 1) {
        workspaceRuntime.classList.add("is-complete");
        const headingState = workspaceRuntime.querySelector(".workspace-runtime-heading small");
        if (headingState) headingState.textContent = workspaceString("workspace.runtime.ready");
      }
    }, index * 520 + 430);
    workspaceStepTimers.push(startTimer, completeTimer);
  });
}

function setWorkspaceStreamCopy(field, text) {
  const node = workspaceConversation?.querySelector(`[data-workspace-field='${field}']`);
  if (!node) return;
  const frame = node.closest("[data-workspace-stream]");
  if (frame) frame.dataset.streamCopy = text;
  node.setAttribute("aria-label", text);
  node.textContent = text;
  node.classList.remove("is-streaming");
}

function streamWorkspaceField(field, duration) {
  const scenario = workspaceScenarioDefinitions[workspaceScenarioIndex];
  const node = workspaceConversation?.querySelector(`[data-workspace-field='${field}']`);
  if (!scenario || !node) return;
  const text = workspaceString(`${scenario.base}.${field}`);
  const characters = Array.from(text);
  const intervalMs = Math.max(16, Math.min(42, Math.round(duration / Math.max(characters.length, 1))));
  let index = 0;

  setWorkspaceStreamCopy(field, text);
  node.textContent = "";
  node.classList.add("is-streaming");

  const interval = window.setInterval(() => {
    index += 1;
    node.textContent = characters.slice(0, index).join("");
    if (index >= characters.length) {
      window.clearInterval(interval);
      node.classList.remove("is-streaming");
    }
  }, intervalMs);
  workspaceStepTimers.push(interval);
}

function showWorkspaceConversation() {
  if (!workspaceConversation) return;
  clearWorkspaceConversationTimers();
  const scenario = workspaceScenarioDefinitions[workspaceScenarioIndex];
  workspaceConversation.classList.remove("is-sequencing", "is-switching");
  workspaceConversationSteps.forEach((step) => step.classList.add("is-visible"));
  ["request", "fetch", "proposal"].forEach((field) => {
    setWorkspaceStreamCopy(field, workspaceString(`${scenario.base}.${field}`));
  });
  renderWorkspaceRuntime(scenario, true);
}

function renderWorkspaceDetails(scenario) {
  if (!workspaceDetails) return;
  const detailNodes = scenario.details.map(([valueKey, labelKey]) => {
    const item = document.createElement("span");
    const value = document.createElement("strong");
    const label = document.createElement("small");
    value.textContent = workspaceString(`${scenario.base}.${valueKey}`);
    label.textContent = workspaceString(`${scenario.base}.${labelKey}`);
    item.append(value, label);
    return item;
  });
  workspaceDetails.replaceChildren(...detailNodes);
}

function renderWorkspaceScenario(index = workspaceScenarioIndex) {
  if (!workspaceConversation || !workspaceScenarioDefinitions.length) return;
  workspaceScenarioIndex = (index + workspaceScenarioDefinitions.length) % workspaceScenarioDefinitions.length;
  const scenario = workspaceScenarioDefinitions[workspaceScenarioIndex];
  const fields = ["request", "fetch", "agent", "ready", "agentDetail", "proposal", "cardTitle", "cardMeta", "cardReady"];

  fields.forEach((field) => {
    const node = workspaceConversation.querySelector(`[data-workspace-field='${field}']`);
    if (!node) return;
    const value = workspaceString(`${scenario.base}.${field}`);
    if (["request", "fetch", "proposal"].includes(field)) setWorkspaceStreamCopy(field, value);
    else node.textContent = value;
  });

  const icon = workspaceConversation.querySelector("[data-workspace-field='icon']");
  if (icon) icon.textContent = scenario.icon;
  renderWorkspaceDetails(scenario);
  renderWorkspaceRuntime(scenario, true);

  workspaceConversation.classList.remove("is-complete");
  workspaceConversation.setAttribute("aria-label", `${workspaceString(`${scenario.base}.nav`)} — ${workspaceString(`${scenario.base}.agent`)}`);
  if (workspaceAgentDisclosure) workspaceAgentDisclosure.setAttribute("aria-expanded", "false");
  if (workspaceAgentDetail) workspaceAgentDetail.hidden = true;
  if (workspaceDetails) workspaceDetails.hidden = true;
  if (workspaceReviewButton) {
    workspaceReviewButton.setAttribute("aria-expanded", "false");
    workspaceReviewButton.textContent = workspaceString(`${scenario.base}.review`);
  }
  if (workspaceCompleteButton) {
    workspaceCompleteButton.disabled = false;
    workspaceCompleteButton.textContent = workspaceString(`${scenario.base}.${scenario.actionKey}`);
  }
  if (workspaceResultStatus) workspaceResultStatus.textContent = workspaceString(`${scenario.base}.cardReady`);
  if (workspaceComposerStatus) workspaceComposerStatus.textContent = "";

  workspaceScenarioButtons.forEach((button, buttonIndex) => {
    const buttonScenario = workspaceScenarioDefinitions[buttonIndex];
    const selected = buttonIndex === workspaceScenarioIndex;
    const label = buttonScenario ? workspaceString(`${buttonScenario.base}.nav`) : "";
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-current", selected ? "true" : "false");
    button.setAttribute("aria-label", currentLanguage === "es" ? `Mostrar ${label}` : `Show ${label}`);
    button.title = label;
  });
}

function advanceWorkspaceScenario(index = workspaceScenarioIndex + 1, autoplay = true) {
  if (!workspaceConversation) return;
  clearWorkspaceConversationTimers();
  workspaceConversation.classList.add("is-switching");
  const switchTimer = window.setTimeout(() => {
    renderWorkspaceScenario(index);
    workspaceConversation.classList.remove("is-switching");
    workspaceConversationInteracted = false;
    if (autoplay && workspaceConversationVisible && !reducedMotionQuery.matches) playWorkspaceConversation();
    else showWorkspaceConversation();
  }, 360);
  workspaceStepTimers.push(switchTimer);
}

function playWorkspaceConversation() {
  if (!workspaceConversation || reducedMotionQuery.matches || workspaceConversationInteracted) {
    showWorkspaceConversation();
    return;
  }

  clearWorkspaceConversationTimers();
  const scenario = workspaceScenarioDefinitions[workspaceScenarioIndex];
  workspaceConversation.classList.add("is-sequencing");
  workspaceConversationSteps.forEach((step) => step.classList.remove("is-visible"));
  ["request", "fetch", "proposal"].forEach((field) => {
    const copy = workspaceString(`${scenario.base}.${field}`);
    setWorkspaceStreamCopy(field, copy);
    const node = workspaceConversation.querySelector(`[data-workspace-field='${field}']`);
    if (node) node.textContent = "";
  });
  renderWorkspaceRuntime(scenario, false);

  window.requestAnimationFrame(() => {
    workspaceConversationSteps.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        step.classList.add("is-visible");
        const stream = workspaceStreamSteps[index];
        if (stream) streamWorkspaceField(stream.field, stream.duration);
        if (index === 2) playWorkspaceRuntime();
      }, workspaceStepDelays[index] || 0);
      workspaceStepTimers.push(timer);
    });
  });

  workspaceReplayTimer = window.setTimeout(() => {
    if (workspaceConversationVisible && !workspaceConversationInteracted) advanceWorkspaceScenario();
  }, 12600);
}

function holdWorkspaceConversation() {
  workspaceConversationInteracted = true;
  showWorkspaceConversation();
}

function syncWorkspaceConversationLanguage() {
  const scenario = workspaceScenarioDefinitions[workspaceScenarioIndex];
  const detailsOpen = workspaceDetails?.hidden === false;
  const agentOpen = workspaceAgentDisclosure?.getAttribute("aria-expanded") === "true";
  const completed = workspaceConversation?.classList.contains("is-complete");
  renderWorkspaceScenario(workspaceScenarioIndex);
  if (detailsOpen && workspaceDetails && workspaceReviewButton) {
    workspaceDetails.hidden = false;
    workspaceReviewButton.setAttribute("aria-expanded", "true");
    workspaceReviewButton.textContent = workspaceString(`${scenario.base}.hide`);
  }
  if (agentOpen && workspaceAgentDisclosure && workspaceAgentDetail) {
    workspaceAgentDisclosure.setAttribute("aria-expanded", "true");
    workspaceAgentDetail.hidden = false;
  }
  if (completed && workspaceConversation && workspaceCompleteButton && workspaceResultStatus) {
    workspaceConversation.classList.add("is-complete");
    workspaceCompleteButton.disabled = true;
    workspaceCompleteButton.textContent = workspaceString(`${scenario.base}.${scenario.doneKey}`);
    workspaceResultStatus.textContent = workspaceString(`${scenario.base}.${scenario.doneStatusKey}`);
  }
}

workspaceAgentDisclosure?.addEventListener("click", () => {
  holdWorkspaceConversation();
  const expanded = workspaceAgentDisclosure.getAttribute("aria-expanded") === "true";
  workspaceAgentDisclosure.setAttribute("aria-expanded", String(!expanded));
  if (workspaceAgentDetail) workspaceAgentDetail.hidden = expanded;
});

workspaceReviewButton?.addEventListener("click", () => {
  holdWorkspaceConversation();
  const willOpen = workspaceDetails?.hidden !== false;
  if (workspaceDetails) workspaceDetails.hidden = !willOpen;
  workspaceReviewButton.setAttribute("aria-expanded", String(willOpen));
  workspaceReviewButton.textContent = workspaceScenarioString(willOpen ? "hide" : "review");
});

workspaceCompleteButton?.addEventListener("click", () => {
  holdWorkspaceConversation();
  const scenario = workspaceScenarioDefinitions[workspaceScenarioIndex];
  workspaceConversation?.classList.add("is-complete");
  workspaceCompleteButton.disabled = true;
  workspaceCompleteButton.textContent = workspaceString(`${scenario.base}.${scenario.doneKey}`);
  if (workspaceResultStatus) workspaceResultStatus.textContent = workspaceString(`${scenario.base}.${scenario.doneStatusKey}`);
  workspaceReplayTimer = window.setTimeout(() => {
    if (!workspaceConversationVisible) return;
    workspaceConversationInteracted = false;
    advanceWorkspaceScenario();
  }, 2800);
});

workspaceScenarioButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    workspaceConversationInteracted = false;
    advanceWorkspaceScenario(index, !reducedMotionQuery.matches);
  });
});

workspaceComposer?.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = workspaceComposer.querySelector("input");
  const request = input?.value.trim();
  if (!request) {
    input?.focus();
    return;
  }

  holdWorkspaceConversation();
  if (workspaceRequestCopy) {
    workspaceRequestCopy.textContent = request;
  }
  if (workspaceComposerStatus) {
    workspaceComposerStatus.textContent = currentLanguage === "es"
      ? "Solicitud preparada en esta vista de producto."
      : "Request prepared in this product view.";
  }
  workspaceComposer.reset();
});

document.addEventListener("agentia:languagechange", syncWorkspaceConversationLanguage);

renderWorkspaceScenario();

if (workspaceConversation && "IntersectionObserver" in window && !reducedMotionQuery.matches) {
  const workspaceConversationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      workspaceConversationVisible = entry.isIntersecting;
      if (entry.isIntersecting) playWorkspaceConversation();
      else {
        clearWorkspaceConversationTimers();
        workspaceConversationInteracted = false;
      }
    });
  }, { threshold: 0.3 });
  workspaceConversationObserver.observe(workspaceConversation);
} else {
  showWorkspaceConversation();
}

reducedMotionQuery.addEventListener?.("change", () => {
  if (reducedMotionQuery.matches) showWorkspaceConversation();
  else if (workspaceConversationVisible && !workspaceConversationInteracted) playWorkspaceConversation();
});

function setRailAccessibility(visible) {
  if (!desktopRail || !railToggle) return;
  desktopRail.setAttribute("aria-hidden", String(!visible));
  desktopRail.inert = !visible;
  railToggle.setAttribute("aria-expanded", String(visible));
  const icon = railToggle.querySelector(".material-symbols-outlined");
  if (icon) icon.textContent = railOpenedByUser ? "close" : "menu";
}

function closeDesktopRail() {
  railOpenedByUser = false;
  document.body.classList.remove("rail-open");
  if (railScrim) railScrim.hidden = true;
  setRailAccessibility(window.scrollY <= 24);
}

function openDesktopRail() {
  if (!desktopMotionQuery.matches) return;
  railOpenedByUser = true;
  document.body.classList.add("rail-open", "rail-collapsed");
  if (railScrim) railScrim.hidden = false;
  setRailAccessibility(true);
}

railToggle?.addEventListener("click", () => {
  if (railOpenedByUser) closeDesktopRail();
  else openDesktopRail();
});

railScrim?.addEventListener("click", closeDesktopRail);

document.querySelectorAll(".site-rail a").forEach((link) => {
  link.addEventListener("click", () => {
    if (railOpenedByUser) closeDesktopRail();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (railOpenedByUser) closeDesktopRail();
  if (menuButton?.getAttribute("aria-expanded") === "true") setMenu(false);
});

function updateRail(y) {
  if (!desktopMotionQuery.matches) {
    railOpenedByUser = false;
    document.body.classList.remove("rail-collapsed", "rail-open");
    if (railScrim) railScrim.hidden = true;
    if (desktopRail) {
      desktopRail.removeAttribute("aria-hidden");
      desktopRail.inert = false;
    }
    return;
  }

  if (y <= 24) {
    railOpenedByUser = false;
    document.body.classList.remove("rail-collapsed", "rail-open");
    if (railScrim) railScrim.hidden = true;
    setRailAccessibility(true);
    return;
  }

  document.body.classList.add("rail-collapsed");
  if (!railOpenedByUser) setRailAccessibility(false);
}

function updateHeroMotion(y) {
  if (!heroSection) return;
  const progress = clamp(y / Math.max(heroSection.offsetHeight, 1));
  const copyY = reducedMotionQuery.matches ? 0 : -52 * progress;
  const productY = reducedMotionQuery.matches ? 0 : 72 * progress;
  heroSection.style.setProperty("--hero-copy-y", `${copyY.toFixed(2)}px`);
  heroSection.style.setProperty("--hero-copy-opacity", String((1 - 0.44 * progress).toFixed(3)));
  heroSection.style.setProperty("--hero-product-y", `${productY.toFixed(2)}px`);
  heroSection.style.setProperty("--hero-product-scale", String((1 + 0.025 * progress).toFixed(4)));
}

function updateManifestoMotion(y) {
  if (!manifestoSpotlight || !heroSection || !desktopMotionQuery.matches || reducedMotionQuery.matches) {
    document.body.classList.remove("manifesto-active");
    return;
  }

  const start = Math.max(140, heroSection.offsetHeight * 0.28);
  const reveal = easeOutCubic(clamp((y - start) / 360));
  const exitStart = heroSection.offsetHeight + 330;
  const exit = easeOutCubic(clamp((y - exitStart) / 360));
  const opacity = reveal * (1 - exit);
  const overall = clamp((y - start) / Math.max(exitStart + 360 - start, 1));
  const clip = (1 - reveal) * 100;

  manifestoSpotlight.style.setProperty("--manifesto-opacity", opacity.toFixed(3));
  manifestoSpotlight.style.setProperty("--manifesto-clip", `${clip.toFixed(2)}%`);
  manifestoSpotlight.style.setProperty("--manifesto-progress", overall.toFixed(3));
  manifestoSpotlight.style.setProperty("--manifesto-title-y", `${(110 * (1 - reveal) - 110 * exit).toFixed(2)}px`);
  manifestoSpotlight.style.setProperty("--manifesto-title-scale", String((0.92 + 0.08 * reveal - 0.035 * exit).toFixed(4)));
  manifestoSpotlight.style.setProperty("--manifesto-support-y", `${(54 * (1 - reveal) - 42 * exit).toFixed(2)}px`);
  document.body.classList.toggle("manifesto-active", opacity > 0.03);
}

function queueIndustryBlueprintSnap(y) {
  const movingDown = y > lastNarrativeScrollY;
  lastNarrativeScrollY = y;
  window.clearTimeout(industrySnapTimer);

  if (
    !industriesSection ||
    !heroSection ||
    !movingDown ||
    industrySnapInProgress ||
    !desktopMotionQuery.matches ||
    reducedMotionQuery.matches
  ) return;

  const stageTop = industriesSection.offsetTop;
  const snapStart = heroSection.offsetHeight + 300;
  if (y < snapStart || y >= stageTop - 4) return;

  industrySnapTimer = window.setTimeout(() => {
    if (window.scrollY < snapStart || window.scrollY >= stageTop - 4) return;
    industrySnapInProgress = true;
    window.scrollTo({ top: stageTop, behavior: "smooth" });
    window.setTimeout(() => { industrySnapInProgress = false; }, 800);
  }, 140);
}

function updateMethodStory(y) {
  if (!methodStory) return;

  if (!desktopMotionQuery.matches || reducedMotionQuery.matches) {
    methodStory.style.setProperty("--method-progress", "1");
    methodStory.style.setProperty("--method-line-progress", "1");
    methodSteps.forEach((step) => {
      step.classList.add("is-reached");
      step.classList.remove("is-active");
      step.removeAttribute("aria-current");
    });
    return;
  }

  const travel = Math.max(methodStory.offsetHeight - window.innerHeight, 1);
  const progress = clamp((y - methodStory.offsetTop) / travel);
  const timelineProgress = clamp(progress / 0.94);
  const lineProgress = easeOutCubic(timelineProgress);
  const activeIndex = Math.min(methodSteps.length - 1, Math.floor(timelineProgress * methodSteps.length));

  methodStory.style.setProperty("--method-progress", progress.toFixed(4));
  methodStory.style.setProperty("--method-line-progress", lineProgress.toFixed(4));

  methodSteps.forEach((step, index) => {
    const reached = timelineProgress >= index / methodSteps.length;
    const active = index === activeIndex;
    step.classList.toggle("is-reached", reached);
    step.classList.toggle("is-active", active);
    if (active) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
}

function syncLegacyPricingHash() {
  if (
    window.location.hash !== "#pricing" ||
    !methodStory ||
    !desktopMotionQuery.matches ||
    reducedMotionQuery.matches
  ) return;

  window.requestAnimationFrame(() => {
    const travel = Math.max(methodStory.offsetHeight - window.innerHeight, 1);
    window.scrollTo({ top: methodStory.offsetTop + travel * 0.86, behavior: "auto" });
  });
}

function updateScrollNarrative() {
  scrollFrame = 0;
  const y = window.scrollY;
  const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const pageProgress = clamp(y / scrollable);
  document.documentElement.style.setProperty("--page-progress", pageProgress.toFixed(4));
  updateRail(y);
  updateHeroMotion(y);
  updateManifestoMotion(y);
  queueIndustryBlueprintSnap(y);
  updateMethodStory(y);
}

function queueScrollNarrative() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(updateScrollNarrative);
}

window.addEventListener("scroll", queueScrollNarrative, { passive: true });
window.addEventListener("resize", queueScrollNarrative);
window.addEventListener("load", syncLegacyPricingHash);
window.addEventListener("hashchange", syncLegacyPricingHash);
desktopMotionQuery.addEventListener?.("change", queueScrollNarrative);
reducedMotionQuery.addEventListener?.("change", queueScrollNarrative);

const revealGroups = [
  ".manifesto > *",
  ".industries-intro > *",
  ".industry-column > *",
  ".method-section .section-heading > *",
  ".trust-copy > *",
  ".trust-list article",
  ".demo-copy > *",
  ".demo-form > label",
  ".demo-form > button",
  ".site-footer > *"
];

const revealNodes = Array.from(document.querySelectorAll(revealGroups.join(",")));
revealNodes.forEach((node, index) => {
  node.dataset.reveal = "";
  node.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
});

if ("IntersectionObserver" in window && !reducedMotionQuery.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -7% 0px", threshold: 0.08 });
  revealNodes.forEach((node) => revealObserver.observe(node));
  document.documentElement.classList.add("motion-ready");
} else {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

updateScrollNarrative();
syncLegacyPricingHash();

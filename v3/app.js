/* Progressive enhancement only. Every first-frame product element is static HTML. */
(() => {
  "use strict";
  const es = document.documentElement.lang === "es";
  const copy = (en, spanish) => (es ? spanish : en);
  const brain = document.querySelector(".brain-workspace");
  const stages = [...document.querySelectorAll("[data-stage]")];
  function selectStage(index) {
    brain.dataset.currentStage = String(index);
    stages.forEach((button, i) =>
      button.setAttribute("aria-pressed", String(i === index)),
    );
    document.querySelectorAll("[data-signal]").forEach((node) => {
      node.hidden = Number(node.dataset.signal) !== index;
    });
    document.querySelectorAll("[data-stage-caption]").forEach((node) => {
      node.hidden = Number(node.dataset.stageCaption) !== index;
    });
    document.querySelector("[data-date-known]").hidden = false;
    document.querySelector("[data-date-conflict]").hidden = index === 0;
    document.querySelector(".conflict-note").hidden = index === 0;
    // Update the commitment's evidence, preserving both sources when they disagree.
    const commitment = document.querySelector('[data-detail="commitment"]');
    commitment.querySelector(".detail-name").textContent =
      index > 0
        ? copy(
            "Committed: 22 October. Requested: 23 October.",
            "Compromiso: 22 de octubre. Petición: 23 de octubre.",
          )
        : copy(
            "Deliver the reviewed agreement",
            "Entregar el contrato revisado",
          );
    commitment.querySelector("blockquote").textContent =
      index > 0
        ? copy(
            "19 Oct: “Elena will send the reviewed agreement on Thursday.” 21 Oct: “Could you send the final agreement on Friday instead?”",
            "19 oct.: «Elena enviará el contrato revisado el jueves». 21 oct.: «¿Podríais enviar el contrato final el viernes?»",
          )
        : copy(
            "“Elena will send the reviewed agreement on Thursday.”",
            "«Elena enviará el contrato revisado el jueves».",
          );
    commitment.querySelector(".source-proof > span").lastChild.textContent =
      index > 0
        ? copy(
            " Email · 19 Oct, 16:40 + 21 Oct, 11:12",
            " Correo · 19 oct., 16:40 + 21 oct., 11:12",
          )
        : copy(" Email · 19 Oct, 16:40", " Correo · 19 oct., 16:40");
  }
  stages.forEach((button, i) => {
    button.addEventListener("click", () => selectStage(i));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const target =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? stages.length - 1
            : (i + (event.key === "ArrowRight" ? 1 : -1) + stages.length) %
              stages.length;
      stages[target].focus();
      selectStage(target);
    });
  });
  document.querySelectorAll("[data-entity]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-entity]").forEach((other) => {
        const selected = other === button;
        other.classList.toggle("selected", selected);
        other.setAttribute("aria-pressed", String(selected));
      });
      document.querySelectorAll("[data-detail]").forEach((detail) => {
        detail.hidden = detail.dataset.detail !== button.dataset.entity;
      });
    });
  });
  const checkbox = document.querySelector("[data-approval-check]");
  const action = document.querySelector("[data-operation-action]");
  const reset = document.querySelector("[data-operation-reset]");
  const message = document.querySelector("[data-operation-message]");
  const badge = document.querySelector("[data-operation-badge]");
  const review = document.querySelector("[data-timeline-review]");
  const record = document.querySelector("[data-timeline-record]");
  const feedback = document.querySelector("[data-feedback]");
  let state = "review";
  function actionLabel(label) {
    // Keep the arrow SVG and the button node so keyboard focus is never lost.
    action.firstChild.textContent = label;
  }
  checkbox.addEventListener("change", () => {
    action.disabled = !checkbox.checked;
    message.textContent = checkbox.checked
      ? copy(
          "Ready to approve this illustrative proposal.",
          "Lista para aprobar esta propuesta ilustrativa.",
        )
      : copy(
          "Review the proposal, then confirm to enable approval.",
          "Revisa la propuesta y confirma para habilitar la aprobación.",
        );
  });
  action.addEventListener("click", () => {
    if (state === "review" && checkbox.checked) {
      state = "approved";
      checkbox.disabled = true;
      badge.textContent = copy("Approved", "Aprobada");
      badge.className = "tag success";
      review.className = "complete";
      record.className = "current";
      document.querySelector("[data-review-label]").textContent = copy(
        "Approved by Elena",
        "Aprobada por Elena",
      );
      document.querySelector("[data-record-label]").textContent = copy(
        "Ready to record",
        "Lista para registrar",
      );
      message.textContent = copy(
        "Approved in this demo. Next, simulate recording the entry in Clio.",
        "Aprobada en esta demo. Ahora puedes simular el registro en Clio.",
      );
      actionLabel(
        copy("Simulate recording in Clio", "Simular registro en Clio"),
      );
      reset.hidden = false;
    } else if (state === "approved") {
      state = "recorded";
      record.className = "complete";
      badge.textContent = copy("Recorded · demo", "Registrada · demo");
      document.querySelector("[data-record-label]").textContent = copy(
        "Entry reference linked",
        "Referencia vinculada",
      );
      message.textContent = copy(
        "Demo complete: 0:45 recorded against M-024. No real entry has been created.",
        "Demo completada: 0:45 registradas en M-024. No se ha creado ningún registro real.",
      );
      feedback.textContent = copy(
        "Brain feedback · Reference DEMO-024 linked to the matter. The time system remains the source of record.",
        "Feedback al Brain · Referencia DEMO-024 vinculada al asunto. El sistema de horas conserva el registro.",
      );
      actionLabel(
        copy("Explore the result above", "Consulta el resultado arriba"),
      );
      action.setAttribute("aria-disabled", "true");
      // Keep focus on the completed action; reset remains the next tab stop.
    }
  });
  reset.addEventListener("click", () => {
    state = "review";
    checkbox.checked = false;
    checkbox.disabled = false;
    action.disabled = true;
    action.removeAttribute("aria-disabled");
    actionLabel(copy("Approve proposal", "Aprobar propuesta"));
    badge.textContent = copy("Needs approval", "Requiere aprobación");
    badge.className = "tag review";
    review.className = "current";
    record.className = "";
    document.querySelector("[data-review-label]").textContent = copy(
      "Approval required",
      "Requiere aprobación",
    );
    document.querySelector("[data-record-label]").textContent = copy(
      "After your approval",
      "Tras tu aprobación",
    );
    message.textContent = copy(
      "Review the proposal, then confirm to enable approval.",
      "Revisa la propuesta y confirma para habilitar la aprobación.",
    );
    feedback.textContent = copy(
      "After recording: link the entry reference back to the matter.",
      "Tras el registro: vincular la referencia de horas al asunto.",
    );
    reset.hidden = true;
    checkbox.focus();
  });
})();

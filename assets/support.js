/* The support form. It is hidden in the markup and revealed here, so a
   visitor without JavaScript never sees a form that cannot submit. If this
   file fails to load, the noscript message is not shown either; the email
   button above remains the path. */
(() => {
  const form = document.getElementById("support-form");
  if (!form) return;

  const status = document.getElementById("support-form-status");
  const button = form.querySelector('button[type="submit"]');

  form.hidden = false;

  // Store links and app help links can point at /support/?app=wset2 to land
  // with the right app already selected. Anything not in the list is ignored.
  const requestedApp = new URLSearchParams(window.location.search)
    .get("app")
    ?.trim()
    .toLowerCase();
  if (requestedApp) {
    const match = [...form.elements.app.options].some(
      (option) => option.value === requestedApp,
    );
    if (match) {
      form.elements.app.value = requestedApp;
      // The URL already answered "which app?", so do not ask again.
      const appField = document.getElementById("support-app-field");
      if (appField) {
        appField.hidden = true;
        appField.closest(".field-grid")?.classList.add("field-grid-single");
      }
    }
  }

  function fail(message) {
    status.textContent = `${message} Your message is still in the form, so you can try again.`;
    status.focus();
    button.disabled = false;
    button.textContent = "Send support request";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    button.disabled = true;
    button.textContent = "Sending…";
    status.textContent = "";

    const data = new FormData(form);
    const cryptoApi = globalThis.crypto;
    const requestId =
      cryptoApi && typeof cryptoApi.randomUUID === "function"
        ? cryptoApi.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const payload = {
      email: data.get("email"),
      name: data.get("name"),
      app: data.get("app"),
      appVersion: data.get("appVersion"),
      device: data.get("device"),
      category: data.get("category"),
      message: data.get("message"),
      pageUrl: window.location.href,
      consent: data.get("consent") === "on",
      turnstileToken: data.get("cf-turnstile-response") || "",
      nickname_confirm: data.get("nickname_confirm") || "",
      requestId,
    };

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status !== 202) throw new Error(`status ${response.status}`);

      form.hidden = true;
      button.hidden = true;
      status.textContent = "We will reply to the email address you gave us if applicable.";
      status.focus();
    } catch {
      fail("We could not send that just now.");
    }
  });
})();

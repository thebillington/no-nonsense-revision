/* The support form. It is hidden in the markup and revealed here, so a
   visitor without JavaScript never sees a form that cannot submit. If this
   file fails to load, the noscript message is not shown either; the email
   button above remains the path. */
(() => {
  const form = document.getElementById("support-form");
  if (!form) return;

  const status = document.getElementById("support-form-status");
  const email = form.dataset.supportEmail || "";
  const button = form.querySelector('button[type="submit"]');

  form.hidden = false;

  function mailto() {
    const subject = "Support request";
    const body = [
      `App: ${form.elements.app.value}`,
      `Category: ${form.elements.category.value}`,
      `Version: ${form.elements.appVersion.value}`,
      `Device: ${form.elements.device.value}`,
      "",
      form.elements.message.value,
    ].join("\n");
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function fail(message) {
    status.textContent = `${message} `;
    const link = document.createElement("a");
    link.href = mailto();
    link.textContent = "Email us instead";
    status.append(link, " — your message is still in the form.");
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
      status.textContent =
        "Thanks — your request is in. We will reply to the email address you gave us.";
      status.focus();
    } catch {
      fail("We could not send that just now.");
    }
  });
})();

(function () {
  var script = document.currentScript || {};
  var apiBase = (script.dataset.api || "https://crm.torenaone-office.ru").replace(/\/$/, "");
  var siteKey = script.dataset.siteKey || "sk_live_torenaone_main";
  var formSelector = script.dataset.form || "form";
  var source = script.dataset.source || "existing-site-form";
  var forms = Array.prototype.slice.call(document.querySelectorAll(formSelector));

  if (!forms.length) {
    setTimeout(function () {
      Array.prototype.slice.call(document.querySelectorAll(formSelector)).forEach(bindForm);
    }, 1000);
    return;
  }

  forms.forEach(bindForm);

  function bindForm(form) {
    if (!form || form.dataset.mmCrmCapture === "1") return;
    form.dataset.mmCrmCapture = "1";
    form.addEventListener("submit", function () {
      var payload = buildPayload(form);
      if (!payload.name || !payload.phone) return;
      sendCopy(payload);
    }, true);
  }

  function buildPayload(form) {
    var data = new FormData(form);
    var values = {};
    data.forEach(function (value, key) {
      if (typeof value === "string" && value.trim()) {
        values[key.toLowerCase()] = value.trim();
      }
    });

    return {
      apiKey: siteKey,
      name: pick(values, ["name", "your-name", "client_name", "client-name", "fio", "имя"]) || readInput(form, 'input[name*="name" i], input[placeholder*="имя" i]'),
      phone: pick(values, ["phone", "tel", "telephone", "your-phone", "client_phone", "client-phone", "телефон"]) || readInput(form, 'input[type="tel"], input[name*="phone" i], input[name*="tel" i], input[placeholder*="тел" i]'),
      email: pick(values, ["email", "mail", "your-email"]) || readInput(form, 'input[type="email"], input[name*="email" i], input[name*="mail" i]'),
      comment: pick(values, ["comment", "message", "your-message", "text", "комментарий"]) || readInput(form, 'textarea, input[name*="comment" i], input[name*="message" i]'),
      interest: pick(values, ["interest", "product", "model", "category", "utm_campaign"]) || document.title || "Заявка с сайта",
      channel: source,
      pageUrl: window.location.href,
    };
  }

  function sendCopy(payload) {
    var url = apiBase + "/api/public/lead";
    var body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      var blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
      credentials: "omit",
    }).catch(function () {});
  }

  function pick(values, names) {
    for (var i = 0; i < names.length; i += 1) {
      if (values[names[i]]) return values[names[i]];
    }
    return "";
  }

  function readInput(root, selector) {
    var el = root.querySelector(selector);
    return el ? String(el.value || "").trim() : "";
  }
})();

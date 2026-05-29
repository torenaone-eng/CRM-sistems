(function () {
  var script = document.currentScript || {};
  var apiBase = (script.dataset.api || "http://127.0.0.1:3001").replace(/\/$/, "");
  var siteKey = script.dataset.siteKey || "sk_live_torenaone_main";
  var targetSelector = script.dataset.target || "#mm-crm-widget";
  var title = script.dataset.title || "Заявка в Мировые мощности";
  var buttonText = script.dataset.button || "Отправить заявку";
  var target = document.querySelector(targetSelector);

  if (!target) {
    target = document.createElement("div");
    target.id = targetSelector.replace(/^#/, "") || "mm-crm-widget";
    document.body.appendChild(target);
  }

  var style = document.createElement("style");
  style.textContent = [
    ".mm-crm-widget{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f211f;background:#fff;border:1px solid #dce9d8;border-radius:14px;padding:18px;box-shadow:0 14px 38px rgba(22,38,31,.10);max-width:420px}",
    ".mm-crm-widget *{box-sizing:border-box}",
    ".mm-crm-widget__title{font-size:20px;font-weight:800;margin:0 0 6px;color:#16261f}",
    ".mm-crm-widget__sub{font-size:13px;color:#667464;margin:0 0 14px}",
    ".mm-crm-widget__field{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}",
    ".mm-crm-widget__field span{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#667464;font-weight:700}",
    ".mm-crm-widget input,.mm-crm-widget textarea,.mm-crm-widget select{width:100%;border:1px solid #dce9d8;border-radius:8px;padding:10px 11px;font:inherit;font-size:14px;background:#fff;color:#1f211f;outline:none}",
    ".mm-crm-widget input:focus,.mm-crm-widget textarea:focus,.mm-crm-widget select:focus{border-color:#50b743}",
    ".mm-crm-widget button{width:100%;border:0;border-radius:9px;background:#50b743;color:#fff;padding:11px 14px;font:inherit;font-weight:800;cursor:pointer}",
    ".mm-crm-widget button:disabled{opacity:.6;cursor:default}",
    ".mm-crm-widget__status{font-size:13px;margin-top:10px;padding:10px;border-radius:8px;display:none}",
    ".mm-crm-widget__status.ok{display:block;background:#e4f5df;color:#2f8f36}",
    ".mm-crm-widget__status.err{display:block;background:#fde8e8;color:#df2d34}",
  ].join("");
  document.head.appendChild(style);

  target.className = (target.className ? target.className + " " : "") + "mm-crm-widget";
  target.innerHTML = [
    '<div class="mm-crm-widget__title">' + escapeHtml(title) + "</div>",
    '<p class="mm-crm-widget__sub">Заявка сразу попадет в CRM torenaOne.</p>',
    '<label class="mm-crm-widget__field"><span>Товар</span><select data-mm-field="productId"><option value="">Загрузка каталога...</option></select></label>',
    '<label class="mm-crm-widget__field"><span>Имя</span><input data-mm-field="name" autocomplete="name" placeholder="Ваше имя"></label>',
    '<label class="mm-crm-widget__field"><span>Телефон</span><input data-mm-field="phone" autocomplete="tel" placeholder="+7 900 000-00-00"></label>',
    '<label class="mm-crm-widget__field"><span>Email</span><input data-mm-field="email" autocomplete="email" placeholder="email@example.ru"></label>',
    '<label class="mm-crm-widget__field"><span>Комментарий</span><textarea data-mm-field="comment" rows="3" placeholder="Что нужно рассчитать?"></textarea></label>',
    '<button type="button" data-mm-submit>' + escapeHtml(buttonText) + "</button>",
    '<div class="mm-crm-widget__status" data-mm-status></div>',
  ].join("");

  var productSelect = target.querySelector('[data-mm-field="productId"]');
  var submit = target.querySelector("[data-mm-submit]");
  var status = target.querySelector("[data-mm-status]");
  var products = [];

  loadCatalog();
  submit.addEventListener("click", sendLead);

  function loadCatalog() {
    fetch(apiBase + "/api/public/catalog?apiKey=" + encodeURIComponent(siteKey))
      .then(function (res) { return res.ok ? res.json() : res.json().then(function (data) { throw new Error(data.error || "Ошибка каталога"); }); })
      .then(function (data) {
        products = data.products || [];
        productSelect.innerHTML = products.length
          ? products.map(function (p) {
              return '<option value="' + escapeAttr(p.id) + '">' + escapeHtml(p.name) + " · " + formatMoney(p.price) + "</option>";
            }).join("")
          : '<option value="">Нет товаров на складе</option>';
      })
      .catch(function (error) {
        productSelect.innerHTML = '<option value="">Каталог недоступен</option>';
        showStatus(error.message, true);
      });
  }

  function sendLead() {
    var body = {
      apiKey: siteKey,
      productId: value("productId"),
      name: value("name"),
      phone: value("phone"),
      email: value("email"),
      comment: value("comment"),
      interest: selectedProduct()?.category || "Каталог",
      channel: "site",
    };

    if (!body.name || !body.phone) {
      showStatus("Укажите имя и телефон.", true);
      return;
    }

    submit.disabled = true;
    submit.textContent = "Отправляем...";

    fetch(apiBase + "/api/public/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) { return res.ok ? res.json() : res.json().then(function (data) { throw new Error(data.error || "Ошибка отправки"); }); })
      .then(function () {
        target.querySelector('[data-mm-field="name"]').value = "";
        target.querySelector('[data-mm-field="phone"]').value = "";
        target.querySelector('[data-mm-field="email"]').value = "";
        target.querySelector('[data-mm-field="comment"]').value = "";
        showStatus("Заявка отправлена. Менеджер скоро свяжется с вами.", false);
      })
      .catch(function (error) { showStatus(error.message, true); })
      .finally(function () {
        submit.disabled = false;
        submit.textContent = buttonText;
      });
  }

  function value(name) {
    var el = target.querySelector('[data-mm-field="' + name + '"]');
    return el ? String(el.value || "").trim() : "";
  }

  function selectedProduct() {
    var id = value("productId");
    return products.find(function (p) { return p.id === id; });
  }

  function showStatus(message, error) {
    status.textContent = message;
    status.className = "mm-crm-widget__status " + (error ? "err" : "ok");
  }

  function formatMoney(value) {
    return (Number(value) || 0).toLocaleString("ru-RU") + " ₽";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }
})();

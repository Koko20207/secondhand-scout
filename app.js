const brandPresets = [
  {
    name: "a la sha",
    aliases: "阿財 alasha",
    price: 300,
    targetSell: 690,
    category: "二手 衣服",
    exclude: "童裝 全新高價",
    note: "有粉絲客群，阿財圖案、刺繡、洋裝、外套優先。"
  },
  {
    name: "SCOTTISH HOUSE",
    aliases: "蘇格蘭屋 ScottishHouse",
    price: 400,
    targetSell: 790,
    category: "二手 外套",
    exclude: "童裝 瑕疵",
    note: "熟齡專櫃客群，L/XL、外套、針織、格紋款比較值得。"
  },
  {
    name: "UNIQLO",
    aliases: "優衣庫 UQ",
    price: 250,
    targetSell: 490,
    category: "二手 外套",
    exclude: "瑕疵 泛黃",
    note: "周轉快，羽絨、聯名、寬褲、襯衫優先。"
  },
  {
    name: "GU",
    aliases: "g.u.",
    price: 180,
    targetSell: 390,
    category: "二手 衣服",
    exclude: "瑕疵",
    note: "單價低但快，適合多件便宜收。"
  },
  {
    name: "23區",
    aliases: "23ku 23区",
    price: 500,
    targetSell: 990,
    category: "二手 衣服",
    exclude: "瑕疵",
    note: "日系專櫃，問的人精準，洋裝、外套、長褲優先。"
  },
  {
    name: "ICB",
    aliases: "icb",
    price: 500,
    targetSell: 990,
    category: "二手 衣服",
    exclude: "瑕疵",
    note: "職場女裝好賣，西裝外套、襯衫、褲裙優先。"
  },
  {
    name: "自由區",
    aliases: "自由区 jiyuku",
    price: 600,
    targetSell: 1200,
    category: "二手 衣服",
    exclude: "瑕疵",
    note: "客群願意買質感，價格別收太高。"
  },
  {
    name: "ZARA",
    aliases: "zara",
    price: 250,
    targetSell: 590,
    category: "二手 衣服",
    exclude: "瑕疵",
    note: "詢問多但砍價也多，挑外套、洋裝、西裝感款式。"
  },
  {
    name: "金安德森",
    aliases: "Kinloch Anderson KA",
    price: 300,
    targetSell: 690,
    category: "二手 包",
    exclude: "寢具",
    note: "皮件、包包、男襯衫、童裝可測，普通女裝別囤多。"
  }
];

const platformData = {
  shopee: {
    name: "蝦皮",
    makeUrl: ({ brand, alias, category, price }) =>
      `https://shopee.tw/search?keyword=${encodeURIComponent(`${brand} ${alias} ${category} ${price}`)}`
  },
  yahoo: {
    name: "Yahoo",
    makeUrl: ({ brand, alias, category }) =>
      `https://tw.bid.yahoo.com/search/auction/product?p=${encodeURIComponent(`${brand} ${alias} ${category}`)}&refine=con_used&sort=price`
  },
  ruten: {
    name: "露天",
    makeUrl: ({ brand, alias, category, price }) =>
      `https://www.ruten.com.tw/find/?q=${encodeURIComponent(`${brand} ${alias} ${category} ${price}`)}`
  },
  carousell: {
    name: "旋轉",
    makeUrl: ({ brand, alias, category, price }) =>
      `https://tw.carousell.com/search/${encodeURIComponent(`${brand} ${alias} ${category} ${price}`)}`
  },
  google: {
    name: "Google",
    makeUrl: ({ brand, alias, category, price, exclude }) => {
      const excluded = exclude
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => `-${word}`)
        .join(" ");
      const terms = `${brand} ${alias} ${category} ${price}元以下 ${excluded}`;
      return `https://www.google.com/search?q=${encodeURIComponent(terms)}`;
    }
  }
};

const defaultMonitors = brandPresets.slice(0, 5).map((brand) => ({
  brand: brand.name,
  alias: brand.aliases,
  price: brand.price,
  targetSell: brand.targetSell,
  category: brand.category,
  exclude: brand.exclude,
  platforms: ["shopee", "yahoo", "carousell", "google"],
  note: brand.note,
  createdAt: new Date().toISOString()
}));

const store = {
  get(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const state = {
  monitors: store.get("scout.monitors", defaultMonitors),
  favorites: store.get("scout.favorites", []),
  scans: store.get("scout.scans", [])
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const currency = (value) => `$${Math.round(Number(value) || 0)}`;

function populateBrandPresets() {
  $("#brandPresetInput").innerHTML = brandPresets
    .map((brand, index) => `<option value="${index}">${brand.name}</option>`)
    .join("");
}

function applyPreset(index) {
  const preset = brandPresets[index];
  if (!preset) return;
  $("#brandInput").value = preset.name;
  $("#aliasInput").value = preset.aliases;
  $("#priceInput").value = preset.price;
  $("#targetSellInput").value = preset.targetSell;
  $("#categoryInput").value = preset.category;
  $("#excludeInput").value = preset.exclude;
  renderResultStrip();
  updateMessage();
}

function getFormPayload() {
  return {
    brand: $("#brandInput").value.trim() || "a la sha",
    alias: $("#aliasInput").value.trim(),
    price: Number($("#priceInput").value || 300),
    targetSell: Number($("#targetSellInput").value || 0),
    category: $("#categoryInput").value,
    exclude: $("#excludeInput").value.trim(),
    platforms: $$("input[name='platform']:checked").map((input) => input.value),
    note: brandPresets.find((item) => item.name === $("#brandInput").value.trim())?.note || "",
    createdAt: new Date().toISOString()
  };
}

function makeLinks(payload) {
  return payload.platforms.map((key) => ({
    key,
    name: platformData[key].name,
    url: platformData[key].makeUrl(payload)
  }));
}

function renderSummary() {
  $("#monitorCount").textContent = state.monitors.length;
  $("#favoriteCount").textContent = state.favorites.length;
  const average = state.monitors.length
    ? state.monitors.reduce((sum, item) => sum + Number(item.price || 0), 0) / state.monitors.length
    : 0;
  $("#averageBudget").textContent = currency(average);
}

function renderResultStrip(payload = getFormPayload()) {
  const links = makeLinks(payload);
  $("#resultStrip").innerHTML = links
    .map((link) => `<a class="result-link" href="${link.url}" target="_blank" rel="noreferrer">${link.name}</a>`)
    .join("");
}

function monitorLabel(monitor) {
  return `${monitor.brand} / ${currency(monitor.price)}內 / ${monitor.category.replace("二手 ", "")}`;
}

function renderMonitors() {
  store.set("scout.monitors", state.monitors);
  renderSummary();
  const list = $("#monitorList");
  if (!state.monitors.length) {
    list.innerHTML = `<div class="empty">還沒有監控條件</div>`;
    return;
  }

  list.innerHTML = state.monitors
    .map((monitor, index) => {
      const firstUrl = makeLinks(monitor)[0]?.url || "#";
      const platforms = monitor.platforms.map((key) => platformData[key].name).join("、");
      const expected = monitor.targetSell ? ` / 預估賣 ${currency(monitor.targetSell)}` : "";
      return `
        <article class="item">
          <div>
            <strong>${monitorLabel(monitor)}${expected}</strong>
            <small>${platforms}${monitor.exclude ? ` / 排除 ${monitor.exclude}` : ""}${monitor.note ? ` / ${monitor.note}` : ""}</small>
          </div>
          <div class="item-actions">
            <a href="${firstUrl}" target="_blank" rel="noreferrer" aria-label="開啟">GO</a>
            <button type="button" data-load-monitor="${index}" aria-label="載入">LOAD</button>
            <button type="button" data-scan="${index}" aria-label="掃描">ALL</button>
            <button class="danger" type="button" data-delete-monitor="${index}" aria-label="刪除">X</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFavorites() {
  store.set("scout.favorites", state.favorites);
  renderSummary();
  const list = $("#favoriteList");
  if (!state.favorites.length) {
    list.innerHTML = `<div class="empty">值得問的商品可以先存這裡</div>`;
    return;
  }

  list.innerHTML = state.favorites
    .map((favorite, index) => {
      const profit = Number(favorite.sell || 0) - Number(favorite.price || 0);
      return `
        <article class="item">
          <div>
            <strong>${favorite.title}</strong>
            <small>進 ${currency(favorite.price)} / 賣 ${currency(favorite.sell)} / 粗估差額 ${currency(profit)}${favorite.url ? ` / ${favorite.url}` : ""}</small>
          </div>
          <div class="item-actions">
            ${favorite.url ? `<a href="${favorite.url}" target="_blank" rel="noreferrer" aria-label="開啟">GO</a>` : ""}
            <button class="danger" type="button" data-delete-favorite="${index}" aria-label="刪除">X</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function openMonitor(index) {
  const monitor = state.monitors[index];
  if (!monitor) return;
  state.scans.unshift({ label: monitorLabel(monitor), at: new Date().toISOString() });
  state.scans = state.scans.slice(0, 30);
  store.set("scout.scans", state.scans);
  makeLinks(monitor).forEach((link, linkIndex) => {
    setTimeout(() => window.open(link.url, "_blank", "noreferrer"), linkIndex * 180);
  });
}

function loadMonitor(index) {
  const monitor = state.monitors[index];
  if (!monitor) return;
  $("#brandInput").value = monitor.brand;
  $("#aliasInput").value = monitor.alias || "";
  $("#priceInput").value = monitor.price;
  $("#targetSellInput").value = monitor.targetSell || "";
  $("#categoryInput").value = monitor.category;
  $("#excludeInput").value = monitor.exclude || "";
  $$("input[name='platform']").forEach((input) => {
    input.checked = monitor.platforms.includes(input.value);
  });
  renderResultStrip();
  updateMessage();
}

function updateProfit() {
  const buyCost = Number($("#buyCost").value || 0);
  const sellPrice = Number($("#sellPrice").value || 0);
  const extraCost = Number($("#extraCost").value || 0);
  const feeRate = Number($("#feeRate").value || 0) / 100;
  const fee = sellPrice * feeRate;
  const profit = Math.round(sellPrice - buyCost - extraCost - fee);
  $("#profitValue").textContent = currency(profit);
  $("#profitNote").textContent = profit < 120 ? "利潤偏薄" : profit < 250 ? "可以測試" : "值得優先問";
}

function updateScore() {
  const buy = Number($("#scoreBuy").value || 0);
  const sell = Number($("#scoreSell").value || 0);
  const margin = sell > 0 ? Math.max(0, Math.min(30, ((sell - buy) / sell) * 45)) : 0;
  const condition = Number($("#scoreCondition").value);
  const demand = Number($("#scoreDemand").value);
  const size = Number($("#scoreSize").value);
  const style = Number($("#scoreStyle").value);
  const score = Math.round(Math.min(100, margin + condition + demand + size + style));
  $("#scoreValue").textContent = score;
  $("#scoreLabel").textContent = score >= 82 ? "優先收" : score >= 68 ? "可以問" : score >= 52 ? "壓價再收" : "先不要囤";
}

function buildMessage() {
  const { brand, price } = getFormPayload();
  return `你好，我有在找 ${brand} 二手衣，想請問這件還在嗎？如果衣況乾淨、沒有明顯污漬或破損，想跟你購買。若多件一起帶，方便幫我算 ${price} 元以內或批價嗎？也想請你補品牌標、尺寸標、瑕疵近照，謝謝。`;
}

function updateMessage() {
  $("#messageText").value = buildMessage();
}

function exportData() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    monitors: state.monitors,
    favorites: state.favorites,
    scans: state.scans
  };
  $("#dataBox").value = JSON.stringify(payload, null, 2);
}

function importData() {
  const raw = $("#dataBox").value.trim();
  if (!raw) return;
  const payload = JSON.parse(raw);
  state.monitors = Array.isArray(payload.monitors) ? payload.monitors : state.monitors;
  state.favorites = Array.isArray(payload.favorites) ? payload.favorites : state.favorites;
  state.scans = Array.isArray(payload.scans) ? payload.scans : state.scans;
  renderMonitors();
  renderFavorites();
  exportData();
}

function notify(text) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification("搜貨衣櫃", { body: text });
}

function bindEvents() {
  $("#brandPresetInput").addEventListener("change", (event) => applyPreset(Number(event.target.value)));

  $("#searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = getFormPayload();
    renderResultStrip(payload);
    makeLinks(payload).forEach((link, index) => {
      setTimeout(() => window.open(link.url, "_blank", "noreferrer"), index * 180);
    });
  });

  $("#saveMonitorButton").addEventListener("click", () => {
    const payload = getFormPayload();
    state.monitors.unshift(payload);
    renderMonitors();
    exportData();
    notify(`已加入 ${monitorLabel(payload)}`);
  });

  $("#scanAllButton").addEventListener("click", () => {
    state.monitors.forEach((_, index) => setTimeout(() => openMonitor(index), index * 900));
  });

  $("#notifyButton").addEventListener("click", async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") notify("提醒已開啟。iPhone 需要把網站加入主畫面後，通知才比較穩。");
  });

  $("#monitorList").addEventListener("click", (event) => {
    const scanIndex = event.target.dataset.scan;
    const loadIndex = event.target.dataset.loadMonitor;
    const deleteIndex = event.target.dataset.deleteMonitor;
    if (scanIndex !== undefined) openMonitor(Number(scanIndex));
    if (loadIndex !== undefined) loadMonitor(Number(loadIndex));
    if (deleteIndex !== undefined) {
      state.monitors.splice(Number(deleteIndex), 1);
      renderMonitors();
      exportData();
    }
  });

  $("#favoriteForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.favorites.unshift({
      title: $("#favoriteTitle").value.trim() || "未命名商品",
      price: Number($("#favoritePrice").value || 0),
      sell: Number($("#favoriteSell").value || 0),
      url: $("#favoriteUrl").value.trim(),
      createdAt: new Date().toISOString()
    });
    event.currentTarget.reset();
    renderFavorites();
    exportData();
  });

  $("#favoriteList").addEventListener("click", (event) => {
    const deleteIndex = event.target.dataset.deleteFavorite;
    if (deleteIndex !== undefined) {
      state.favorites.splice(Number(deleteIndex), 1);
      renderFavorites();
      exportData();
    }
  });

  $("#clearFavoritesButton").addEventListener("click", () => {
    state.favorites = [];
    renderFavorites();
    exportData();
  });

  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((item) => item.classList.remove("active"));
      $$(".tab-panel").forEach((panel) => panel.classList.remove("active"));
      tab.classList.add("active");
      $(`#${tab.dataset.tab}`).classList.add("active");
    });
  });

  ["buyCost", "sellPrice", "extraCost", "feeRate"].forEach((id) => {
    $(`#${id}`).addEventListener("input", updateProfit);
  });

  ["scoreBuy", "scoreSell", "scoreCondition", "scoreDemand", "scoreSize", "scoreStyle"].forEach((id) => {
    $(`#${id}`).addEventListener("input", updateScore);
    $(`#${id}`).addEventListener("change", updateScore);
  });

  ["brandInput", "aliasInput", "priceInput", "targetSellInput", "categoryInput", "excludeInput"].forEach((id) => {
    $(`#${id}`).addEventListener("input", () => {
      renderResultStrip();
      updateMessage();
    });
  });

  $$("input[name='platform']").forEach((input) => {
    input.addEventListener("change", renderResultStrip);
  });

  $("#refreshMessageButton").addEventListener("click", updateMessage);
  $("#copyMessageButton").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("#messageText").value);
    notify("議價文字已複製");
  });

  $("#exportButton").addEventListener("click", exportData);
  $("#importButton").addEventListener("click", importData);
  $("#resetButton").addEventListener("click", () => {
    state.monitors = defaultMonitors;
    state.favorites = [];
    state.scans = [];
    renderMonitors();
    renderFavorites();
    exportData();
  });
}

function init() {
  populateBrandPresets();
  renderResultStrip();
  renderMonitors();
  renderFavorites();
  updateProfit();
  updateScore();
  updateMessage();
  exportData();
  bindEvents();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
}

init();

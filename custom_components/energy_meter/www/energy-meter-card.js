/**
 * Energy Meter Card — Custom Lovelace card for Energy Meter integration.
 * Resembles a real digital power meter with LCD-style readings.
 */

const TRANSLATIONS = {
  en: {
    title: "Energy Meter",
    meter_reading: "Meter Reading",
    day: "Day",
    night: "Night",
    total: "Total",
    today: "Today",
    since_report: "Since Report",
    cost: "Cost",
    current_tariff: "Current Tariff",
    power: "Power",
    report: "Submit Report",
    report_confirm: "Submit meter report? This will save current readings as a snapshot.",
    kwh: "kWh",
    uah: "UAH",
    watts: "W",
    phase: "Phase",
    last_report: "Last report",
    no_data: "\u2014",
    not_found: "Entity not found",
    night_schedule: "Night",
    settings: "Settings",
    day_rate: "Day rate",
    night_rate: "Night rate",
    single_rate: "Rate",
    initial_day: "Day reading",
    initial_night: "Night reading",
    initial_total: "Total reading",
    save: "Save",
    saved: "Saved!",
    uah_kwh: "UAH/kWh",
    rates: "Tariff rates",
    readings: "Current readings",
  },
  uk: {
    title: "\u041b\u0456\u0447\u0438\u043b\u044c\u043d\u0438\u043a",
    meter_reading: "\u041f\u043e\u043a\u0430\u0437\u043d\u0438\u043a\u0438 \u043b\u0456\u0447\u0438\u043b\u044c\u043d\u0438\u043a\u0430",
    day: "\u0414\u0435\u043d\u044c",
    night: "\u041d\u0456\u0447",
    total: "\u0412\u0441\u044c\u043e\u0433\u043e",
    today: "\u0417\u0430 \u0441\u044c\u043e\u0433\u043e\u0434\u043d\u0456",
    since_report: "\u0417 \u043e\u0441\u0442\u0430\u043d\u043d\u044c\u043e\u0433\u043e \u0437\u0432\u0456\u0442\u0443",
    cost: "\u0412\u0430\u0440\u0442\u0456\u0441\u0442\u044c",
    current_tariff: "\u041f\u043e\u0442\u043e\u0447\u043d\u0438\u0439 \u0442\u0430\u0440\u0438\u0444",
    power: "\u041f\u043e\u0442\u0443\u0436\u043d\u0456\u0441\u0442\u044c",
    report: "\u041f\u043e\u0434\u0430\u0442\u0438 \u0437\u0432\u0456\u0442",
    report_confirm: "\u041f\u043e\u0434\u0430\u0442\u0438 \u0437\u0432\u0456\u0442? \u041f\u043e\u0442\u043e\u0447\u043d\u0456 \u043f\u043e\u043a\u0430\u0437\u043d\u0438\u043a\u0438 \u0431\u0443\u0434\u0443\u0442\u044c \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0456.",
    kwh: "\u043a\u0412\u0442\u00b7\u0433\u043e\u0434",
    uah: "\u0433\u0440\u043d",
    watts: "\u0412\u0442",
    phase: "\u0424\u0430\u0437\u0430",
    last_report: "\u041e\u0441\u0442\u0430\u043d\u043d\u0456\u0439 \u0437\u0432\u0456\u0442",
    no_data: "\u2014",
    not_found: "\u0421\u0443\u0442\u043d\u0456\u0441\u0442\u044c \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u0430",
    night_schedule: "\u041d\u0456\u0447",
    settings: "\u041d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f",
    day_rate: "\u0414\u0435\u043d\u043d\u0438\u0439 \u0442\u0430\u0440\u0438\u0444",
    night_rate: "\u041d\u0456\u0447\u043d\u0438\u0439 \u0442\u0430\u0440\u0438\u0444",
    single_rate: "\u0422\u0430\u0440\u0438\u0444",
    initial_day: "\u041f\u043e\u043a\u0430\u0437\u043d\u0438\u043a \u0434\u0435\u043d\u044c",
    initial_night: "\u041f\u043e\u043a\u0430\u0437\u043d\u0438\u043a \u043d\u0456\u0447",
    initial_total: "\u041f\u043e\u043a\u0430\u0437\u043d\u0438\u043a \u0437\u0430\u0433\u0430\u043b\u044c\u043d\u0438\u0439",
    save: "\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438",
    saved: "\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e!",
    uah_kwh: "\u0433\u0440\u043d/\u043a\u0412\u0442\u00b7\u0433\u043e\u0434",
    rates: "\u0422\u0430\u0440\u0438\u0444\u0438",
    readings: "\u041f\u043e\u0442\u043e\u0447\u043d\u0456 \u043f\u043e\u043a\u0430\u0437\u043d\u0438\u043a\u0438",
  },
};

class EnergyMeterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._settingsOpen = false;
    this._inputValues = {};
  }

  set hass(hass) {
    this._hass = hass;
    this._lang = hass.language === "uk" ? "uk" : "en";

    // Don't re-render while settings panel is open — protects user input
    if (this._settingsOpen) return;

    this._render();
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define an entity");
    }
    this._config = config;
  }

  getCardSize() {
    return 7;
  }

  static getConfigElement() {
    return document.createElement("energy-meter-card-editor");
  }

  static getStubConfig() {
    return { entity: "" };
  }

  _t(key) {
    return (
      (TRANSLATIONS[this._lang] && TRANSLATIONS[this._lang][key]) ||
      TRANSLATIONS.en[key] ||
      key
    );
  }

  _fmt(val, decimals = 2) {
    if (val === null || val === undefined || isNaN(val)) return this._t("no_data");
    return Number(val).toFixed(decimals);
  }

  _fmtDate(iso) {
    if (!iso) return this._t("no_data");
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(this._lang === "uk" ? "uk-UA" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  async _handleReport() {
    if (!this._hass) return;
    const ok = confirm(this._t("report_confirm"));
    if (!ok) return;
    await this._hass.callService("energy_meter", "take_snapshot", {});
  }

  async _handleSaveSettings() {
    if (!this._hass) return;
    const root = this.shadowRoot;
    const data = {};

    const dayRate = root.getElementById("inp_day_rate");
    const nightRate = root.getElementById("inp_night_rate");
    const singleRate = root.getElementById("inp_single_rate");
    const initDay = root.getElementById("inp_initial_day");
    const initNight = root.getElementById("inp_initial_night");
    const initTotal = root.getElementById("inp_initial_total");

    if (dayRate) data.day_rate = parseFloat(dayRate.value);
    if (nightRate) data.night_rate = parseFloat(nightRate.value);
    if (singleRate) data.single_rate = parseFloat(singleRate.value);
    if (initDay) data.initial_day = parseFloat(initDay.value);
    if (initNight) data.initial_night = parseFloat(initNight.value);
    if (initTotal) data.initial_total = parseFloat(initTotal.value);

    await this._hass.callService("energy_meter", "update_settings", data);

    // Clear stored input values — next render will use fresh attribute values
    this._inputValues = {};

    // Flash "Saved!" feedback
    const saveBtn = root.getElementById("saveBtn");
    if (saveBtn) {
      const orig = saveBtn.textContent;
      saveBtn.textContent = this._t("saved");
      saveBtn.classList.add("saved");
      setTimeout(() => {
        saveBtn.textContent = orig;
        saveBtn.classList.remove("saved");
      }, 1500);
    }
  }

  _render() {
    if (!this._hass || !this._config.entity) return;

    const stateObj = this._hass.states[this._config.entity];
    if (!stateObj) {
      this.shadowRoot.innerHTML = `
        <ha-card>
          <div style="padding:16px;color:#ff5555;">${this._t("not_found")}: ${this._config.entity}</div>
        </ha-card>`;
      return;
    }

    const a = stateObj.attributes;
    const isDual = a.tariff_type === "dual";
    const phaseCount = a.phase_count || 3;
    const isNight = a.current_tariff === "night";

    // Phase data
    const phases = [];
    const phaseLabels = ["A", "B", "C"];
    const voltageKeys = ["voltage_a", "voltage_b", "voltage_c"];
    for (let i = 0; i < phaseCount; i++) {
      const v = a[voltageKeys[i]];
      phases.push({
        label: phaseLabels[i],
        voltage: v,
        ok: v !== null && v !== undefined && v >= 100,
      });
    }

    // Build HTML
    this.shadowRoot.innerHTML = `
      <style>${this._getStyles()}</style>
      <ha-card>
        <div class="meter-card">

          <!-- Header -->
          <div class="header">
            <div class="header-title">
              <ha-icon icon="mdi:flash" style="--mdc-icon-size:20px;color:#ffd700;"></ha-icon>
              <span>${this._t("title")}</span>
            </div>
            <div class="header-right">
              ${isDual ? `
                <div class="tariff-badge ${isNight ? "night" : "day"}">
                  <ha-icon icon="${isNight ? "mdi:weather-night" : "mdi:white-balance-sunny"}"
                    style="--mdc-icon-size:16px;"></ha-icon>
                  <span>${isNight ? this._t("night") : this._t("day")}</span>
                </div>
              ` : ""}
              <button class="settings-toggle" id="settingsToggle">
                <ha-icon icon="mdi:cog" style="--mdc-icon-size:18px;"></ha-icon>
              </button>
            </div>
          </div>

          <!-- Phase indicators -->
          <div class="section phases">
            ${phases.map((p) => `
              <div class="phase">
                <div class="led ${p.ok ? "led-green" : "led-red"}"></div>
                <div class="phase-voltage">${p.voltage !== null && p.voltage !== undefined ? this._fmt(p.voltage, 1) + "V" : "---"}</div>
                <div class="phase-label">${this._t("phase")} ${p.label}</div>
              </div>
            `).join("")}
          </div>

          <!-- Meter readings -->
          <div class="section">
            <div class="section-title">${this._t("meter_reading")}</div>
            ${isDual ? `
              <div class="reading-row">
                <span class="reading-icon"><ha-icon icon="mdi:white-balance-sunny" style="--mdc-icon-size:16px;color:#ffa726;"></ha-icon></span>
                <span class="reading-label">${this._t("day")}:</span>
                <span class="lcd-value">${this._fmt(a.reading_day)}</span>
                <span class="reading-unit">${this._t("kwh")}</span>
              </div>
              <div class="reading-row">
                <span class="reading-icon"><ha-icon icon="mdi:weather-night" style="--mdc-icon-size:16px;color:#42a5f5;"></ha-icon></span>
                <span class="reading-label">${this._t("night")}:</span>
                <span class="lcd-value">${this._fmt(a.reading_night)}</span>
                <span class="reading-unit">${this._t("kwh")}</span>
              </div>
              <div class="reading-row reading-total">
                <span class="reading-icon"></span>
                <span class="reading-label">${this._t("total")}:</span>
                <span class="lcd-value lcd-total">${this._fmt(a.reading_total)}</span>
                <span class="reading-unit">${this._t("kwh")}</span>
              </div>
            ` : `
              <div class="reading-row reading-total">
                <span class="reading-icon"></span>
                <span class="reading-label">${this._t("total")}:</span>
                <span class="lcd-value lcd-total">${this._fmt(a.reading_total)}</span>
                <span class="reading-unit">${this._t("kwh")}</span>
              </div>
            `}
          </div>

          <!-- Today's consumption -->
          <div class="section">
            <div class="section-title">${this._t("today")}</div>
            ${isDual ? `
              <div class="reading-row">
                <span class="reading-icon"><ha-icon icon="mdi:white-balance-sunny" style="--mdc-icon-size:16px;color:#ffa726;"></ha-icon></span>
                <span class="reading-label">${this._t("day")}:</span>
                <span class="lcd-value lcd-today">${this._fmt(a.today_day)}</span>
                <span class="reading-unit">${this._t("kwh")}</span>
              </div>
              <div class="reading-row">
                <span class="reading-icon"><ha-icon icon="mdi:weather-night" style="--mdc-icon-size:16px;color:#42a5f5;"></ha-icon></span>
                <span class="reading-label">${this._t("night")}:</span>
                <span class="lcd-value lcd-today">${this._fmt(a.today_night)}</span>
                <span class="reading-unit">${this._t("kwh")}</span>
              </div>
              <div class="reading-row reading-total">
                <span class="reading-icon"></span>
                <span class="reading-label">${this._t("total")}:</span>
                <span class="lcd-value lcd-today">${this._fmt(a.today_total)}</span>
                <span class="reading-unit">${this._t("kwh")}</span>
              </div>
            ` : `
              <div class="reading-row reading-total">
                <span class="reading-icon"></span>
                <span class="reading-label">${this._t("total")}:</span>
                <span class="lcd-value lcd-today">${this._fmt(a.today_total)}</span>
                <span class="reading-unit">${this._t("kwh")}</span>
              </div>
            `}
          </div>

          <!-- Since report (deltas + cost) -->
          <div class="section">
            <div class="section-title">${this._t("since_report")}</div>
            ${isDual ? `
              <div class="delta-row">
                <ha-icon icon="mdi:white-balance-sunny" style="--mdc-icon-size:14px;color:#ffa726;"></ha-icon>
                <span class="delta-label">${this._t("day")}:</span>
                <span class="delta-kwh">${this._fmt(a.delta_day)}</span>
                <span class="delta-mult">\u00d7 ${this._fmt(a.day_rate)}</span>
                <span class="delta-eq">=</span>
                <span class="delta-cost">${this._fmt(a.cost_day)} ${this._t("uah")}</span>
              </div>
              <div class="delta-row">
                <ha-icon icon="mdi:weather-night" style="--mdc-icon-size:14px;color:#42a5f5;"></ha-icon>
                <span class="delta-label">${this._t("night")}:</span>
                <span class="delta-kwh">${this._fmt(a.delta_night)}</span>
                <span class="delta-mult">\u00d7 ${this._fmt(a.night_rate)}</span>
                <span class="delta-eq">=</span>
                <span class="delta-cost">${this._fmt(a.cost_night)} ${this._t("uah")}</span>
              </div>
              <div class="delta-row delta-total-row">
                <span class="delta-total-icon"></span>
                <span class="delta-label">${this._t("total")}:</span>
                <span class="delta-kwh">${this._fmt(a.delta_total)}</span>
                <span class="delta-mult">${this._t("kwh")}</span>
                <span class="delta-eq"></span>
                <span class="delta-cost delta-cost-total">${this._fmt(a.cost_total)} ${this._t("uah")}</span>
              </div>
            ` : `
              <div class="delta-row delta-total-row">
                <span class="delta-total-icon"></span>
                <span class="delta-label">${this._t("total")}:</span>
                <span class="delta-kwh">${this._fmt(a.delta_total)}</span>
                <span class="delta-mult">\u00d7 ${this._fmt(a.single_rate)}</span>
                <span class="delta-eq">=</span>
                <span class="delta-cost delta-cost-total">${this._fmt(a.cost_total)} ${this._t("uah")}</span>
              </div>
            `}
          </div>

          ${isDual ? `
          <div class="schedule-row">
            <ha-icon icon="mdi:clock-outline" style="--mdc-icon-size:14px;color:#78909c;"></ha-icon>
            <span>${this._t("night_schedule")}: ${a.night_start || "23:00"} \u2014 ${a.night_end || "07:00"}</span>
          </div>
          ` : ""}

          <!-- Footer: power + report button -->
          <div class="footer">
            <div class="power-display">
              <ha-icon icon="mdi:flash" style="--mdc-icon-size:18px;color:#ffd700;"></ha-icon>
              <span class="power-value">${a.power !== null && a.power !== undefined ? this._fmt(a.power, 0) : "---"}</span>
              <span class="power-unit">${this._t("watts")}</span>
            </div>
            <button class="report-btn" id="reportBtn">
              <ha-icon icon="mdi:file-document-check-outline" style="--mdc-icon-size:16px;"></ha-icon>
              ${this._t("report")}
            </button>
          </div>

          <div class="last-report">
            ${this._t("last_report")}: ${this._fmtDate(a.last_snapshot)}
            ${a.last_snapshot && isDual ? `
              <br>${this._t("day")}: ${this._fmt(a.snapshot_day)} · ${this._t("night")}: ${this._fmt(a.snapshot_night)}
            ` : ""}
            ${a.last_snapshot && !isDual ? `
              <br>${this._t("total")}: ${this._fmt(a.snapshot_total)}
            ` : ""}
          </div>

          <!-- Settings panel (collapsible) -->
          <div class="settings-panel" id="settingsPanel" style="display:${this._settingsOpen ? "block" : "none"};">
            <div class="section-title">${this._t("settings")}</div>

            <div class="settings-group">
              <div class="settings-group-title">${this._t("rates")}</div>
              ${isDual ? `
                <div class="settings-row">
                  <label>${this._t("day_rate")} (${this._t("uah_kwh")})</label>
                  <input type="number" id="inp_day_rate" step="0.01" min="0" value="${this._inputValues.day_rate ?? a.day_rate ?? 4.32}">
                </div>
                <div class="settings-row">
                  <label>${this._t("night_rate")} (${this._t("uah_kwh")})</label>
                  <input type="number" id="inp_night_rate" step="0.01" min="0" value="${this._inputValues.night_rate ?? a.night_rate ?? 2.16}">
                </div>
              ` : `
                <div class="settings-row">
                  <label>${this._t("single_rate")} (${this._t("uah_kwh")})</label>
                  <input type="number" id="inp_single_rate" step="0.01" min="0" value="${this._inputValues.single_rate ?? a.single_rate ?? 4.32}">
                </div>
              `}
            </div>

            <div class="settings-group">
              <div class="settings-group-title">${this._t("readings")}</div>
              ${isDual ? `
                <div class="settings-row">
                  <label>${this._t("initial_day")} (${this._t("kwh")})</label>
                  <input type="number" id="inp_initial_day" step="0.01" min="0" value="${this._inputValues.initial_day ?? a.reading_day ?? 0}">
                </div>
                <div class="settings-row">
                  <label>${this._t("initial_night")} (${this._t("kwh")})</label>
                  <input type="number" id="inp_initial_night" step="0.01" min="0" value="${this._inputValues.initial_night ?? a.reading_night ?? 0}">
                </div>
              ` : `
                <div class="settings-row">
                  <label>${this._t("initial_total")} (${this._t("kwh")})</label>
                  <input type="number" id="inp_initial_total" step="0.01" min="0" value="${this._inputValues.initial_total ?? a.reading_total ?? 0}">
                </div>
              `}
            </div>

            <button class="save-btn" id="saveBtn">${this._t("save")}</button>
          </div>

        </div>
      </ha-card>
    `;

    // Bind events
    const btn = this.shadowRoot.getElementById("reportBtn");
    if (btn) btn.addEventListener("click", () => this._handleReport());

    const toggle = this.shadowRoot.getElementById("settingsToggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        this._settingsOpen = !this._settingsOpen;
        if (!this._settingsOpen) {
          // Clear user edits and re-render with fresh values
          this._inputValues = {};
          this._render();
        } else {
          const panel = this.shadowRoot.getElementById("settingsPanel");
          if (panel) panel.style.display = "block";
        }
      });
    }

    // Track user edits in input fields
    const inputMap = {
      inp_day_rate: "day_rate", inp_night_rate: "night_rate", inp_single_rate: "single_rate",
      inp_initial_day: "initial_day", inp_initial_night: "initial_night", inp_initial_total: "initial_total",
    };
    for (const [elemId, key] of Object.entries(inputMap)) {
      const el = this.shadowRoot.getElementById(elemId);
      if (el) el.addEventListener("input", (e) => { this._inputValues[key] = e.target.value; });
    }

    const saveBtn = this.shadowRoot.getElementById("saveBtn");
    if (saveBtn) saveBtn.addEventListener("click", () => this._handleSaveSettings());
  }

  _getStyles() {
    return `
      ha-card {
        background: linear-gradient(145deg, #1a1a2e, #16213e);
        border: 1px solid #2a2a4a;
        border-radius: 12px;
        overflow: hidden;
        color: #d0d0d0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .meter-card {
        padding: 16px;
      }

      /* Header */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }
      .header-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 1.1em;
        font-weight: 600;
        color: #ffffff;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .settings-toggle {
        background: none;
        border: none;
        color: #607d8b;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        transition: color 0.2s;
      }
      .settings-toggle:hover {
        color: #90a4ae;
      }
      .tariff-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .tariff-badge.day {
        background: rgba(255, 167, 38, 0.2);
        color: #ffa726;
        border: 1px solid rgba(255, 167, 38, 0.3);
      }
      .tariff-badge.night {
        background: rgba(66, 165, 245, 0.2);
        color: #42a5f5;
        border: 1px solid rgba(66, 165, 245, 0.3);
      }

      /* Sections */
      .section {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .section-title {
        font-size: 0.75em;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: #78909c;
        margin-bottom: 10px;
        font-weight: 600;
      }

      /* Phase indicators */
      .phases {
        display: flex;
        justify-content: space-around;
        padding: 10px 8px;
      }
      .phase {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .led {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.1);
      }
      .led-green {
        background: radial-gradient(circle at 35% 35%, #66ff88, #00cc44);
        box-shadow: 0 0 8px rgba(0, 204, 68, 0.6), 0 0 16px rgba(0, 204, 68, 0.2);
      }
      .led-red {
        background: radial-gradient(circle at 35% 35%, #ff6666, #cc0000);
        box-shadow: 0 0 8px rgba(204, 0, 0, 0.6), 0 0 16px rgba(204, 0, 0, 0.2);
      }
      .phase-voltage {
        font-family: 'Courier New', 'Consolas', 'Liberation Mono', monospace;
        font-size: 1em;
        font-weight: bold;
        color: #e0e0e0;
      }
      .phase-label {
        font-size: 0.7em;
        color: #78909c;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* Meter readings */
      .reading-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }
      .reading-row:last-child {
        margin-bottom: 0;
      }
      .reading-icon {
        width: 20px;
        display: flex;
        justify-content: center;
      }
      .reading-label {
        width: 60px;
        font-size: 0.85em;
        color: #90a4ae;
      }
      .lcd-value {
        flex: 1;
        text-align: right;
        font-family: 'Courier New', 'Consolas', 'Liberation Mono', monospace;
        font-size: 1.3em;
        font-weight: bold;
        color: #00e676;
        letter-spacing: 1px;
        text-shadow: 0 0 6px rgba(0, 230, 118, 0.3);
        padding: 2px 8px;
        background: rgba(0, 230, 118, 0.05);
        border-radius: 4px;
      }
      .lcd-total {
        color: #00e5ff;
        text-shadow: 0 0 6px rgba(0, 229, 255, 0.3);
        background: rgba(0, 229, 255, 0.05);
        font-size: 1.4em;
      }
      .lcd-today {
        color: #ab47bc;
        text-shadow: 0 0 6px rgba(171, 71, 188, 0.3);
        background: rgba(171, 71, 188, 0.05);
      }
      .reading-total {
        margin-top: 4px;
        padding-top: 6px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .reading-unit {
        width: 65px;
        font-size: 0.75em;
        color: #607d8b;
      }

      /* Delta / cost rows */
      .delta-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
        font-size: 0.88em;
      }
      .delta-row:last-child {
        margin-bottom: 0;
      }
      .delta-label {
        width: 50px;
        color: #90a4ae;
      }
      .delta-total-icon {
        width: 14px;
      }
      .delta-kwh {
        font-family: 'Courier New', 'Consolas', monospace;
        font-weight: bold;
        color: #b0bec5;
        min-width: 60px;
        text-align: right;
      }
      .delta-mult {
        color: #607d8b;
        font-size: 0.9em;
      }
      .delta-eq {
        color: #607d8b;
      }
      .delta-cost {
        font-family: 'Courier New', 'Consolas', monospace;
        font-weight: bold;
        color: #ffd740;
        min-width: 80px;
        text-align: right;
      }
      .delta-cost-total {
        color: #ffab40;
        font-size: 1.05em;
      }
      .delta-total-row {
        margin-top: 4px;
        padding-top: 6px;
        border-top: 1px solid rgba(255,255,255,0.06);
      }

      /* Night schedule */
      .schedule-row {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.78em;
        color: #78909c;
        margin-bottom: 10px;
        padding-left: 4px;
      }

      /* Footer */
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 4px;
      }
      .power-display {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .power-value {
        font-family: 'Courier New', 'Consolas', monospace;
        font-size: 1.3em;
        font-weight: bold;
        color: #ffd740;
        text-shadow: 0 0 6px rgba(255, 215, 64, 0.2);
      }
      .power-unit {
        font-size: 0.8em;
        color: #78909c;
      }

      /* Report button */
      .report-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: linear-gradient(180deg, #2d4a7a, #1a3050);
        color: #00ccff;
        border: 1px solid #3a5a8a;
        border-radius: 8px;
        padding: 8px 14px;
        cursor: pointer;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.75em;
        letter-spacing: 1px;
        transition: all 0.15s;
        font-family: inherit;
      }
      .report-btn:hover {
        background: linear-gradient(180deg, #3a5a8a, #2d4a7a);
        border-color: #4a7ab0;
      }
      .report-btn:active {
        transform: translateY(1px);
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
      }

      /* Last report */
      .last-report {
        text-align: right;
        font-size: 0.72em;
        color: #546e7a;
        margin-top: 8px;
      }

      /* Settings panel */
      .settings-panel {
        margin-top: 12px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 8px;
        padding: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .settings-group {
        margin-bottom: 12px;
      }
      .settings-group:last-of-type {
        margin-bottom: 14px;
      }
      .settings-group-title {
        font-size: 0.72em;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #607d8b;
        margin-bottom: 8px;
      }
      .settings-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .settings-row label {
        font-size: 0.85em;
        color: #90a4ae;
      }
      .settings-row input {
        width: 110px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        color: #e0e0e0;
        padding: 6px 10px;
        font-size: 0.9em;
        font-family: 'Courier New', monospace;
        text-align: right;
      }
      .settings-row input:focus {
        outline: none;
        border-color: #00ccff;
        box-shadow: 0 0 4px rgba(0, 204, 255, 0.3);
      }
      .save-btn {
        width: 100%;
        background: linear-gradient(180deg, #2d6a3a, #1a4025);
        color: #66ff88;
        border: 1px solid #3a8a4a;
        border-radius: 8px;
        padding: 10px;
        cursor: pointer;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.8em;
        letter-spacing: 1px;
        transition: all 0.15s;
        font-family: inherit;
      }
      .save-btn:hover {
        background: linear-gradient(180deg, #3a8a4a, #2d6a3a);
        border-color: #4aaa5a;
      }
      .save-btn:active {
        transform: translateY(1px);
      }
      .save-btn.saved {
        background: #2d6a3a;
        color: #aaffbb;
      }
    `;
  }
}

// Card editor for Lovelace UI
class EnergyMeterCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        .editor { padding: 8px; }
        .editor label { display: block; margin-bottom: 4px; font-weight: 500; }
        .editor ha-entity-picker { display: block; }
      </style>
      <div class="editor">
        <label>Entity</label>
        <ha-entity-picker
          .hass=${this._hass}
          .value="${this._config.entity || ""}"
          .includeDomains=${["sensor"]}
          allow-custom-entity
        ></ha-entity-picker>
      </div>
    `;

    const picker = this.shadowRoot.querySelector("ha-entity-picker");
    if (picker) {
      picker.hass = this._hass;
      picker.value = this._config.entity || "";
      picker.includeDomains = ["sensor"];
      picker.allowCustomEntity = true;
      picker.addEventListener("value-changed", (ev) => {
        this._config = { ...this._config, entity: ev.detail.value };
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config: this._config },
          })
        );
      });
    }
  }
}

// Register card
customElements.define("energy-meter-card", EnergyMeterCard);
customElements.define("energy-meter-card-editor", EnergyMeterCardEditor);

// Register for Lovelace card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: "energy-meter-card",
  name: "Energy Meter Card",
  description: "Digital power meter display with phase indicators, readings, and cost tracking",
  preview: true,
  documentationURL: "https://github.com/finintra/Lichylnyk",
});

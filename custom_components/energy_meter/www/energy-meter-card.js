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
    no_data: "—",
    not_found: "Entity not found",
    night_schedule: "Night",
  },
  uk: {
    title: "Лічильник",
    meter_reading: "Показники лічильника",
    day: "День",
    night: "Ніч",
    total: "Всього",
    since_report: "З останнього звіту",
    cost: "Вартість",
    current_tariff: "Поточний тариф",
    power: "Потужність",
    report: "Подати звіт",
    report_confirm: "Подати звіт? Поточні показники будуть збережені.",
    kwh: "кВт·год",
    uah: "грн",
    watts: "Вт",
    phase: "Фаза",
    last_report: "Останній звіт",
    no_data: "—",
    not_found: "Сутність не знайдена",
    night_schedule: "Ніч",
  },
};

class EnergyMeterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._lang = hass.language === "uk" ? "uk" : "en";
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
            ${isDual ? `
              <div class="tariff-badge ${isNight ? "night" : "day"}">
                <ha-icon icon="${isNight ? "mdi:weather-night" : "mdi:white-balance-sunny"}"
                  style="--mdc-icon-size:16px;"></ha-icon>
                <span>${isNight ? this._t("night") : this._t("day")}</span>
              </div>
            ` : ""}
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

          <!-- Since report (deltas + cost) -->
          <div class="section">
            <div class="section-title">${this._t("since_report")}</div>
            ${isDual ? `
              <div class="delta-row">
                <ha-icon icon="mdi:white-balance-sunny" style="--mdc-icon-size:14px;color:#ffa726;"></ha-icon>
                <span class="delta-label">${this._t("day")}:</span>
                <span class="delta-kwh">${this._fmt(a.delta_day)}</span>
                <span class="delta-mult">× ${this._fmt(a.day_rate)}</span>
                <span class="delta-eq">=</span>
                <span class="delta-cost">${this._fmt(a.cost_day)} ${this._t("uah")}</span>
              </div>
              <div class="delta-row">
                <ha-icon icon="mdi:weather-night" style="--mdc-icon-size:14px;color:#42a5f5;"></ha-icon>
                <span class="delta-label">${this._t("night")}:</span>
                <span class="delta-kwh">${this._fmt(a.delta_night)}</span>
                <span class="delta-mult">× ${this._fmt(a.night_rate)}</span>
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
                <span class="delta-mult">× ${this._fmt(a.single_rate)}</span>
                <span class="delta-eq">=</span>
                <span class="delta-cost delta-cost-total">${this._fmt(a.cost_total)} ${this._t("uah")}</span>
              </div>
            `}
          </div>

          ${isDual ? `
          <!-- Night schedule -->
          <div class="schedule-row">
            <ha-icon icon="mdi:clock-outline" style="--mdc-icon-size:14px;color:#78909c;"></ha-icon>
            <span>${this._t("night_schedule")}: ${a.night_start || "23:00"} — ${a.night_end || "07:00"}</span>
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
          </div>

        </div>
      </ha-card>
    `;

    // Bind report button
    const btn = this.shadowRoot.getElementById("reportBtn");
    if (btn) {
      btn.addEventListener("click", () => this._handleReport());
    }
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

# Energy Meter / Лічильник електроенергії

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/v/release/finintra/Lichylnyk)](https://github.com/finintra/Lichylnyk/releases)

Custom integration for Home Assistant to track electricity consumption from Zigbee2MQTT energy meters (Ourtop ATMS10013Z3 and similar).

Кастомна інтеграція для Home Assistant для обліку електроенергії з лічильників Zigbee2MQTT (Ourtop ATMS10013Z3 та подібні).

---

## Features / Можливості

| EN | UA |
|---|---|
| Single or dual tariff (day/night) | Одно- або двозонний тариф (день/ніч) |
| 1, 2, or 3 phase support | Підтримка 1, 2 або 3 фаз |
| Automatic day/night tariff switching | Автоматичне перемикання день/ніч |
| Per-phase voltage monitoring | Моніторинг напруги по фазах |
| Cost calculation in UAH | Розрахунок вартості в грн |
| Monthly usage reports (snapshots) | Щомісячні звіти (снепшоти) |
| Custom Lovelace card with meter-like UI | Кастомна Lovelace-картка у стилі лічильника |
| Ukrainian & English localization | Українська та англійська локалізація |

## Sensors / Сенсори

The integration creates 3 sensors per meter / Інтеграція створює 3 сенсори на лічильник:

| Sensor | Description | UA |
|---|---|---|
| **Energy Meter Total** | Total energy reading (kWh), with day/night breakdown | Загальні показники (кВт·год), з розбивкою день/ніч |
| **Energy Cost** | Cost since last report (UAH) | Вартість з останнього звіту (грн) |
| **Power Status** | Electricity availability per phase | Наявність електроенергії по фазах |

## Installation / Встановлення

### HACS (recommended / рекомендовано)

1. Open HACS → Integrations → Menu (⋮) → Custom repositories
2. Add `https://github.com/finintra/Lichylnyk` as **Integration**
3. Find "Energy Meter" and install
4. Restart Home Assistant

### Manual / Вручну

1. Copy `custom_components/energy_meter` to your `config/custom_components/`
2. Restart Home Assistant

## Configuration / Налаштування

1. Go to **Settings → Devices & Services → Add Integration**
2. Search for **Energy Meter**
3. Follow the setup wizard:
   - Choose tariff type (single / dual) and phase count
   - Select Zigbee2MQTT source entities (energy, power, voltage)
   - Set tariff rates (UAH/kWh)
   - Enter initial meter readings

## Lovelace Card / Картка

The integration includes a custom card that auto-registers. Add it to your dashboard:

Інтеграція включає картку, яка реєструється автоматично. Додайте її на дашборд:

```yaml
type: custom:energy-meter-card
entity: sensor.energy_meter_total
```

### Card features / Можливості картки

- Phase voltage indicators (green/red LED) / Індикатори напруги фаз (зелений/червоний)
- LCD-style meter readings / Показники у стилі LCD-дисплея
- Day/night consumption breakdown / Розбивка споживання день/ніч
- Cost calculation since last report / Розрахунок вартості з останнього звіту
- Current power draw (W) / Поточна потужність (Вт)
- "Submit Report" button for monthly snapshots / Кнопка "Подати звіт" для щомісячних знімків

## Services / Сервіси

| Service | Description | UA |
|---|---|---|
| `energy_meter.take_snapshot` | Save current readings as a snapshot for monthly reporting | Зберегти поточні показники як знімок |
| `energy_meter.reset_readings` | Reset readings and start a new billing period | Скинути показники, почати новий період |

## Supported devices / Підтримувані пристрої

- Ourtop ATMS10013Z3 (3-phase Zigbee energy meter)
- Any Zigbee2MQTT energy meter providing energy (kWh), power (W), and voltage (V) entities

---

Made with ⚡ for Ukrainian smart homes / Зроблено з ⚡ для українських розумних будинків

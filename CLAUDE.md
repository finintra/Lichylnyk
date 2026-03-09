# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lichylnyk** is a Home Assistant custom integration (`energy_meter` domain) for tracking electricity consumption from Zigbee2MQTT energy meters (Ourtop ATMS10013Z3). Supports single/dual tariff (day/night), 1-3 phase meters, Ukrainian (primary) and English UI. Distributed via HACS.

## Architecture

All code lives in `custom_components/energy_meter/`. No build step, tests, or CI — deploy by copying to HA's `custom_components/` or installing via HACS.

### Core Components

- **`__init__.py`** — Domain setup. `async_setup()` registers the Lovelace card JS. `async_setup_entry()` creates persistent storage and registers 3 services (`reset_readings`, `take_snapshot`, `update_settings`). Services communicate to sensors via `async_dispatcher_send`.

- **`sensor.py`** — Three sensor entities per config entry:
  - `EnergyMeterMainSensor` (RestoreEntity) — tracks day/night/total kWh readings, voltages, power. Subscribes to Zigbee2MQTT entities via `async_track_state_change_event`. Splits energy deltas into day/night based on time. Exposes ~20 attributes used by the card.
  - `EnergyMeterCostSensor` — calculates cost from stored readings minus snapshot.
  - `EnergyMeterPowerStatusSensor` — on/off based on voltage presence (>50V threshold).

- **`config_flow.py`** — 4-step wizard: tariff type + phases → entity selection → rates/schedule → initial readings. Conditional branching for single vs dual tariff. Includes OptionsFlow for post-install rate changes.

- **`www/energy-meter-card.js`** — Custom Lovelace card (plain HTMLElement, Shadow DOM). Dark meter-style UI with LCD digits, LED phase indicators, collapsible settings panel. Bilingual via `TRANSLATIONS` object keyed by `hass.language`. Calls `energy_meter.take_snapshot` and `energy_meter.update_settings` services directly.

### Data Flow

1. Zigbee2MQTT entity state change → `_async_source_changed` in main sensor
2. `_process_energy()` calculates delta, splits day/night by current time, adds to readings
3. Readings persisted to `Store` (HA's `helpers.storage`)
4. Card reads all data from main sensor's `extra_state_attributes`
5. "Submit Report" button → `take_snapshot` service → saves current readings as snapshot → dispatcher signal → sensor refreshes state
6. Settings panel "Save" → `update_settings` service → updates config entry + in-memory config → resets `_last_energy` to None → dispatcher signal → sensor applies new readings

### Key Design Decisions

- **Snapshot = billing period baseline.** Delta = current reading − snapshot reading. When user enters new "current readings", `_last_energy` resets to None so only consumption after that point is tracked.
- **Initial snapshot auto-created.** If no snapshot exists when sensor initializes or settings update, snapshot is set equal to current readings (delta starts at 0).
- **Card auto-registered** in `async_setup()` (not `async_setup_entry()`) so it loads before config entries. Uses `async_register_static_paths` with fallback to deprecated `register_static_path`.
- **All card data comes from one entity's attributes** — the main sensor. No separate API calls.

## Key Constants (`const.py`)

Config keys: `CONF_TARIFF_TYPE`, `CONF_DAY_RATE`, `CONF_NIGHT_RATE`, `CONF_SINGLE_RATE`, `CONF_INITIAL_DAY/NIGHT/TOTAL`, `CONF_ENERGY_ENTITY`, `CONF_VOLTAGE_A/B/C_ENTITY`, `CONF_POWER_ENTITY`.

Tariff types: `TARIFF_SINGLE`, `TARIFF_DUAL`. Storage: `STORAGE_KEY = "energy_meter_data"`.

## Translations

- `strings.json` — source strings (English)
- `translations/en.json`, `translations/uk.json` — config flow UI translations
- `www/energy-meter-card.js` — card has its own `TRANSLATIONS` object (EN/UK) at the top of the file

When updating user-facing text, check all three locations.

## HACS Distribution

- `hacs.json` at repo root with `content_in_root: false`
- `manifest.json` has `version` field — must match git release tag (e.g., `v1.2.0`)
- Card JS served from `/energy_meter/energy-meter-card.js` (not HACS's `/hacsfiles/` path)

## Default Tariff Rates

Day: 4.32 UAH/kWh, Night: 2.16 UAH/kWh (Ukrainian electricity tariffs).

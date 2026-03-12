"""Energy Meter integration for Home Assistant."""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType

from .const import (
    DOMAIN,
    STORAGE_KEY,
    STORAGE_VERSION,
    SERVICE_RESET_READINGS,
    SERVICE_SNAPSHOT,
    SERVICE_UPDATE_SETTINGS,
)

_LOGGER = logging.getLogger(__name__)

PLATFORMS = ["sensor"]

CARD_PATH = "/energy_meter/energy-meter-card.js"
CARD_FILE = os.path.join(os.path.dirname(__file__), "www", "energy-meter-card.js")

# Read version for cache-busting
_manifest = os.path.join(os.path.dirname(__file__), "manifest.json")
with open(_manifest, encoding="utf-8") as _f:
    _VERSION = json.load(_f).get("version", "0")
CARD_URL = f"{CARD_PATH}?v={_VERSION}"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up Energy Meter domain."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def _register_card(hass: HomeAssistant) -> None:
    """Register frontend card (once)."""
    if hass.data[DOMAIN].get("frontend_registered"):
        return
    try:
        from homeassistant.components.http import StaticPathConfig
        await hass.http.async_register_static_paths(
            [StaticPathConfig(CARD_PATH, CARD_FILE, cache_headers=False)]
        )
    except (ImportError, AttributeError):
        hass.http.register_static_path(CARD_PATH, CARD_FILE, cache_headers=False)
    add_extra_js_url(hass, CARD_URL)
    hass.data[DOMAIN]["frontend_registered"] = True
    _LOGGER.info("Lichylnyk card registered at %s", CARD_URL)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Energy Meter from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    # Register frontend card on first config entry setup
    await _register_card(hass)

    store = Store(hass, STORAGE_VERSION, f"{STORAGE_KEY}_{entry.entry_id}")
    stored = await store.async_load() or {}

    hass.data[DOMAIN][entry.entry_id] = {
        "config": dict(entry.data),
        "store": store,
        "stored": stored,
    }

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Register services
    async def handle_reset(call: ServiceCall) -> None:
        """Reset readings — save current as snapshot and start new period."""
        for eid, data in hass.data[DOMAIN].items():
            if not isinstance(data, dict) or "stored" not in data:
                continue
            stored = data["stored"]
            stored["snapshot_day"] = stored.get("reading_day", 0)
            stored["snapshot_night"] = stored.get("reading_night", 0)
            stored["snapshot_total"] = stored.get("reading_total", 0)
            stored["snapshot_time"] = datetime.now().isoformat()
            await data["store"].async_save(stored)
        async_dispatcher_send(hass, f"{DOMAIN}_snapshot_taken")

    async def handle_snapshot(call: ServiceCall) -> None:
        """Take a snapshot of current readings."""
        for eid, data in hass.data[DOMAIN].items():
            if not isinstance(data, dict) or "stored" not in data:
                continue
            stored = data["stored"]
            stored["snapshot_day"] = stored.get("reading_day", 0)
            stored["snapshot_night"] = stored.get("reading_night", 0)
            stored["snapshot_total"] = stored.get("reading_total", 0)
            stored["snapshot_time"] = datetime.now().isoformat()
            await data["store"].async_save(stored)
        async_dispatcher_send(hass, f"{DOMAIN}_snapshot_taken")

    async def handle_update_settings(call: ServiceCall) -> None:
        """Update tariff rates or readings from the card."""
        svc_data = dict(call.data)
        for entry_obj in hass.config_entries.async_entries(DOMAIN):
            new_data = dict(entry_obj.data)
            # Update only provided fields
            for key in (
                "day_rate", "night_rate", "single_rate",
                "initial_day", "initial_night", "initial_total",
                "last_report_day", "last_report_night", "last_report_total",
            ):
                if key in svc_data:
                    new_data[key] = float(svc_data[key])

            # Update stored data and persist BEFORE async_update_entry
            # (which triggers a reload via async_update_options)
            eid = entry_obj.entry_id
            if eid in hass.data[DOMAIN] and isinstance(hass.data[DOMAIN][eid], dict):
                hass.data[DOMAIN][eid]["config"] = new_data
                entry_stored = hass.data[DOMAIN][eid]["stored"]
                entry_store = hass.data[DOMAIN][eid]["store"]
                readings_changed = False
                if "initial_day" in svc_data:
                    entry_stored["reading_day"] = float(svc_data["initial_day"])
                    readings_changed = True
                if "initial_night" in svc_data:
                    entry_stored["reading_night"] = float(svc_data["initial_night"])
                    readings_changed = True
                if "initial_total" in svc_data:
                    entry_stored["reading_total"] = float(svc_data["initial_total"])
                    readings_changed = True
                if "last_report_day" in svc_data:
                    entry_stored["snapshot_day"] = float(svc_data["last_report_day"])
                if "last_report_night" in svc_data:
                    entry_stored["snapshot_night"] = float(svc_data["last_report_night"])
                if "last_report_total" in svc_data:
                    entry_stored["snapshot_total"] = float(svc_data["last_report_total"])
                if not entry_stored.get("snapshot_time"):
                    entry_stored["snapshot_time"] = datetime.now().isoformat()
                if readings_changed:
                    # Reset daily checkpoints to new readings (avoid negative daily values)
                    entry_stored["daily_day"] = entry_stored.get("reading_day", 0)
                    entry_stored["daily_night"] = entry_stored.get("reading_night", 0)
                    entry_stored["daily_total"] = entry_stored.get("reading_total", 0)
                    # Reset energy tracking so delta starts from 0
                    entry_stored["last_energy"] = None
                await entry_store.async_save(dict(entry_stored))

            hass.config_entries.async_update_entry(entry_obj, data=new_data)
        async_dispatcher_send(hass, f"{DOMAIN}_settings_updated")

    if not hass.services.has_service(DOMAIN, SERVICE_RESET_READINGS):
        hass.services.async_register(DOMAIN, SERVICE_RESET_READINGS, handle_reset)
        hass.services.async_register(DOMAIN, SERVICE_SNAPSHOT, handle_snapshot)
        hass.services.async_register(DOMAIN, SERVICE_UPDATE_SETTINGS, handle_update_settings)

    entry.async_on_unload(entry.add_update_listener(async_update_options))

    return True


async def async_update_options(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle options update."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok

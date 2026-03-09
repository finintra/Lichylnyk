"""Energy Meter integration for Home Assistant."""
from __future__ import annotations

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

CARD_URL = "/energy_meter/energy-meter-card.js"
CARD_FILE = os.path.join(os.path.dirname(__file__), "www", "energy-meter-card.js")


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up Energy Meter domain — register frontend card."""
    hass.data.setdefault(DOMAIN, {})

    # Register frontend card early (before config entries)
    try:
        from homeassistant.components.http import StaticPathConfig
        await hass.http.async_register_static_paths(
            [StaticPathConfig(CARD_URL, CARD_FILE, cache_headers=False)]
        )
    except (ImportError, AttributeError):
        hass.http.register_static_path(CARD_URL, CARD_FILE, cache_headers=False)
    add_extra_js_url(hass, CARD_URL)
    _LOGGER.info("Energy Meter card registered at %s", CARD_URL)

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Energy Meter from a config entry."""
    hass.data.setdefault(DOMAIN, {})

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
            ):
                if key in svc_data:
                    new_data[key] = float(svc_data[key])
            hass.config_entries.async_update_entry(entry_obj, data=new_data)
            # Also update in-memory config
            eid = entry_obj.entry_id
            if eid in hass.data[DOMAIN] and isinstance(hass.data[DOMAIN][eid], dict):
                hass.data[DOMAIN][eid]["config"] = new_data
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

# BREAKSTATE NJ V56.1 — Data & Provenance Audit

Audit date: 2026-09-16

## Verified upstreams

- NOAA/NCEI `DEM_mosaics/DEM_global_mosaic/ImageServer`: reachable; supports Get Samples; elevation mosaic with source metadata fields including `DateCompleted`, `VerticalDatum`, `DemName`, and `MetadataURL` at the service level.
- NOAA/NCEI `DEM_mosaics/DEM_all/ImageServer`: reachable; supports Get Samples.
- NOAA/NCEI `DEM_mosaics/CRM_mosaic/ImageServer`: reachable; compiled Coastal Relief Model baseline.
- NOAA/NCEI `bag_bathymetry/ImageServer`: reachable; supports Get Samples and exposes survey IDs in its catalog.
- NOAA NDBC realtime2: stations 44065, 44091 and 44025 return current text observations.
- USGS The National Map `USGSTopo/MapServer`: reachable cached basemap service.

## Critical findings fixed

1. **Retrieval time was not survey time.** V56 returned `sampledAt` which could be misunderstood as the age of the seabed. V56.1 now returns `retrievedAt`, leaves `surveyDate` null until source-raster metadata is resolved, and labels the bottom as a historical/surveyed-or-compiled baseline.
2. **NDBC `.adcp` was not validated.** The audited NDBC realtime directory did not expose `.adcp` files for the configured stations. V56.1 removes that assumption. Current observations are now explicitly unavailable until a validated current station/feed is configured.
3. **Beach orientation bug.** Client transport used a hard-coded 8° shore bearing. V56.1 uses the selected beach's server-defined orientation.
4. **Stale observations.** NDBC records now retain their observation timestamp and receive a 180-minute freshness classification. Stale buoys are not used for transport.
5. **Modeled transport labeling.** Wave-derived arrows are always labeled `MODELED WAVE-DRIVEN TRANSPORT`; they are never described as observed current.
6. **Bathymetry failures remain fail-closed.** If NOAA/NCEI sampling fails, the UI reports unavailable data and generates no synthetic seafloor.
7. **Upstream health endpoint.** `/api/health` now checks the configured NDBC, NOAA/NCEI DEM, and USGS basemap services with explicit success/failure and latency.
8. **Oversized upstream response handling.** Responses over the configured limit now fail rather than silently returning truncated data.

## Classification contract

- **LIVE OBSERVATION:** timestamped NDBC measurement within the configured freshness window.
- **BASELINE:** NOAA/NCEI survey, mosaic, archive, or compiled relief value. It is not automatically today's bottom.
- **MODELED:** a calculation from observations/baseline data; never presented as directly measured.
- **UNAVAILABLE:** missing, stale, failed, or not yet validated. No synthetic substitute.

## Remaining blocker before claiming “current sandbars”

The application still does not resolve the acquisition date and vertical datum for every raster contributing to each sampled cell, and it does not yet assimilate surveyed bottom forward to today's morphology. Therefore V56.1 deliberately describes detected crests as **baseline-derived bar crests**, not current sandbars.

Before a production current-morphology product, resolve raster-level `DateCompleted`/survey metadata and vertical datum, select a validated current/tide forcing source by geography, then implement and validate the morphology assimilation layer against later surveys.

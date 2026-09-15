# BREAKSTATE NJ — V56

## Run
```bash
npm run dev
```
Open: http://localhost:5173/

No npm install is required. Node.js 18+ is required.

## What V56 does
- Uses USGS The National Map as the land/topographic basemap through the local server.
- Queries multiple NOAA/NCEI bathymetry ImageServer sources.
- Splits bathymetry sampling into small requests to avoid the oversized URL failure in V11.
- Builds a continuous nearshore colored depth field from returned measured elevations.
- Detects coherent cross-shore relief maxima and draws them as estimated inner/outer sandbar crests.
- Reads live NDBC wave observations.
- Attempts NDBC ADCP current observations; if unavailable, clearly labels wave-driven transport as modeled.
- Never fabricates a bathymetric fallback when upstream data are unavailable.

## Accuracy rule
The bathymetry is a surveyed/baseline representation from NOAA/NCEI holdings. A detected crest is an interpretation of that measured grid, not a claim that the sandbar is at that exact position today. A future morphology-assimilation layer is required for present-day bar migration.

## QA
```bash
npm test
```

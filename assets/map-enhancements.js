(function () {
  const CSV_STORAGE_KEY = 'steula:uploaded-csv';
  const LAST_GEO_STORAGE_KEY = 'steula:last-geocode';

  const state = {
    map: null,
    cepCoords: null,
    selectedLatLng: null,
    selectedName: null,
    selectedMarker: null,
    highlightLayer: null,
    lineLayer: null,
    cepMarkerLayer: null,
    selectionSource: null,
    markerHooksDone: false,
    csvHookInstalled: false,
    csvRestoreAttempted: false,
    lastGeoRestoreAttempted: false,
    layoutStyleInjected: false,
    selectionSyncTimer: null,
  };

  function readStoredLastGeo() {
    try {
      const raw = localStorage.getItem(LAST_GEO_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.cepCoords) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function writeStoredLastGeo() {
    try {
      localStorage.setItem(
        LAST_GEO_STORAGE_KEY,
        JSON.stringify({
          cep: state.lastCep || '',
          cepCoords: state.cepCoords,
          selectedName: state.selectedName || '',
          selectedLatLng: state.selectedLatLng,
          savedAt: Date.now(),
        })
      );
    } catch {
      // ignore storage failures
    }
  }

  function installLeafletMapCapture() {
    if (!window.L || !window.L.Map || window.__steulaMapCaptureInstalled) return;
    window.__steulaMapCaptureInstalled = true;

    const originalInit = window.L.Map.prototype.initialize;
    window.L.Map.prototype.initialize = function () {
      const result = originalInit.apply(this, arguments);
      state.map = this;
      return result;
    };
  }

  function installOpenMeteoFallbackPatch() {
    if (window.__steulaOpenMeteoFallbackInstalled) return;
    if (typeof window.fetch !== 'function') return;

    window.__steulaOpenMeteoFallbackInstalled = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async function (input, init) {
      const url = typeof input === 'string' ? input : input && input.url;

      if (!url || !url.includes('geocoding-api.open-meteo.com/v1/search')) {
        return originalFetch(input, init);
      }

      const response = await originalFetch(input, init);

      try {
        if (!response.ok) return response;

        const parsedUrl = new URL(url, window.location.href);
        if (parsedUrl.searchParams.get('countryCode') !== 'BR') return response;

        const payload = await response.clone().json();
        if (payload && Array.isArray(payload.results) && payload.results.length > 0) {
          return response;
        }

        const city = (parsedUrl.searchParams.get('name') || '').trim();
        const stateCode = (parsedUrl.searchParams.get('state') || '').trim();
        if (!city || !stateCode) return response;

        const nominatimQuery = `${city}, ${stateCode}, Brazil`;
        const fallbackUrl =
          'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
          encodeURIComponent(nominatimQuery);

        const fallbackResponse = await originalFetch(fallbackUrl, {
          headers: { 'User-Agent': 'Steula-App' },
        });
        if (!fallbackResponse.ok) return response;

        const fallbackData = await fallbackResponse.json();
        if (!Array.isArray(fallbackData) || fallbackData.length === 0) return response;

        const first = fallbackData[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return response;

        const patchedPayload = {
          generationtime_ms: payload && payload.generationtime_ms ? payload.generationtime_ms : 0,
          results: [
            {
              name: city,
              admin1: stateCode,
              country: 'Brazil',
              latitude: lat,
              longitude: lng,
            },
          ],
        };

        return new Response(JSON.stringify(patchedPayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        return response;
      }
    };
  }

  function getMap() {
    return state.map;
  }

  function formatDistanceKm(fromLatLng, toCoords) {
    const from = window.L.latLng(fromLatLng.lat, fromLatLng.lng);
    const to = window.L.latLng(toCoords.lat, toCoords.lng);
    const distanceMeters = from.distanceTo(to);
    const distanceKm = distanceMeters / 1000;

    if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)} km`;
    }

    return `${Math.round(distanceKm)} km`;
  }

  function findMarkerNearLatLng(latLng, maxDistanceMeters) {
    const map = getMap();
    if (!map || !latLng) return null;

    const target = window.L.latLng(latLng.lat, latLng.lng);
    const limit = Number.isFinite(maxDistanceMeters) ? maxDistanceMeters : 150;

    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    map.eachLayer((layer) => {
      if (!(layer instanceof window.L.Marker)) return;
      const name = markerName(layer);
      if (!name) return;

      const distance = target.distanceTo(layer.getLatLng());
      if (distance <= limit && distance < nearestDistance) {
        nearest = layer;
        nearestDistance = distance;
      }
    });

    return nearest;
  }

  function resolveSelectedMarker() {
    const map = getMap();
    if (!map) return null;

    if (state.selectedMarker && map.hasLayer(state.selectedMarker)) {
      return state.selectedMarker;
    }

    let marker = null;

    if (state.selectedName) {
      marker = findMarkerByName(state.selectedName);
    }

    if (!marker && state.selectedLatLng) {
      marker = findMarkerNearLatLng(state.selectedLatLng, 300);
    }

    if (!marker && state.cepCoords) {
      marker = findNearestRepresentativeMarker(state.cepCoords);
    }

    if (marker) {
      state.selectedMarker = marker;
      state.selectedLatLng = marker.getLatLng();
      const meta = markerCityState(marker);
      console.log('📍 Marcador selecionado no mapa:', {
        nome: markerName(marker),
        cidade: meta && meta.city ? meta.city : '',
        uf: meta && meta.state ? meta.state : '',
      });
    }

    return marker;
  }

  function drawSelection() {
    const map = getMap();
    if (!map) return;

    resolveSelectedMarker();

    if (state.cepMarkerLayer) {
      map.removeLayer(state.cepMarkerLayer);
      state.cepMarkerLayer = null;
    }

    if (state.cepCoords) {
      state.cepMarkerLayer = window.L.marker([state.cepCoords.lat, state.cepCoords.lng], {
        icon: window.L.divIcon({
          className: '',
          html: '<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.2);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="8" r="4" stroke="#ffffff" stroke-width="2"/><path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      })
        .addTo(map)
        .bindPopup('Cliente (CEP destinatário)');
    }

    if (state.highlightLayer) {
      map.removeLayer(state.highlightLayer);
    }

    if (state.lineLayer) {
      map.removeLayer(state.lineLayer);
      state.lineLayer = null;
    }

    if (!state.selectedLatLng) return;

    state.highlightLayer = window.L.circleMarker(state.selectedLatLng, {
      radius: 11,
      color: '#ffffff',
      weight: 3,
      fillColor: '#ef4444',
      fillOpacity: 1,
    }).addTo(map);

    if (state.cepCoords) {
      const from = [state.selectedLatLng.lat, state.selectedLatLng.lng];
      const to = [state.cepCoords.lat, state.cepCoords.lng];
      const distanceText = formatDistanceKm(state.selectedLatLng, state.cepCoords);
      const midLat = (from[0] + to[0]) / 2;
      const midLng = (from[1] + to[1]) / 2;
      const midpoint = window.L.latLng(midLat, midLng);

      state.lineLayer = window.L.polyline(
        [from, to],
        {
          color: '#ef4444',
          weight: 3,
          opacity: 0.95,
          dashArray: '8,8',
        }
      )
        .addTo(map)
        .bindPopup(`<strong>Distância estimada:</strong> ${distanceText}`);

      state.lineLayer.on('click', function (ev) {
        state.lineLayer.openPopup(ev.latlng);
      });

      if (state.selectionSource !== 'marker') {
        window.setTimeout(() => {
          if (state.lineLayer) {
            state.lineLayer.openPopup(midpoint);
          }
        }, 180);
      }
    }

    state.selectionSource = null;

    focusMapOnSelection();

    if (state.selectedMarker && state.selectedMarker.openPopup) {
      window.setTimeout(() => {
        try {
          state.selectedMarker.openPopup();
        } catch {
          // ignore popup timing errors
        }
      }, 120);
    }

    writeStoredLastGeo();
  }

  function injectClickableCursorStyles() {
    if (document.getElementById('steula-clickable-cursor-style')) return;
    const style = document.createElement('style');
    style.id = 'steula-clickable-cursor-style';
    style.textContent = `
      .space-y-1\\.5.text-xs > div,
      p.text-lg.font-bold.text-foreground,
      p.text-lg.font-bold.text-foreground * {
        cursor: pointer !important;
      }
    `;
    document.head.appendChild(style);
  }

  function injectLayoutTweaksStyles() {
    if (state.layoutStyleInjected) return;
    state.layoutStyleInjected = true;

    const style = document.createElement('style');
    style.id = 'steula-layout-tweaks-style';
    style.textContent = `
      .steula-left-scroll {
        max-height: calc(100vh - 24px) !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        overscroll-behavior: contain;
        scrollbar-gutter: stable;
        padding-right: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  function getCommonAncestor(first, second) {
    if (!first || !second) return null;

    const visited = new Set();
    let node = first;
    while (node) {
      visited.add(node);
      node = node.parentElement;
    }

    node = second;
    while (node) {
      if (visited.has(node)) return node;
      node = node.parentElement;
    }

    return null;
  }

  function setupLeftMenuScroll() {
    const cepInput = document.querySelector('#cep');
    const csvInput = document.querySelector('input[type="file"][accept*=".csv"]');

    let panel = getCommonAncestor(cepInput, csvInput);

    if (!panel && cepInput && cepInput.closest) {
      panel = cepInput.closest('div.w-full.max-w-md.space-y-4');
    }

    if (!panel || !(panel instanceof HTMLElement)) return;
    panel.classList.add('steula-left-scroll');
  }

  function hideCoverageSection() {
    const textNodes = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, th, td'));

    const coverageNode = textNodes.find((node) => {
      const text = normalizeText(node.textContent || '');
      return (
        text.includes('tabela de cobertura') ||
        text === 'cobertura' ||
        text.includes('cobertura de representantes')
      );
    });

    if (!coverageNode || !(coverageNode instanceof HTMLElement)) return;

    const container =
      coverageNode.closest('section, article, .card, [role="region"], div[class*="shadow"], div[class*="border"]') ||
      coverageNode.closest('div');

    if (container && container instanceof HTMLElement) {
      container.style.display = 'none';
    }
  }

  function markerName(marker) {
    try {
      const popup = marker.getPopup && marker.getPopup();
      if (!popup) return null;
      const content = popup.getContent && popup.getContent();
      if (typeof content !== 'string') return null;
      const m = content.match(/<strong>(.*?)<\/strong>/i);
      return m ? m[1].trim() : null;
    } catch {
      return null;
    }
  }

  function markerCityState(marker) {
    try {
      const popup = marker.getPopup && marker.getPopup();
      if (!popup) return null;
      const content = popup.getContent && popup.getContent();
      if (typeof content !== 'string') return null;

      const m = content.match(/<span[^>]*>\s*([^<,]+)\s*,\s*([A-Z]{2})\s*<\/span>/i);
      if (!m) return null;

      return {
        city: (m[1] || '').trim(),
        state: (m[2] || '').trim().toUpperCase(),
      };
    } catch {
      return null;
    }
  }

  function findMarkerByName(name) {
    const map = getMap();
    if (!map || !name) return null;

    const targetName = normalizeText(String(name));
    const matches = [];
    map.eachLayer((layer) => {
      if (!(layer instanceof window.L.Marker)) return;
      const n = markerName(layer);
      if (!n) return;

      const candidateName = normalizeText(String(n));
      if (
        candidateName === targetName ||
        candidateName.includes(targetName) ||
        targetName.includes(candidateName)
      ) {
        matches.push(layer);
      }
    });

    if (matches.length === 0) {
      return state.cepCoords ? findNearestRepresentativeMarker(state.cepCoords) : null;
    }
    if (matches.length === 1 || !state.cepCoords) return matches[0];

    const target = window.L.latLng(state.cepCoords.lat, state.cepCoords.lng);
    let nearest = matches[0];
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const marker of matches) {
      const d = target.distanceTo(marker.getLatLng());
      if (d < nearestDistance) {
        nearest = marker;
        nearestDistance = d;
      }
    }

    return nearest;
  }

  function findNearestRepresentativeMarker(coords) {
    const map = getMap();
    if (!map || !coords) return null;

    const target = window.L.latLng(coords.lat, coords.lng);
    const cepMeta = state.cepMeta || null;
    const sameCityCandidates = [];
    const allCandidates = [];

    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    map.eachLayer((layer) => {
      if (!(layer instanceof window.L.Marker)) return;
      const name = markerName(layer);
      if (!name) return;

      allCandidates.push(layer);

      if (cepMeta && cepMeta.city && cepMeta.state) {
        const markerMeta = markerCityState(layer);
        if (
          markerMeta &&
          normalizeText(markerMeta.city) === normalizeText(cepMeta.city) &&
          markerMeta.state === String(cepMeta.state).toUpperCase()
        ) {
          sameCityCandidates.push(layer);
        }
      }
    });

    const candidates = sameCityCandidates.length > 0 ? sameCityCandidates : allCandidates;

    for (const layer of candidates) {
      if (!(layer instanceof window.L.Marker)) continue;

      const markerLatLng = layer.getLatLng();
      const distance = target.distanceTo(markerLatLng);
      if (distance < nearestDistance) {
        nearest = layer;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  function normalizeText(value) {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function getRepresentativeFilterSelect() {
    const selects = Array.from(document.querySelectorAll('select'));
    return selects.find((select) =>
      Array.from(select.options || []).some(
        (option) => normalizeText(option.textContent || option.innerText) === 'todos os representantes'
      )
    );
  }

  function getRepresentativeFilterTrigger() {
    const select = getRepresentativeFilterSelect();
    if (!select) return null;

    let node = select.parentElement;
    while (node && node !== document.body) {
      const trigger = node.querySelector('button[role="combobox"]');
      if (trigger) return trigger;
      node = node.parentElement;
    }

    const comboboxes = Array.from(document.querySelectorAll('button[role="combobox"]'));
    return comboboxes[1] || null;
  }

  function setRepresentativeTriggerLabel(name) {
    const trigger = getRepresentativeFilterTrigger();
    if (!trigger) return;
    const valueNode = trigger.querySelector('span');
    if (valueNode) {
      valueNode.textContent = name;
    }
  }

  function clickRepresentativeOption(name, attempt) {
    const normalizedName = normalizeText(name);
    const option = Array.from(document.querySelectorAll('[role="option"]')).find(
      (item) => normalizeText(item.textContent || item.innerText) === normalizedName
    );

    if (option) {
      option.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      option.click();
      return;
    }

    if (attempt < 8) {
      window.setTimeout(() => clickRepresentativeOption(name, attempt + 1), 80);
    }
  }

  function syncRepresentativeFilterUi(name) {
    const trigger = getRepresentativeFilterTrigger();
    if (!trigger) return;

    setRepresentativeTriggerLabel(name);
    trigger.click();
    window.setTimeout(() => clickRepresentativeOption(name, 0), 50);
  }

  function focusMapOnSelection() {
    const map = getMap();
    if (!map) return;

    if (state.selectedLatLng && state.cepCoords) {
      const selected = window.L.latLng(state.selectedLatLng.lat, state.selectedLatLng.lng);
      const cep = window.L.latLng(state.cepCoords.lat, state.cepCoords.lng);
      const distance = selected.distanceTo(cep);

      if (distance < 80) {
        map.setView(selected, Math.max(map.getZoom(), 12));
        return;
      }

      const bounds = window.L.latLngBounds([
        [state.selectedLatLng.lat, state.selectedLatLng.lng],
        [state.cepCoords.lat, state.cepCoords.lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60] });
      return;
    }

    if (state.selectedLatLng) {
      map.setView(state.selectedLatLng, Math.max(map.getZoom(), 8));
    }
  }

  function schedulePostFilterSelectionSync() {
    if (state.selectionSyncTimer) {
      window.clearTimeout(state.selectionSyncTimer);
    }

    state.selectionSyncTimer = window.setTimeout(() => {
      state.selectionSyncTimer = null;
      resolveSelectedMarker();
      drawSelection();
    }, 260);
  }

  function setRepresentativeFilterByName(name) {
    const select = getRepresentativeFilterSelect();
    if (!select) return;

    const normalizedName = normalizeText(name);
    if (!normalizedName) return;

    const option = Array.from(select.options || []).find(
      (item) => normalizeText(item.textContent || item.innerText) === normalizedName
    );

    if (!option || select.value === option.value) return;

    const valueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value'
    )?.set;

    if (valueSetter) {
      valueSetter.call(select, option.value);
    } else {
      select.value = option.value;
    }

    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    syncRepresentativeFilterUi(name);
    schedulePostFilterSelectionSync();
  }

  function hookMarkerClicks() {
    const map = getMap();
    if (!map) return;

    map.eachLayer((layer) => {
      if (!(layer instanceof window.L.Marker)) return;
      if (layer.__steulaHooked) return;
      layer.__steulaHooked = true;

      layer.on('click', function () {
        const name = markerName(layer);
        if (name) {
          setRepresentativeFilterByName(name);
          state.selectedName = name;
        }
        state.selectionSource = 'marker';
        state.selectedMarker = layer;
        state.selectedLatLng = layer.getLatLng();
        drawSelection();
      });
    });
  }

  async function geocodeCep(cepRaw) {
    const cep = (cepRaw || '').replace(/\D/g, '');
    if (cep.length !== 8) {
      console.error('❌ CEP inválido (não tem 8 dígitos):', cepRaw);
      return null;
    }

    try {
      console.log(`🔍 Buscando CEP: ${cep}`);
      const via = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then((r) => r.json());
      if (!via || via.erro) {
        console.error('❌ CEP não encontrado no viaCEP:', cep);
        return null;
      }
      
      console.log(`✓ viaCEP retornou: ${via.localidade}, ${via.uf}`);

      // Strategy 1: Nominatim com localidade + estado + Brasil
      try {
        const nominatimQuery = `${via.bairro}, ${via.localidade}, ${via.uf}, Brazil`;
        console.log(`🌐 Tentando Nominatim Strategy 1: ${nominatimQuery}`);
        const nominatim1 = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nominatimQuery)}&limit=1`,
          { headers: { 'User-Agent': 'Steula-App' } }
        ).then((r) => r.json());
        
        if (nominatim1 && nominatim1.length > 0) {
          console.log(`✓ Nominatim encontrou (Strategy 1): ${nominatim1[0].display_name}`);
          return {
            lat: parseFloat(nominatim1[0].lat),
            lng: parseFloat(nominatim1[0].lon),
            city: via.localidade,
            state: via.uf,
          };
        }
      } catch (err) {
        console.warn('Nominatim Strategy 1 falhou:', err);
      }

      // Strategy 2: Nominatim com localidade + estado apenas
      try {
        const nominatimQuery2 = `${via.localidade}, ${via.uf}, Brazil`;
        console.log(`🌐 Tentando Nominatim Strategy 2: ${nominatimQuery2}`);
        const nominatim2 = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nominatimQuery2)}&limit=1`,
          { headers: { 'User-Agent': 'Steula-App' } }
        ).then((r) => r.json());
        
        if (nominatim2 && nominatim2.length > 0) {
          console.log(`✓ Nominatim encontrou (Strategy 2): ${nominatim2[0].display_name}`);
          return {
            lat: parseFloat(nominatim2[0].lat),
            lng: parseFloat(nominatim2[0].lon),
            city: via.localidade,
            state: via.uf,
          };
        }
      } catch (err) {
        console.warn('Nominatim Strategy 2 falhou:', err);
      }

      // Strategy 3: Open-Meteo com countryCode
      try {
        const openMeteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(via.localidade)}&state=${encodeURIComponent(via.uf)}&countryCode=BR&count=1&language=pt&format=json`;
        console.log(`🌐 Tentando Open-Meteo: ${openMeteoUrl}`);
        
        const geo = await fetch(openMeteoUrl).then((r) => r.json());
        console.log(`Open-Meteo resposta:`, geo);
        
        if (geo && geo.results && geo.results.length > 0) {
          const result = geo.results[0];
          console.log(`✓ Open-Meteo encontrou: ${result.name}, ${result.admin1}, ${result.country}`);
          return {
            lat: result.latitude,
            lng: result.longitude,
            city: via.localidade,
            state: via.uf,
          };
        }
      } catch (err) {
        console.warn('Open-Meteo Strategy falhou:', err);
      }

      // Fallback failed
      console.error('❌ Todas as estratégias falharam para:', via);
      return null;
    } catch (err) {
      console.error('❌ Erro ao geocodificar CEP:', err);
      return null;
    }
  }

  function setupCepTracking() {
    document.addEventListener('submit', async (ev) => {
      const form = ev.target;
      if (!(form instanceof HTMLFormElement)) return;
      const input = form.querySelector('#cep');
      if (!input) return;

      if (!String(input.value || '').trim()) return;

      const coords = await geocodeCep(input.value);
      state.lastCep = input.value;
      state.cepCoords = coords;
      state.cepMeta = coords
        ? { city: coords.city || '', state: coords.state || '' }
        : null;

      if (coords) {
        const nearestMarker = findNearestRepresentativeMarker(coords);
        if (nearestMarker) {
          const nearestName = markerName(nearestMarker);
          if (nearestName) {
            state.selectedName = nearestName;
            setRepresentativeFilterByName(nearestName);
          }
          state.selectionSource = 'list';
          state.selectedMarker = nearestMarker;
          state.selectedLatLng = nearestMarker.getLatLng();
        }
      }

      drawSelection();
    });
  }

  function selectRepresentativeByName(name) {
    if (!name) return;
    const marker = findMarkerByName(name);
    if (!marker) return;

    setRepresentativeFilterByName(name);
    state.selectedName = name;
    state.selectionSource = 'list';
    state.selectedMarker = marker;
    state.selectedLatLng = marker.getLatLng();
    drawSelection();
  }

  function tryRestoreLastGeocode() {
    if (state.lastGeoRestoreAttempted) return;

    const stored = readStoredLastGeo();
    if (!stored) {
      state.lastGeoRestoreAttempted = true;
      return;
    }

    const map = getMap();
    const input = document.querySelector('#cep');
    if (!map || !(input instanceof HTMLInputElement)) return;

    state.lastGeoRestoreAttempted = true;
    state.lastCep = stored.cep || '';
    state.cepCoords = stored.cepCoords || null;
    state.selectedName = stored.selectedName || null;
    state.selectedMarker = null;
    state.selectedLatLng = stored.selectedLatLng || null;

    if (stored.cep) {
      input.value = stored.cep;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (stored.selectedName) {
      setRepresentativeFilterByName(stored.selectedName);
    }

    drawSelection();
  }

  function setupRepresentativeNameClicks() {
    document.addEventListener('click', (ev) => {
      const target = ev.target;
      if (!target || !target.closest) return;

      const row = target.closest('.space-y-1\\.5.text-xs > div');
      if (row) {
        const nameEl = row.querySelector('span.ml-2.text-foreground');
        if (!nameEl) return;
        const name = (nameEl.textContent || '').trim();
        selectRepresentativeByName(name);
        return;
      }

      const primaryNameEl = target.closest('p.text-lg.font-bold.text-foreground');
      if (primaryNameEl) {
        const name = (primaryNameEl.textContent || '').trim();
        selectRepresentativeByName(name);
      }
    });
  }

  function readStoredCsv() {
    try {
      const raw = localStorage.getItem(CSV_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.text !== 'string' || !parsed.text.trim()) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function writeStoredCsv(name, text) {
    try {
      localStorage.setItem(
        CSV_STORAGE_KEY,
        JSON.stringify({
          name: name || 'representantes.csv',
          text,
          savedAt: Date.now(),
        })
      );
    } catch {
      // ignore storage failures
    }
  }

  function setupCsvPersistence() {
    if (state.csvHookInstalled) return;
    state.csvHookInstalled = true;

    document.addEventListener('change', (ev) => {
      const input = ev.target;
      if (!(input instanceof HTMLInputElement)) return;
      if (input.type !== 'file') return;

      const file = input.files && input.files[0];
      if (!file) return;
      if (!/\.csv$/i.test(file.name)) return;

      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === 'string' ? reader.result : '';
        if (!text.trim()) return;
        writeStoredCsv(file.name, text);
      };
      reader.readAsText(file, 'utf-8');
    });
  }

  function tryRestoreCsv() {
    if (state.csvRestoreAttempted) return;
    const stored = readStoredCsv();
    if (!stored) {
      state.csvRestoreAttempted = true;
      return;
    }

    const input = document.querySelector('input[type="file"][accept*=".csv"]');
    if (!(input instanceof HTMLInputElement)) return;

    try {
      const file = new File([stored.text], stored.name || 'representantes.csv', {
        type: 'text/csv',
      });
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      state.csvRestoreAttempted = true;
    } catch {
      state.csvRestoreAttempted = true;
    }
  }

  function boot() {
    installLeafletMapCapture();
    installOpenMeteoFallbackPatch();
    hookMarkerClicks();
    injectClickableCursorStyles();
    injectLayoutTweaksStyles();
    setupLeftMenuScroll();
    hideCoverageSection();
    setupCsvPersistence();
    tryRestoreCsv();
    tryRestoreLastGeocode();
  }

  setupCepTracking();
  setupRepresentativeNameClicks();

  setInterval(boot, 1200);
})();

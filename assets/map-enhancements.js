(function () {
  const CSV_STORAGE_KEY = 'steula:uploaded-csv';
  const LAST_GEO_STORAGE_KEY = 'steula:last-geocode';

  const state = {
    map: null,
    cepCoords: null,
    selectedLatLng: null,
    selectedName: null,
    highlightLayer: null,
    lineLayer: null,
    cepMarkerLayer: null,
    selectionSource: null,
    markerHooksDone: false,
    csvHookInstalled: false,
    csvRestoreAttempted: false,
    lastGeoRestoreAttempted: false,
    layoutStyleInjected: false,
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

  function drawSelection() {
    const map = getMap();
    if (!map) return;

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

  function findMarkerByName(name) {
    const map = getMap();
    if (!map || !name) return null;
    let found = null;
    map.eachLayer((layer) => {
      if (found) return;
      if (!(layer instanceof window.L.Marker)) return;
      const n = markerName(layer);
      if (n && n.toLowerCase() === name.toLowerCase()) {
        found = layer;
      }
    });
    return found;
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

      const query = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(via.localidade)}&state=${encodeURIComponent(via.uf)}&countryCode=BR&count=1&language=pt&format=json`;
      console.log(`🌐 Open-Meteo URL: ${query}`);
      
      const geo = await fetch(query).then((r) => r.json());
      
      if (!geo) {
        console.error('❌ Open-Meteo retornou null');
        return null;
      }
      
      if (!geo.results || !geo.results.length) {
        console.error('❌ Open-Meteo retornou array vazio para:', via.localidade, via.uf, 'Resposta:', geo);
        return null;
      }
      
      const result = geo.results[0];
      console.log(`✓ Open-Meteo encontrou: ${result.name}, ${result.admin1}, ${result.country}`);
      return { lat: result.latitude, lng: result.longitude };
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

      const coords = await geocodeCep(input.value);
      state.lastCep = input.value;
      state.cepCoords = coords;
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

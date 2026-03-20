import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Representative } from '@/types/representative';
import { ZONE_COLORS } from '@/lib/geo-utils';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface CoverageMapProps {
  representatives: Representative[];
}

export function CoverageMap({ representatives }: CoverageMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([-14.235, -51.9253], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapInstanceRef.current);

      // Fix map size after mount
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }

    const map = mapInstanceRef.current;

    // Clear existing layers (except tile layer)
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const repsWithCoords = representatives.filter(r => r.lat != null && r.lng != null);

    for (const rep of repsWithCoords) {
      const pos: L.LatLngExpression = [rep.lat!, rep.lng!];

      // Zona de Abandono > 300km
      L.circle(pos, {
        radius: 300000,
        color: ZONE_COLORS.abandono,
        fillColor: ZONE_COLORS.abandono,
        fillOpacity: 0.06,
        weight: 1,
      }).addTo(map);

      // Atendimento Híbrido 150-300km  
      L.circle(pos, {
        radius: 300000,
        color: ZONE_COLORS.hibrido,
        fillColor: ZONE_COLORS.hibrido,
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(map);

      // Atendimento Presencial ≤ 150km
      L.circle(pos, {
        radius: 150000,
        color: ZONE_COLORS.presencial,
        fillColor: ZONE_COLORS.presencial,
        fillOpacity: 0.18,
        weight: 1.5,
      }).addTo(map);

      // Marker
      const marker = L.marker(pos).addTo(map);
      marker.bindPopup(`
        <div style="font-size:13px;">
          <strong>${rep.nome}</strong><br/>
          <span style="color:#666;">${rep.cidade}, ${rep.estado}</span><br/>
          ${rep.telefone ? `📞 ${rep.telefone}<br/>` : ''}
          ${rep.email ? `✉️ ${rep.email}<br/>` : ''}
          ${rep.observacoes ? `<em style="font-size:11px;">${rep.observacoes.split('|')[0].trim()}</em>` : ''}
        </div>
      `);
    }

    return () => {};
  }, [representatives]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} className="h-full w-full rounded-lg" />;
}

import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
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
  const repsWithCoords = representatives.filter(r => r.lat != null && r.lng != null);

  return (
    <MapContainer
      center={[-14.235, -51.9253]}
      zoom={4}
      className="h-full w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {repsWithCoords.map((rep) => (
        <RepresentativeMarker key={rep.codigo} rep={rep} />
      ))}
    </MapContainer>
  );
}

function RepresentativeMarker({ rep }: { rep: Representative }) {
  if (rep.lat == null || rep.lng == null) return null;
  const pos: [number, number] = [rep.lat, rep.lng];

  return (
    <>
      {/* Zona de Abandono > 300km */}
      <Circle
        center={pos}
        radius={300000}
        pathOptions={{ color: ZONE_COLORS.abandono, fillColor: ZONE_COLORS.abandono, fillOpacity: 0.06, weight: 1 }}
      />
      {/* Atendimento Híbrido 150-300km */}
      <Circle
        center={pos}
        radius={300000}
        pathOptions={{ color: ZONE_COLORS.hibrido, fillColor: ZONE_COLORS.hibrido, fillOpacity: 0.1, weight: 1 }}
      />
      {/* Atendimento Presencial ≤ 150km */}
      <Circle
        center={pos}
        radius={150000}
        pathOptions={{ color: ZONE_COLORS.presencial, fillColor: ZONE_COLORS.presencial, fillOpacity: 0.18, weight: 1.5 }}
      />
      <Marker position={pos}>
        <Popup>
          <div className="space-y-1 text-sm">
            <p className="font-semibold">{rep.nome}</p>
            <p className="text-muted-foreground">{rep.cidade}, {rep.estado}</p>
            {rep.telefone && <p>📞 {rep.telefone}</p>}
            {rep.email && <p>✉️ {rep.email}</p>}
            {rep.observacoes && <p className="italic text-xs">{rep.observacoes}</p>}
          </div>
        </Popup>
      </Marker>
    </>
  );
}

import type { CoverageZone } from '@/types/representative';

// Haversine formula to calculate distance between two points
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getZone(distanceKm: number): CoverageZone {
  if (distanceKm <= 150) return 'presencial';
  if (distanceKm <= 300) return 'possivel_tlv';
  return 'abandono';
}

export const ZONE_COLORS: Record<CoverageZone, string> = {
  presencial: '#22c55e',
  possivel_tlv: '#f59e0b',
  abandono: '#ef4444',
};

export const ZONE_LABELS: Record<CoverageZone, string> = {
  presencial: 'Atendimento Presencial (≤ 150 km)',
  possivel_tlv: 'Atendimento Possível TLV (151–300 km)',
  abandono: 'Zona de Abandono (> 300 km)',
};

// Major Brazilian state capitals with coordinates for coverage calculation
export const BRAZIL_CAPITALS: { cidade: string; estado: string; lat: number; lng: number }[] = [
  { cidade: 'São Paulo', estado: 'SP', lat: -23.5505, lng: -46.6333 },
  { cidade: 'Rio de Janeiro', estado: 'RJ', lat: -22.9068, lng: -43.1729 },
  { cidade: 'Belo Horizonte', estado: 'MG', lat: -19.9167, lng: -43.9345 },
  { cidade: 'Salvador', estado: 'BA', lat: -12.9714, lng: -38.5124 },
  { cidade: 'Brasília', estado: 'DF', lat: -15.7801, lng: -47.9292 },
  { cidade: 'Curitiba', estado: 'PR', lat: -25.4284, lng: -49.2733 },
  { cidade: 'Fortaleza', estado: 'CE', lat: -3.7172, lng: -38.5433 },
  { cidade: 'Manaus', estado: 'AM', lat: -3.1190, lng: -60.0217 },
  { cidade: 'Recife', estado: 'PE', lat: -8.0476, lng: -34.8770 },
  { cidade: 'Porto Alegre', estado: 'RS', lat: -30.0346, lng: -51.2177 },
  { cidade: 'Belém', estado: 'PA', lat: -1.4558, lng: -48.5024 },
  { cidade: 'Goiânia', estado: 'GO', lat: -16.6869, lng: -49.2648 },
  { cidade: 'Guarulhos', estado: 'SP', lat: -23.4543, lng: -46.5337 },
  { cidade: 'Campinas', estado: 'SP', lat: -22.9099, lng: -47.0626 },
  { cidade: 'São Luís', estado: 'MA', lat: -2.5297, lng: -44.2825 },
  { cidade: 'Maceió', estado: 'AL', lat: -9.6658, lng: -35.7353 },
  { cidade: 'Campo Grande', estado: 'MS', lat: -20.4697, lng: -54.6201 },
  { cidade: 'Teresina', estado: 'PI', lat: -5.0892, lng: -42.8019 },
  { cidade: 'João Pessoa', estado: 'PB', lat: -7.1195, lng: -34.8450 },
  { cidade: 'Natal', estado: 'RN', lat: -5.7945, lng: -35.2110 },
  { cidade: 'Cuiabá', estado: 'MT', lat: -15.5960, lng: -56.0969 },
  { cidade: 'Aracaju', estado: 'SE', lat: -10.9091, lng: -37.0677 },
  { cidade: 'Florianópolis', estado: 'SC', lat: -27.5954, lng: -48.5480 },
  { cidade: 'Vitória', estado: 'ES', lat: -20.3155, lng: -40.3128 },
  { cidade: 'Porto Velho', estado: 'RO', lat: -8.7612, lng: -63.9004 },
  { cidade: 'Macapá', estado: 'AP', lat: 0.0349, lng: -51.0694 },
  { cidade: 'Rio Branco', estado: 'AC', lat: -9.9754, lng: -67.8249 },
  { cidade: 'Boa Vista', estado: 'RR', lat: 2.8195, lng: -60.6714 },
  { cidade: 'Palmas', estado: 'TO', lat: -10.1689, lng: -48.3317 },
];

export const BRAZIL_STATES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
  'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

// Simple geocoding based on known cities, fallback to state capital
export function geocodeFromCity(cidade: string, estado: string): { lat: number; lng: number } | null {
  const capital = BRAZIL_CAPITALS.find(
    c => c.estado === estado.toUpperCase() || 
         c.cidade.toLowerCase() === cidade.toLowerCase()
  );
  return capital ? { lat: capital.lat, lng: capital.lng } : null;
}

// Cache for representative geocoding to avoid repeated API calls
const repGeoCache: Record<string, { lat: number; lng: number } | null> = {};

/**
 * Geocode a representative using their full address
 * Uses Nominatim as primary, Open-Meteo as fallback
 */
export async function geocodeRepresentative(
  rua?: string,
  bairro?: string,
  cidade?: string,
  estado?: string
): Promise<{ lat: number; lng: number } | null> {
  // Build cache key
  const cacheKey = `${rua || ''}-${bairro || ''}-${cidade || ''}-${estado || ''}`;
  if (repGeoCache[cacheKey]) {
    return repGeoCache[cacheKey];
  }

  try {
    // Build address progressively more specific
    // Strategy 1: Full address with street, neighborhood, city, state
    if (rua && bairro && cidade && estado) {
      const fullAddress = `${rua}, ${bairro}, ${cidade}, ${estado}, Brazil`;
      const result = await tryNominatimGeocode(fullAddress);
      if (result) {
        repGeoCache[cacheKey] = result;
        console.log(`Geocoded: ${fullAddress}`, result);
        return result;
      }
    }

    // Strategy 2: Neighborhood + city + state
    if (bairro && cidade && estado) {
      const address = `${bairro}, ${cidade}, ${estado}, Brazil`;
      const result = await tryNominatimGeocode(address);
      if (result) {
        repGeoCache[cacheKey] = result;
        console.log(`Geocoded: ${address}`, result);
        return result;
      }
    }

    // Strategy 3: City + state via Open-Meteo (more reliable for Brazilian cities)
    if (cidade && estado) {
      const result = await tryOpenMeteoGeocode(cidade, estado);
      if (result) {
        repGeoCache[cacheKey] = result;
        console.log(`Geocoded (Open-Meteo): ${cidade}, ${estado}`, result);
        return result;
      }
    }

    repGeoCache[cacheKey] = null;
    return null;
  } catch (error) {
    console.error(`Error geocoding ${cacheKey}:`, error);
    repGeoCache[cacheKey] = null;
    return null;
  }
}

async function tryNominatimGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Steula-App' }
    });
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Nominatim error:', error);
    return null;
  }
}

async function tryOpenMeteoGeocode(cidade: string, estado: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&state=${encodeURIComponent(estado)}&country=Brazil&count=1&language=pt&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lng: data.results[0].longitude
      };
    }
    return null;
  } catch (error) {
    console.error('Open-Meteo error:', error);
    return null;
  }
}

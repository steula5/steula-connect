/**
 * Cache de CEPs já buscados para evitar requisições repetidas
 */
const cepCache: Record<string, { lat: number; lng: number } | null> = {};

/**
 * Fetches coordinates (latitude and longitude) for a given CEP using viaCEP API
 * Uses Nominatim (OpenStreetMap) for more accurate geocoding with address details
 */
export async function getCoordenatesByCEP(cep: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Remove formatting from CEP
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    // Check cache first
    if (cepCache[cleanCEP]) {
      return cepCache[cleanCEP];
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    // Strategy 1: Try Nominatim with city + state and district (bairro)
    // This is more reliable for Brazilian cities/neighborhoods
    let queryAddress = `${data.bairro}, ${data.localidade}, ${data.uf}, Brazil`;
    let nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      queryAddress
    )}&limit=1`;

    let nominatimResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Steula-App'
      }
    });
    
    let nominatimData = await nominatimResponse.json();

    if (nominatimData && nominatimData.length > 0) {
      const result = nominatimData[0];
      const coords = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
      console.log(`Geocoding encontrado (bairro+cidade+estado): ${queryAddress}`, coords);
      cepCache[cleanCEP] = coords;
      return coords;
    }

    // Strategy 2: Try Nominatim with just city + state
    queryAddress = `${data.localidade}, ${data.uf}, Brazil`;
    nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      queryAddress
    )}&limit=1`;

    nominatimResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Steula-App'
      }
    });
    
    nominatimData = await nominatimResponse.json();

    if (nominatimData && nominatimData.length > 0) {
      const result = nominatimData[0];
      const coords = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
      console.log(`Geocoding encontrado (cidade+estado): ${queryAddress}`, coords);
      cepCache[cleanCEP] = coords;
      return coords;
    }

    // Strategy 3: Fallback to Open-Meteo (city + state)
    const geocodingResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        data.localidade
      )}&state=${encodeURIComponent(data.uf)}&country=Brazil&count=1&language=pt&format=json`
    );
    
    const geocodingData = await geocodingResponse.json();

    if (geocodingData.results && geocodingData.results.length > 0) {
      const result = geocodingData.results[0];
      const coords = {
        lat: result.latitude,
        lng: result.longitude,
      };
      console.log(`Geocoding encontrado (Open-Meteo): ${data.localidade}, ${data.uf}`, coords);
      cepCache[cleanCEP] = coords;
      return coords;
    }

    // No coordinates found
    cepCache[cleanCEP] = null;
    return null;
  } catch (error) {
    console.error('Erro ao buscar coordenadas do CEP:', error);
    return null;
  }
}

/**
 * Fetches address information from a CEP
 */
export async function getAddressByCEP(cep: string): Promise<{
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
} | null> {
  try {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();

    if (data.erro) {
      return null;
    }

    return {
      logradouro: data.logradouro,
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf,
    };
  } catch (error) {
    console.error('Erro ao buscar endereço pelo CEP:', error);
    return null;
  }
}

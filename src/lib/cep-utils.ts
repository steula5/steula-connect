/**
 * Cache de CEPs já buscados para evitar requisições repetidas
 */
const cepCache: Record<string, { lat: number; lng: number } | null> = {};

/**
 * Fetches coordinates (latitude and longitude) for a given CEP using viaCEP API
 * Uses multiple geocoding strategies with fallbacks
 */
export async function getCoordenatesByCEP(cep: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Remove formatting from CEP
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    // Check cache first
    if (cleanCEP in cepCache) {
      return cepCache[cleanCEP];
    }

    let addressData;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      addressData = await response.json();

      if (addressData.erro) {
        throw new Error('CEP não encontrado');
      }
    } catch (err) {
      console.error('Erro ao buscar dados do CEP via viaCEP:', err);
      return null;
    }

    // Strategy 1: Open-Meteo (more reliable in browser due CORS compatibility)
    try {
      const geocodingResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          addressData.localidade
        )}&state=${encodeURIComponent(addressData.uf)}&country=Brazil&count=1&language=pt&format=json`
      );
      
      if (geocodingResponse.ok) {
        const geocodingData = await geocodingResponse.json();

        if (geocodingData.results && geocodingData.results.length > 0) {
          const result = geocodingData.results[0];
          const coords = {
            lat: result.latitude,
            lng: result.longitude,
          };
          console.log(`✓ Geocoding encontrado (Open-Meteo): ${addressData.localidade}, ${addressData.uf}`, coords);
          cepCache[cleanCEP] = coords;
          return coords;
        }
      }
    } catch (err) {
      console.warn('Open-Meteo Strategy falhou:', err);
    }

    // Do not fallback to state centroids, they create very inaccurate distances.
    console.error('Todas as estratégias de geocoding falharam para:', addressData);
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

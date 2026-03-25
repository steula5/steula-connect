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

    // Strategy 2: Fallback - approximate center of the state
    const estadoCentroids: Record<string, { lat: number; lng: number }> = {
      'AC': { lat: -9.0192, lng: -67.7964 },
      'AL': { lat: -9.5140, lng: -36.8214 },
      'AP': { lat: 1.4104, lng: -52.7641 },
      'AM': { lat: -3.4168, lng: -65.1095 },
      'BA': { lat: -12.9822, lng: -38.5104 },
      'CE': { lat: -3.7319, lng: -38.5267 },
      'DF': { lat: -15.7942, lng: -47.8822 },
      'ES': { lat: -20.3155, lng: -40.3128 },
      'GO': { lat: -15.8267, lng: -49.8501 },
      'MA': { lat: -2.9053, lng: -45.3244 },
      'MT': { lat: -12.6819, lng: -56.9211 },
      'MS': { lat: -20.7722, lng: -54.5591 },
      'MG': { lat: -18.8860, lng: -45.2944 },
      'PA': { lat: -5.5295, lng: -52.9295 },
      'PB': { lat: -7.0790, lng: -35.7597 },
      'PR': { lat: -24.5951, lng: -51.4779 },
      'PE': { lat: -8.2880, lng: -35.2975 },
      'PI': { lat: -6.1609, lng: -41.7084 },
      'RJ': { lat: -22.8068, lng: -43.1729 },
      'RN': { lat: -5.7942, lng: -35.2093 },
      'RS': { lat: -30.0346, lng: -51.4619 },
      'RO': { lat: -8.7616, lng: -63.9002 },
      'RR': { lat: 2.8235, lng: -60.6758 },
      'SC': { lat: -27.5954, lng: -49.0451 },
      'SP': { lat: -21.7629, lng: -48.5514 },
      'SE': { lat: -10.5095, lng: -37.0051 },
      'TO': { lat: -10.1753, lng: -48.2982 }
    };

    const stateCentroid = estadoCentroids[addressData.uf];
    if (stateCentroid) {
      console.log(`⚠ Usando centroide do estado: ${addressData.uf}`, stateCentroid);
      cepCache[cleanCEP] = stateCentroid;
      return stateCentroid;
    }

    // No coordinates found
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

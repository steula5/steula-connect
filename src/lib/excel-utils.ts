import * as XLSX from 'xlsx';
import type { Representative } from '@/types/representative';
import { geocodeRepresentative } from '@/lib/geo-utils';

export async function readExcelRepresentatives(file: File): Promise<Representative[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        if (!worksheet) {
          reject(new Error('Nenhuma planilha encontrada'));
          return;
        }

        const rows = XLSX.utils.sheet_to_json(worksheet);

        interface TempRep extends Representative {
          _needsGeocoding?: boolean;
        }

        const representatives: TempRep[] = rows
          .map((row: any) => {
            // Map Excel columns to Representative interface
            const latStr = row.lat || row['Latitude'] || row['Lat'] || row['latitude'];
            const lngStr = row.lng || row['Longitude'] || row['Lng'] || row['Long'] || row['longitude'];
            const latNum = latStr ? parseFloat(String(latStr)) : undefined;
            const lngNum = lngStr ? parseFloat(String(lngStr)) : undefined;
            
            const rep: TempRep = {
              codigo: String(row.codigo || row['Código'] || '').trim(),
              nome: String(row.nome || row['Nome'] || row['name'] || '').trim(),
              rua: String(row.rua || row['Rua'] || row['Endereço'] || '').trim(),
              bairro: String(row.bairro || row['Bairro'] || '').trim(),
              cidade: String(row.cidade || row['Cidade'] || '').trim(),
              estado: String(row.estado || row['Estado'] || row['UF'] || '').trim().toUpperCase(),
              cep: String(row.cep || row['CEP'] || row['Cep'] || '').trim(),
              telefone: String(row.telefone || row['Telefone'] || row['Tel'] || '').trim(),
              email: String(row.email || row['Email'] || row['E-mail'] || '').trim(),
              observacoes: String(row.observacoes || row['Observações'] || row['Obs'] || '').trim(),
              lat: (latNum && !isNaN(latNum)) ? latNum : undefined,
              lng: (lngNum && !isNaN(lngNum)) ? lngNum : undefined,
              _needsGeocoding: !(latNum && !isNaN(latNum)) || !(lngNum && !isNaN(lngNum)),
            };

            // Filter out empty entries
            return rep.codigo && rep.nome ? rep : null;
          })
          .filter(Boolean) as TempRep[];

        // Geocode representatives that don't have coordinates
        const repsNeedingGeocode = representatives.filter(r => r._needsGeocoding);
        
        if (repsNeedingGeocode.length > 0) {
          console.log(`Geocodificando ${repsNeedingGeocode.length} representantes do Excel...`);
          
          for (const rep of repsNeedingGeocode) {
            const coords = await geocodeRepresentative(
              rep.rua,
              rep.bairro,
              rep.cidade,
              rep.estado
            );
            if (coords) {
              rep.lat = coords.lat;
              rep.lng = coords.lng;
            }
            // Add small delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Clean up temporary fields
        const cleanReps = representatives.map(({ _needsGeocoding, ...rep }) => rep) as Representative[];

        resolve(cleanReps);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Calculates the distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest representative to given coordinates
 */
export function findNearestRepresentative(
  representatives: Representative[],
  latitude: number,
  longitude: number
): Representative | null {
  if (!representatives.length) return null;

  let nearest = representatives[0];
  let minDistance = Infinity;

  representatives.forEach((rep) => {
    if (rep.lat !== undefined && rep.lng !== undefined) {
      const distance = calculateDistance(latitude, longitude, rep.lat, rep.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = rep;
      }
    }
  });

  return minDistance !== Infinity ? nearest : null;
}

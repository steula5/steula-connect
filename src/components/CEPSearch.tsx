import { useState } from 'react';
import { MapPin, Loader2, AlertCircle, Phone, Mail, MapPinIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Representative } from '@/types/representative';
import { getCoordenatesByCEP, getAddressByCEP } from '@/lib/cep-utils';
import { findNearestRepresentative, calculateDistance } from '@/lib/excel-utils';

interface CEPSearchProps {
  representatives: Representative[];
}

export function CEPSearch({ representatives }: CEPSearchProps) {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearestRep, setNearestRep] = useState<(Representative & { distance: number }) | null>(null);
  const [nearbyReps, setNearbyReps] = useState<Array<Representative & { distance: number }>>([]);
  const [addressInfo, setAddressInfo] = useState<{
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
  } | null>(null);
  const [cepCoords, setCepCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNearestRep(null);
    setNearbyReps([]);
    setAddressInfo(null);
    setCepCoords(null);

    if (!cep.trim()) {
      setError('Digite um CEP para buscar');
      return;
    }

    setLoading(true);
    try {
      // Get address info
      const address = await getAddressByCEP(cep);
      if (!address) {
        setError('CEP não encontrado. Verifique e tente novamente.');
        setLoading(false);
        return;
      }

      setAddressInfo(address);

      // Get coordinates
      const coords = await getCoordenatesByCEP(cep);
      if (!coords) {
        setError('Não foi possível obter as coordenadas do CEP. Verifique se o CEP está correto.');
        setLoading(false);
        return;
      }

      setCepCoords(coords);
      console.log('CEP:', cep);
      console.log('Endereço:', address);
      console.log('Coordenadas do CEP:', coords);

      // Find all representatives with distances
      const repsWithValidCoords = representatives.filter(
        (r) => r.lat !== undefined && r.lng !== undefined
      );

      if (!repsWithValidCoords.length) {
        setError('Nenhum representante com coordenadas disponíveis para cálculo de distância.');
        setLoading(false);
        return;
      }

      const repsWithDistance = repsWithValidCoords.map((rep) => ({
        ...rep,
        distance: Math.round(calculateDistance(coords.lat, coords.lng, rep.lat!, rep.lng!) * 10) / 10,
      }));

      // Sort by distance
      repsWithDistance.sort((a, b) => a.distance - b.distance);

      // Log distances for debugging
      console.log('Distâncias calculadas (top 5):');
      repsWithDistance.slice(0, 5).forEach(({ nome, cidade, estado, distance }) => {
        console.log(`  ${nome} (${cidade}, ${estado}): ${distance} km`);
      });

      setNearestRep(repsWithDistance[0]);
      setNearbyReps(repsWithDistance.slice(0, 5)); // Show top 5
    } catch (err) {
      console.error('Erro na busca:', err);
      setError(
        err instanceof Error ? err.message : 'Erro ao processar a busca.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) {
      return cleaned;
    }
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Buscar por CEP
          </CardTitle>
          <CardDescription>
            Digite o CEP do cliente para encontrar o representante mais próximo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="cep" className="text-sm font-medium">
                CEP
              </label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(formatCEP(e.target.value))}
                maxLength={9}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !representatives.length}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <MapPinIcon className="mr-2 h-4 w-4" />
                  Buscar Representante
                </>
              )}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {addressInfo && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium text-foreground">
                  {addressInfo.logradouro}
                </p>
                <p className="text-muted-foreground">
                  {addressInfo.bairro}
                </p>
                <p className="text-muted-foreground">
                  {addressInfo.localidade}, {addressInfo.uf}
                </p>
              </div>

              {nearestRep && (
                <div className="space-y-3 rounded-lg border bg-card p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-primary">
                      Representante Mais Próximo
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {nearestRep.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Código: {nearestRep.codigo}
                    </p>
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">
                          {nearestRep.rua}
                        </p>
                        <p className="text-muted-foreground">
                          {nearestRep.bairro}
                        </p>
                        <p className="text-muted-foreground">
                          {nearestRep.cidade}, {nearestRep.estado} {nearestRep.cep}
                        </p>
                      </div>
                    </div>

                    {nearestRep.telefone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${nearestRep.telefone}`}
                          className="text-primary hover:underline"
                        >
                          {nearestRep.telefone}
                        </a>
                      </div>
                    )}

                    {nearestRep.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${nearestRep.email}`}
                          className="text-primary hover:underline"
                        >
                          {nearestRep.email}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>Distância: {nearestRep.distance} km</span>
                    </div>
                  </div>

                  {nearestRep.observacoes && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Observações
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {nearestRep.observacoes}
                      </p>
                    </div>
                  )}

                  {/* Top 5 Nearby Representatives */}
                  {nearbyReps.length > 1 && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-semibold text-blue-900">
                        📍 Representantes Próximos (Top 5)
                      </p>
                      <div className="space-y-1.5 text-xs">
                        {nearbyReps.map((rep, idx) => (
                          <div key={rep.codigo} className="flex items-center justify-between rounded bg-muted p-2">
                            <div>
                              <span className="font-medium text-foreground">#{idx + 1}</span>
                              <span className="ml-2 text-foreground">{rep.nome}</span>
                              <span className="ml-1 text-muted-foreground">({rep.cidade}, {rep.estado})</span>
                            </div>
                            <span className={`font-semibold ${
                              rep.distance <= 150 ? 'text-green-600' :
                              rep.distance <= 300 ? 'text-amber-600' :
                              'text-red-600'
                            }`}>
                              {rep.distance} km
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

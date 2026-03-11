import { Injectable } from '@nestjs/common';

type Coordinates = { latitude: number; longitude: number };

const DEFAULT_RENNES: Coordinates = { latitude: 48.1173, longitude: -1.6778 };

const CITY_COORDS: Record<string, Coordinates> = {
  rennes: { latitude: 48.1173, longitude: -1.6778 },
  paris: { latitude: 48.8566, longitude: 2.3522 },
  lyon: { latitude: 45.764, longitude: 4.8357 },
  bordeaux: { latitude: 44.8378, longitude: -0.5792 },
  lille: { latitude: 50.6292, longitude: 3.0573 },
  nantes: { latitude: 47.2184, longitude: -1.5536 },
  angers: { latitude: 47.4784, longitude: -0.5632 },
  laval: { latitude: 48.0717, longitude: -0.7743 },
  'cesson-sevigne': { latitude: 48.1214, longitude: -1.6037 },
  'cesson sévigné': { latitude: 48.1214, longitude: -1.6037 },
  'saint-malo': { latitude: 48.6493, longitude: -2.0257 },
  'saint malo': { latitude: 48.6493, longitude: -2.0257 },
  'saint-gregoire': { latitude: 48.1518, longitude: -1.6867 },
  'saint grégoire': { latitude: 48.1518, longitude: -1.6867 },
  chantepie: { latitude: 48.0909, longitude: -1.6177 },
  'vern-sur-seiche': { latitude: 48.0472, longitude: -1.6006 },
  'vern sur seiche': { latitude: 48.0472, longitude: -1.6006 },
};

@Injectable()
export class LocationService {
  async geocodeAddress(query: string): Promise<Coordinates | null> {
    const normalized = normalizeText(query);
    if (!normalized) return null;

    const token = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (token) {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          normalized,
        )}.json?country=fr&language=fr&limit=1&types=address,place,postcode&proximity=-1.6778,48.1173&access_token=${encodeURIComponent(token)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as {
            features?: Array<{ center?: [number, number] }>;
          };
          const center = data.features?.[0]?.center;
          if (Array.isArray(center) && center.length === 2) {
            return { longitude: center[0], latitude: center[1] };
          }
        }
      } catch {
        // Fallback ci-dessous
      }
    }

    for (const [cityKey, coords] of Object.entries(CITY_COORDS)) {
      if (normalized.includes(cityKey)) return coords;
    }

    return null;
  }

  async geocodeCandidate(input: { city?: string | null; postalCode?: string | null }) {
    const parts = [input.postalCode, input.city, 'France'].filter(Boolean);
    const query = parts.join(', ');
    return this.geocodeAddress(query);
  }

  async geocodeCompany(input: {
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
  }) {
    const parts = [input.address, input.postalCode, input.city, 'France'].filter(Boolean);
    const query = parts.join(', ');
    return this.geocodeAddress(query);
  }

  async geocodeOffer(input: {
    location?: string | null;
    city?: string | null;
    postalCode?: string | null;
  }) {
    const parts = [input.location, input.postalCode, input.city, 'France'].filter(Boolean);
    const query = parts.join(', ');
    return (await this.geocodeAddress(query)) ?? DEFAULT_RENNES;
  }
}

function normalizeText(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

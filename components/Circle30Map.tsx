'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ParsedAIResponse } from '@/types/responses';

interface Circle30MapProps {
  geojsonData?: ParsedAIResponse['geojson'];
}

export default function Circle30Map({ geojsonData }: Circle30MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
  const apiVersion = 1;

  const getLatestStyleVersion = async (): Promise<string> => {
    const versionsUrl = `https://api.tomtom.com/maps/orbis/assets/styles?key=${apiKey}&apiVersion=${apiVersion}`;
    const res = await fetch(versionsUrl);
    const data = await res.json();

    if (!res.ok || !data.versions?.length) {
      throw new Error('No available style versions');
    }

    // Return latest version (usually last in list)
    return data.versions[data.versions.length - 1].version;
  };

  const fetchStyle = async (version: string) => {
    const styleUrl = `https://api.tomtom.com/maps/orbis/assets/styles/${version}/style.json?key=${apiKey}&apiVersion=${apiVersion}&map=basic_street-light`;
    const res = await fetch(styleUrl);
    if (!res.ok) throw new Error('Failed to fetch style JSON');
    return await res.json();
  };

  const addFeaturesToMap = async (geojsonData: ParsedAIResponse['geojson']) => {
    try {
      if (!mapRef.current) {
        console.error('Map instance not initialized');
        return;
      }

      if (!geojsonData) {
        console.error('No GeoJSON data provided');
        return;
      }

      console.log('Processing GeoJSON data:', {
        type: geojsonData.type,
        features: geojsonData.features?.length,
        firstFeature: geojsonData.features?.[0]
      });

      if (!geojsonData.features || !Array.isArray(geojsonData.features)) {
        console.error('Invalid GeoJSON features:', geojsonData);
        return;
      }

      if (geojsonData.features.length === 0) {
        console.log('No features to add to map');
        return;
      }

      // Check if source already exists
      const existingSource = mapRef.current.getSource('zip-codes');
      if (existingSource) {
        console.log('Removing existing source');
        // Remove layers first
        if (mapRef.current.getLayer('zip-codes-fill')) {
          mapRef.current.removeLayer('zip-codes-fill');
        }
        if (mapRef.current.getLayer('zip-codes-outline')) {
          mapRef.current.removeLayer('zip-codes-outline');
        }
        mapRef.current.removeSource('zip-codes');
      }

      // Add new source
      console.log('Adding new source with data');
      mapRef.current.addSource('zip-codes', {
        type: 'geojson',
        data: geojsonData
      });

      // Add fill layer with color scale based on EV count per capita
      console.log('Adding fill layer');
      mapRef.current.addLayer({
        id: 'zip-codes-fill',
        type: 'fill',
        source: 'zip-codes',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'evs_per_capita'],
            0, '#ff0000',    // Bright red for lowest
            0.0001, '#cc0000', // Darker red
            0.0002, '#990000', // Even darker red
            0.0003, '#660000'  // Darkest red
          ],
          'fill-opacity': 0.7
        }
      });

      // Add outline layer
      console.log('Adding outline layer');
      mapRef.current.addLayer({
        id: 'zip-codes-outline',
        type: 'line',
        source: 'zip-codes',
        paint: {
          'line-color': '#000',
          'line-width': 1
        }
      });

      // Add hover effect
      let popup: maplibregl.Popup | null = null;
      let hoverTimeout: NodeJS.Timeout | null = null;

      mapRef.current.on('mouseenter', 'zip-codes-fill', (e) => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }

        hoverTimeout = setTimeout(() => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const zipCode = feature.properties?.ZIP;
            const population = feature.properties?.population;
            const evCount = feature.properties?.ev_poi_count;
            const evPerCapita = feature.properties?.evs_per_capita;
            
            // Remove existing popup if any
            if (popup) {
              popup.remove();
            }
            
            // Create new popup
            popup = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: 10,
              className: 'custom-popup'
            })
              .setLngLat(e.lngLat)
              .setHTML(`
                <div class="p-2 bg-white text-black">
                  <h3 class="font-bold text-lg">ZIP Code ${zipCode}</h3>
                  <p class="text-base">Population: ${population.toLocaleString()}</p>
                  <p class="text-base">EV Charging Stations: ${evCount}</p>
                  <p class="text-base">EV Charging Stations per Capita: ${evPerCapita.toFixed(6)}</p>
                </div>
              `)
              .addTo(mapRef.current!);
          }
        }, 100); // 100ms delay
      });

      mapRef.current.on('mouseleave', 'zip-codes-fill', () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          hoverTimeout = null;
        }
        if (popup) {
          popup.remove();
          popup = null;
        }
      });

      // Change cursor to pointer when hovering over ZIP codes
      mapRef.current.on('mouseenter', 'zip-codes-fill', () => {
        mapRef.current!.getCanvas().style.cursor = 'pointer';
      });

      mapRef.current.on('mouseleave', 'zip-codes-fill', () => {
        mapRef.current!.getCanvas().style.cursor = '';
      });

      // Fit bounds to show all features
      const bounds = new maplibregl.LngLatBounds();
      console.log('Calculating bounds for features:', geojsonData.features.length);
      
      geojsonData.features.forEach((feature, index) => {
        try {
          if (!feature.geometry) {
            console.error(`Feature ${index} has no geometry:`, feature);
            return;
          }
          if (!feature.geometry.coordinates) {
            console.error(`Feature ${index} has no coordinates:`, feature);
            return;
          }
          if (!Array.isArray(feature.geometry.coordinates[0])) {
            console.error(`Feature ${index} has invalid coordinates structure:`, feature);
            return;
          }
          
          const coords = feature.geometry.coordinates[0] as [number, number][];
          console.log(`Processing feature ${index} coordinates:`, {
            featureId: feature.properties?.ZIP,
            coordinateCount: coords.length,
            firstCoord: coords[0]
          });
          
          coords.forEach((coord) => {
            bounds.extend(coord as maplibregl.LngLatLike);
          });
        } catch (error) {
          console.error(`Error processing feature ${index}:`, error);
        }
      });
      
      console.log('Final bounds:', {
        sw: bounds.getSouthWest(),
        ne: bounds.getNorthEast()
      });
      
      mapRef.current.fitBounds(bounds, { padding: 50 });
    } catch (error) {
      console.error('Error in addFeaturesToMap:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        geojsonData: JSON.stringify(geojsonData, null, 2)
      });
      throw error;
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    const loadMap = async () => {
      try {
        const version = await getLatestStyleVersion();
        const style = await fetchStyle(version);

        const map = new maplibregl.Map({
          container: mapContainer.current!,
          style,
          center: [-97.7431, 30.2672], // Default to Austin
          zoom: 12
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        mapRef.current = map;

        // Wait for map to load before adding features
        map.on('load', () => {
          if (geojsonData) {
            addFeaturesToMap(geojsonData);
          }
        });
      } catch (err: any) {
        console.error('Map load error:', err);
        setError(err.message || 'Unknown error loading map.');
      }
    };

    loadMap();

    return () => {
      mapRef.current?.remove();
    };
  }, []); // Initial map load

  // Handle visualization updates
  useEffect(() => {
    const map = mapRef.current;
    if (map && geojsonData) {
      console.log('Map style loaded:', map.isStyleLoaded());
      console.log('Received GeoJSON data in useEffect:', {
        type: geojsonData.type,
        featureCount: geojsonData.features?.length,
        firstFeature: geojsonData.features?.[0],
        mapState: {
          loaded: map.loaded(),
          styleLoaded: map.isStyleLoaded(),
          sources: map.getStyle().sources
        }
      });
      
      if (map.isStyleLoaded()) {
        addFeaturesToMap(geojsonData);
      } else {
        map.once('style.load', () => {
          console.log('Style now loaded, adding features');
          addFeaturesToMap(geojsonData);
        });
      }
    }
  }, [geojsonData]); // Update when visualization changes

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0F172A', position: 'absolute', inset: 0 }}>
      {error && (
        <div className="text-red-400 bg-gray-900 p-4 absolute top-0 left-0 z-50">
          Map error: {error}
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}

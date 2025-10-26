'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ParsedAIResponse, MapActionData } from '@/types/responses';

interface Circle30MapProps {
  geojsonData?: ParsedAIResponse['geojson'];
  mapAction?: MapActionData;
}

export default function Circle30Map({ geojsonData, mapAction }: Circle30MapProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [containerReady, setContainerReady] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
  const apiVersion = 1;

  // Show error if API key is missing
  if (!apiKey) {
    console.error('TomTom API key is missing!');
    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: '#0F172A', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center p-8 bg-gray-800 rounded-lg max-w-md">
          <h3 className="text-xl font-bold text-red-400 mb-4">Map Configuration Required</h3>
          <p className="text-gray-300 mb-4">
            TomTom API key is not configured. Please add <code className="bg-gray-700 px-2 py-1 rounded">NEXT_PUBLIC_TOMTOM_API_KEY</code> to your environment variables.
          </p>
          <p className="text-sm text-gray-400">
            The map will work once the API key is properly configured in Vercel.
          </p>
        </div>
      </div>
    );
  }

  const getLatestStyleVersion = async (): Promise<string> => {
    const versionsUrl = `https://api.tomtom.com/maps/orbis/assets/styles?key=${apiKey}&apiVersion=${apiVersion}`;
    console.log('Fetching TomTom style versions from:', versionsUrl);
    
    try {
      const res = await fetch(versionsUrl);
      console.log('TomTom API response status:', res.status, res.statusText);
      
      const data = await res.json();
      console.log('TomTom API response data:', data);

      if (!res.ok || !data.versions?.length) {
        throw new Error(`TomTom API error: ${res.status} ${res.statusText} - ${JSON.stringify(data)}`);
      }

      // Return latest version (usually last in list)
      const version = data.versions[data.versions.length - 1].version;
      console.log('Using TomTom style version:', version);
      return version;
    } catch (error) {
      console.error('Error fetching TomTom style versions:', error);
      throw error;
    }
  };

  const fetchStyle = async (version: string) => {
    const styleUrl = `https://api.tomtom.com/maps/orbis/assets/styles/${version}/style.json?key=${apiKey}&apiVersion=${apiVersion}&map=basic_street-light`;
    console.log('Fetching TomTom style from:', styleUrl);
    
    try {
      const res = await fetch(styleUrl);
      console.log('TomTom style response status:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`TomTom style fetch failed: ${res.status} ${res.statusText} - ${errorText}`);
      }
      
      const style = await res.json();
      console.log('TomTom style loaded successfully');
      return style;
    } catch (error) {
      console.error('Error fetching TomTom style:', error);
      throw error;
    }
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

  // Handle map centering
  const centerMap = (latitude: number, longitude: number, zoom: number) => {
    console.log('=== CENTER MAP CALLED ===', { latitude, longitude, zoom });
    
    if (!mapRef.current) {
      console.log('Map not ready for centering, waiting...');
      return;
    }
    
    console.log('Centering map:', { latitude, longitude, zoom });
    console.log('Map current center before:', mapRef.current.getCenter());
    console.log('Map current zoom before:', mapRef.current.getZoom());
    
    // Ensure map is fully loaded before centering
    if (mapRef.current.loaded()) {
      console.log('Map is loaded, centering now');
      mapRef.current.setCenter([longitude, latitude]);
      mapRef.current.setZoom(zoom);
      console.log('Map center after:', mapRef.current.getCenter());
      console.log('Map zoom after:', mapRef.current.getZoom());
    } else {
      console.log('Map not loaded yet, waiting for load event');
      // Wait for map to load before centering
      mapRef.current.once('load', () => {
        console.log('Map loaded, now centering');
        mapRef.current!.setCenter([longitude, latitude]);
        mapRef.current!.setZoom(zoom);
        console.log('Map center after load:', mapRef.current!.getCenter());
        console.log('Map zoom after load:', mapRef.current!.getZoom());
      });
    }
  };

  // Handle POI display
  const addPOIs = (pois: any[], showLabels: boolean) => {
    if (!mapRef.current) return;

    console.log('Adding POIs:', pois.length);
    console.log('Raw POI data:', JSON.stringify(pois));

    // Validate and filter POIs with valid coordinates
    const validPOIs = pois.filter((poi, index) => {
      const hasValidLat = typeof poi.lat === 'number' && !isNaN(poi.lat) && poi.lat >= -90 && poi.lat <= 90;
      const hasValidLng = typeof poi.lng === 'number' && !isNaN(poi.lng) && poi.lng >= -180 && poi.lng <= 180;

      if (!hasValidLat || !hasValidLng) {
        console.error(`POI ${index} has invalid coordinates:`, poi);
        return false;
      }
      return true;
    });

    if (validPOIs.length === 0) {
      console.error('No valid POIs to display!');
      return;
    }

    console.log(`Displaying ${validPOIs.length} valid POIs out of ${pois.length}`);

    // Remove existing POI source if it exists
    if (mapRef.current.getSource('pois')) {
      if (mapRef.current.getLayer('pois-circles')) {
        mapRef.current.removeLayer('pois-circles');
      }
      if (mapRef.current.getLayer('pois-labels')) {
        mapRef.current.removeLayer('pois-labels');
      }
      mapRef.current.removeSource('pois');
    }

    // Create GeoJSON for POIs
    const poiGeoJSON = {
      type: 'FeatureCollection' as const,
      features: validPOIs.map((poi, index) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [poi.lng, poi.lat] as [number, number]
        },
        properties: {
          id: index,
          name: poi.name || 'Unknown',
          type: poi.type || 'poi',
          color: poi.color || '#ff6b6b',
          description: poi.description || ''
        }
      }))
    };

    console.log('POI GeoJSON features:', poiGeoJSON.features.length);

    // Add POI source
    mapRef.current.addSource('pois', {
      type: 'geojson',
      data: poiGeoJSON
    });

    // Add POI circles
    mapRef.current.addLayer({
      id: 'pois-circles',
      type: 'circle',
      source: 'pois',
      paint: {
        'circle-color': ['coalesce', ['get', 'color'], '#ff6b6b'],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    // Add POI labels if requested
    if (showLabels) {
      mapRef.current.addLayer({
        id: 'pois-labels',
        type: 'symbol',
        source: 'pois',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-size': 11
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      });
    }

    // Auto-fit map to show all POIs
    if (poiGeoJSON.features.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      poiGeoJSON.features.forEach(feature => {
        const coords = feature.geometry.coordinates as [number, number];
        bounds.extend(coords);
      });
      mapRef.current.fitBounds(bounds, { padding: 100, maxZoom: 15 });
      console.log('Auto-fitted map bounds to show all POIs');
    }
  };

  // Handle route display
  const addRoutes = (routes: any[], showDirections: boolean) => {
    if (!mapRef.current) return;

    console.log('Adding routes:', routes.length);

    routes.forEach((route, index) => {
      const sourceId = `route-${index}`;
      const layerId = `route-line-${index}`;
      
      // Remove existing route if it exists
      if (mapRef.current!.getSource(sourceId)) {
        if (mapRef.current!.getLayer(layerId)) {
          mapRef.current!.removeLayer(layerId);
        }
        mapRef.current!.removeSource(sourceId);
      }

      // Create GeoJSON for route
      const routeGeoJSON = {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: route.coordinates as [number, number][]
        },
        properties: {
          name: route.name || `Route ${index + 1}`,
          color: route.color,
          width: route.width
        }
      };

      // Add route source
      mapRef.current!.addSource(sourceId, {
        type: 'geojson',
        data: routeGeoJSON
      });

      // Add route line
      mapRef.current!.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': route.color,
          'line-width': route.width || 4
        }
      });
    });
  };

  // Handle polygon display
  const addPolygons = (polygons: any[], showLabels: boolean) => {
    if (!mapRef.current) return;

    console.log('Adding polygons:', polygons.length);

    polygons.forEach((polygon, index) => {
      const sourceId = `polygon-${index}`;
      const fillLayerId = `polygon-fill-${index}`;
      const strokeLayerId = `polygon-stroke-${index}`;
      const labelLayerId = `polygon-label-${index}`;
      
      // Remove existing polygon if it exists
      if (mapRef.current!.getSource(sourceId)) {
        if (mapRef.current!.getLayer(fillLayerId)) {
          mapRef.current!.removeLayer(fillLayerId);
        }
        if (mapRef.current!.getLayer(strokeLayerId)) {
          mapRef.current!.removeLayer(strokeLayerId);
        }
        if (mapRef.current!.getLayer(labelLayerId)) {
          mapRef.current!.removeLayer(labelLayerId);
        }
        mapRef.current!.removeSource(sourceId);
      }

      // Create GeoJSON for polygon
      const polygonGeoJSON = {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: polygon.coordinates as [number, number][][]
        },
        properties: {
          name: polygon.name || `Polygon ${index + 1}`,
          fillColor: polygon.fillColor,
          strokeColor: polygon.strokeColor,
          opacity: polygon.opacity
        }
      };

      // Add polygon source
      mapRef.current!.addSource(sourceId, {
        type: 'geojson',
        data: polygonGeoJSON
      });

      // Add polygon fill
      mapRef.current!.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': polygon.fillColor,
          'fill-opacity': polygon.opacity || 0.7
        }
      });

      // Add polygon stroke
      mapRef.current!.addLayer({
        id: strokeLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': polygon.strokeColor,
          'line-width': 2
        }
      });

      // Add polygon labels if requested
      if (showLabels && polygon.name) {
        mapRef.current!.addLayer({
          id: labelLayerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'text-field': polygon.name,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 14
          },
          paint: {
            'text-color': '#000',
            'text-halo-color': '#fff',
            'text-halo-width': 2
          }
        });
      }
    });
  };

  // Callback ref to ensure container is ready
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !mapRef.current) {
      console.log('Container ready, will initialize map');
      // Add a small delay to ensure iframe is fully ready
      setTimeout(() => {
        setContainerReady(true);
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (!containerReady) {
      console.log('Container not ready yet, waiting...');
      return;
    }

    // In ChatGPT iframe, wait for mapAction before initializing map
    if (window !== window.top && !mapAction) {
      console.log('In iframe environment, waiting for mapAction before initializing map...');
      return;
    }

    const loadMap = async () => {
      try {
        console.log('Starting map load process...');
        
        // Wait for iframe to be fully ready (ChatGPT environment)
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const version = await getLatestStyleVersion();
        const style = await fetchStyle(version);

        // Find the container element with multiple fallback strategies
        let container = document.querySelector('[data-map-container]') as HTMLDivElement;
        
        if (!container) {
          // Fallback: try to find by ref
          console.log('Container not found by data attribute, trying fallback...');
          container = document.querySelector('.map-container') as HTMLDivElement;
        }
        
        if (!container) {
          // Last resort: wait a bit and try again
          console.log('Container still not found, waiting 200ms and retrying...');
          await new Promise(resolve => setTimeout(resolve, 200));
          container = document.querySelector('[data-map-container]') as HTMLDivElement;
        }

        if (!container) {
          console.error('Map container not found after all attempts');
          setError('Map container not found - please refresh the page');
          setIsLoading(false);
          return;
        }

        console.log('Container found, initializing map');

        // Ensure container has proper dimensions
        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          console.log('Container has zero dimensions, setting minimum size');
          container.style.minWidth = '400px';
          container.style.minHeight = '400px';
          // Wait a bit more for dimensions to be set
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Final check before creating map
        if (!container || container.offsetWidth === 0 || container.offsetHeight === 0) {
          console.error('Container still invalid after dimension fix');
          setError('Map container dimensions invalid');
          setIsLoading(false);
          return;
        }

        // Additional validation - ensure container is properly attached to DOM
        if (!container.isConnected || !container.parentNode) {
          console.error('Container not properly attached to DOM');
          setError('Map container not properly attached to DOM');
          setIsLoading(false);
          return;
        }

        console.log('Container validation passed, ready to create map');

        // Determine initial center and zoom based on mapAction
        let initialCenter: [number, number] = [2.3508, 48.8569]; // Default to Paris (Europe center)
        let initialZoom = 4; // World/Europe view
        let usedForInitialCenter = false;

        if (mapAction && mapAction.action === 'center_map') {
          initialCenter = [mapAction.longitude, mapAction.latitude];
          initialZoom = mapAction.zoom;
          usedForInitialCenter = true;
          console.log('Using center_map for initial center:', initialCenter, 'zoom:', initialZoom);
        } else if (mapAction && mapAction.action === 'show_pois' && mapAction.pois && mapAction.pois.length > 0) {
          // Calculate center from POIs - only use POIs with valid coordinates
          const validCoords = mapAction.pois.filter((p: any) =>
            typeof p.lat === 'number' && !isNaN(p.lat) &&
            typeof p.lng === 'number' && !isNaN(p.lng)
          );

          if (validCoords.length > 0) {
            const lats = validCoords.map((p: any) => p.lat);
            const lngs = validCoords.map((p: any) => p.lng);
            const avgLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
            const avgLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length;
            initialCenter = [avgLng, avgLat];
            initialZoom = 12;
            console.log('Using POI center for initial center:', initialCenter);
          } else {
            console.warn('No valid POI coordinates for initial center, using default');
          }
        }

        const map = new maplibregl.Map({
          container: container,
          style,
          center: initialCenter,
          zoom: initialZoom
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        mapRef.current = map;
        setIsLoading(false);
        console.log('Map initialized successfully');

        // Wait for map to load before adding features
        map.on('load', () => {
          console.log('Map loaded event fired');
          if (geojsonData) {
            addFeaturesToMap(geojsonData);
          }
          if (mapAction) {
            console.log('Processing mapAction after map load:', mapAction);
            // Skip center_map if we already used it for initial center
            if (mapAction.action === 'center_map' && usedForInitialCenter) {
              console.log('Skipping center_map - already used for initial center');
            } else {
              handleMapAction(mapAction);
            }
          }
        });
      } catch (err: any) {
        console.error('Map load error:', err);
        const errorMessage = err.message || 'Unknown error loading map.';
        console.error('Setting error state:', errorMessage);
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    loadMap();

    return () => {
      if (mapRef.current) {
        console.log('Cleaning up map instance');
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [containerReady, mapAction]); // Load when container is ready AND mapAction is available

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
  }, [geojsonData]);

  // Handle map actions
  useEffect(() => {
    const map = mapRef.current;
    if (map && mapAction) {
      console.log('Received map action:', mapAction);
      
      if (map.isStyleLoaded()) {
        handleMapAction(mapAction);
      } else {
        map.once('style.load', () => {
          console.log('Style loaded, executing map action');
          handleMapAction(mapAction);
        });
      }
    }
  }, [mapAction]);

  const handleMapAction = (action: MapActionData) => {
    if (!mapRef.current) {
      console.log('Map not ready for action, waiting...');
      // Wait a bit and try again
      setTimeout(() => {
        if (mapRef.current) {
          handleMapAction(action);
        }
      }, 500);
      return;
    }

    console.log('Handling map action:', action);
    
    switch (action.action) {
      case 'center_map':
        centerMap(action.latitude, action.longitude, action.zoom);
        break;
      case 'show_pois':
        addPOIs(action.pois, action.showLabels);
        break;
      case 'show_routes':
        addRoutes(action.routes, action.showDirections);
        break;
      case 'show_polygons':
        addPolygons(action.polygons, action.showLabels);
        break;
      default:
        console.warn('Unknown map action:', action);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0F172A', position: 'absolute', inset: 0 }}>
      {error && (
        <div className="text-red-400 bg-gray-900 p-4 absolute top-0 left-0 z-50">
          Map error: {error}
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0F172A] z-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading map...</p>
        </div>
      )}
      <div 
        ref={mapContainerRef}
        data-map-container
        className="w-full h-full map-container" 
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}

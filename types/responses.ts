import { FeatureCollection, Polygon } from 'geojson';

// Response types for the AI chat
export interface AIResponse {
  text: {
    title: string;
    zipCodes: {
      zipCode: string;
      population: string;
      evCount: string;
      evCountPerCapita: string;
    }[];
    analysis: string;
  };
  geojson: string;
}

export interface ParsedAIResponse {
  text: AIResponse['text'] | string; // Support both structured data and simple string responses
  geojson: FeatureCollection<Polygon, {
    ZIP: string;
    population: number;
    ev_poi_count: number;
    evs_per_capita: number;
  }> | null;
}

// Map action types
export interface MapAction {
  action: 'center_map' | 'show_pois' | 'show_routes' | 'show_polygons';
  timestamp: string;
}

export interface CenterMapAction extends MapAction {
  action: 'center_map';
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface POI {
  lat: number;
  lng: number;
  name: string;
  type: string;
  color: string;
  description?: string;
}

export interface ShowPOIsAction extends MapAction {
  action: 'show_pois';
  pois: POI[];
  showLabels: boolean;
}

export interface Route {
  coordinates: [number, number][];
  color: string;
  width: number;
  name?: string;
  description?: string;
}

export interface ShowRoutesAction extends MapAction {
  action: 'show_routes';
  source: {
    lat: number;
    lng: number;
    name: string;
  };
  destination: {
    lat: number;
    lng: number;
    name: string;
  };
  mode?: 'car' | 'pedestrian' | 'bicycle';
  coordinates?: [number, number][];
  distance?: string;
  duration?: string;
  error?: string;
}

export interface MapPolygon {
  coordinates: [number, number][][];
  fillColor: string;
  strokeColor: string;
  opacity: number;
  name?: string;
  description?: string;
}

export interface ShowPolygonsAction extends MapAction {
  action: 'show_polygons';
  polygons: MapPolygon[];
  showLabels: boolean;
}

export type MapActionData = CenterMapAction | ShowPOIsAction | ShowRoutesAction | ShowPolygonsAction;

export interface ZipCodeFeature {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];  // Array of coordinate pairs
  };
  properties: {
    ZIP: string;
    population: number;
    ev_poi_count: number;
    evs_per_capita: number;
  };
}

export interface Visualization {
  type: string;
  data: MapVisualization;
}

export interface MapVisualization {
  features: Feature[];
  config: MapConfig;
}

export interface MapConfig {
  fitBounds: boolean;
  bounds?: {
    southWest: [number, number];  // [lon, lat]
    northEast: [number, number];  // [lon, lat]
  };
  center: [number, number];  // [lon, lat]
  zoom: number;
}

export interface Feature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'Point';
    coordinates: number[][][] | number[];  // For Polygon: array of coordinate rings, for Point: [lon, lat]
  };
  properties: {
    id: string;
    title: string;
    data: FeatureData;
    style: FeatureStyle;
  };
}

export interface FeatureData {
  zipCode?: string;
  evStationCount?: number;
  population?: number;
  evStationsPerCapita?: number;
  type?: 'EV Station';
}

export interface FeatureStyle {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  color?: string;
  radius?: number;
}

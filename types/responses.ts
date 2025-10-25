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

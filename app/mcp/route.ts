import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const baseURL = "https://chatgpt-app-with-next-js-tan-theta.vercel.app";

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const result = await fetch(`${baseUrl}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const handler = createMcpHandler(async (server) => {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/");

  const contentWidget: ContentWidget = {
    id: "show_content",
    title: "Show Content",
    templateUri: "ui://widget/content-template.html",
    invoking: "Loading content...",
    invoked: "Content loaded",
    html: html,
    description: "Displays the homepage content",
    widgetDomain: "https://chatgpt-app-with-next-js-tan-theta.vercel.app",
  };

  const mapWidget: ContentWidget = {
    id: "show_map",
    title: "Show Interactive Map",
    templateUri: "ui://widget/map-template.html",
    invoking: "Loading map...",
    invoked: "Map loaded",
    html: html,
    description: "Displays an interactive map with GeoJSON data visualization",
    widgetDomain: "https://chatgpt-app-with-next-js-tan-theta.vercel.app",
  };

  const centerMapWidget: ContentWidget = {
    id: "center_map",
    title: "Center Map",
    templateUri: "ui://widget/center-map-template.html",
    invoking: "Centering map...",
    invoked: "Map centered",
    html: html,
    description: "Centers the map on specific coordinates with zoom level",
    widgetDomain: "https://chatgpt-app-with-next-js-tan-theta.vercel.app",
  };

  const showPOIsWidget: ContentWidget = {
    id: "show_pois",
    title: "Show Points of Interest",
    templateUri: "ui://widget/show-pois-template.html",
    invoking: "Adding POIs...",
    invoked: "POIs displayed",
    html: html,
    description: "Displays points of interest on the map such as hotels, restaurants, attractions, landmarks, and other locations",
    widgetDomain: "https://chatgpt-app-with-next-js-tan-theta.vercel.app",
  };

  const showRoutesWidget: ContentWidget = {
    id: "show_routes",
    title: "Show Routes",
    templateUri: "ui://widget/show-routes-template.html",
    invoking: "Adding routes...",
    invoked: "Routes displayed",
    html: html,
    description: "Displays routes on the map",
    widgetDomain: "https://chatgpt-app-with-next-js-tan-theta.vercel.app",
  };

  const showPolygonsWidget: ContentWidget = {
    id: "show_polygons",
    title: "Show Polygons",
    templateUri: "ui://widget/show-polygons-template.html",
    invoking: "Adding polygons...",
    invoked: "Polygons displayed",
    html: html,
    description: "Displays polygons on the map",
    widgetDomain: "https://chatgpt-app-with-next-js-tan-theta.vercel.app",
  };
  server.registerResource(
    "content-widget",
    contentWidget.templateUri,
    {
      title: contentWidget.title,
      description: contentWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": contentWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${contentWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": contentWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": contentWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerResource(
    "map-widget",
    mapWidget.templateUri,
    {
      title: mapWidget.title,
      description: mapWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": mapWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${mapWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": mapWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": mapWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerResource(
    "center-map-widget",
    centerMapWidget.templateUri,
    {
      title: centerMapWidget.title,
      description: centerMapWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": centerMapWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${centerMapWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": centerMapWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": centerMapWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerResource(
    "show-pois-widget",
    showPOIsWidget.templateUri,
    {
      title: showPOIsWidget.title,
      description: showPOIsWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": showPOIsWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${showPOIsWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": showPOIsWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": showPOIsWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerResource(
    "show-routes-widget",
    showRoutesWidget.templateUri,
    {
      title: showRoutesWidget.title,
      description: showRoutesWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": showRoutesWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${showRoutesWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": showRoutesWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": showRoutesWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerResource(
    "show-polygons-widget",
    showPolygonsWidget.templateUri,
    {
      title: showPolygonsWidget.title,
      description: showPolygonsWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": showPolygonsWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${showPolygonsWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": showPolygonsWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": showPolygonsWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    contentWidget.id,
    {
      title: contentWidget.title,
      description:
        "Fetch and display the homepage content with the name of the user",
      inputSchema: {
        name: z.string().describe("The name of the user to display on the homepage"),
      },
      _meta: widgetMeta(contentWidget),
    },
    async ({ name }) => {
      return {
        content: [
          {
            type: "text",
            text: name,
          },
        ],
        structuredContent: {
          name: name,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(contentWidget),
      };
    }
  );

  server.registerTool(
    mapWidget.id,
    {
      title: mapWidget.title,
      description: "Display an interactive map with optional GeoJSON data visualization",
      inputSchema: {
        geojson: z.string().optional().describe("GeoJSON data to display on the map"),
        center: z.string().optional().describe("Map center coordinates (e.g., 'lat,lng')"),
        zoom: z.number().optional().describe("Map zoom level"),
      },
      _meta: widgetMeta(mapWidget),
    },
    async ({ geojson, center, zoom }) => {
      let parsedGeojson = null;
      if (geojson) {
        try {
          parsedGeojson = JSON.parse(geojson);
        } catch (error) {
          console.error('Failed to parse GeoJSON:', error);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Interactive map loaded${parsedGeojson ? ` with ${parsedGeojson.features?.length || 0} features` : ''}`,
          },
        ],
        structuredContent: {
          geojson: parsedGeojson,
          center: center,
          zoom: zoom,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(mapWidget),
      };
    }
  );

  server.registerTool(
    centerMapWidget.id,
    {
      title: centerMapWidget.title,
      description: "Center the map on specific coordinates with zoom level. Use this when the user asks to show, view, or go to a specific location like a city, country, or address. Automatically determine coordinates for cities and places.",
      inputSchema: {
        latitude: z.number().describe("Latitude coordinate (e.g., 52.3676 for Amsterdam, 40.7128 for New York)"),
        longitude: z.number().describe("Longitude coordinate (e.g., 4.9041 for Amsterdam, -74.0060 for New York)"),
        zoom: z.number().optional().describe("Zoom level (1-20, default 12 for cities, 15 for specific locations)"),
      },
      _meta: widgetMeta(centerMapWidget),
    },
    async ({ latitude, longitude, zoom = 12 }) => {
      return {
        content: [
          {
            type: "text",
            text: `Map centered on ${latitude}, ${longitude} at zoom level ${zoom}`,
          },
        ],
        structuredContent: {
          action: "center_map",
          latitude,
          longitude,
          zoom,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(centerMapWidget),
      };
    }
  );

  server.registerTool(
    showPOIsWidget.id,
    {
      title: showPOIsWidget.title,
      description: "Display points of interest on the map such as hotels, restaurants, attractions, landmarks, and other locations. Use this when the user asks to show hotels, restaurants, or any specific places on the map. Each POI will be shown as a colored marker.",
      inputSchema: {
        pois: z.array(z.object({
          lat: z.number().describe("Latitude coordinate"),
          lng: z.number().describe("Longitude coordinate"),
          name: z.string().describe("POI name (e.g., hotel name, restaurant name)"),
          type: z.string().describe("POI type (e.g., 'hotel', 'restaurant', 'attraction')"),
          color: z.string().describe("Color for the POI marker (e.g., '#ff6b6b', '#4ecdc4')"),
          description: z.string().optional().describe("Optional description")
        })).describe("Array of points of interest to display (hotels, restaurants, etc.)"),
        showLabels: z.boolean().optional().describe("Whether to show text labels on POIs"),
      },
      _meta: widgetMeta(showPOIsWidget),
    },
    async ({ pois, showLabels = false }) => {
      return {
        content: [
          {
            type: "text",
            text: `Displaying ${pois.length} points of interest on the map`,
          },
        ],
        structuredContent: {
          action: "show_pois",
          pois,
          showLabels,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(showPOIsWidget),
      };
    }
  );

  server.registerTool(
    showRoutesWidget.id,
    {
      title: showRoutesWidget.title,
      description: "Display routes on the map like Google Maps. Use this when user asks for directions, routes, or 'how to get from A to B'. The app will automatically calculate the route using TomTom routing API.",
      inputSchema: {
        source: z.object({
          lat: z.number().describe("Source latitude"),
          lng: z.number().describe("Source longitude"),
          name: z.string().describe("Source location name (e.g., 'Eiffel Tower', 'Paris')")
        }).describe("Route starting point"),
        destination: z.object({
          lat: z.number().describe("Destination latitude"),
          lng: z.number().describe("Destination longitude"),
          name: z.string().describe("Destination location name (e.g., 'Louvre Museum', 'Amsterdam')")
        }).describe("Route ending point"),
        mode: z.enum(['car', 'pedestrian', 'bicycle']).optional().describe("Travel mode: 'car' (default), 'pedestrian', 'bicycle'"),
      },
      _meta: widgetMeta(showRoutesWidget),
    },
    async ({ source, destination, mode = 'car' }) => {
      // Call TomTom Routing API server-side with traffic data
      try {
        const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
        const routingApiUrl = `https://api.tomtom.com/routing/1/calculateRoute/${source.lat},${source.lng}:${destination.lat},${destination.lng}/json?key=${apiKey}&travelMode=${mode}&traffic=true&sectionType=traffic`;

        console.log('Calling TomTom Routing API with traffic data:', routingApiUrl);

        const response = await fetch(routingApiUrl);
        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
          throw new Error('No route found');
        }

        const route = data.routes[0];
        const coordinates = route.legs[0].points.map((point: any) => [point.longitude, point.latitude]);
        const distanceKm = (route.summary.lengthInMeters / 1000).toFixed(1);
        const durationMin = Math.round(route.summary.travelTimeInSeconds / 60);

        // Extract traffic sections with TomTom's color information
        const trafficSections = route.sections?.map((section: any) => ({
          startPointIndex: section.startPointIndex,
          endPointIndex: section.endPointIndex,
          // TomTom traffic values: JAM, SLOW, MEDIUM, FAST, FREE_FLOW
          trafficSpeed: section.simpleCategory || 'FREE_FLOW',
          delaySeconds: section.delayInSeconds || 0,
          magnitudeOfDelay: section.magnitudeOfDelay || 0, // 0=unknown, 1=minor, 2=moderate, 3=major, 4=undefined
          // Check for TomTom-provided colors
          effectiveSpeedInKmh: section.effectiveSpeedInKmh,
          tmc: section.tmc // Traffic Message Channel data may contain colors
        })) || [];

        console.log(`Route found with ${trafficSections.length} traffic sections`);
        // Log first section to see what data TomTom provides
        if (trafficSections.length > 0) {
          console.log('Sample traffic section data:', JSON.stringify(trafficSections[0], null, 2));
        }

        return {
          content: [
            {
              type: "text",
              text: `Route found: ${distanceKm} km, ${durationMin} min via ${mode} with real-time traffic`,
            },
          ],
          structuredContent: {
            action: "show_routes",
            source,
            destination,
            mode,
            coordinates,
            distance: `${distanceKm} km`,
            duration: `${durationMin} min`,
            trafficSections,
            timestamp: new Date().toISOString(),
          },
          _meta: widgetMeta(showRoutesWidget),
        };
      } catch (error) {
        console.error('Error fetching route:', error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to calculate route from ${source.name} to ${destination.name}`,
            },
          ],
          structuredContent: {
            action: "show_routes",
            source,
            destination,
            mode,
            error: 'Failed to fetch route',
            timestamp: new Date().toISOString(),
          },
          _meta: widgetMeta(showRoutesWidget),
        };
      }
    }
  );

  server.registerTool(
    showPolygonsWidget.id,
    {
      title: showPolygonsWidget.title,
      description: "Display polygons on the map with custom colors and opacity",
      inputSchema: {
        polygons: z.array(z.object({
          coordinates: z.array(z.array(z.array(z.number()))).describe("Array of polygon coordinate rings"),
          fillColor: z.string().describe("Fill color for the polygon"),
          strokeColor: z.string().describe("Stroke color for the polygon border"),
          opacity: z.number().optional().describe("Opacity of the polygon fill"),
          name: z.string().optional().describe("Optional polygon name"),
          description: z.string().optional().describe("Optional polygon description")
        })).describe("Array of polygons to display"),
        showLabels: z.boolean().optional().describe("Whether to show text labels on polygons"),
      },
      _meta: widgetMeta(showPolygonsWidget),
    },
    async ({ polygons, showLabels = false }) => {
      return {
        content: [
          {
            type: "text",
            text: `Displaying ${polygons.length} polygons on the map`,
          },
        ],
        structuredContent: {
          action: "show_polygons",
          polygons,
          showLabels,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(showPolygonsWidget),
      };
    }
  );
});

export const GET = handler;
export const POST = handler;

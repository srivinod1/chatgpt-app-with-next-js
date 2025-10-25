import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

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
    templateUri: "ui://widget/map-template.html",
    invoking: "Centering map...",
    invoked: "Map centered",
    html: html,
    description: "Centers the map on specific coordinates with zoom level",
    widgetDomain: "https://chatgpt-app-with-next-js-tan-theta.vercel.app",
  };

  const poisWidget: ContentWidget = {
    id: "show_pois",
    title: "Show Points of Interest",
    templateUri: "ui://widget/map-template.html",
    invoking: "Loading POIs...",
    invoked: "POIs displayed",
    html: html,
    description: "Displays points of interest and address points on the map",
    widgetDomain: "https://chatgpt-app-with-next-js-tan-theta.vercel.app",
  };

  const routesWidget: ContentWidget = {
    id: "show_routes",
    title: "Show Routes",
    templateUri: "ui://widget/map-template.html",
    invoking: "Loading routes...",
    invoked: "Routes displayed",
    html: html,
    description: "Displays route lines on the map",
    widgetDomain: "https://chatgpt-app-with-next-js-tan-theta.vercel.app",
  };

  const polygonsWidget: ContentWidget = {
    id: "show_polygons",
    title: "Show Polygons",
    templateUri: "ui://widget/map-template.html",
    invoking: "Loading polygons...",
    invoked: "Polygons displayed",
    html: html,
    description: "Displays colored polygon overlays on the map",
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

  // Register all map-related widgets
  const mapWidgets = [mapWidget, centerMapWidget, poisWidget, routesWidget, polygonsWidget];
  
  mapWidgets.forEach((widget) => {
    server.registerResource(
      `${widget.id}-widget`,
      widget.templateUri,
      {
        title: widget.title,
        description: widget.description,
        mimeType: "text/html+skybridge",
        _meta: {
          "openai/widgetDescription": widget.description,
          "openai/widgetPrefersBorder": true,
        },
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "text/html+skybridge",
            text: `<html>${widget.html}</html>`,
            _meta: {
              "openai/widgetDescription": widget.description,
              "openai/widgetPrefersBorder": true,
              "openai/widgetDomain": widget.widgetDomain,
            },
          },
        ],
      })
    );
  });

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

  // Register all map tools
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
      description: "Center the map on specific coordinates with zoom level",
      inputSchema: {
        latitude: z.number().describe("Latitude coordinate"),
        longitude: z.number().describe("Longitude coordinate"),
        zoom: z.number().optional().describe("Zoom level (1-20, default 12)"),
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
    poisWidget.id,
    {
      title: poisWidget.title,
      description: "Display points of interest and address points on the map",
      inputSchema: {
        pois: z.string().describe("JSON array of POI objects with lat, lng, name, type, and color properties"),
        showLabels: z.boolean().optional().describe("Whether to show POI labels (default true)"),
      },
      _meta: widgetMeta(poisWidget),
    },
    async ({ pois, showLabels = true }) => {
      let parsedPois = null;
      try {
        parsedPois = JSON.parse(pois);
      } catch (error) {
        console.error('Failed to parse POIs:', error);
      }

      return {
        content: [
          {
            type: "text",
            text: `Displaying ${parsedPois?.length || 0} points of interest${showLabels ? ' with labels' : ''}`,
          },
        ],
        structuredContent: {
          action: "show_pois",
          pois: parsedPois,
          showLabels,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(poisWidget),
      };
    }
  );

  server.registerTool(
    routesWidget.id,
    {
      title: routesWidget.title,
      description: "Display route lines on the map",
      inputSchema: {
        routes: z.string().describe("JSON array of route objects with coordinates, color, and width properties"),
        showDirections: z.boolean().optional().describe("Whether to show direction arrows (default false)"),
      },
      _meta: widgetMeta(routesWidget),
    },
    async ({ routes, showDirections = false }) => {
      let parsedRoutes = null;
      try {
        parsedRoutes = JSON.parse(routes);
      } catch (error) {
        console.error('Failed to parse routes:', error);
      }

      return {
        content: [
          {
            type: "text",
            text: `Displaying ${parsedRoutes?.length || 0} routes${showDirections ? ' with direction arrows' : ''}`,
          },
        ],
        structuredContent: {
          action: "show_routes",
          routes: parsedRoutes,
          showDirections,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(routesWidget),
      };
    }
  );

  server.registerTool(
    polygonsWidget.id,
    {
      title: polygonsWidget.title,
      description: "Display colored polygon overlays on the map",
      inputSchema: {
        polygons: z.string().describe("JSON array of polygon objects with coordinates, fillColor, strokeColor, and opacity properties"),
        showLabels: z.boolean().optional().describe("Whether to show polygon labels (default false)"),
      },
      _meta: widgetMeta(polygonsWidget),
    },
    async ({ polygons, showLabels = false }) => {
      let parsedPolygons = null;
      try {
        parsedPolygons = JSON.parse(polygons);
      } catch (error) {
        console.error('Failed to parse polygons:', error);
      }

      return {
        content: [
          {
            type: "text",
            text: `Displaying ${parsedPolygons?.length || 0} polygons${showLabels ? ' with labels' : ''}`,
          },
        ],
        structuredContent: {
          action: "show_polygons",
          polygons: parsedPolygons,
          showLabels,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(polygonsWidget),
      };
    }
  );
});

export const GET = handler;
export const POST = handler;

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
});

export const GET = handler;
export const POST = handler;

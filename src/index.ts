import { Hono } from "hono";
import { serve } from '@hono/node-server';
import { amazonScraperHandler } from "./routes/amazonRoute";
import { ebayScraperHandler } from "./routes/ebayRoute";

const app = new Hono();

app.post("/scraper", async (c) => {
  const { url } = await c.req.json();
  if (!url) {
    return c.json({ error: "URL is required" }, 400);
  }

  let result;
  if (url.includes("amazon.")) {
    result = await amazonScraperHandler(url);
  } else if (url.includes("ebay.")) {
    result = await ebayScraperHandler(url);
  } else {
    return c.json({ error: "Unsupported site" }, 400);
  }

  return c.json(result);
});

serve({
  fetch: app.fetch,
  port: 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});

export default app;

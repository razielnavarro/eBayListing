import { Hono } from "hono";
import { serve } from '@hono/node-server'

import { ebay } from "./routes/ebayRoute";
import { amazon } from "./routes/amazonRoute";

const app = new Hono();

app.route('ebayScraper', ebay);
app.route('amazonScraper', amazon);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})


export default app;
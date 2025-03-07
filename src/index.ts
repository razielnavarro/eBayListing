import { Hono } from "hono";
import { serve } from '@hono/node-server'

import { ebayScraper } from "./controllers/ebayScraper";
import { amazonScraper } from "./controllers/amazonScraper";

const app = new Hono();

app.route('ebayScraper', ebayScraper);
app.route('amazonScraper', amazonScraper);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})


export default app;
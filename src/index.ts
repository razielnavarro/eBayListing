import { Hono } from "hono";
import { serve } from '@hono/node-server'

import { listingInfo } from "./controllers/listingInfo.controller";

const app = new Hono();

app.route('listingInfo', listingInfo);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})


export default app;
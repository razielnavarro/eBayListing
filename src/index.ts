import { Hono } from "hono";
import { listingInfo } from "./controllers/listingInfo.controller";

const app = new Hono();

app.route('listingInfo', listingInfo);

export default app;
import { createCrmApp } from "./app.ts";

const port = Number(process.env.CRM_API_PORT ?? 4000);
const app = createCrmApp();

app.listen(port, () => {
  console.log(`Oakbase CRM API ready on http://localhost:${port}`);
});

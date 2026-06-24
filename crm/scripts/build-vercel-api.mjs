import { rm } from "node:fs/promises";
import { build } from "esbuild";

await rm("server-dist", { recursive: true, force: true });

await build({
  entryPoints: ["server/app.ts"],
  outfile: "server-dist/app.mjs",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  packages: "external",
  sourcemap: false,
});

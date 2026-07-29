import { describe, expect, it } from "vitest";

import packageJson from "../package.json?raw";
import robots from "../public/robots.txt?raw";
import sitemap from "../public/sitemap.xml?raw";
import readme from "../README.md?raw";
import product from "../src/config/product.ts?raw";
import wrangler from "../wrangler.jsonc?raw";

describe("publishing contract", () => {
  it("uses the product yhay81.com subdomain as the only production origin", () => {
    for (const content of [product, wrangler, packageJson, robots, sitemap, readme]) {
      expect(content).toContain("tegotae.yhay81.com");
      expect(content).not.toContain("yusuke8h.workers.dev");
    }
    expect(wrangler).toContain('"workers_dev": false');
    expect(wrangler).toContain('"custom_domain": true');
  });

  it("has D1, daily cleanup, metrics, and no auth dependency", () => {
    expect(wrangler).toContain('"binding": "DB"');
    expect(wrangler).toContain('"crons"');
    expect(packageJson).toContain('"metrics"');
    expect(packageJson).not.toContain("better-auth");
  });
});

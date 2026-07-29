import { describe, expect, it } from "vitest";

import appClient from "../public/app.js?raw";
import dashboardClient from "../public/dashboard.js?raw";
import { beaconScript } from "../src/beacon";

describe("browser code", () => {
  it("never renders site-controlled strings as HTML", () => {
    expect(appClient).not.toContain("innerHTML");
    expect(dashboardClient).not.toContain("innerHTML");
    expect(dashboardClient).toContain("textContent");
  });

  it("keeps access keys in fragments and request headers", () => {
    expect(appClient).toContain('managementUrl.searchParams.set("qa", "1")');
    expect(dashboardClient).toContain("location.hash.slice(1)");
    expect(dashboardClient).toContain('"x-site-key": key');
    expect(dashboardClient).toContain('automated ? "/?qa=1" : "/"');
    expect(dashboardClient).not.toContain('searchParams.get("key")');
  });

  it("keeps the embedded beacon independent from browser identity state", () => {
    expect(beaconScript).toContain("location.pathname");
    expect(beaconScript).toContain("document.referrer");
    expect(beaconScript).not.toContain("location.href");
    expect(beaconScript).not.toContain("cookie");
    expect(beaconScript).not.toContain("localStorage");
    expect(beaconScript).not.toContain("sessionStorage");
    expect(new TextEncoder().encode(beaconScript).byteLength).toBeLessThan(1_500);
  });
});

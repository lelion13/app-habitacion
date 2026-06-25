import { chromium } from "@playwright/test";

const captureId = process.argv[2];
const targetUrl = process.argv[3];

if (!captureId || !targetUrl) {
  console.error("Usage: node figma-capture.mjs <captureId> <url>");
  process.exit(1);
}

const endpoint = `https://mcp.figma.com/mcp/capture/${captureId}/submit`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
});

await page.route("**/*", async (route) => {
  const url = route.request().url();
  if (
    url.includes("/stream") ||
    route.request().resourceType() === "eventsource"
  ) {
    await route.abort();
    return;
  }

  try {
    const response = await route.fetch({ timeout: 15000 });
    const headers = { ...response.headers() };
    delete headers["content-security-policy"];
    delete headers["content-security-policy-report-only"];
    await route.fulfill({ response, headers });
  } catch {
    await route.abort();
  }
});

await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(5000);

await page.waitForSelector("text=Enfermería", { timeout: 30000 }).catch(() => {});

const scriptText = await (
  await page.context().request.get("https://mcp.figma.com/mcp/html-to-design/capture.js")
).text();

await page.evaluate((source) => {
  const el = document.createElement("script");
  el.textContent = source;
  document.head.appendChild(el);
}, scriptText);

await page.waitForTimeout(1000);

const rootSelector = await page.evaluate(() =>
  document.querySelector(".habitacion-root") ? ".habitacion-root" : "body",
);

const result = await page.evaluate(
  ({ id, submitEndpoint, selector }) =>
    window.figma.captureForDesign({
      captureId: id,
      endpoint: submitEndpoint,
      selector,
    }),
  { id: captureId, submitEndpoint: endpoint, selector: rootSelector },
);

console.log(JSON.stringify(result, null, 2));
await browser.close();

import { test, expect } from "@playwright/test";

test.describe("App Habitación", () => {
  test("landing shows room and dashboard links", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "App Habitación" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /App Habitación/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Dashboard/i })).toBeVisible();
  });

  test("dashboard login page renders", async ({ page }) => {
    await page.goto("/dashboard/login");
    await expect(
      page.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByLabel("Correo")).toBeVisible();
  });

  test("habitacion page loads or shows config error", async ({ page }) => {
    await page.goto("/habitacion");
    await expect(
      page.getByText(/Cargando habitación|Configure NEXT_PUBLIC_ROOM_KEY|Habitación/i),
    ).toBeVisible({ timeout: 10000 });
  });
});

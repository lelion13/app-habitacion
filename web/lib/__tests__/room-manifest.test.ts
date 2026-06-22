import { describe, expect, it } from "@jest/globals";
import { buildRoomManifest, manifestShortName } from "../room-manifest";

describe("room-manifest", () => {
  it("builds start_url with encoded key", () => {
    const manifest = buildRoomManifest({
      roomKey: "room-101-key",
      label: "Habitación 101",
      number: "101",
    });
    expect(manifest.start_url).toBe("/habitacion?key=room-101-key");
    expect(manifest.name).toBe("Habitación 101");
    expect(manifest.display).toBe("fullscreen");
  });

  it("truncates long labels for short_name", () => {
    expect(manifestShortName("Hab. 101", "101")).toBe("Hab. 101");
    expect(manifestShortName("Habitación de observación 101", "101")).toBe(
      "Hab. 101",
    );
  });
});

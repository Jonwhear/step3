/**
 * How the current rotation is named on screen.
 *
 * The service label now appears in the top bar of every screen rather than in
 * a block on the page, so it has to read as a phrase on its own — the old
 * `${rotation.name} Service` template produced "General / Off-Service Service"
 * on any day outside a rotation block.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addRotation, getCurrentRotation } from "@/domain/profile";
import { closeTestDb, createTestDb, seedProfile, type TestContext } from "./helpers";

let ctx: TestContext;

beforeEach(() => {
  ctx = createTestDb(false);
});

afterEach(() => {
  closeTestDb(ctx);
});

describe("rotation service label", () => {
  it("names an off-service day without doubling the word", () => {
    const rotation = getCurrentRotation(ctx.db, "2026-04-01");
    expect(rotation.isOffService).toBe(true);
    expect(rotation.serviceLabel).toBe("General Service");
  });

  it("appends Service to a rotation named after its specialty", () => {
    seedProfile(ctx, { rotationSpecialty: "Internal Medicine" });
    expect(getCurrentRotation(ctx.db, "2026-04-01").serviceLabel).toBe(
      "Internal Medicine Service",
    );
  });

  it("does not append Service to a rotation that already says it", () => {
    seedProfile(ctx);
    addRotation(ctx.db, {
      name: "Night Float Service",
      specialty: "Internal Medicine",
      startDate: "2027-01-01",
      endDate: "2027-01-31",
    });
    expect(getCurrentRotation(ctx.db, "2027-01-15").serviceLabel).toBe(
      "Night Float Service",
    );
  });
});

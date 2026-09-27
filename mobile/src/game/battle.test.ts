import { describe, expect, it } from "vitest";
import { battlePercent, didPassBattle } from "./battle";

describe("native battle scoring", () => {
  it("passes at the shared 60 percent capture threshold", () => {
    expect(didPassBattle(3, 5)).toBe(true);
    expect(didPassBattle(2, 5)).toBe(false);
  });

  it("formats the result as a whole percentage", () => {
    expect(battlePercent(2, 3)).toBe(67);
    expect(battlePercent(0, 0)).toBe(0);
  });
});

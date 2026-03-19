// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConsent } from "../useConsent";

beforeEach(() => localStorage.clear());

describe("useConsent", () => {
  it("defaults to null (no decision yet)", () => {
    const { result } = renderHook(() => useConsent());
    expect(result.current.consent).toBeNull();
  });

  it("returns stored consent from localStorage", () => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({ essential: true, advertising: true })
    );
    const { result } = renderHook(() => useConsent());
    expect(result.current.consent).toEqual({
      essential: true,
      advertising: true,
    });
  });

  it("acceptAll sets all categories to true and persists", () => {
    const { result } = renderHook(() => useConsent());
    act(() => result.current.acceptAll());
    expect(result.current.consent).toEqual({
      essential: true,
      advertising: true,
    });
    expect(JSON.parse(localStorage.getItem("cookie-consent")!)).toEqual({
      essential: true,
      advertising: true,
    });
  });

  it("rejectNonEssential sets advertising false and persists", () => {
    const { result } = renderHook(() => useConsent());
    act(() => result.current.rejectNonEssential());
    expect(result.current.consent).toEqual({
      essential: true,
      advertising: false,
    });
  });

  it("hasAdvertisingConsent returns true only when advertising is true", () => {
    const { result } = renderHook(() => useConsent());
    expect(result.current.hasAdvertisingConsent).toBe(false);
    act(() => result.current.acceptAll());
    expect(result.current.hasAdvertisingConsent).toBe(true);
  });
});

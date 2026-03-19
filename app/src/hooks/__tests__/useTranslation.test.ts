// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTranslation } from "../useTranslation";

beforeEach(() => localStorage.clear());

describe("useTranslation", () => {
  it("defaults to browser language or de", () => {
    const { result } = renderHook(() => useTranslation());
    expect(["de", "en"]).toContain(result.current.i18n.language);
  });

  it("changeLanguage updates language and persists", () => {
    const { result } = renderHook(() => useTranslation());
    act(() => result.current.i18n.changeLanguage("en"));
    expect(result.current.i18n.language).toBe("en");
    expect(localStorage.getItem("app-language")).toBe("en");
  });

  it("reads persisted language from localStorage", () => {
    localStorage.setItem("app-language", "en");
    const { result } = renderHook(() => useTranslation());
    expect(result.current.i18n.language).toBe("en");
  });

  it("t() returns translated string for current language", () => {
    const { result } = renderHook(() => useTranslation());
    act(() => result.current.i18n.changeLanguage("en"));
    expect(result.current.t("app.title")).toBe("Couples Timer");
    act(() => result.current.i18n.changeLanguage("de"));
    expect(result.current.t("app.title")).toBe("Zwiegespräch");
  });
});

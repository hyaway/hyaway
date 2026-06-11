// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { resolveFavoriteService } from "./resolve-favorite-service";
import type { RatingServiceInfo } from "@/integrations/hydrus-api/models";
import { ServiceType } from "@/integrations/hydrus-api/models";

function like(name: string): RatingServiceInfo {
  return { type: ServiceType.RATING_LIKE, name } as RatingServiceInfo;
}

function numerical(name: string): RatingServiceInfo {
  return { type: ServiceType.RATING_NUMERICAL, name } as RatingServiceInfo;
}

function incDec(name: string): RatingServiceInfo {
  return { type: ServiceType.RATING_INC_DEC, name } as RatingServiceInfo;
}

describe("resolveFavoriteService", () => {
  it("returns null when there are no rating services", () => {
    expect(resolveFavoriteService([])).toBeNull();
  });

  it("returns null when no like/dislike service exists", () => {
    const services: Array<[string, RatingServiceInfo]> = [
      ["num", numerical("Quality")],
    ];
    expect(resolveFavoriteService(services)).toBeNull();
  });

  it("ignores numerical and inc/dec services", () => {
    const services: Array<[string, RatingServiceInfo]> = [
      ["num", numerical("Favourites")],
      ["inc", incDec("Favourites")],
    ];
    expect(resolveFavoriteService(services)).toBeNull();
  });

  it("returns the only like/dislike service", () => {
    const services: Array<[string, RatingServiceInfo]> = [
      ["num", numerical("Quality")],
      ["fav", like("my stars")],
    ];
    expect(resolveFavoriteService(services)?.[0]).toBe("fav");
  });

  it("prefers a service named 'favourites' (case-insensitive)", () => {
    const services: Array<[string, RatingServiceInfo]> = [
      ["a", like("Cute")],
      ["b", like("Favourites")],
    ];
    expect(resolveFavoriteService(services)?.[0]).toBe("b");
  });

  it("matches the American spelling 'favorites' too", () => {
    const services: Array<[string, RatingServiceInfo]> = [
      ["a", like("Cute")],
      ["b", like("favorites")],
    ];
    expect(resolveFavoriteService(services)?.[0]).toBe("b");
  });

  it("falls back to the first like service when none is named favourites", () => {
    const services: Array<[string, RatingServiceInfo]> = [
      ["a", like("Cute")],
      ["b", like("Lewd")],
    ];
    expect(resolveFavoriteService(services)?.[0]).toBe("a");
  });
});

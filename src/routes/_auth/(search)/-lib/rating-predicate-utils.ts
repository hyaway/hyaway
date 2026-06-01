// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

export const RATING_FIELD_PREFIX = "rating:";
export const SYSTEM_RATING_GROUP_LABEL = "system:rating";
export const SYSTEM_RATING_PREFIX = "system:rating for ";
export const SYSTEM_HAS_RATING_PREFIX = "system:has rating for ";
export const SYSTEM_NO_RATING_PREFIX = "system:no rating for ";

export type RatingFieldName = `rating:${string}`;

export type RatingSystemTagKind = "rating" | "has" | "has_not";

export type ParsedRatingSystemTag = {
  fieldName: RatingFieldName;
  kind: RatingSystemTagKind;
};

export function isRatingFieldName(fieldName: string): boolean {
  return fieldName.startsWith(RATING_FIELD_PREFIX);
}

export function getRatingServiceName(fieldName: string): string {
  return fieldName.slice(RATING_FIELD_PREFIX.length);
}

export function getRatingFieldName(serviceName: string): RatingFieldName {
  return `${RATING_FIELD_PREFIX}${serviceName}`;
}

export function getRatingSystemTag(
  fieldName: string,
): `system:rating for ${string}` {
  return `${SYSTEM_RATING_PREFIX}${getRatingServiceName(fieldName)}`;
}

export function getHasRatingSystemTag(fieldName: string): string {
  return `${SYSTEM_HAS_RATING_PREFIX}${getRatingServiceName(fieldName)}`;
}

export function getNoRatingSystemTag(fieldName: string): string {
  return `${SYSTEM_NO_RATING_PREFIX}${getRatingServiceName(fieldName)}`;
}

export function getRatingSystemTags(fieldName: string): Array<string> {
  return [
    getRatingSystemTag(fieldName),
    getHasRatingSystemTag(fieldName),
    getNoRatingSystemTag(fieldName),
  ];
}

export function parseRatingSystemTag(
  systemTag: string,
): ParsedRatingSystemTag | null {
  if (systemTag.startsWith(SYSTEM_HAS_RATING_PREFIX)) {
    return {
      fieldName: getRatingFieldName(
        systemTag.slice(SYSTEM_HAS_RATING_PREFIX.length),
      ),
      kind: "has",
    };
  }

  if (systemTag.startsWith(SYSTEM_NO_RATING_PREFIX)) {
    return {
      fieldName: getRatingFieldName(
        systemTag.slice(SYSTEM_NO_RATING_PREFIX.length),
      ),
      kind: "has_not",
    };
  }

  if (systemTag.startsWith(SYSTEM_RATING_PREFIX)) {
    return {
      fieldName: getRatingFieldName(systemTag.slice(SYSTEM_RATING_PREFIX.length)),
      kind: "rating",
    };
  }

  return null;
}
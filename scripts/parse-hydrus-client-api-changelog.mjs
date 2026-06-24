#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { JSDOM } from "jsdom";

const DEFAULT_SOURCE = ".reference/hydrus/docs/old_changelog.html";

const args = process.argv.slice(2);
const sourceArg = readArg("--source") ?? DEFAULT_SOURCE;
const format = readArg("--format") ?? "markdown";
const sourcePath = resolve(process.cwd(), sourceArg);

const endpointPattern = new RegExp(
  [
    "/api_version",
    "/request_new_permissions",
    "/verify_access_key",
    "/session_key",
    "/client_info",
    "/get_services",
    "/get_service_rating_svg",
    "/get_files/search_files",
    "/get_files/file_metadata",
    "/add_tags/search_tags",
    "/add_tags/clean_tags",
    "/add_tags/add_tags",
    "/add_tags/get_favourite_tags",
    "/add_tags/set_favourite_tags",
    "/manage_pages/get_pages",
    "/manage_pages/get_page_info",
    "/manage_pages/get_media_viewers",
    "/manage_pages/refresh_page",
    "/manage_pages/focus_page",
    "/manage_database/get_client_options",
    "/add_files/delete_files",
    "/add_files/undelete_files",
    "/add_files/archive_files",
    "/add_files/unarchive_files",
    "/edit_times/increment_file_viewtime",
    "/edit_times/set_file_viewtime",
    "/add_notes/set_notes",
    "/add_notes/delete_notes",
    "/edit_ratings/set_rating",
  ]
    .map(escapeRegExp)
    .join("|"),
  "i",
);

const clientApiFieldPattern = new RegExp(
  [
    "services_v2",
    "show_in_thumbnail",
    "allows_zero",
    "file_viewing_statistics",
    "permits_everything",
    "include_current_tags",
    "include_pending_tags",
    "override_previously_deleted_mappings",
    "create_new_deleted_mappings",
    "time_archived",
    "autocomplete_text",
    "hash_ids_selected",
    "num_files_selected",
    "return_file_ids",
    "return_hashes",
    "tag_display_type",
    "is_media_page",
    "service_keys_to_actions_to_tags",
    "include_notes",
    "known_urls",
    "has_audio",
    "is_inbox",
    "is_local",
    "is_trashed",
  ]
    .map(escapeRegExp)
    .join("|"),
  "i",
);

const clientApiContextPattern = /client api/i;
const standaloneRelevantFieldPattern = /services_v2/i;
const exactClientApiPhrasePattern =
  /Client API now has calls to get\/set the favourite tags/i;

const apiVersionPattern =
  /(?:Client API|client api|api) (?:version is now|is now version|version is incremented to|version to|is now version)\s*(\d+)|incremented Client API version to\s*(\d+)|client api version is now\s*(\d+)|the client api version is now\s*(\d+)|the Client API version is now\s*(\d+)|client api is now version\s*(\d+)|the client api is now version\s*(\d+)|although it is a tiny change.*Client API version to\s*(\d+)|client api version is incremented to\s*(\d+)/i;

const html = readFileSync(sourcePath, "utf8");
const document = new JSDOM(html).window.document;
const rows = extractRows(document);

switch (format) {
  case "json": {
    console.log(JSON.stringify(rows, null, 2));
    break;
  }
  case "tsv": {
    for (const row of rows) {
      console.log(
        [row.hydrusVersion, row.apiVersion ?? "", row.items.join(" | ")].join(
          "\t",
        ),
      );
    }
    break;
  }
  case "markdown": {
    console.log("| Hydrus version | API version | Parsed changelog items |");
    console.log("| --- | ---: | --- |");
    for (const row of rows) {
      console.log(
        `| ${row.hydrusVersion} | ${row.apiVersion ?? "unknown"} | ${row.items.map(escapeMarkdownTableCell).join("<br>")} |`,
      );
    }
    break;
  }
  default: {
    throw new Error(
      `Unknown --format "${format}". Use markdown, json, or tsv.`,
    );
  }
}

function extractRows(document) {
  const rows = [];

  for (const versionNode of document.querySelectorAll("body > div > ul > li")) {
    const heading = versionNode.querySelector(":scope > h2");
    const list = versionNode.querySelector(":scope > ul");

    if (!heading || !list) continue;

    const hydrusVersion = heading.textContent.match(/\d+/)?.[0];
    if (!hydrusVersion) continue;

    const items = [];
    let apiVersion = null;

    for (const item of list.querySelectorAll(":scope > li")) {
      const text = normaliseText(item.textContent);
      const apiVersionMatch = text.match(apiVersionPattern);

      if (apiVersionMatch) {
        apiVersion = apiVersionMatch.slice(1).find(Boolean) ?? apiVersion;
      }

      const mentionsEndpoint = endpointPattern.test(text);
      const mentionsRelevantFieldInClientApiContext =
        clientApiContextPattern.test(text) && clientApiFieldPattern.test(text);
      const mentionsStandaloneRelevantField =
        standaloneRelevantFieldPattern.test(text);
      const mentionsExactClientApiPhrase =
        exactClientApiPhrasePattern.test(text);

      if (
        (mentionsEndpoint ||
          mentionsRelevantFieldInClientApiContext ||
          mentionsStandaloneRelevantField ||
          mentionsExactClientApiPhrase) &&
        !/^client api$/i.test(text)
      ) {
        items.push(text);
      }
    }

    if (apiVersion || items.length > 0) {
      rows.push({ hydrusVersion, apiVersion, items });
    }
  }

  return rows;
}

function readArg(name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;

  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }

  return value;
}

function normaliseText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeMarkdownTableCell(value) {
  return value.replaceAll("|", "\\|");
}

"use client";

import { useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldAtlas from "world-atlas/countries-110m.json";

import { count } from "@/lib/format";

/**
 * Organic sessions by country.
 *
 * <p><b>A map answers "where", and only that.</b> Comparing 8,580 against 2,600
 * by the shade of two countries is the thing a choropleth is worst at, so the
 * figures are not left to it — the ranked list beside this panel carries them,
 * and every shape hands over its exact count on hover. The map's job is the
 * shape of the audience at a glance: that this is a North African and Western
 * European business, which no ordered list makes as obvious.
 *
 * <p><b>Sequential colour: one hue, light to dark.</b> More sessions, more of
 * the hue — never a second colour, which would say "different" rather than
 * "more". Mixed against `--card` rather than picked as fixed steps, so the
 * low end always resolves toward whatever surface is actually behind it: on a
 * white card the faint end is nearly white, on a dark one nearly black, and
 * "barely any traffic" reads as "barely any ink" in both without a second ramp.
 *
 * <p>⚠️ Countries GA4 reported nothing for are drawn in the muted token, not in
 * the palest step of the ramp. No data and almost no data are different claims,
 * and the legend says which is which.
 *
 * <p>The topology is parsed, projected and turned into path strings once at
 * module scope, so hovering re-renders 176 `d` attributes that were already
 * computed rather than reprojecting the world on every pointer move.
 *
 * <p>⚠️ <b>The atlas is 197KB raw, ~39KB over the wire.</b> It lands in the
 * client bundle because the workspace that renders this is a client component —
 * the brand control is React state, so the map has to re-render beside it. That
 * is a fair price for a page someone opens deliberately, but it is not free: if
 * this page ever needs to be light, `next/dynamic` with `ssr: false` moves the
 * topology out of the initial payload and costs only a placeholder.
 */

// Natural Earth rather than Mercator: Mercator inflates the far north until
// Greenland outweighs Africa, which on a traffic map is an outright lie.
//
// A fixed drawing surface rather than a measured one. The SVG scales with its
// viewBox, so there is nothing to observe, nothing that differs between server
// and browser, and no first paint at the wrong size.
const WIDTH = 820;
const HEIGHT = 380;

/** ISO 3166-1 numeric for Antarctica. Drawn, it is a white bar across the foot
 *  of every world map and it has never had a session. */
const ANTARCTICA = "010";

const topology = worldAtlas as unknown as Topology<{ countries: GeometryCollection }>;

const projected = (
  feature(topology, topology.objects.countries) as FeatureCollection<Geometry>
).features.filter((shape) => String(shape.id) !== ANTARCTICA);

const toPath = geoPath(
  geoNaturalEarth1().fitSize([WIDTH, HEIGHT], {
    type: "FeatureCollection",
    features: projected,
  })
);

type Shape = {
  /** React key and hover identity. Always unique; see below. */
  key: string;
  /** ISO 3166-1 numeric, or "" for the shapes that have none. */
  atlasId: string;
  name: string;
  d: string;
};

const SHAPES: Shape[] = projected
  .map((shape: Feature<Geometry>, index: number) => ({
    // ⚠️ The index, not the atlas id. Three geometries in this topology carry
    // no `id` at all — N. Cyprus, Somaliland and Kosovo, none of which is a UN
    // member with an ISO number — so `String(shape.id)` gave all three the
    // literal key "undefined" and React a duplicate-key warning on every
    // render. Duplicate keys are not cosmetic: they let React reuse the wrong
    // node between renders, which on a hover highlight means outlining the
    // wrong country.
    key: String(index),
    // Separate from the key, and empty for those three. An empty id simply
    // finds no row and the shape draws as no-data, which is the truth.
    atlasId: shape.id == null ? "" : String(shape.id),
    name: (shape.properties as { name?: string } | null)?.name ?? "",
    d: toPath(shape) ?? "",
  }))
  // A few geometries project to nothing. There is no shape to draw or hover.
  .filter((shape) => shape.d !== "");

/**
 * Five steps, as a percentage of the hue mixed into the surface.
 *
 * <p>Binned rather than continuous, so the legend can name each step and two
 * countries in the same band are visibly the same band. The lightest is 22%
 * rather than something fainter — below that it stops being distinguishable
 * from the no-data fill, which is the one confusion this scale must not cause.
 */
const STEPS = [22, 40, 58, 78, 100] as const;

function fillFor(step: number): string {
  return `color-mix(in oklch, var(--viz-ramp-2) ${step}%, var(--card))`;
}

/** Which band a country falls in, as a share of the busiest one. */
function bandFor(sessions: number, max: number): number {
  if (sessions <= 0 || max <= 0) return -1;
  const share = sessions / max;
  // `- 1` so a country on exactly the maximum lands in the last band rather
  // than one past the end of the array.
  return Math.min(STEPS.length - 1, Math.floor(share * STEPS.length));
}

export type CountryRow = {
  country: string;
  countryId: string;
  /** ISO 3166-1 numeric — what the topology keys its shapes on. */
  atlasId: string;
  sessions: number;
};

export function CountriesMap({
  rows,
  title,
  note,
}: {
  rows: readonly CountryRow[];
  /**
   * ⚠️ The card's heading, rendered here rather than by the card.
   *
   * <p>The readout sits opposite it on the same line, which it can only do if
   * one component owns both. The alternative — lifting the hovered country up
   * to the workspace so the card could render the readout — would put this
   * component's own interaction state in its parent, and every card on the
   * page would carry a piece of the map.
   */
  title: string;
  note: string;
}) {
  /**
   * ⚠️ The hovered country's id, not the pointer's position.
   *
   * <p>Following the cursor would mean a `mousemove` handler setting state on
   * every pixel and re-rendering 176 paths behind it. The readout has a fixed
   * home in the header instead, so state changes once per country entered —
   * and nothing at all while the pointer moves around inside one.
   */
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const byAtlasId = new Map(rows.map((row) => [row.atlasId, row]));
  const max = rows.reduce((highest, row) => Math.max(highest, row.sessions), 0);

  const hovered = hoveredKey === null ? null : SHAPES.find((shape) => shape.key === hoveredKey);
  const hoveredRow = hovered ? byAtlasId.get(hovered.atlasId) : undefined;

  return (
    <div className="min-w-0">
      {/* Heading on the left, readout on the right, on one line.
          ⚠️ One line, not the two a tooltip panel would take. The slot is
          always occupied — a hint when nothing is hovered, the country when
          something is — so the header never changes height and the map below
          never shifts under the pointer that is pointing at it. A readout that
          moves the thing it describes is worse than no readout. */}
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{note}</p>
        </div>

        <p className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[0.65rem]">
          {hovered ? (
            <>
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{
                  background: hoveredRow ? fillFor(100) : "var(--muted-foreground)",
                }}
              />
              <span className="font-medium">{hovered.name}</span>
              <span className="text-muted-foreground">
                {count(hoveredRow?.sessions ?? 0)} sessions
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Hover a country</span>
          )}
        </p>
      </div>

      <div className="mt-4 min-w-0" onMouseLeave={() => setHoveredKey(null)}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Organic sessions by country. ${rows
            .map((row) => `${row.country}, ${count(row.sessions)}`)
            .join(". ")}.`}
        >
          {SHAPES.map((shape) => {
            const row = byAtlasId.get(shape.atlasId);
            const band = row ? bandFor(row.sessions, max) : -1;

            return (
              <path
                key={shape.key}
                d={shape.d}
                fill={band < 0 ? "var(--muted)" : fillFor(STEPS[band])}
                // A hairline in the surface colour between neighbours, so two
                // countries in the same band stay two countries. Vector-effect
                // keeps it hairline at any scale rather than growing with the
                // viewBox.
                stroke="var(--card)"
                strokeWidth={0.5}
                vectorEffect="non-scaling-stroke"
                // ⚠️ Every country, not only the ones with traffic. "Nothing
                // from here" is an answer, and a map where half the shapes
                // ignore the pointer feels broken rather than empty.
                onMouseEnter={() => setHoveredKey(shape.key)}
                // ⚠️ Per shape, not only on the map as a whole. The ocean is
                // not a path, so sliding off a country into open sea fires no
                // event anywhere — the wrapper's `onMouseLeave` only runs when
                // the pointer leaves the entire map, and until then the last
                // country stayed lit under a pointer that had left it.
                //
                // Guarded, because crossing straight into a neighbour fires
                // this shape's leave around the next shape's enter; clearing
                // unconditionally would wipe the country just entered.
                onMouseLeave={() =>
                  setHoveredKey((current) => (current === shape.key ? null : current))
                }
              />
            );
          })}

          {/* The hovered outline, drawn again on top.
              Paths later in the document overlap earlier ones, so a highlight
              applied in place is clipped by whichever neighbour happens to be
              drawn after it. A second pass, above everything and deaf to the
              pointer, outlines the whole shape whatever its position. */}
          {hovered ? (
            <path
              d={hovered.d}
              fill="none"
              stroke="var(--foreground)"
              strokeWidth={1.25}
              vectorEffect="non-scaling-stroke"
              className="pointer-events-none"
            />
          ) : null}
        </svg>

      </div>

      {/* The key. Without it the shading is decoration — a reader can see that
          one country is darker but not what darker is worth. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[0.6rem] text-muted-foreground">Fewer</span>
          <span className="flex overflow-hidden rounded-[3px]">
            {STEPS.map((step) => (
              <span
                key={step}
                aria-hidden
                className="size-2.5"
                style={{ background: fillFor(step) }}
              />
            ))}
          </span>
          <span className="text-[0.6rem] text-muted-foreground">
            More · up to {count(max)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-[3px]"
            style={{ background: "var(--muted)" }}
          />
          <span className="text-[0.6rem] text-muted-foreground">No sessions</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Component, Suspense, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group } from "three";

import { CoinLoader, CoinUnavailable } from "@/components/settings/coinLoader";

/**
 * The credit coin, as an actual mesh.
 *
 * <p>This work is based on "Stylized Pirate Coin"
 * (https://sketchfab.com/3d-models/stylized-pirate-coin-9135d081eaa74842a121fc3c81291aa3)
 * by DaveNiam (https://sketchfab.com/daveniam) licensed under CC-BY-4.0
 * (http://creativecommons.org/licenses/by/4.0/).
 *
 * <p>⚠️ <b>The credit is a licence condition, not a courtesy.</b> CC BY allows
 * commercial use and requires the author be named — so it is also shown to
 * readers in the Contact and Support panel. A comment in source nobody using
 * the product can see does not satisfy it. If `MODEL_PATH` ever points at a
 * different mesh, check that model's licence before removing this.
 *
 * <p>⚠️ The shipped file is not the download. Sketchfab's glTF came to 3.44MB,
 * almost all of it texture — a 1.8MB metallic-roughness PNG for an ornament
 * rendered about 150px wide. Re-encoded to WebP at 512px it is 133KB, a 26×
 * saving with nothing visible lost at this size. Geometry was left alone:
 * Draco would have saved bytes on 848 triangles that do not exist, at the cost
 * of fetching a decoder at runtime.
 *
 * <p>⚠️ Everything here can fail — the file may be missing, the browser may
 * refuse a WebGL context, the loader throws rather than returning null — and
 * all of it lands on `CoinUnavailable`. A decorative ornament must never be
 * able to take a settings page down with it.
 */

const MODEL_PATH = "/models/pirate-coin.glb";

/**
 * Normalised on what is actually seen, not the bounding sphere.
 *
 * <p>⚠️ This was 1/8.48 — the sphere radius √(6² + 5.908² + 1²), which folds in
 * the coin's 2-unit thickness and its corner diagonal. Neither is ever on
 * screen: the mesh is a disc of ±6 × ±5.908 facing the camera, so the widest
 * thing to frame is 6, and dividing by 8.48 shrank it to about 70% of the size
 * it should be.
 *
 * <p>Read from the file's accessor min/max, not guessed.
 */
const NORMALISE = 1 / 6;

/**
 * Where the entry starts, as a multiple of the settled size.
 *
 * <p>Below 1, so the coin grows into place: it starts at 60% and eases up to
 * full. Above 1 it would begin larger than the frame allows — the visible
 * half-height here is ~1.198 against the coin's 0.985 — and a coin that opens
 * with its edges cut off reads as arriving from outside rather than zooming.
 * Starting small has no such ceiling.
 */
const ENTRY_FROM = 0.6;

/** How long it takes to settle, in seconds. */
const ENTRY_SECONDS = 0.7;

function CoinMesh({ animate }: { animate: boolean }) {
  const group = useRef<Group>(null);
  const started = useRef<number | null>(null);
  const { scene } = useGLTF(MODEL_PATH);

  /**
   * ⚠️ Cloned once, and levelled.
   *
   * <p>`useGLTF` memoises by path, so two coins on a page would otherwise share
   * nodes and the second would steal the first's transform. The clone has to be
   * memoised too — done in the render body it ran on every frame's re-render,
   * rebuilding the scene graph continuously.
   *
   * <p>The levelling is the fix for the diagonal spin. The exported node
   * carries a baked quaternion of about 31° about X — the angle the model was
   * posed at in Sketchfab's viewport — so rotating it about world Y swung it
   * through a cone rather than turning it on the spot. The geometry itself is a
   * disc in the XY plane (±6 × ±5.9 × ±1), so with the node's rotation cleared
   * the face points straight down +Z at the camera and a Y spin is the coin
   * turning about its own vertical diameter.
   *
   * <p>Safe here because the file has exactly one node. A model with a real
   * hierarchy would need the tilt cancelled on the root instead of every
   * transform in the tree flattened.
   */
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => object.quaternion.identity());
    return clone;
  }, [scene]);

  useFrame((state, delta) => {
    const coin = group.current;
    if (!coin) return;

    // Slow enough to read as "this is an object", not a spinner.
    coin.rotation.y += delta * 0.45;

    /**
     * ⚠️ The entry is a scale, and it grows: a zoom in.
     *
     * <p>This was `Bounds fit`, which animates the camera to frame the mesh —
     * and which way that reads depends on where the camera happened to start,
     * so it kept coming out wrong whichever end I set. Animating the coin's own
     * scale means the direction is one number, `ENTRY_FROM`: below 1 zooms in,
     * above 1 zooms out. There is no fitting pass left to argue with it.
     *
     * <p>Timed from the clock rather than counted in frames, so it lasts the
     * same 0.7s on a 60Hz panel and a 144Hz one.
     */
    if (!animate) {
      coin.scale.setScalar(NORMALISE);
      return;
    }

    started.current ??= state.clock.elapsedTime;
    const progress = Math.min((state.clock.elapsedTime - started.current) / ENTRY_SECONDS, 1);
    // easeOutCubic: most of the movement early, then it settles rather than
    // arriving at speed.
    const eased = 1 - (1 - progress) ** 3;

    coin.scale.setScalar(NORMALISE * (ENTRY_FROM + (1 - ENTRY_FROM) * eased));
  });

  return (
    <group ref={group} scale={NORMALISE * (animate ? ENTRY_FROM : 1)}>
      <primitive object={model} />
    </group>
  );
}

/**
 * The canvas, and the thing that makes the first paint smooth.
 *
 * <p>⚠️ `useGLTF` is called here, <b>outside</b> the canvas, purely so this
 * component suspends until the model is ready. The canvas is then mounted with
 * the mesh already in hand.
 *
 * <p>The alternative — canvas first, model streaming in behind a Suspense
 * inside it — is what made the first load ugly: an empty transparent canvas is
 * laid out and composited before there is anything to draw, so its box shows
 * for a beat and the coin pops in afterwards. Loading first means one
 * transition instead of two, and nothing on screen that is not finished.
 */
function CoinCanvas({ still }: { still: boolean }) {
  useGLTF(MODEL_PATH);

  return (
    <Canvas
      /**
       * ⚠️ Fixed, and derived rather than tuned.
       *
       * The mesh is normalised so its widest visible extent is 1, and the
       * vertical field of view is 35°, so the half-height at distance d is
       * d·tan(17.5°). At 3.4 that is ~1.072 against the coin's 0.985 — about
       * 92% of the frame, up from 82% at 3.8. Closer still is possible but the
       * margin stops being a margin: at 3.2 it is 98%, and the coin touches the
       * edges of a box it shares with a heading and a figure.
       *
       * Nothing moves the camera any more — the entry is the coin's own scale —
       * so this is the one distance.
       *
       * Dead-on at y = 0. The old 0.6 lift tipped the camera down at it, which
       * added a slant of its own on top of the model's baked one.
       */
      camera={{ position: [0, 0, 3.4], fov: 35 }}
      // ⚠️ Explicitly transparent. Some browsers paint a fresh canvas white for
      // a frame before the first clear, which is the flash that showed up in
      // the coin's place on reload.
      onCreated={({ gl }) => gl.setClearAlpha(0)}
      // Capped at 2: a coin does not need a phone's full pixel ratio, and
      // uncapped it renders four times the pixels for no visible gain.
      dpr={[1, 2]}
      // ⚠️ Honours the system setting. A permanently rotating object is
      // exactly what "reduce motion" is about; `demand` renders a single frame
      // and stops, so the coin is there and simply holds still.
      frameloop={still ? "demand" : "always"}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
      className="animate-in fade-in duration-500 motion-reduce:animate-none"
    >
      {/* Simple lights rather than drei's `Environment`, which fetches an HDRI
          — a second network request, for an ornament. */}
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <directionalLight position={[-4, -2, -3]} intensity={0.7} />

      <CoinMesh animate={!still} />
    </Canvas>
  );
}

/**
 * ⚠️ A class, because React only offers error boundaries as classes. Nothing
 * else in this codebase is one, and this is the reason.
 */
class CoinBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Coin3D({ className }: { className?: string }) {
  const still =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <CoinBoundary fallback={<CoinUnavailable className={className} />}>
      <Suspense fallback={<CoinLoader className={className} />}>
        <div className={className}>
          <CoinCanvas still={still} />
        </div>
      </Suspense>
    </CoinBoundary>
  );
}

useGLTF.preload(MODEL_PATH);

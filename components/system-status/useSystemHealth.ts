"use client"

import { useEffect, useRef, useState } from "react"

import { readSystemHealth } from "@/app/(private)/system-status/actions"
import type { SystemHealth } from "@/lib/system/healthTypes"

/**
 * Keeps the System status page live, and remembers the last five minutes.
 *
 * <p>Asks the backend every five seconds. <b>Nothing is stored</b>: the history
 * is an array in this tab — open the page and the graphs start empty and fill,
 * like Task Manager. It can tell you the machine is struggling now, never what
 * happened at three in the morning; that would need a table, and can be added
 * later without changing any of this. (Same model as the LMS.)
 *
 * <p><b>Rates are worked out here.</b> Network bytes and request totals arrive
 * as running totals; a rate is the difference between two readings, so only the
 * one taking the readings can compute it. The first reading only sets the
 * baseline, rather than drawing a made-up first point.
 */

/** How many readings the graphs draw. At 5 s each, five minutes. */
const HISTORY = 60
const INTERVAL_MS = 5000

export type Sample = {
  cpu: number
  memory: number
  heap: number
  latency: number
  /** Bytes per second. */
  networkIn: number
  networkOut: number
  requestsPerMinute: number
  /** Per-container CPU, by name — containers are replaced on every deploy, so not by position. */
  containerCpu: Record<string, number>
}

export type SystemHealthState = {
  /** The latest reading, or null before the first one. */
  current: SystemHealth | null
  /** Oldest first. */
  history: Sample[]
  /** Set when a poll fails; the last good reading stays on screen. */
  error: string | null
}

export function useSystemHealth(initial: SystemHealth | null, initialError: string | null): SystemHealthState {
  const [current, setCurrent] = useState<SystemHealth | null>(initial)
  const [history, setHistory] = useState<Sample[]>([])
  const [error, setError] = useState<string | null>(initialError)
  /** The previous reading, for turning running totals into rates. Not seeded from the server's: its time is unknown here. */
  const previous = useRef<{ health: SystemHealth; at: number } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      // A hidden tab does not need a graph; it catches up when shown again.
      if (document.visibilityState !== "visible") return
      try {
        const result = await readSystemHealth()
        if (cancelled) return
        if (!result.ok) {
          setError(result.error)
          return
        }

        const health = result.data
        const now = Date.now()
        const last = previous.current
        setCurrent(health)
        setError(null)

        if (last) {
          const seconds = Math.max((now - last.at) / 1000, 0.001)
          const sample: Sample = {
            cpu: health.server.cpuPercent,
            memory: share(health.server.memoryTotal - health.server.memoryAvailable, health.server.memoryTotal),
            heap: share(health.backend.heapUsed, health.backend.heapMax),
            latency: health.backend.p95Millis,
            networkIn: Math.max(0, (health.server.networkIn - last.health.server.networkIn) / seconds),
            networkOut: Math.max(0, (health.server.networkOut - last.health.server.networkOut) / seconds),
            requestsPerMinute: Math.max(0, ((health.backend.totalRequests - last.health.backend.totalRequests) / seconds) * 60),
            containerCpu: Object.fromEntries((health.containers?.items ?? []).map((c) => [c.name, c.cpuPercent])),
          }
          setHistory((h) => [...h, sample].slice(-HISTORY))
        }
        previous.current = { health, at: now }
      } catch {
        if (!cancelled) setError("Could not reach the server.")
      }
    }

    void poll()
    const timer = window.setInterval(poll, INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  return { current, history, error }
}

function share(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0
}

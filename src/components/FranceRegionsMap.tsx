import React from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { scaleLinear } from "d3-scale"

const FR_REGIONS_GEOJSON =
  "https://france-geojson.gregoiredavid.fr/repo/regions.geojson"

type RegionAgg = {
  code?: string
  name?: string
  orders: number
  revenue: number
}

type GeographyFeature = {
  rsmKey: string
  id?: string | number
  properties?: { code?: string; nom?: string; [k: string]: unknown }
  [k: string]: unknown
}

type GeographiesRenderProps = { geographies: GeographyFeature[] }

const fmtEur = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 })

const FranceRegionsMap: React.FC<{
  data: Record<string, RegionAgg>
  getKey?: (props: GeographyFeature) => string
}> = ({
  data,
  getKey = (p) => String(p.properties?.code || p.properties?.nom || "").toUpperCase(),
}) => {
  const maxOrders =
    Object.values(data).reduce((m, r) => Math.max(m, r?.orders || 0), 0) || 1
  const color = scaleLinear<string>().domain([0, maxOrders]).range(["#e9f5ee", "#14532d"])

  const containerRef = React.useRef<HTMLDivElement>(null)
  const [tip, setTip] = React.useState<{ x: number; y: number; text: string } | null>(null)

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h4 className="text-sm font-semibold text-dark-green mb-3">Commandes par région</h4>

      <div ref={containerRef} className="relative w-full h-[420px]">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [2.3, 46.5], scale: 1700 }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={FR_REGIONS_GEOJSON as any}>
            {({ geographies }: GeographiesRenderProps) =>
              geographies.map((geo: GeographyFeature) => {
                const key = getKey(geo)
                const code = String(geo.properties?.code ?? "").toUpperCase()
                const nomLower = String(geo.properties?.nom ?? "").toLowerCase()

                const rec =
                  data[key] ||
                  (code && data[code]) ||
                  (nomLower && data[nomLower])

                const orders = rec?.orders ?? 0
                const revenue = rec?.revenue ?? 0

                const handleEnterOrMove = (e: React.MouseEvent<SVGPathElement, MouseEvent>) => {
                  const rect = containerRef.current?.getBoundingClientRect()
                  const name = (geo.properties?.nom as string) || key
                  if (!rect) return
                  setTip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    text: `${name}\nCmd: ${orders} • CA: ${fmtEur(revenue)}`,
                  })
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo as any}
                    fill={color(orders)}
                    stroke="#ffffff"
                    strokeWidth={0.8}
                    onMouseEnter={handleEnterOrMove}
                    onMouseMove={handleEnterOrMove}
                    onMouseLeave={() => setTip(null)}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "#0f5132" },
                      pressed: { outline: "none" },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>

        {tip && (
          <div
            className="pointer-events-none absolute z-10 rounded-md bg-black/70 text-white text-xs px-2 py-1 whitespace-pre"
            style={{ left: tip.x + 10, top: tip.y - 40 }}
          >
            {tip.text}
          </div>
        )}

        <div className="absolute bottom-3 left-3 bg-white/90 border rounded px-2 py-1 text-[11px]">
          <div className="font-semibold text-gray-800 mb-1">Commandes</div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-4 h-3" style={{ background: color(0) }} />
            0
            <span
              className="inline-block w-16 h-3"
              style={{
                background: `linear-gradient(90deg, ${color(0)}, ${color(maxOrders)})`,
              }}
            />
            {maxOrders}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FranceRegionsMap

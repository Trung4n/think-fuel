export function getFuelMode(fuel) {
  if (fuel > 700) return { label: 'Full Help', color: '#14B8A6' }
  if (fuel >= 300) return { label: 'Guided', color: '#F59E0B' }
  if (fuel >= 1) return { label: 'Socratic', color: '#EA580C' }
  return { label: 'Locked', color: '#E11D48' }
}

export default function FuelBar({ fuel, maxFuel, showLabel = true }) {
  const pct = maxFuel > 0 ? Math.min(100, (fuel / maxFuel) * 100) : 0
  const { label, color } = getFuelMode(fuel)

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-500">Brain Fuel</span>
          <span className="text-xs font-semibold font-mono" style={{ color }}>
            {fuel} / {maxFuel} — {label}
          </span>
        </div>
      )}
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

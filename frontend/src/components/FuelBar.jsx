export function getFuelMode(fuel) {
  if (fuel > 700) return { label: 'Full Help', color: '#06B6D4' }
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
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Brain Fuel</span>
          <span className="text-xs font-medium" style={{ color }}>
            {fuel} / {maxFuel} — {label}
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

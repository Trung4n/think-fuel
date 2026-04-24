import { getFuelMode } from './FuelBar'

export default function ModeTag({ fuel }) {
  const { label, color } = getFuelMode(fuel)
  return (
    <span
      className="text-xs font-mono px-2 py-0.5 rounded border"
      style={{ color, borderColor: color, backgroundColor: `${color}18` }}
    >
      {label}
    </span>
  )
}

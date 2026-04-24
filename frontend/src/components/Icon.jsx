import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// Centralized icon component — wraps FontAwesomeIcon with consistent defaults.
// Import icon objects from @fortawesome/free-solid-svg-icons (or *-regular, *-brands)
// and pass them via the `icon` prop.
export default function Icon({ icon, size, className, style, fixedWidth = false, spin = false }) {
  return (
    <FontAwesomeIcon
      icon={icon}
      className={className}
      style={style}
      fixedWidth={fixedWidth}
      spin={spin}
      {...(size ? { size } : {})}
    />
  )
}

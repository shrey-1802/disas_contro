/**
 * Status Badge Component Render Helper
 * Enforces the strict 3-tier operational model (SAFE, CAUTION, BLOCKED)
 * Always pairs ICON + TEXT LABEL (Never color alone)
 */

export const STATUS_TIERS = {
  SAFE: {
    key: 'safe',
    label: 'SAFE',
    badgeClass: 'status-badge--safe',
    icon: '✓'
  },
  CAUTION: {
    key: 'caution',
    label: 'CAUTION',
    badgeClass: 'status-badge--caution',
    icon: '▲'
  },
  BLOCKED: {
    key: 'blocked',
    label: 'BLOCKED',
    badgeClass: 'status-badge--blocked',
    icon: '🛑'
  }
};

/**
 * Maps backend road/bridge status string to approved 3-tier tier
 */
export function mapStatusToTier(backendStatus) {
  if (!backendStatus) return STATUS_TIERS.SAFE;
  const statusLower = String(backendStatus).toLowerCase();

  switch (statusLower) {
    case 'normal':
    case 'recoverable':
    case 'safe':
    case 'clear':
      return STATUS_TIERS.SAFE;

    case 'degraded':
    case 'restricted':
    case 'caution':
    case 'warning':
      return STATUS_TIERS.CAUTION;

    case 'hazardous':
    case 'impassable':
    case 'blocked':
    case 'closed':
    case 'stranded':
      return STATUS_TIERS.BLOCKED;

    default:
      return STATUS_TIERS.SAFE;
  }
}

/**
 * Renders HTML for a status badge
 */
export function renderStatusBadge(backendStatus, customText = null) {
  const tier = mapStatusToTier(backendStatus);
  const text = customText || tier.label;

  return `
    <span class="status-badge ${tier.badgeClass}">
      <span class="status-badge__icon" aria-hidden="true">${tier.icon}</span>
      <span class="status-badge__text">${text}</span>
    </span>
  `;
}

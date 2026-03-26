import { getDomain } from '../lib/domains';

export default function DomainBadge({ domainId, size = 'sm' }) {
  const domain = getDomain(domainId);
  const Icon = domain.icon;
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded-full font-semibold`}
      style={{ background: `${domain.color}20`, color: domain.color }}
    >
      <Icon size={size === 'sm' ? 12 : 14} />
      {domain.label}
    </span>
  );
}

import useSWR from 'swr';
import { fetcher } from './api';
import {
  Users, Target, GraduationCap, DollarSign, Settings, Heart,
  Folder, BarChart3, Briefcase, Building, Shield, Zap, Globe,
  BookOpen, Cpu, Database, FileText, Layers, Package, TrendingUp
} from 'lucide-react';

const ICON_MAP = {
  Users, Target, GraduationCap, DollarSign, Settings, Heart,
  Folder, BarChart3, Briefcase, Building, Shield, Zap, Globe,
  BookOpen, Cpu, Database, FileText, Layers, Package, TrendingUp,
};

export function getIcon(iconName) {
  return ICON_MAP[iconName] || Folder;
}

// Default fallback domains (used before API loads)
const FALLBACK_DOMAINS = [
  { id: 'workforce_planning', label: 'Workforce Planning', color: '#3B82F6', icon: 'Users' },
  { id: 'talent_acquisition', label: 'Talent Acquisition', color: '#8B5CF6', icon: 'Target' },
  { id: 'people_development', label: 'People Development', color: '#10B981', icon: 'GraduationCap' },
  { id: 'compensation_benefits', label: 'Compensation & Benefits', color: '#F59E0B', icon: 'DollarSign' },
  { id: 'hr_operations', label: 'HR Operations', color: '#EC4899', icon: 'Settings' },
  { id: 'diversity_inclusion', label: 'Diversity & Inclusion', color: '#06B6D4', icon: 'Heart' },
];

// SWR hook for components that need reactive domain data
export function useDomains() {
  const { data, isLoading } = useSWR('/domains', fetcher);
  const domains = (data && data.length > 0) ? data : FALLBACK_DOMAINS;
  return { domains, isLoading };
}

// Synchronous helper — works with cached SWR data or fallback
let _cachedDomains = FALLBACK_DOMAINS;

export function setCachedDomains(domains) {
  if (domains && domains.length > 0) _cachedDomains = domains;
}

export function getDomain(id) {
  const found = _cachedDomains.find(d => d.id === id);
  if (found) return { ...found, icon: getIcon(found.icon) };
  return { id, label: id, color: '#6B7280', icon: Folder };
}

// Legacy export for components using DOMAINS directly
export const DOMAINS = FALLBACK_DOMAINS;

export const ICON_OPTIONS = Object.keys(ICON_MAP);

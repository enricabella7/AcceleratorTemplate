import { Users, Target, GraduationCap, DollarSign, Settings, Heart } from 'lucide-react';

export const DOMAINS = [
  { id: 'workforce_planning', label: 'Workforce Planning', color: '#3B82F6', icon: Users },
  { id: 'talent_acquisition', label: 'Talent Acquisition', color: '#8B5CF6', icon: Target },
  { id: 'people_development', label: 'People Development', color: '#10B981', icon: GraduationCap },
  { id: 'compensation_benefits', label: 'Compensation & Benefits', color: '#F59E0B', icon: DollarSign },
  { id: 'hr_operations', label: 'HR Operations', color: '#EC4899', icon: Settings },
  { id: 'diversity_inclusion', label: 'Diversity & Inclusion', color: '#06B6D4', icon: Heart },
];

export function getDomain(id) {
  return DOMAINS.find(d => d.id === id) || { id, label: id, color: '#6B7280', icon: Users };
}

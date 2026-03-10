export const PIPELINE_STAGES = [
  { id: 'Nouveau Lead', label: 'Nouveau Lead', colorClass: 'bg-blue-500', colorHex: '#3b82f6' },
  { id: 'Decouverte des besoins (Audit)', label: 'Découverte des besoins (Audit)', colorClass: 'bg-indigo-500', colorHex: '#6366f1' },
  { id: 'Demonstration 3DEXPERIENCE', label: 'Démonstration 3DEXPERIENCE', colorClass: 'bg-cyan-500', colorHex: '#06b6d4' },
  { id: 'POC (Proof of Concept)', label: 'POC (Proof of Concept)', colorClass: 'bg-amber-500', colorHex: '#f59e0b' },
  { id: 'Negociation contractuelle', label: 'Négociation contractuelle', colorClass: 'bg-orange-500', colorHex: '#f97316' },
  { id: 'Gagne', label: 'Gagné', colorClass: 'bg-green-500', colorHex: '#22c55e' },
  { id: 'Perdu', label: 'Perdu', colorClass: 'bg-red-500', colorHex: '#ef4444' },
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[number]['id'];
export type LegacyLeadStatus = 'nouveau' | 'en cours' | 'converti' | 'perdu';
export type LeadStatus = PipelineStageId | LegacyLeadStatus;

const LEGACY_TO_STAGE: Record<LegacyLeadStatus, PipelineStageId> = {
  nouveau: 'Nouveau Lead',
  'en cours': 'Decouverte des besoins (Audit)',
  converti: 'Gagne',
  perdu: 'Perdu',
};

export function normalizeLeadStatus(status: string | null | undefined): PipelineStageId {
  if (!status) return 'Nouveau Lead';
  const raw = status as LeadStatus;
  if ((PIPELINE_STAGES as readonly { id: string }[]).some((stage) => stage.id === raw)) {
    return raw as PipelineStageId;
  }
  if (raw in LEGACY_TO_STAGE) {
    return LEGACY_TO_STAGE[raw as LegacyLeadStatus];
  }
  return 'Nouveau Lead';
}

export function isOpenStage(status: string | null | undefined): boolean {
  const normalized = normalizeLeadStatus(status);
  return normalized !== 'Gagne' && normalized !== 'Perdu';
}

export function isWonStage(status: string | null | undefined): boolean {
  return normalizeLeadStatus(status) === 'Gagne';
}

export function isLostStage(status: string | null | undefined): boolean {
  return normalizeLeadStatus(status) === 'Perdu';
}

export function stageColorClass(status: string | null | undefined): string {
  const normalized = normalizeLeadStatus(status);
  const found = PIPELINE_STAGES.find((s) => s.id === normalized);
  return found?.colorClass ?? 'bg-slate-500';
}

export function stageColorHex(status: string | null | undefined): string {
  const normalized = normalizeLeadStatus(status);
  const found = PIPELINE_STAGES.find((s) => s.id === normalized);
  return found?.colorHex ?? '#64748b';
}

const VALID_STATUSES = new Set(['qualified', 'partial', 'highRisk', 'irreversible', 'rejected']);

function normalizeCandidate(candidate, index) {
  if (typeof candidate === 'string') {
    return { id: `candidate-${index + 1}`, text: candidate, status: 'qualified', notes: [], weight: 1, tags: [] };
  }
  if (!candidate || typeof candidate !== 'object') throw new Error(`Invalid ankage candidate at index ${index}`);
  const status = candidate.status || 'qualified';
  if (!VALID_STATUSES.has(status)) throw new Error(`Invalid ankage status: ${status}`);
  return {
    id: candidate.id || `candidate-${index + 1}`,
    text: candidate.text || candidate.label || candidate.content || '',
    status,
    weight: Number(candidate.weight ?? 1),
    notes: Array.isArray(candidate.notes) ? candidate.notes : candidate.note ? [candidate.note] : [],
    tags: Array.isArray(candidate.tags) ? candidate.tags : [],
  };
}

function prepareAnkage(candidates, options = {}) {
  if (!Array.isArray(candidates)) throw new Error('prepareAnkage requires an array of candidates');
  const normalized = candidates.map(normalizeCandidate);
  const selectableStatuses = new Set(options.includeIrreversible ? ['qualified', 'partial', 'highRisk', 'irreversible'] : ['qualified', 'partial', 'highRisk']);
  const selectable = normalized.filter(x => selectableStatuses.has(x.status));
  return {
    kind: 'ankage',
    total: normalized.length,
    selectableCount: selectable.length,
    candidates: normalized,
    selectable,
    rejected: normalized.filter(x => x.status === 'rejected'),
    irreversible: normalized.filter(x => x.status === 'irreversible'),
    reminder: '安价候选不是裁决；必须先过知识、能力、感知、心理、动机、资源、关系和世界规则校验。',
  };
}

module.exports = {
  prepareAnkage,
  VALID_STATUSES,
};

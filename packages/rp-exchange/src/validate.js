const ALLOWED_TYPES = new Set([
  'physique_bloodline',
  'energy_foundation',
  'foundation_based_ability',
  'non_foundation_body_soul_technique',
  'item',
  'knowledge',
  'contract',
]);

const ALLOWED_CONTRACT_SUBTYPES = new Set([
  'familiar_contract',
  'specific_character_summon_contract',
  'teammate_world_travel_contract',
]);

const FORBIDDEN_TYPE_HINTS = [
  'system', '系统', '情报', '攻略', '未来剧情', '秘密', '碎片', '残缺', '试用', '弱化', '单招',
];

function validateCompleteness(entry) {
  const c = entry.completeness || {};
  if (c.isCompleteUnit !== true) throw new Error('Exchange entry must be a complete unit');
  if (c.notFragment !== true) throw new Error('Exchange entry must not be a fragment');
  if (c.notTrial !== true) throw new Error('Exchange entry must not be a trial version');
  if (c.notWeakened !== true) throw new Error('Exchange entry must not be weakened');
  const text = `${entry.name || ''} ${entry.description || ''} ${c.notes || ''}`;
  for (const hint of FORBIDDEN_TYPE_HINTS) {
    if (text.includes(hint)) throw new Error(`Forbidden exchange hint: ${hint}`);
  }
  return true;
}

function validateType(entry) {
  if (!ALLOWED_TYPES.has(entry.type)) throw new Error(`Invalid exchange type: ${entry.type}`);
  if (entry.type === 'knowledge' && entry.subtype === 'information') throw new Error('Knowledge exchange must not include information/intelligence');
  if (entry.type === 'contract' && !ALLOWED_CONTRACT_SUBTYPES.has(entry.subtype)) throw new Error(`Invalid contract subtype: ${entry.subtype}`);
  return true;
}

function validateSource(entry) {
  const source = entry.source || {};
  if (source.status === 'archived') {
    if (!Array.isArray(source.refs) || source.refs.length < 1) throw new Error('Archived exchange entry requires world_query ref/sourceRef');
    if (source.verificationStatus !== 'verified') throw new Error('Archived exchange entry must be verified');
    return true;
  }
  if (source.status === 'unarchived') {
    const webSources = Array.isArray(source.webSources) ? source.webSources : [];
    if (webSources.length < 2) throw new Error('Unarchived exchange entry requires at least two independent sources');
    if (source.verificationStatus !== 'verified') throw new Error('Unarchived exchange entry must be double-source verified');
    for (const s of webSources) {
      if (!s.url || !s.title || !s.fetchedAt || !s.summary) throw new Error('Each web source requires url/title/fetchedAt/summary');
    }
    return true;
  }
  throw new Error(`Invalid source status: ${source.status}`);
}

function validateEvaluation(entry) {
  const ev = entry.evaluation || {};
  if (ev.evaluationMethod !== 'multi-world-evaluation-method-v1') throw new Error('Exchange entry evaluation must use multi-world-evaluation-method-v1');
  if (!ev.framework && !ev.ratingSystem) throw new Error('Exchange entry evaluation requires framework or ratingSystem');
  const rating = ev.pricingRating ?? ev.overall ?? ev.rating ?? ev.n ?? entry.rating?.n;
  if (rating === undefined || rating === null || rating === '') throw new Error('Exchange entry evaluation requires pricing/overall N rating');
  if (!ev.basis && !entry.rating?.evidence) throw new Error('Exchange entry evaluation requires basis/evidence');
  if (!ev.evidence && !entry.rating?.evidence) throw new Error('Exchange entry evaluation requires evidence record');
  return true;
}

function validateEntry(entry) {
  if (!entry || typeof entry !== 'object') throw new Error('Entry must be object');
  if (!entry.id || !entry.name) throw new Error('Entry requires id and name');
  validateType(entry);
  validateCompleteness(entry);
  validateSource(entry);
  validateEvaluation(entry);
  return true;
}

module.exports = { validateEntry, validateType, validateCompleteness, validateSource, validateEvaluation, ALLOWED_TYPES, ALLOWED_CONTRACT_SUBTYPES };

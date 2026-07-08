function formatRollValue(roll) {
  const marks = [];
  if (roll.success) marks.push('✓');
  if (roll.triggersAgain) marks.push('↻');
  return `${roll.value}${marks.join('')}`;
}

function formatPoolResult(result) {
  const dice = result.rolls.map(formatRollValue).join(', ') || '(no dice)';
  const label = result.label ? `${result.label}: ` : '';
  return [
    `${label}${result.outcomeLabel}`,
    `骰池=${result.config.pool} DC=${result.dc} 成功阈值=${result.config.targetNumber}+ 加骰=${result.config.again || 'none'}`,
    `骰面=[${dice}] 成功数=${result.successes} margin=${result.margin}`,
    `seedTime=${result.seed.seedTime} seedHash=${result.seed.seedHash} replayable=false`,
  ].join('\n');
}

function formatContestResult(result) {
  return [
    `${result.outcomeLabel} margin=${result.margin}`,
    `行动方: ${result.actor.successes} successes [${result.actor.rolls.map(formatRollValue).join(', ')}]`,
    `对抗方: ${result.opponent.successes} successes [${result.opponent.rolls.map(formatRollValue).join(', ')}]`,
    `seedTime=${result.seed.seedTime} seedHash=${result.seed.seedHash} replayable=false`,
  ].join('\n');
}

function formatTableResult(result) {
  const roll = result.roll === null || result.roll === undefined ? `weight ${result.weight}/${result.totalWeight}` : `roll=${result.roll}`;
  return [
    `${result.tableName || result.tableId || 'table'}: ${result.selectedText}`,
    `${result.mode} ${roll}`,
    `seedTime=${result.seed.seedTime} seedHash=${result.seed.seedHash} replayable=false`,
  ].join('\n');
}

function formatAnkageResult(result) {
  return [
    `安价候选：total=${result.total} selectable=${result.selectableCount}`,
    `可选=${result.selectable.map(x => `${x.id}:${x.status}`).join(', ') || '(none)'}`,
    `剔除=${result.rejected.map(x => x.id).join(', ') || '(none)'}`,
    result.reminder,
  ].join('\n');
}

function formatResult(result) {
  if (result.kind === 'pool') return formatPoolResult(result);
  if (result.kind === 'contest') return formatContestResult(result);
  if (result.kind === 'table' || result.kind === 'anka') return formatTableResult(result);
  if (result.kind === 'ankage') return formatAnkageResult(result);
  return JSON.stringify(result, null, 2);
}

module.exports = {
  formatPoolResult,
  formatContestResult,
  formatTableResult,
  formatAnkageResult,
  formatResult,
};

import { getCurrentModuloDB, nextCurrentModuloDB, setModuloDB, resolveUserId } from '../Repositories/modulo.repository.js';
import { incrementXp } from './exp.service.js';

const MODULE_COLUMNS = {
  codigotransito: 'modulo_codigotransito',
  codigodetransito: 'modulo_codigotransito',
  'codigo-transito': 'modulo_codigotransito',
  legislacao: 'modulo_codigotransito',
  modulo_codigotransito: 'modulo_codigotransito',

  placastransito: 'modulo_placastransito',
  placatransito: 'modulo_placastransito',
  'placas-transito': 'modulo_placastransito',
  'placa-transito': 'modulo_placastransito',
  sinalizacao: 'modulo_placastransito',
  modulo_placastransito: 'modulo_placastransito',

  direcaodefensiva: 'modulo_direcaodefensiva',
  direcaoofensiva: 'modulo_direcaodefensiva',
  'direcao-defensiva': 'modulo_direcaodefensiva',
  seguranca: 'modulo_direcaodefensiva',
  modulo_direcaodefensiva: 'modulo_direcaodefensiva',

  primeirossocorros: 'modulo_primeirossocorros',
  'primeiros-socorros': 'modulo_primeirossocorros',
  socorros: 'modulo_primeirossocorros',
  modulo_primeirossocorros: 'modulo_primeirossocorros',

  cidadania: 'modulo_cidadania',
  meioambiente: 'modulo_cidadania',
  'meio-ambiente': 'modulo_cidadania',
  meioambienteecidadania: 'modulo_cidadania',
  modulo_cidadania: 'modulo_cidadania'
};

const CANONICAL_NAMES = {
  modulo_codigotransito: 'CodigoTransito',
  modulo_placastransito: 'PlacasTransito',
  modulo_direcaodefensiva: 'DirecaoDefensiva',
  modulo_primeirossocorros: 'PrimeirosSocorros',
  modulo_cidadania: 'Cidadania'
};

export function resolveModuleColumn(content) {
  if (!content) return null;
  const key = String(content).toLowerCase().replace(/[^a-z0-9]/g, '');
  return MODULE_COLUMNS[key] || MODULE_COLUMNS[String(content).toLowerCase()] || null;
}

export function getAll(content) {
  if (!content) return MODULE_COLUMNS;
  const col = resolveModuleColumn(content);
  return col ? { [content]: col } : MODULE_COLUMNS;
}

export async function getCurrent(content, userId) {
  const column = resolveModuleColumn(content);
  if (!column) {
    throw new Error(`Conteúdo inválido: "${content}". Conteúdos aceitos: CodigoTransito, PlacasTransito, DirecaoDefensiva, PrimeirosSocorros, Cidadania.`);
  }

  const resolvedUserId = await resolveUserId(userId);
  const query = await getCurrentModuloDB(column, resolvedUserId);
  const row = query?.rows[0];
  const rawValue = row && row[column] !== undefined ? Number(row[column]) : 1;
  const moduloAtual = Math.max(1, rawValue || 1);
  const canonical = CANONICAL_NAMES[column] || content;

  return {
    success: true,
    conteudo: canonical,
    coluna: column,
    modulo_atual: moduloAtual,
    userId: resolvedUserId
  };
}

export async function moveToNext(content, userId) {
  const column = resolveModuleColumn(content);
  if (!column) {
    throw new Error(`Conteúdo inválido: "${content}". Conteúdos aceitos: CodigoTransito, PlacasTransito, DirecaoDefensiva, PrimeirosSocorros, Cidadania.`);
  }

  const resolvedUserId = await resolveUserId(userId);
  const canonical = CANONICAL_NAMES[column] || content;

  const currentQuery = await getCurrentModuloDB(column, resolvedUserId);
  const currentRow = currentQuery?.rows[0];
  const currentRaw = currentRow && currentRow[column] !== undefined ? Number(currentRow[column]) : 1;
  const moduloAnterior = Math.max(1, currentRaw || 1);

  const query = await nextCurrentModuloDB(column, resolvedUserId);
  const row = query?.rows[0];
  const rawValue = row && row[column] !== undefined ? Number(row[column]) : 1;
  const moduloAtual = Math.max(1, rawValue || 1);

  let expTotal = null;
  const realmenteAvancou = moduloAtual > moduloAnterior;
  const xpGanha = realmenteAvancou ? 25 : 0;

  if (realmenteAvancou) {
    try {
      expTotal = await incrementXp(resolvedUserId, xpGanha);
    } catch (err) {
      console.warn('[ModuloService] Não foi possível incrementar XP:', err.message);
    }
  }

  return {
    success: true,
    conteudo: canonical,
    coluna: column,
    modulo_atual: moduloAtual,
    modulo_anterior: moduloAnterior,
    xp_ganha: xpGanha,
    exp_total: expTotal,
    message: realmenteAvancou 
      ? `Avanço realizado com sucesso! Você entrou no Módulo ${moduloAtual} de ${canonical}.`
      : `Você avançou no módulo de ${canonical}.`,
    userId: resolvedUserId
  };
}

export async function setPointer(content, userId, novoNumero) {
  const column = resolveModuleColumn(content);
  if (!column) {
    throw new Error(`Conteúdo inválido: "${content}".`);
  }

  const resolvedUserId = await resolveUserId(userId);
  const num = Math.max(1, Number(novoNumero) || 1);
  await setModuloDB(column, resolvedUserId, num);
  const canonical = CANONICAL_NAMES[column] || content;

  return {
    success: true,
    conteudo: canonical,
    coluna: column,
    modulo_atual: num,
    userId: resolvedUserId,
    message: `Ponteiro do módulo atualizado para o Módulo ${num}!`
  };
}
import { getCurrentModuloDB, nextCurrentModuloDB } from '../Repositories/modulo.repository.js';

const modules = {
  CodigoTransito: 'modulo_codigotransito',
  PlacasTransito: 'modulo_placastransito',
  DirecaoDefensiva: 'modulo_direcaodefensiva',
  PrimeirosSocorros: 'modulo_primeirossocorros',
  Cidadania: 'modulo_cidadania'
};

export function getAll(content) {
  return content ? modules[content] : modules;
}

export async function getCurrent(content, userId) {
  const column = modules[content];
  if (!column) {
    throw new Error('Conteúdo inválido');
  }

  const query = await getCurrentModuloDB(column, userId);
  const row = query?.rows[0];
  const moduloAtual = row && row[column] !== undefined ? Number(row[column]) : 0;

  return {
    conteudo: content,
    modulo_atual: moduloAtual
  };
}

export async function moveToNext(content, userId) {
  const column = modules[content];
  if (!column) {
    throw new Error('Conteúdo inválido');
  }

  const query = await nextCurrentModuloDB(column, userId);
  const row = query?.rows[0];
  const moduloAtual = row && row[column] !== undefined ? Number(row[column]) : 0;

  return {
    conteudo: content,
    modulo_atual: moduloAtual
  };
}
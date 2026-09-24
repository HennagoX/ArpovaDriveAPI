import pool from '../Repositories/db.js';

export const TITULOS_NIVEL = [
  'Futuro Condutor',            // Lv 1
  'Aluno em Formação',          // Lv 2
  'Aprendiz da Legislação',     // Lv 3
  'Conhecedor de Placas',       // Lv 4
  'Motorista Consciente',       // Lv 5
  'Piloto Preventivo',          // Lv 6
  'Motorista em Treinamento',   // Lv 7
  'Condutor Experiente',        // Lv 8
  'Mestre da Direção Defensiva',// Lv 9
  'Perito no Trânsito',         // Lv 10
  'Piloto de Elite',            // Lv 11
  'Ás do Volante',              // Lv 12
  'Especialista DETRAN',        // Lv 13
  'Instrutor Honorário',        // Lv 14
  'Lenda do Asfalto'            // Lv 15+
];

export function getXpRequiredForLevel(level) {
  if (level <= 1) return 0;
  return 100 * Math.pow(level - 1, 2);
}

export function getLevelInfo(totalExp = 0) {
  const exp = Math.max(0, Number(totalExp) || 0);
  let level = 1;
  while (getXpRequiredForLevel(level + 1) <= exp) {
    level++;
  }
  const currentBase = getXpRequiredForLevel(level);
  const nextBase = getXpRequiredForLevel(level + 1);
  const xpInLevel = exp - currentBase;
  const xpNeeded = nextBase - currentBase;
  const pct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
  const titulo = TITULOS_NIVEL[Math.min(level - 1, TITULOS_NIVEL.length - 1)];

  return {
    nivel: level,
    tituloNivel: titulo,
    totalExp: exp,
    xpNoNivel: xpInLevel,
    xpNecessarioNivel: xpNeeded,
    progressoPct: pct
  };
}

export async function getCurrentXp(userId) {
  const result = await pool.query(
    'SELECT exp, lv FROM usuario WHERE id_usuario = $1',
    [userId]
  );
  const exp = Number(result.rows[0]?.exp || 0);
  const levelInfo = getLevelInfo(exp);
  return {
    exp,
    lv: levelInfo.nivel,
    ...levelInfo
  };
}

export async function incrementXp(userId, increment = 0) {
  const currentResult = await pool.query(
    'SELECT exp, lv FROM usuario WHERE id_usuario = $1',
    [userId]
  );
  const previousExp = Number(currentResult.rows[0]?.exp || 0);
  const previousLv = Number(currentResult.rows[0]?.lv || 1);
  const finalExp = previousExp + Number(increment);

  const levelInfo = getLevelInfo(finalExp);

  await pool.query(
    'UPDATE usuario SET exp = $1, lv = $2 WHERE id_usuario = $3',
    [finalExp, levelInfo.nivel, userId]
  );

  return {
    exp: finalExp,
    lv: levelInfo.nivel,
    previousLv,
    leveledUp: levelInfo.nivel > previousLv,
    ...levelInfo
  };
}

export default {
  TITULOS_NIVEL,
  getXpRequiredForLevel,
  getLevelInfo,
  getCurrentXp,
  incrementXp
};

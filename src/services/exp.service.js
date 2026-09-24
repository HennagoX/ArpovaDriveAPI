import pool from '../Repositories/db.js';

export async function getCurrentXp(userId) {
  const result = await pool.query(
    'SELECT exp FROM usuario WHERE id_usuario = $1',
    [userId]
  );
  return Number(result.rows[0]?.exp || 0);
}

export async function incrementXp(userId, increment = 0) {
  const result = await pool.query(
    'UPDATE usuario SET exp = COALESCE(exp, 0) + $1 WHERE id_usuario = $2 RETURNING exp',
    [increment, userId]
  );
   const currentLv = await pool.query('SELECT lv FROM usuario WHERE id_usuario = $1', [userId])
   
   const finalExp = Number(result.rows[0]?.exp || 0) 
   const requirementExp = 100 + 200 * (currentLv  - 1);

   if (finalExp >= requirementExp){
       const nextLv = currentLv + 1;
       const currentLv = await pool.query('SELECT lv FROM usuario WHERE id_usuario = $1', [userId])
  }

  return finalExp;
}

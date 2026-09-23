import pool from './db.js'

export async function getCurrentModuloDB(content, userId) {
    const currentModulos = await pool.query(` SELECT ${content} FROM usuario WHERE id_usuario = $1`, [userId]);

    return currentModulos;
}


    export async function nextCurrentModuloDB(content, userId) {
      const result = await pool.query(
        `SELECT ${content} FROM usuario WHERE id_usuario = $1`,
        [userId]
      );
    
      const valorAtual = Number(result.rows[0]?.[content] || 0);
      const proximoValor = valorAtual + 1;
    
      const currentModulos = await pool.query(
        `UPDATE usuario SET ${content} = $1 WHERE id_usuario = $2 RETURNING ${content}`,
        [proximoValor, userId]
      );
    
      return currentModulos;
    }
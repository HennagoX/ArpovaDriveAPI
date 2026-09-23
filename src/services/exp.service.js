import pool from '../Repositories/db.js'

export  async function getCurrentXp(user_Id){
    const currentXp = await pool.query(`SELECT exp FROM usuario WHERE id = $1`, user_Id)
    return currentXp;
}

export async function incrementXp(user_Id, increment){
      const currentXp = await pool.query(`SELECT exp FROM usuario WHERE id = $1`, user_Id)
      const newXp = currentXp += increment || currentXp;
     return pool.query(`UPDATE usuario SET exp=${newXp} WHERE id = $1 `, user_Id)
}
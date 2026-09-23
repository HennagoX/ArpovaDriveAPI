import pool from './db';

export async function getQuestoes(moduloQuestao, user_Id) {
  const response = await pool.query(`SELECT ${moduloQuestao} from usuario WHERE id_usuario = $1`, user_Id)
  return response;
}

export async function incrementarAcerto(moduloQuestao, user_Id){
   const response = await pool.query(`SELECT ${moduloQuestao} from usuario WHERE id_usuario = $1`, user_Id) | null;
   if (!response) return null;
   const newAcertos = response += 1;
   return pool.query(`UPDATE usuario SET ${moduloQuestao}=${newAcertos} WHERE id = $1`, user_Id)
}
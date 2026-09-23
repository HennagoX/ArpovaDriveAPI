import pool from './db';

export async function getQuestoes(user_Id) {
  const response = await pool.query(`SELECT * from questoes WHERE id_usuario = $1`, user_Id)
  return response;
}

export async function concluirQuestoes(user_Id){
  
}
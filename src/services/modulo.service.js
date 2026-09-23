import {getCurrentModuloDB, nextCurrentModuloDB} from '../Repositories/modulo.repository.js';

const modules = {
   'CodigoTransito' : 'modulo_codigotransito',
   "PlacasTransito" : 'modulo_placastransito',
   "DirecaoDefensiva" : 'modulo_direcaodefensiva',
   "PrimeirosSocorros" : 'modulo_primeirossocorros',
   "Cidadania" : 'modulo_cidadania'
}

export function getAll(content){
      return modules[content];
}

export  async function getCurrent(content, userId){
      const column = modules[content];
      if (!column) {
        throw new Error('Conteúdo inválido');
      }
    
      const query = await getCurrentModuloDB(column, userId);
      return {
        conteudo: content,
        modulo_atual: query ? query.rows[0] : null
      };
}

export async function moveToNext(content, userId){
     const column = modules[content];
      if (!column) {
        throw new Error('Conteúdo inválido');
      }
    
      const query = await nextCurrentModuloDB(column, userId);
      return {
        conteudo: content,
        modulo_atual: query ? query.rows[0] : null
      };
}
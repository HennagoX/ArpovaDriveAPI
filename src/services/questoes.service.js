import {getQuestoes, incrementarAcerto} from '../Repositories/questoes.repository'

const questoes = {
    ["CodigoDeTransito"] : {
        ["1"] : "A"
    }
}

export function checarAcerto(respostas, user_Id) {
    const questao = respostas.questao
    const respostaUsuario = respostas.resposta
    const numQuestao = respostas.questao.num
    if (questoes[questao] && respostaUsuario && num) { 
      if (questoes[questao][num] === respostaUsuario) {
        incrementarAcerto(respostas.questao, user_Id) 
      }
      else
      {
        return null;
      }
    }

}
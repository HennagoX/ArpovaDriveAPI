import { checarAcerto } from "../services/questoes.service.js";

export async function checkAcerto(req, res){
    try{
    const message = await checarAcerto();
    return res.status(200).json({sucess : true, message : message});
    }
    catch(error){
        console.log(error);
        return res.status(400).json({sucess : false,  message : "Não foi possível checar o acerto"});
    }
}
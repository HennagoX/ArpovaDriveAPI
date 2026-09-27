import moduloCustomizadoService from '../services/moduloCustomizado.service.js';

export async function listar(req, res, next) {
  try {
    const conteudoId = req.query?.conteudoId || req.params?.conteudoId || null;
    const resultado = await moduloCustomizadoService.listarModulos(conteudoId);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function salvar(req, res, next) {
  try {
    const requesterId = req.requesterId;
    const dados = req.body;
    const resultado = await moduloCustomizadoService.salvarModulo(dados, requesterId);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function remover(req, res, next) {
  try {
    const id = req.params?.id || req.body?.id;
    const conteudoId = req.query?.conteudoId || req.body?.conteudo_id || null;
    const resultado = await moduloCustomizadoService.removerModulo(id, conteudoId);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function restaurar(req, res, next) {
  try {
    const id = req.params?.id || req.body?.id;
    const resultado = await moduloCustomizadoService.restaurarModulo(id);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

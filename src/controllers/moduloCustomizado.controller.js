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
    const requesterId = req.requesterId;
    const id = req.params?.id || req.body?.id;
    const conteudoId = req.query?.conteudoId || req.body?.conteudo_id || null;
    const resultado = await moduloCustomizadoService.removerModulo(id, conteudoId, requesterId);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function restaurar(req, res, next) {
  try {
    const requesterId = req.requesterId;
    const id = req.params?.id || req.body?.id;
    const resultado = await moduloCustomizadoService.restaurarModulo(id, requesterId);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function historico(req, res, next) {
  try {
    const conteudoId = req.query?.conteudoId || req.query?.conteudo_id || null;
    const moduloId = req.query?.moduloId || req.query?.modulo_id || null;
    const resultado = await moduloCustomizadoService.listarHistorico(conteudoId, moduloId);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function reverter(req, res, next) {
  try {
    const requesterId = req.requesterId;
    const historicoId = req.params?.id || req.body?.historicoId || req.body?.id;
    const targetVersion = req.body?.targetVersion || req.body?.modo || 'versao';
    const resultado = await moduloCustomizadoService.reverterHistorico(historicoId, requesterId, targetVersion);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function removerHistorico(req, res, next) {
  try {
    const requesterId = req.requesterId;
    const historicoId = req.params?.id;
    const resultado = await moduloCustomizadoService.removerItemHistorico(historicoId, requesterId);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function limparHistorico(req, res, next) {
  try {
    const requesterId = req.requesterId;
    const conteudoId = req.query?.conteudoId || req.body?.conteudoId || null;
    const moduloId = req.query?.moduloId || req.body?.moduloId || null;
    const resultado = await moduloCustomizadoService.limparHistorico(conteudoId, moduloId, requesterId);
    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

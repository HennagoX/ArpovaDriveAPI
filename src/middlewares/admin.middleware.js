import pool from '../Repositories/db.js';
import { isUserAdmin } from '../config/admin.config.js';

/**
 * Verifica se um usuário ou identificador possui papel de Administrador.
 * Consulta o banco de dados (coluna is_admin) e mantém compatibilidade com ADMIN_EMAIL/ADMIN_ID.
 */
export async function checkIsAdmin(identifier) {
  if (!identifier) return false;

  // Compatibilidade com variáveis de ambiente (.env)
  if (isUserAdmin(identifier)) return true;

  try {
    const clean = String(identifier).trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

    let query = '';
    let params = [];

    if (isUuid) {
      query = 'SELECT is_admin FROM usuario WHERE id_usuario = $1 LIMIT 1';
      params = [clean];
    } else {
      query = 'SELECT is_admin FROM usuario WHERE LOWER(email) = LOWER($1) OR id_usuario::text = $1 LIMIT 1';
      params = [clean];
    }

    const { rows } = await pool.query(query, params);
    if (rows.length > 0 && rows[0].is_admin === true) {
      return true;
    }
  } catch (err) {
    console.error('[AdminMiddleware] Erro ao verificar admin no banco:', err.message);
  }

  return false;
}

/**
 * Middleware que bloqueia requisições não autorizadas para rotas administrativas.
 */
export async function requireAdmin(req, res, next) {
  const requesterId = req.headers?.['x-admin-id'] || 
                      req.headers?.['x-user-id'] || 
                      req.headers?.['x-usuario-id'] || 
                      req.body?.requesterId || 
                      req.query?.requesterId ||
                      req.body?.userId ||
                      req.query?.userId;

  if (!requesterId) {
    return res.status(401).json({
      error: 'Identificação necessária para acessar esta funcionalidade de administrador.'
    });
  }

  const isAdmin = await checkIsAdmin(requesterId);
  if (!isAdmin) {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores do sistema têm permissão para realizar esta operação.'
    });
  }

  req.isAdmin = true;
  req.requesterId = requesterId;
  next();
}

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

/**
 * Configurações e utilitários para verificação de permissões do Administrador.
 * Lê as credenciais e o ID do Administrador diretamente das variáveis de ambiente (.env).
 */

export function getAdminConfig() {
  return {
    id: (process.env.ADMIN_ID || process.env.ADMIN_USER_ID || '').trim(),
    email: (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
    password: process.env.ADMIN_PASSWORD || process.env.ADMIN_SENHA || ''
  };
}

/**
 * Verifica se um determinado identificador (UUID ou e-mail) ou objeto de usuário pertence ao Administrador.
 * @param {string|Object} [userOrId]
 * @returns {boolean}
 */
export function isUserAdmin(userOrId) {
  if (!userOrId) return false;
  const admin = getAdminConfig();

  // Se nenhum parâmetro de admin estiver configurado, ninguém é considerado admin
  if (!admin.id && !admin.email) return false;

  if (typeof userOrId === 'string') {
    const clean = userOrId.trim().toLowerCase();
    if (admin.id && clean === admin.id.toLowerCase()) return true;
    if (admin.email && clean === admin.email) return true;
    return false;
  }

  if (typeof userOrId === 'object') {
    const id = String(userOrId.id_usuario || userOrId.id || userOrId.userId || '').trim();
    const email = String(userOrId.email || '').toLowerCase().trim();
    if (admin.id && id.toLowerCase() === admin.id.toLowerCase()) return true;
    if (admin.email && email === admin.email) return true;
  }

  return false;
}

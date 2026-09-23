import dotenv from 'dotenv';

dotenv.config();

export function getAdminConfig() {
  return {
    id: (process.env.ADMIN_ID || '').trim(),
    email: (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
    password: process.env.ADMIN_PASSWORD || ''
  };
}

export function isUserAdmin(userOrId) {
  if (!userOrId) return false;
  const admin = getAdminConfig();

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

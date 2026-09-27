#!/usr/bin/env node

/**
 * Script de Gerenciamento de Administradores - AprovaDrive
 * 
 * Uso via linha de comando:
 *   node scripts/gerenciar-admin.js listar
 *   node scripts/gerenciar-admin.js tornar <email_ou_id>
 *   node scripts/gerenciar-admin.js remover <email_ou_id>
 *   node scripts/gerenciar-admin.js criar <email> <nome> <senha>
 * 
 * Ou execute sem parâmetros para abrir o menu interativo:
 *   npm run admin
 */

import readline from 'readline';
import bcrypt from 'bcrypt';
import pool from '../src/Repositories/db.js';

async function inicializarColuna() {
  await pool.query('ALTER TABLE usuario ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;');
}

async function listarUsuarios() {
  await inicializarColuna();
  const { rows } = await pool.query(`
    SELECT id_usuario, nome, email, is_admin, criado_em 
    FROM usuario 
    ORDER BY is_admin DESC, nome ASC
  `);

  console.log('\n========================================================================');
  console.log('                 USUÁRIOS E ADMINISTRADORES CADASTRADOS                 ');
  console.log('========================================================================');

  if (rows.length === 0) {
    console.log('Nenhum usuário cadastrado no banco de dados.');
    return;
  }

  rows.forEach((u, i) => {
    const badge = u.is_admin ? ' [ADMINISTRADOR]' : '[ALUNO]        ';
    console.log(`${String(i + 1).padStart(2, ' ')}. ${badge} | ${u.nome.padEnd(25, ' ')} | ${u.email.padEnd(30, ' ')} | ID: ${u.id_usuario}`);
  });
  console.log('========================================================================\n');
}

async function tornarAdmin(identificador) {
  if (!identificador) {
    console.error('Erro: Informe o e-mail ou UUID do usuário.');
    return false;
  }

  await inicializarColuna();
  const clean = identificador.trim();
  const { rows } = await pool.query(
    `UPDATE usuario 
     SET is_admin = TRUE 
     WHERE LOWER(email) = LOWER($1) OR id_usuario::text = $1
     RETURNING id_usuario, nome, email, is_admin;`,
    [clean]
  );

  if (rows.length === 0) {
    console.error(`Usuário "${clean}" não foi encontrado no banco de dados.`);
    return false;
  }

  const u = rows[0];
  console.log(`\n SUCESSO! O usuário "${u.nome}" (${u.email}) agora é um ADMINISTRADOR do AprovaDrive! \n`);
  return true;
}

async function removerAdmin(identificador) {
  if (!identificador) {
    console.error('X Erro: Informe o e-mail ou UUID do usuário.');
    return false;
  }

  await inicializarColuna();
  const clean = identificador.trim();
  const { rows } = await pool.query(
    `UPDATE usuario 
     SET is_admin = FALSE 
     WHERE LOWER(email) = LOWER($1) OR id_usuario::text = $1
     RETURNING id_usuario, nome, email, is_admin;`,
    [clean]
  );

  if (rows.length === 0) {
    console.error(`X Usuário "${clean}" não foi encontrado no banco de dados.`);
    return false;
  }

  const u = rows[0];
  console.log(`\nℹ️ Privilégios de Administrador removidos para "${u.nome}" (${u.email}). Agora é um aluno regular.\n`);
  return true;
}

async function criarAdmin(email, nome, senha) {
  if (!email || !nome || !senha) {
    console.error('Erro: Para criar um novo administrador, informe: <email> <nome> <senha>');
    return false;
  }

  await inicializarColuna();
  const normalizedEmail = email.toLowerCase().trim();

  // Verifica se já existe
  const existente = await pool.query('SELECT id_usuario FROM usuario WHERE LOWER(email) = $1', [normalizedEmail]);
  if (existente.rows.length > 0) {
    console.log(`Usuário com o e-mail "${normalizedEmail}" já existe. Atualizando para administrador...`);
    return await tornarAdmin(normalizedEmail);
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const dataNascimento = '2000-01-01';

  const query = `
    INSERT INTO usuario(nome, email, senha, data_nascimento, is_admin)
    VALUES($1, $2, $3, $4, TRUE)
    RETURNING id_usuario, nome, email, is_admin;
  `;

  const { rows } = await pool.query(query, [nome.trim(), normalizedEmail, senhaHash, dataNascimento]);
  const u = rows[0];
  console.log(`\n NOVO ADMINISTRADOR CRIADO COM SUCESSO! `);
  console.log(`Nome:  ${u.nome}`);
  console.log(`Email: ${u.email}`);
  console.log(`ID:    ${u.id_usuario}\n`);
  return true;
}

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function menuInterativo() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  while (true) {
    console.log('======================================================');
    console.log('     GERENCIADOR DE ADMINISTRADORES APROVADRIVE   ');
    console.log('======================================================');
    console.log(' 1. Listar todos os usuários e status de Administrador');
    console.log(' 2. Tornar usuário existente em Administrador');
    console.log(' 3. Revogar privilégios de Administrador');
    console.log(' 4. Criar um novo Administrador no banco');
    console.log(' 5. Sair');
    console.log('======================================================');

    const opcao = (await prompt(rl, 'Escolha uma opção (1-5): ')).trim();

    if (opcao === '1') {
      await listarUsuarios();
    } else if (opcao === '2') {
      const email = (await prompt(rl, 'Digite o e-mail ou UUID do usuário: ')).trim();
      await tornarAdmin(email);
    } else if (opcao === '3') {
      const email = (await prompt(rl, 'Digite o e-mail ou UUID do usuário: ')).trim();
      await removerAdmin(email);
    } else if (opcao === '4') {
      const email = (await prompt(rl, 'E-mail do novo administrador: ')).trim();
      const nome = (await prompt(rl, 'Nome completo: ')).trim();
      const senha = (await prompt(rl, 'Senha: ')).trim();
      await criarAdmin(email, nome, senha);
    } else if (opcao === '5' || opcao.toLowerCase() === 'sair') {
      console.log('Encerrando gerenciador de administradores.');
      break;
    } else {
      console.log('Opção inválida.');
    }
  }

  rl.close();
}

async function main() {
  const args = process.argv.slice(2);
  const comando = (args[0] || '').toLowerCase();

  try {
    if (comando === 'listar' || comando === 'list') {
      await listarUsuarios();
    } else if (comando === 'tornar' || comando === 'promover' || comando === 'add') {
      await tornarAdmin(args[1]);
    } else if (comando === 'remover' || comando === 'revogar' || comando === 'del') {
      await removerAdmin(args[1]);
    } else if (comando === 'criar' || comando === 'create') {
      await criarAdmin(args[1], args[2], args[3]);
    } else if (args.length === 1 && args[0].includes('@')) {
      // Atalho: node scripts/gerenciar-admin.js henrique@gmail.com
      await tornarAdmin(args[0]);
    } else {
      await menuInterativo();
    }
  } catch (err) {
    console.error('Erro na execução do script:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();

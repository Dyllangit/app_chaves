// Cria o usuário gestor inicial no banco de dados
// Execute com: npm run criar-admin

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const db            = require('../src/config/database');
const { hashSenha } = require('../src/services/senhaService');

async function main() {
    const nome      = 'Administrador';
    const email     = 'admin@ic.ufmt.br';
    const matricula = 'admin001';
    const senha     = 'admin123';

    const senhaHash = hashSenha(senha);

    await db.query(
        `INSERT INTO pessoa (nome, matricula, email, cargo, perfil, senha_hash)
         VALUES (?, ?, ?, ?, 'gestor', ?)
         ON DUPLICATE KEY UPDATE senha_hash = VALUES(senha_hash)`,
        [nome, matricula, email, 'Gestor TI', senhaHash]
    );

    console.log('\n✔  Usuário gestor criado com sucesso!\n');
    console.log('   E-mail   :', email);
    console.log('   Senha    :', senha);
    console.log('\n   ⚠  Troque a senha após o primeiro acesso!\n');
    process.exit(0);
}

main().catch(err => {
    console.error('Erro:', err.message);
    process.exit(1);
});
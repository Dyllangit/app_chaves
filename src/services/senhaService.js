const crypto = require('crypto');

function hashSenha(senha) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verificarSenha(senha, armazenado) {
    const [salt, hashArmazenado] = armazenado.split(':');
    const hashTentativa = crypto.scryptSync(senha, salt, 64).toString('hex');
    return crypto.timingSafeEqual(
        Buffer.from(hashArmazenado, 'hex'),
        Buffer.from(hashTentativa,  'hex')
    );
}

module.exports = { hashSenha, verificarSenha };
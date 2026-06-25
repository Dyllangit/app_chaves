const transporter = require('../config/email');

async function enviarEmail({ para, assunto, html }) {
    await transporter.sendMail({
        from:    process.env.SMTP_FROM || 'SISGERI <noreply@ic.ufmt.br>',
        to:      para,
        subject: assunto,
        html,
    });
}

// Envia e-mail sem lançar exceção — retorna { sucesso, erro }
async function tentarEnviarEmail(opcoes) {
    if (!process.env.SMTP_HOST) {
        return { sucesso: false, erro: 'SMTP não configurado' };
    }
    try {
        await enviarEmail(opcoes);
        return { sucesso: true };
    } catch (err) {
        console.error('[EmailService] Falha ao enviar e-mail:', err.message);
        return { sucesso: false, erro: err.message };
    }
}

module.exports = { tentarEnviarEmail };
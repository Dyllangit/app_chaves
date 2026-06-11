-- SISGERI — Dados iniciais
-- Execute APÓS o schema.sql
-- Use `npm run criar-admin` para criar o usuário gestor inicial

USE sisgeri;

-- Configurações do sistema
INSERT INTO configuracao (chave, valor, descricao) VALUES
('horario_abertura',   '07:00', 'Horário de abertura do IC'),
('horario_fechamento', '22:00', 'Horário de fechamento do IC'),
('antecedencia_minima_horas', '1', 'Horas mínimas de antecedência para reserva');
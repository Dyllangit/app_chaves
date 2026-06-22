-- SISGERI — Schema do Banco de Dados
-- Sistema de Gestão de Recursos e Equipamentos — IC UFMT
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS sisgeri CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sisgeri;

-- --------------------------------------------------------
-- CONFIGURACAO
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracao (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    chave VARCHAR(50)  NOT NULL UNIQUE,
    valor VARCHAR(255) NOT NULL,
    descricao VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- PESSOA
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS pessoa (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL,
    matricula  VARCHAR(20)  UNIQUE,
    cpf        VARCHAR(14)  UNIQUE,
    email      VARCHAR(100) NOT NULL UNIQUE,
    cargo      VARCHAR(100),
    perfil     ENUM('usuario','funcionario','gestor') NOT NULL DEFAULT 'usuario',
    senha_hash VARCHAR(255) NOT NULL,
    ativo      TINYINT(1)   NOT NULL DEFAULT 1,
    criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- AMBIENTE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS ambiente (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    tipo        ENUM('sala','laboratorio','auditorio') NOT NULL,
    capacidade  INT,
    localizacao VARCHAR(100),
    ativo       TINYINT(1) NOT NULL DEFAULT 1,
    criado_em   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- CHAVE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS chave (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    codigo      VARCHAR(50) NOT NULL,
    status      ENUM('disponivel','entregue','extraviada') NOT NULL DEFAULT 'disponivel',
    ambiente_id INT NOT NULL,
    FOREIGN KEY (ambiente_id) REFERENCES ambiente(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- EQUIPAMENTO
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipamento (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    nome              VARCHAR(100) NOT NULL,
    categoria         VARCHAR(50)  NOT NULL,
    codigo_patrimonio VARCHAR(50)  UNIQUE,
    status            ENUM('disponivel','em_manutencao','desativado') NOT NULL DEFAULT 'disponivel',
    criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- RESERVA (cabeçalho)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS reserva (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    pessoa_id      INT  NOT NULL,
    data           DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim    TIME NOT NULL,
    status         ENUM('confirmada','cancelada') NOT NULL DEFAULT 'confirmada',
    criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pessoa_id) REFERENCES pessoa(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- DETALHE DO EVENTO
-- Informações extras para reservas de ambientes (quando há evento)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalhe_evento (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    reserva_id          INT NOT NULL UNIQUE,
    tipo_evento         VARCHAR(50) NOT NULL,
    descricao           TEXT,
    docente_responsavel VARCHAR(100),
    pessoa_autorizada   VARCHAR(100),
    FOREIGN KEY (reserva_id) REFERENCES reserva(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- RESERVA DE AMBIENTE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS reserva_ambiente (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    reserva_id  INT NOT NULL,
    ambiente_id INT NOT NULL,
    status      ENUM('confirmada','chave_entregue','chave_devolvida','chave_extraviada','cancelada')
                NOT NULL DEFAULT 'confirmada',
    FOREIGN KEY (reserva_id)  REFERENCES reserva(id),
    FOREIGN KEY (ambiente_id) REFERENCES ambiente(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- RESERVA DE EQUIPAMENTO
-- reserva_ambiente_id é nullable: equipamento pode ser reservado independentemente
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS reserva_equipamento (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    reserva_id          INT NOT NULL,
    equipamento_id      INT NOT NULL,
    reserva_ambiente_id INT DEFAULT NULL,
    status              ENUM('confirmada','equipamento_entregue','equipamento_devolvido','cancelada')
                        NOT NULL DEFAULT 'confirmada',
    FOREIGN KEY (reserva_id)          REFERENCES reserva(id),
    FOREIGN KEY (equipamento_id)      REFERENCES equipamento(id),
    FOREIGN KEY (reserva_ambiente_id) REFERENCES reserva_ambiente(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- MOVIMENTAÇÃO DE CHAVE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS mov_chave (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    chave_id            INT NOT NULL,
    reserva_ambiente_id INT NOT NULL,
    pessoa_id           INT NOT NULL,
    tipo                ENUM('retirada','devolucao','extravio') NOT NULL,
    data_hora           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacoes         TEXT,
    FOREIGN KEY (chave_id)            REFERENCES chave(id),
    FOREIGN KEY (reserva_ambiente_id) REFERENCES reserva_ambiente(id),
    FOREIGN KEY (pessoa_id)           REFERENCES pessoa(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- MOVIMENTAÇÃO DE EQUIPAMENTO
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS mov_equipamento (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    equipamento_id          INT NOT NULL,
    reserva_equipamento_id  INT NOT NULL,
    pessoa_id               INT NOT NULL,
    tipo                    ENUM('retirada','devolucao') NOT NULL,
    data_hora               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacoes             TEXT,
    FOREIGN KEY (equipamento_id)         REFERENCES equipamento(id),
    FOREIGN KEY (reserva_equipamento_id) REFERENCES reserva_equipamento(id),
    FOREIGN KEY (pessoa_id)              REFERENCES pessoa(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- TOKEN DE REDEFINIÇÃO DE SENHA
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS token_redefinicao (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    pessoa_id  INT         NOT NULL,
    token      VARCHAR(64) NOT NULL UNIQUE,
    expira_em  DATETIME    NOT NULL,
    usado      TINYINT(1)  NOT NULL DEFAULT 0,
    criado_em  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pessoa_id) REFERENCES pessoa(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
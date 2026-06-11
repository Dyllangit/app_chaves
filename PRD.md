# PRD — SISGERI: Sistema de Gestão de Recursos e Equipamentos do IC-UFMT

**Versão:** 1.1  
**Data:** Junho/2026  
**Base:** Relatório Final de Estágio — Isabelle Fátima Nogueira Rodrigues Corrêa Fonseca  
**Stack:** Node.js · Express.js · EJS · MySQL

---

## 1. Visão Geral

O SISGERI é um sistema web para o Instituto de Computação da UFMT que centraliza o controle de **reservas de ambientes físicos** (salas, laboratórios, auditórios) e **empréstimos de equipamentos** (projetores, caixas de som, chromebooks). Substitui o controle manual/informal hoje feito pela secretaria do IC, eliminando conflitos de agendamento e garantindo rastreabilidade total sobre chaves e equipamentos.

---

## 2. Objetivos

| # | Objetivo |
|---|----------|
| 1 | Eliminar conflitos de horário em reservas de ambientes e equipamentos |
| 2 | Rastrear quem está com cada chave a qualquer momento |
| 3 | Controlar retirada e devolução de equipamentos |
| 4 | Fornecer relatórios de ocupação e uso para gestores |
| 5 | Disponibilizar interface web acessível em navegador desktop e mobile |

---

## 3. Stakeholders e Perfis de Usuário

| Perfil | Descrição | Permissões principais |
|--------|-----------|-----------------------|
| **Usuário** | Docente, servidor técnico ou colaborador autorizado | Criar/alterar/cancelar reservas próprias; visualizar disponibilidade |
| **Funcionário** | Secretaria/coordenação | Registrar retirada e devolução de chaves e equipamentos |
| **Gestor/Administrador** | Direção, coordenações | Tudo acima + relatórios + gerenciar cadastros base |

---

## 4. Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Runtime | Node.js |
| Framework web | Express.js |
| Template engine | EJS |
| Banco de dados | MySQL |
| Autenticação | Sessions (express-session) + Node.js `crypto` nativo |
| Envio de e-mail | Nodemailer |
| Estilo | Bootstrap 5 (arquivos locais em `public/`) |

---

## 5. Requisitos Funcionais

### RF01 — Gerenciar Agenda de Ocupação de Dependências

- O usuário pode **criar** uma reserva de ambiente informando: ambiente, data, horário início/fim.
- O sistema **verifica conflito** de horário antes de confirmar.
- O usuário pode **alterar** data/horário/ambiente de uma reserva existente (desde que não tenha chave já retirada).
- O usuário pode **cancelar** uma reserva existente.
- O sistema emite **comprovante** digital (página imprimível/PDF) após confirmação.
- O sistema atualiza automaticamente a **agenda de ocupação**.

---

### RF02 — Registrar Detalhes do Evento em Ambiente Reservado

- Após criar a reserva, o usuário pode vincular detalhes do evento: tipo (aula, reunião, defesa de TCC, palestra, outro), descrição, docente responsável, pessoa autorizada a retirar a chave.
- Esses dados são opcionais no momento da reserva mas podem ser adicionados/editados posteriormente (enquanto a chave não foi entregue).
- Campos obrigatórios: tipo do evento, docente responsável, pessoa autorizada.

---

### RF03 — Registrar Retirada da Chave

- O **funcionário** acessa a reserva com status "confirmada" e registra a retirada da chave.
- Campos: identificação de quem retirou (nome/matrícula/CPF — pode ser o responsável ou pessoa autorizada), data e hora (preenchidos automaticamente pelo sistema).
- O sistema **valida** se a pessoa está cadastrada como responsável ou autorizada na reserva.
- Após registro, o status da reserva muda para **"chave entregue"**.
- O sistema bloqueia retirada por pessoa não autorizada e exibe alerta.

---

### RF04 — Registrar Devolução da Chave

- O **funcionário** acessa a reserva com status "chave entregue" e registra a devolução.
- Campos: identificação de quem devolveu, data/hora (automático), observações sobre o estado do ambiente (texto livre).
- Após registro, o status da reserva muda para **"chave devolvida"**.
- Devolução por pessoa não cadastrada: sistema registra a ocorrência e alerta a coordenação.

---

### RF05 — Gerenciar Agenda de Uso de Equipamentos

- O usuário pode **criar** uma reserva de equipamento informando: equipamento(s), data, horário início/fim, finalidade.
- O sistema **verifica conflito** antes de confirmar.
- O usuário pode **alterar** ou **cancelar** a reserva (enquanto equipamento não foi retirado).
- O sistema emite **comprovante** digital após confirmação.

---

### RF06 — Verificar Disponibilidade de Equipamentos

- Antes de confirmar qualquer reserva, o sistema exibe quais equipamentos estão disponíveis para o período solicitado.
- A consulta deve retornar resultado em ≤ 5 segundos.
- Em caso de indisponibilidade, o sistema sugere horários alternativos.

---

### RF07 — Associar Reserva de Equipamento a uma Reserva de Ambiente

- O usuário pode, a partir de uma reserva de ambiente existente, adicionar equipamentos usando a data/horário herdados automaticamente.
- O sistema verifica disponibilidade do equipamento para o mesmo período.
- A associação fica registrada como vínculo entre as duas reservas.

---

### RF08 — Reserva de Equipamento Independente

- O usuário pode reservar equipamentos sem vincular a nenhum ambiente físico (uso externo, saguão, etc.).
- Campos: equipamento, data/hora, responsável pela retirada.

---

### RF09 — Emitir Relatórios de Ocupação e Uso

- Acesso restrito ao perfil **Gestor/Administrador**.
- Filtros disponíveis: período (data início/fim), tipo de recurso (ambiente ou equipamento), status da reserva, responsável.
- Conteúdo do relatório: reservas realizadas, não executadas (reserva confirmada mas chave nunca retirada), problemas registrados, devoluções pendentes.
- Exportação em PDF.
- Tempo de geração ≤ 10 segundos.

---

### RF10 — Gerenciar Cadastro de Ambientes *(não detalhado no relatório — essencial)*

- Gestor cadastra, edita e desativa ambientes: nome, tipo (sala/laboratório/auditório), capacidade, localização.
- Cada ambiente pode ter zero ou uma chave associada.

---

### RF11 — Gerenciar Cadastro de Equipamentos *(não detalhado no relatório — essencial)*

- Gestor cadastra, edita e desativa equipamentos: nome, categoria (projetor/chromebook/caixa de som/etc.), código patrimonial, status (disponível/em manutenção/desativado).

---

### RF12 — Gerenciar Cadastro de Pessoas/Usuários *(não detalhado no relatório — essencial)*

- Gestor cadastra usuários com nome, matrícula, CPF, e-mail, cargo e perfil (Usuário / Funcionário / Gestor).
- Cada usuário recebe login e senha.
- Gestor pode ativar/desativar contas.

---

### RF13 — Autenticação *(não detalhado no relatório — essencial)*

- Tela de login com matrícula/e-mail e senha.
- Sessão autenticada com timeout via `express-session`.
- Logout explícito que destrói a sessão.
- Senhas armazenadas com hash usando o módulo nativo `crypto` do Node.js (`crypto.scrypt` com salt aleatório).
- Middleware de proteção de rotas que redireciona para login se não autenticado.
- Middleware de autorização por perfil que retorna 403 se o perfil não tem permissão.

---

### RF14 — Recuperação de Senha *(adicionado)*

**Passo 1 — Solicitar redefinição:**
- Tela "Esqueci minha senha" acessível a partir da tela de login (sem autenticação).
- Usuário informa o e-mail cadastrado.
- Se o e-mail existir, o sistema gera um token seguro (`crypto.randomBytes(32).toString('hex')`) com validade de **1 hora** e envia um link por e-mail via Nodemailer.
- Se o e-mail **não existir**, o sistema exibe a mesma mensagem de sucesso (não revela se o e-mail está ou não cadastrado).

**Passo 2 — Redefinir a senha:**
- O link enviado aponta para uma rota protegida pelo token: `/redefinir-senha?token=<token>`.
- O sistema valida o token: deve existir no banco, não ter sido usado e não estar expirado.
- Se válido: exibe formulário para nova senha + confirmação.
- Se inválido ou expirado: exibe mensagem de erro e sugere nova solicitação.
- Após confirmação, o sistema atualiza o hash da senha, **invalida o token** (marca como usado) e redireciona para o login.

**Regras:**
- Um novo pedido de redefinição invalida tokens anteriores ainda ativos para o mesmo usuário.
- O link só pode ser usado **uma única vez**.
- Token expirado ou já utilizado retorna erro claro ao usuário.

---

### RF15 — Notificações por E-mail em Empréstimo e Devolução *(adicionado)*

O sistema envia um e-mail automático ao **responsável pela reserva** nos seguintes eventos:

| Evento | Destinatário | Conteúdo mínimo do e-mail |
|--------|-------------|---------------------------|
| Retirada de chave (RF03) | Responsável pela reserva | Ambiente, data/hora da retirada, quem retirou |
| Devolução de chave (RF04) | Responsável pela reserva | Ambiente, data/hora da devolução, observações registradas |
| Retirada de equipamento | Responsável pela reserva | Equipamento(s), data/hora da retirada, quem retirou |
| Devolução de equipamento | Responsável pela reserva | Equipamento(s), data/hora da devolução, observa
ções registradas |

**Comportamento sem conectividade (degradação elegante):**
- O envio de e-mail é realizado **após** a gravação no banco — a ação principal nunca depende do envio.
- Se o Nodemailer falhar (sem internet, SMTP indisponível, timeout), o sistema **não interrompe a operação** e exibe um alerta na tela:
  > ✔ Ação registrada com sucesso. Não foi possível enviar o e-mail de notificação (sem conexão).
- O erro de envio é registrado no log do servidor mas **não impede** o fluxo normal.

---

### RF16 — Registrar Retirada de Equipamento *(adicionado — L12)*

Análogo ao RF03, aplicado a equipamentos.

- O **funcionário** acessa a reserva de equipamento com status "confirmada" e registra a retirada.
- Campos: identificação de quem retirou (responsável ou pessoa autorizada), data/hora (automático).
- O sistema valida se a pessoa está cadastrada como responsável ou autorizada na reserva.
- Após registro, o status da reserva de equipamento muda para **"equipamento entregue"**.

---

### RF17 — Registrar Devolução de Equipamento *(adicionado — L12)*

Análogo ao RF04, aplicado a equipamentos.

- O **funcionário** acessa a reserva com status "equipamento entregue" e registra a devolução.
- Campos: identificação de quem devolveu, data/hora (automático), observações sobre o estado do equipamento.
- Após registro, o status muda para **"equipamento devolvido"**.
- Devolução por pessoa não cadastrada: sistema registra ocorrência e alerta a coordenação.

---

### RF18 — Gerenciar Devoluções em Atraso *(adicionado — L5)*

- Tela exclusiva para o perfil **Funcionário** e **Gestor** listando todas as reservas onde a chave ou o equipamento não foi devolvido após o horário de término da reserva.
- Cada item exibe: recurso, responsável, horário previsto de devolução, tempo de atraso.
- Itens em atraso são destacados visualmente (badge vermelho).
- Para cada item em atraso, o funcionário pode acionar **"Notificar responsável"**, que envia um e-mail manual de lembrete ao responsável pela reserva (usando RF15, com a mesma lógica de degradação offline).

---

## 6. Requisitos Não Funcionais

| Código | Requisito |
|--------|-----------|
| RNF01 | Autenticação obrigatória para todas as telas |
| RNF02 | Controle de acesso por perfil (Usuário / Funcionário / Gestor) |
| RNF03 | Interface responsiva (desktop e mobile) |
| RNF04 | Consulta de disponibilidade em ≤ 5s |
| RNF05 | Geração de relatório em ≤ 10s |
| RNF06 | Senhas armazenadas com `crypto.scrypt` + salt (módulo nativo do Node.js) |
| RNF07 | Todas as operações de escrita registradas com usuário e timestamp (trilha de auditoria) |
| RNF08 | Reservas somente dentro do horário de funcionamento do IC (configurável pelo Gestor) |
| RNF09 | O sistema deve funcionar **sem acesso à internet** — todos os assets (Bootstrap, ícones, fontes) servidos localmente a partir de `public/` |

---

## 7. Modelo de Dados (Entidades Principais)

```
Pessoa          — id, nome, matricula, cpf, email, cargo, perfil, senha_hash, ativo
Ambiente        — id, nome, tipo, capacidade, localizacao, ativo
Chave           — id, codigo, status, ambiente_id
Equipamento     — id, nome, categoria, codigo_patrimonio, status
Reserva         — id, pessoa_id, data, horario_inicio, horario_fim, status, tipo_recurso, criado_em
DetalheEvento   — id, reserva_id, tipo_evento, descricao, docente_responsavel, pessoa_autorizada
ReservaAmbiente — id, reserva_id, ambiente_id
ReservaEquip    — id, reserva_id, equipamento_id, reserva_ambiente_id (nullable)
MovChave        — id, chave_id, reserva_id, pessoa_id, tipo (retirada/devolucao), data_hora, observacoes
Relatorio       — id, pessoa_id, tipo, filtros_json, gerado_em
TokenRedefinicao — id, pessoa_id, token, expira_em, usado, criado_em
```

---

## 8. Fluxos Principais (User Stories)

### Fluxo 1 — Reservar uma sala
1. Usuário faz login → acessa "Nova Reserva de Ambiente"
2. Seleciona tipo (sala/lab/auditório), data, horário
3. Sistema exibe ambientes disponíveis no período
4. Usuário seleciona o ambiente e confirma
5. Sistema registra reserva com status "confirmada" e exibe comprovante

### Fluxo 2 — Retirar chave
1. Funcionário busca reserva pelo número ou pelo ambiente/data
2. Verifica status = "confirmada"
3. Clica em "Registrar Retirada"
4. Informa quem está retirando (valida se é responsável ou autorizado)
5. Sistema grava e atualiza status para "chave entregue"

### Fluxo 3 — Devolver chave
1. Funcionário busca reserva com status "chave entregue"
2. Clica em "Registrar Devolução"
3. Informa quem devolveu e observações opcionais
4. Sistema grava e atualiza status para "chave devolvida"

### Fluxo 4 — Reservar equipamento (independente)
1. Usuário acessa "Nova Reserva de Equipamento"
2. Seleciona equipamento, data/horário, finalidade
3. Sistema verifica disponibilidade e confirma
4. Comprovante gerado

### Fluxo 5 — Gerar relatório
1. Gestor acessa "Relatórios"
2. Seleciona filtros (período, tipo, status)
3. Sistema gera tabela com dados
4. Gestor exporta em PDF

---

## 9. Lacunas Identificadas no Relatório ⚠️

O relatório não detalha os seguintes pontos, que precisam de decisão antes ou durante o desenvolvimento:

| # | Lacuna | Impacto | Sugestão |
|---|--------|---------|----------|
| L1 | **Autenticação não tem RF** — mencionada só nos RNF | Alto — bloqueia todo o sistema | Definir RF13 (criado acima) |
| L2 | **CRUD de ambientes/equipamentos/usuários sem RF** | Alto — sem dados cadastrais o sistema não funciona | Definir RF10, RF11, RF12 (criados acima) |
| L3 | **Reservas recorrentes** | ~~Médio~~ | ✅ Resolvido — fora do escopo v1. Usuário cria reservas manualmente. |
| L4 | **Política de prioridade entre reservas concorrentes** | ~~Médio~~ | ✅ Resolvido — "primeiro a confirmar ganha": o sistema bloqueia o recurso no momento da confirmação. Não há fila ou hierarquia. |
| L5 | **Devoluções em atraso** | ~~Médio~~ | ✅ Resolvido — RF18 adicionado: tela dedicada com itens em atraso destacados e botão de notificação manual por e-mail. |
| L6 | **Cancelamento com prazo** | ~~Baixo~~ | ✅ Resolvido — cancelamento permitido até o horário de início da reserva. Após a retirada da chave/equipamento, o cancelamento não é mais possível. |
| L7 | **Política de extravio de chave** | ~~Baixo~~ | ✅ Resolvido — o funcionário registra a ocorrência de extravio na tela de devolução. O status da chave muda para "extraviada" e a reserva encerra como "chave extraviada". O gestor visualiza o histórico no relatório. |
| L8 | **Notificações por e-mail** | ~~Baixo/Médio~~ | ✅ Resolvido — RF15 adicionado (empréstimo e devolução de chaves e equipamentos, com degradação elegante offline). |
| L9 | **Armazenamento de relatórios gerados** | ~~Baixo~~ | ✅ Resolvido — relatórios gerados sob demanda, sem armazenamento. Cada acesso processa os dados em tempo real. |
| L10 | **Nível de acesso por relatório** | ~~Médio~~ | ✅ Resolvido — Gestor acessa todos os relatórios sem restrição; Funcionário acessa relatórios filtrados apenas pela data atual. |
| L11 | **Configuração do horário de funcionamento do IC** | ~~Médio~~ | ✅ Resolvido — configurável pelo Gestor no painel de administração (RF10 ampliado). |
| L12 | **Retirada/devolução de equipamentos sem RF** | ~~Alto~~ | ✅ Resolvido — RF16 (retirada) e RF17 (devolução) adicionados, análogos ao RF03/RF04. |

---

## 10. Escopo da Versão 1.0

**Dentro do escopo:**
- RF01 a RF09 (conforme relatório)
- RF10, RF11, RF12, RF13 (cadastros base e autenticação)
- RF14 (recuperação de senha via e-mail)
- RF15 (notificações por e-mail em empréstimo e devolução)
- RF16 (retirada de equipamento)
- RF17 (devolução de equipamento)
- RF18 (tela de devoluções em atraso com notificação manual)
- 3 perfis de usuário

**Fora do escopo (v1):**
- Reservas recorrentes (L3)
- App mobile nativo
- Integração com sistemas externos da UFMT (SIGA, etc.)

---

## 11. Telas Previstas

| Tela | Perfil |
|------|--------|
| Login | Todos |
| Esqueci minha senha | Todos (sem autenticação) |
| Redefinir senha (via link) | Todos (sem autenticação) |
| Dashboard | Todos (conteúdo por perfil) |
| Calendário de disponibilidade | Todos |
| Nova reserva de ambiente | Usuário |
| Nova reserva de equipamento | Usuário |
| Detalhes da reserva | Usuário/Funcionário |
| Registrar retirada de chave | Funcionário |
| Registrar devolução de chave | Funcionário |
| Registrar retirada de equipamento | Funcionário |
| Registrar devolução de equipamento | Funcionário |
| Devoluções em atraso | Funcionário / Gestor |
| Relatórios | Funcionário (data atual) / Gestor (completo) |
| Gerenciar ambientes | Gestor |
| Gerenciar equipamentos | Gestor |
| Gerenciar usuários | Gestor |

---

## 12. Próximos Passos

1. Validar as **decisões das lacunas** (seção 9) antes de codificar
2. Criar o **schema do banco de dados** MySQL com base na seção 7
3. Configurar o projeto Node.js/Express com estrutura MVC
4. Implementar RF13 (autenticação) como primeira entrega
5. Implementar RF10/RF11/RF12 (cadastros base)
6. Implementar RF01 → RF09 em ordem de prioridade
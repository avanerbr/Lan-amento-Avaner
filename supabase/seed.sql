-- =========================================================================
-- Painel de Lançamento Avaner — seed.sql
-- Rode DEPOIS do schema.sql. Popula as 34 tarefas do checklist do Guilherme
-- (Fases 1 a 5). É seguro rodar de novo: usa ON CONFLICT (id) DO UPDATE,
-- então só atualiza os dados — não duplica linhas.
-- Os 4 primeiros itens da Fase 1 já entram marcados como concluídos por
-- Guilherme, exatamente como estavam no quadro anterior.
-- =========================================================================

insert into public.tasks (id, phase, title, detail, owner, due_date, sort_order, done, done_by, status, priority) values
('f1',  'Fase 1: Alicerce', 'Doc de Direção da oferta', null, 'Guilherme', '2026-09-01', 1, true,  'Guilherme', 'done', 'normal'),
('f2',  'Fase 1: Alicerce', 'Criar/Configurar Grupo', null, 'Guilherme', '2026-09-02', 2, true,  'Guilherme', 'done', 'normal'),
('f3',  'Fase 1: Alicerce', 'Funil de Vendas', null, 'Guilherme', '2026-09-03', 3, true,  'Guilherme', 'done', 'normal'),
('f4',  'Fase 1: Alicerce', 'Estruturação das estratégias', null, 'Guilherme', '2026-09-03', 4, true,  'Guilherme', 'done', 'normal'),
('f5',  'Fase 1: Alicerce', 'Copy VSL Página de Captação', null, 'Guilherme', '2026-09-09', 5, false, null, 'todo', 'normal'),
('f6',  'Fase 1: Alicerce', 'Copy 10 Vídeos de Anúncio', null, 'Guilherme', '2026-09-11', 6, false, null, 'todo', 'normal'),
('f7',  'Fase 1: Alicerce', '5 Estáticos Ads/Posts', null, 'Guilherme', '2026-09-11', 7, false, null, 'todo', 'normal'),
('f8',  'Fase 1: Alicerce', 'Página de Vendas', null, 'Guilherme', '2026-09-15', 8, false, null, 'todo', 'normal'),
('f9',  'Fase 1: Alicerce', 'Revisar / aprovar copys e criativos', null, 'Michael/Jamille', '2026-09-12', 9, false, null, 'todo', 'normal'),
('f10', 'Fase 1: Alicerce', 'Gravar VSL p/ LP', null, 'Michael/Jamille', '2026-09-13', 10, false, null, 'todo', 'normal'),
('f11', 'Fase 1: Alicerce', 'Gravar Criativos', null, 'Michael/Jamille', '2026-09-16', 11, false, null, 'todo', 'normal'),
('f12', 'Fase 1: Alicerce', 'Editar Criativos', null, 'Michael/Jamille', '2026-09-18', 12, false, null, 'todo', 'normal'),

('f13', 'Fase 2: Campanhas', 'Definir plano de mídia (verba R$5.000) e meta de CPL', 'Verba enxuta pra meta de R$1-3MM — definir CPL-alvo e quanto reservar pra remarketing perto da live.', 'Guilherme', '2026-09-24', 1, false, null, 'todo', 'normal'),
('f14', 'Fase 2: Campanhas', 'Acessos Facebook/Instagram', null, 'Guilherme', '2026-09-19', 2, false, null, 'todo', 'normal'),
('f15', 'Fase 2: Campanhas', 'Configuração de Pixel/Trakeamento', null, 'Guilherme', '2026-09-22', 3, false, null, 'todo', 'normal'),
('f16', 'Fase 2: Campanhas', 'Subir campanhas pro ar', null, 'Guilherme', '2026-09-25', 4, false, null, 'todo', 'normal'),

('f17', 'Fase 3: Captação e Aquecimento dos Leads', 'Copys mensagens grupo (direcionamento)', null, 'Guilherme', '2026-09-29', 1, false, null, 'todo', 'normal'),
('f18', 'Fase 3: Captação e Aquecimento dos Leads', 'Copy nova leva de criativos (10/15 peças)', null, 'Guilherme', '2026-10-03', 2, false, null, 'todo', 'normal'),
('f19', 'Fase 3: Captação e Aquecimento dos Leads', 'Otimizar campanhas / LP / funil', 'Contínuo — revisar semanalmente com dados reais das campanhas.', 'Guilherme', '2026-10-10', 3, false, null, 'todo', 'normal'),
('f20', 'Fase 3: Captação e Aquecimento dos Leads', 'Gravar nova leva de criativos (10/15 peças)', null, 'Michael/Jamille', '2026-10-08', 4, false, null, 'todo', 'normal'),
('f21', 'Fase 3: Captação e Aquecimento dos Leads', 'Continuidade das mensagens no grupo', null, 'Michael/Jamille', '2026-10-17', 5, false, null, 'todo', 'normal'),
('f22', 'Fase 3: Captação e Aquecimento dos Leads', 'Enviar mensagens diárias, analisar leads e definir otimizações', 'A partir daqui a responsabilidade é de todo o time em conjunto — depende de dados que só existem depois do início das campanhas.', 'Equipe', '2026-10-17', 6, false, null, 'todo', 'normal'),

('f23', 'Fase 4: Live de Lançamento', 'Copy 2 VSLs (Página de Vendas + Form)', 'O VSL da Página de Vendas é o ponto certo pra quebra de objeção — filtrar quem não tem perfil antes da oferta.', 'Guilherme', '2026-10-12', 1, false, null, 'todo', 'normal'),
('f24', 'Fase 4: Live de Lançamento', 'Copy Slides', null, 'Guilherme', '2026-10-13', 2, false, null, 'todo', 'normal'),
('f25', 'Fase 4: Live de Lançamento', 'Desenvolvimento dos Slides', null, 'Guilherme', '2026-10-16', 3, false, null, 'todo', 'normal'),
('f26', 'Fase 4: Live de Lançamento', 'Formulário (p/ Leads Pós Live)', null, 'Guilherme', '2026-10-15', 4, false, null, 'todo', 'normal'),
('f27', 'Fase 4: Live de Lançamento', 'Criar LP form (p/ Leads pós live)', null, 'Guilherme', '2026-10-16', 5, false, null, 'todo', 'normal'),
('f28', 'Fase 4: Live de Lançamento', 'Gravar VSLs', null, 'Michael', '2026-10-15', 6, false, null, 'todo', 'normal'),
('f29', 'Fase 4: Live de Lançamento', 'Editar VSLs', null, 'Michael', '2026-10-18', 7, false, null, 'todo', 'normal'),
('f30', 'Fase 4: Live de Lançamento', 'Testes técnicos da live no Zoom (sala, gravação, checkout)', null, 'Guilherme', '2026-10-19', 8, false, null, 'todo', 'normal'),
('f31', 'Fase 4: Live de Lançamento', 'Live de Lançamento — pitch e oferta', null, 'Michael', '2026-10-20', 9, false, null, 'todo', 'urgente'),

('f32', 'Fase 5: Pós-Lançamento', 'Retrospectiva do lançamento', null, 'Michael', '2026-10-26', 1, false, null, 'todo', 'normal'),
('f33', 'Fase 5: Pós-Lançamento', 'Onboarding dos novos consorciados', null, 'Jamille', '2026-10-27', 2, false, null, 'todo', 'normal'),
('f34', 'Fase 5: Pós-Lançamento', 'Decidir sobre renovação do contrato com Guilherme', null, 'Michael', '2026-10-27', 3, false, null, 'todo', 'normal')

on conflict (id) do update set
  phase      = excluded.phase,
  title      = excluded.title,
  detail     = excluded.detail,
  owner      = excluded.owner,
  due_date   = excluded.due_date,
  sort_order = excluded.sort_order;
  -- done/done_by/status/priority não são sobrescritos num re-run, pra não
  -- "desmarcar" ou desfazer prioridades/bloqueios que o time já ajustou
  -- no painel.

-- Nota: o UPDATE acima não toca done/done_by/status/priority de propósito.
-- Na primeira execução, os valores do INSERT valem normalmente (f1-f4
-- nascem 'done'; f31 — a própria live — já nasce marcada como 'urgente'
-- só de exemplo de como a prioridade funciona; ajuste como quiser depois
-- direto no painel).

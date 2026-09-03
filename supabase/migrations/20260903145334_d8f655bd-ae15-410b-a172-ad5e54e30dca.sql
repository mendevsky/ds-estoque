
create type public.app_role as enum ('superuser','gestor','tecnico');

create table public.clinicas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text not null default '',
  created_at timestamptz not null default now()
);
grant select on public.clinicas to authenticated;
grant insert, update, delete on public.clinicas to authenticated;
grant all on public.clinicas to service_role;
alter table public.clinicas enable row level security;

create table public.profiles (
  id uuid primary key,
  nome text not null default '',
  clinica_id uuid references public.clinicas(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_superuser()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'superuser')
$$;

create or replace function public.current_clinica()
returns uuid language sql stable security definer set search_path = public as $$
  select clinica_id from public.profiles where id = auth.uid()
$$;

create policy "clinicas_select" on public.clinicas for select to authenticated using (true);
create policy "clinicas_insert" on public.clinicas for insert to authenticated with check (public.is_superuser());
create policy "clinicas_update" on public.clinicas for update to authenticated using (public.is_superuser());
create policy "clinicas_delete" on public.clinicas for delete to authenticated using (public.is_superuser());

create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_superuser() or clinica_id = public.current_clinica());
create policy "profiles_insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update" on public.profiles for update to authenticated using (id = auth.uid() or public.is_superuser());

create policy "user_roles_select" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_superuser());

create table public.insumos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  nome text not null,
  categoria text not null default 'Descartável',
  unidade text not null default 'un',
  codigo_barras text,
  localizacao text not null default '',
  estoque_minimo numeric not null default 0,
  consumo_mensal_estimado numeric not null default 0,
  created_at timestamptz not null default now()
);
create index on public.insumos (clinica_id);
grant select, insert, update, delete on public.insumos to authenticated;
grant all on public.insumos to service_role;
alter table public.insumos enable row level security;
create policy "insumos_all" on public.insumos for all to authenticated
  using (clinica_id = public.current_clinica() or public.is_superuser())
  with check (clinica_id = public.current_clinica() or public.is_superuser());

create table public.lotes (
  id uuid primary key default gen_random_uuid(),
  insumo_id uuid not null references public.insumos(id) on delete cascade,
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  lote text not null default '',
  validade date,
  quantidade numeric not null default 0,
  created_at timestamptz not null default now()
);
create index on public.lotes (insumo_id);
grant select, insert, update, delete on public.lotes to authenticated;
grant all on public.lotes to service_role;
alter table public.lotes enable row level security;
create policy "lotes_all" on public.lotes for all to authenticated
  using (clinica_id = public.current_clinica() or public.is_superuser())
  with check (clinica_id = public.current_clinica() or public.is_superuser());

create table public.procedimentos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  nome text not null,
  descricao text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.procedimentos to authenticated;
grant all on public.procedimentos to service_role;
alter table public.procedimentos enable row level security;
create policy "procedimentos_all" on public.procedimentos for all to authenticated
  using (clinica_id = public.current_clinica() or public.is_superuser())
  with check (clinica_id = public.current_clinica() or public.is_superuser());

create table public.procedimento_itens (
  id uuid primary key default gen_random_uuid(),
  procedimento_id uuid not null references public.procedimentos(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete cascade,
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  quantidade numeric not null default 1
);
grant select, insert, update, delete on public.procedimento_itens to authenticated;
grant all on public.procedimento_itens to service_role;
alter table public.procedimento_itens enable row level security;
create policy "procedimento_itens_all" on public.procedimento_itens for all to authenticated
  using (clinica_id = public.current_clinica() or public.is_superuser())
  with check (clinica_id = public.current_clinica() or public.is_superuser());

create table public.movimentacoes (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references public.clinicas(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete cascade,
  lote_id uuid references public.lotes(id) on delete set null,
  procedimento_id uuid references public.procedimentos(id) on delete set null,
  tipo text not null default 'saida',
  quantidade numeric not null default 0,
  localizacao text not null default '',
  observacao text not null default '',
  user_id uuid,
  created_at timestamptz not null default now()
);
create index on public.movimentacoes (clinica_id, created_at desc);
grant select, insert, update, delete on public.movimentacoes to authenticated;
grant all on public.movimentacoes to service_role;
alter table public.movimentacoes enable row level security;
create policy "movimentacoes_all" on public.movimentacoes for all to authenticated
  using (clinica_id = public.current_clinica() or public.is_superuser())
  with check (clinica_id = public.current_clinica() or public.is_superuser());

create or replace function public.validar_tipo_movimentacao()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.tipo not in ('entrada','saida','ajuste') then
    raise exception 'tipo inválido: %', new.tipo;
  end if;
  return new;
end; $$;
create trigger movimentacoes_tipo before insert or update on public.movimentacoes
  for each row execute function public.validar_tipo_movimentacao();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _clinica uuid;
begin
  begin
    _clinica := nullif(new.raw_user_meta_data->>'clinica_id','')::uuid;
  exception when others then _clinica := null; end;

  insert into public.profiles (id, nome, clinica_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome',''), _clinica)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'tecnico')
  on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.clinicas (nome, cidade) values
  ('Clínica Centro','Recife'),
  ('Clínica Boa Viagem','Recife'),
  ('Clínica Casa Amarela','Recife'),
  ('Clínica Espinheiro','Recife'),
  ('Clínica Olinda','Olinda'),
  ('Clínica Jaboatão','Jaboatão dos Guararapes'),
  ('Clínica Caruaru','Caruaru'),
  ('Clínica Petrolina','Petrolina'),
  ('Clínica Garanhuns','Garanhuns'),
  ('Clínica Paulista','Paulista'),
  ('Clínica Camaragibe','Camaragibe'),
  ('Clínica Vitória','Vitória de Santo Antão'),
  ('Clínica Serra Talhada','Serra Talhada'),
  ('Clínica Arcoverde','Arcoverde'),
  ('Clínica Igarassu','Igarassu');

do $seed$
declare c record; ins record; novo_id uuid; proc_id uuid;
begin
  for c in select id from public.clinicas loop
    for ins in
      select * from (values
        ('Luva de nitrilo (par)','EPI','pares','7891000100101','Armário A1',300,380),
        ('Seringa descartável 5 ml','Descartável','un','7891000100202','Armário A2',200,160),
        ('Agulha 25x7','Descartável','un','7891000100303','Armário A2',150,150),
        ('Clorexidina 2% 100 ml','Antisséptico','frascos','7891000100404','Prateleira B1',8,6),
        ('Lidocaína 2% 20 ml','Medicamento','frascos','7891000100505','Sala de medicação',10,9),
        ('Gaze estéril 7,5 cm','Descartável','pacotes','7891000100606','Armário A3',120,140),
        ('Fio de sutura Nylon 4-0','Instrumental','un','7891000100707','Sala de procedimentos',40,32),
        ('Soro fisiológico 0,9% 500 ml','Medicamento','frascos','7891000100808','Prateleira B2',30,40),
        ('Esparadrapo microporoso','Descartável','rolos','7891000100909','Armário A3',20,18),
        ('Máscara cirúrgica tripla','EPI','un','7891000101010','Armário A1',250,300),
        ('Álcool 70% 1 L','Antisséptico','frascos','7891000101111','Prateleira B1',12,10),
        ('Campo cirúrgico estéril','Instrumental','un','7891000101212','Sala de procedimentos',40,35)
      ) as t(nome,categoria,unidade,codigo,local,minimo,consumo)
    loop
      insert into public.insumos (clinica_id, nome, categoria, unidade, codigo_barras, localizacao, estoque_minimo, consumo_mensal_estimado)
      values (c.id, ins.nome, ins.categoria, ins.unidade, ins.codigo, ins.local, ins.minimo, ins.consumo)
      returning id into novo_id;

      insert into public.lotes (insumo_id, clinica_id, lote, validade, quantidade)
      values (novo_id, c.id, 'L-' || substr(md5(novo_id::text),1,6), current_date + ((20 + (random()*400)::int)), greatest(5, (ins.consumo * (0.4 + random()*2))::numeric(10,0)));

      insert into public.lotes (insumo_id, clinica_id, lote, validade, quantidade)
      values (novo_id, c.id, 'L-' || substr(md5(novo_id::text),7,6), current_date + ((60 + (random()*600)::int)), greatest(5, (ins.consumo * (0.3 + random()))::numeric(10,0)));
    end loop;

    insert into public.procedimentos (clinica_id, nome, descricao) values (c.id,'Sutura simples','Fechamento de feridas') returning id into proc_id;
    insert into public.procedimento_itens (procedimento_id, insumo_id, clinica_id, quantidade)
      select proc_id, i.id, c.id, v.q from public.insumos i
      join (values ('Luva de nitrilo (par)',2),('Fio de sutura Nylon 4-0',1),('Gaze estéril 7,5 cm',3),('Campo cirúrgico estéril',1)) as v(n,q) on v.n = i.nome
      where i.clinica_id = c.id;

    insert into public.procedimentos (clinica_id, nome, descricao) values (c.id,'Curativo avançado','Troca de curativo') returning id into proc_id;
    insert into public.procedimento_itens (procedimento_id, insumo_id, clinica_id, quantidade)
      select proc_id, i.id, c.id, v.q from public.insumos i
      join (values ('Luva de nitrilo (par)',1),('Gaze estéril 7,5 cm',2),('Soro fisiológico 0,9% 500 ml',1),('Esparadrapo microporoso',1)) as v(n,q) on v.n = i.nome
      where i.clinica_id = c.id;

    insert into public.procedimentos (clinica_id, nome, descricao) values (c.id,'Medicação intramuscular','Aplicação IM') returning id into proc_id;
    insert into public.procedimento_itens (procedimento_id, insumo_id, clinica_id, quantidade)
      select proc_id, i.id, c.id, v.q from public.insumos i
      join (values ('Seringa descartável 5 ml',1),('Agulha 25x7',1),('Álcool 70% 1 L',1),('Luva de nitrilo (par)',1)) as v(n,q) on v.n = i.nome
      where i.clinica_id = c.id;

    insert into public.procedimentos (clinica_id, nome, descricao) values (c.id,'Coleta de sangue','Punção venosa') returning id into proc_id;
    insert into public.procedimento_itens (procedimento_id, insumo_id, clinica_id, quantidade)
      select proc_id, i.id, c.id, v.q from public.insumos i
      join (values ('Seringa descartável 5 ml',1),('Agulha 25x7',1),('Luva de nitrilo (par)',1),('Esparadrapo microporoso',1)) as v(n,q) on v.n = i.nome
      where i.clinica_id = c.id;
  end loop;
end $seed$;

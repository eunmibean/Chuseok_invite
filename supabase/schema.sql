-- ============================================================
-- 추석맞이 초대장 — RSVP 테이블
-- Supabase 프로젝트의 SQL Editor에 붙여넣고 실행하세요.
-- ============================================================

create table if not exists public.chuseok (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  attending boolean not null,
  guest_count int not null default 0,
  invited_as text,               -- 개인화 링크(?to=이름)로 들어온 경우 원래 초대 대상 이름
  responded_at timestamptz not null default now()
);

-- Row Level Security 활성화
alter table public.chuseok enable row level security;

-- anon key로 누구나 RSVP를 "추가"할 수 있도록 허용
-- (초대장은 인증 없이 링크만으로 접속하는 구조라 insert만 열어둡니다)
create policy "anyone can submit rsvp"
  on public.chuseok
  for insert
  to anon
  with check (true);

-- 호스트 본인만 응답 목록을 볼 수 있도록 하려면 아래처럼
-- Supabase 대시보드(Table editor)에서 직접 확인하는 것을 권장합니다.
-- 만약 초대장 페이지에서 "지금까지 몇 명 참석하는지" 같은 걸 보여주고
-- 싶다면 아래 select 정책 주석을 해제하세요. (참석자 명단이 모두에게
-- 공개되므로 필요할 때만 사용하세요)
-- create policy "anyone can read rsvps"
--   on public.rsvps
--   for select
--   to anon
--   using (true);

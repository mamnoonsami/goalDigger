-- Create auction_managers table
create table public.auction_managers (
    id uuid default gen_random_uuid() primary key,
    auction_id uuid references public.auctions(id) on delete cascade not null,
    manager_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(auction_id, manager_id)
);

-- Turn on RLS
alter table public.auction_managers enable row level security;

-- Policies
create policy "Anyone can view auction managers"
    on public.auction_managers for select
    using ( true );

create policy "Admins can manage auction managers"
    on public.auction_managers for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
    );

create policy "Managers can join auctions themselves"
    on public.auction_managers for insert
    with check (
        auth.uid() = manager_id
        and exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.is_manager = true
        )
    );

create policy "Managers can leave auctions themselves"
    on public.auction_managers for delete
    using (
        auth.uid() = manager_id
    );

alter table profiles alter column saldo_usd set default 0;
alter table profiles alter column rating_sum set default 0;
alter table profiles alter column rating_count set default 0;

update profiles set saldo_usd = 0 where saldo_usd = 3;
update profiles set rating_sum = 0, rating_count = 0
where rating_count = 1
  and rating_sum = 5
  and not exists (select 1 from ratings r where r.to_user = profiles.user_id);

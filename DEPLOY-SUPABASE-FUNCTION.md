# BẮT BUỘC: Deploy Edge Function tạo tài khoản thợ

Website là static site. Upload ZIP lên Netlify **không tự deploy** thư mục `supabase/functions`.
Vì vậy chức năng “Tạo tài khoản cho thợ” chỉ hoạt động sau khi function được deploy vào Supabase.

Project hiện tại: `kjyavdlnuboumdvcfbqj`
Domain: `https://cheesegrad.click`

## Cách deploy

1. Cài Supabase CLI và đăng nhập.
2. Mở Terminal tại thư mục dự án.
3. Chạy:

```bash
supabase login
supabase link --project-ref kjyavdlnuboumdvcfbqj
supabase secrets set ALLOWED_ORIGINS=https://cheesegrad.click,https://www.cheesegrad.click
supabase functions deploy photographer-account --no-verify-jwt
```

`handler.js` tự kiểm tra Bearer token và RPC `is_admin()`, nên `--no-verify-jwt` chỉ tắt lớp kiểm tra JWT ở gateway để request/CORS đi được tới handler; function vẫn yêu cầu admin hợp lệ.

## Database
Chạy file `SUPABASE-PATCH-ACCOUNTS-CONFIRMATION.sql` trong Supabase SQL Editor nếu chưa chạy.

## Kiểm tra
Supabase Dashboard > Edge Functions phải có function `photographer-account`. Sau khi deploy, đăng xuất/đăng nhập lại Admin rồi thử tạo tài khoản thợ.

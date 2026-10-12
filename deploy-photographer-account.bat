@echo off
set PROJECT_REF=kjyavdlnuboumdvcfbqj
echo Linking Supabase project %PROJECT_REF%...
supabase link --project-ref %PROJECT_REF% || goto :err
supabase secrets set ALLOWED_ORIGINS=https://cheesegrad.click,https://www.cheesegrad.click || goto :err
supabase functions deploy photographer-account --no-verify-jwt || goto :err
echo.
echo DONE. Edge Function photographer-account deployed.
pause
exit /b 0
:err
echo.
echo FAILED. Run supabase login first and try again.
pause
exit /b 1

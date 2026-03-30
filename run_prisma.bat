@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "c:\Users\Admin\OneDrive\ドキュメント\SBgara\sb-garage"
echo === Running prisma db push ===
call npx prisma db push --accept-data-loss
echo === Running prisma db seed ===
call npx prisma db seed
echo === DONE ===

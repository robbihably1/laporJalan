@echo off
echo ========================================================
echo   Menjalankan Seluruh Aplikasi LaporJalan 
echo ========================================================
echo.
echo [1/2] Membuka Backend Node.js (Port 5000 & SQLite)...
start "Backend Node.js Server" cmd /k "cd backend && npm start"

echo [2/2] Membuka Frontend React (Vite Web)...
start "Frontend React Web" cmd /k "npm run dev"

echo.
echo ========================================================
echo  SUKSES! Kedua server telah dinyalakan di jendela baru.
echo  - Backend API : http://localhost:5000
echo  - Frontend Web: http://localhost:5173
echo ========================================================
echo.
pause

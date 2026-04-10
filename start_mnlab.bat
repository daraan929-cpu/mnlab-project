@echo off
echo =======================================================
echo          MNLAB 3D Printing - Local Web Server
echo =======================================================
echo.

:: Get the local IPv4 address
for /f "tokens=14" %%a in ('ipconfig ^| findstr IPv4') do set LOCAL_IP=%%a

echo [INFO] Your computer's local IP address is: %LOCAL_IP%
echo.
echo =======================================================
echo [MOBILE ACCESS] 
echo Open the browser on your mobile phone (connected to the same WiFi)
echo and visit: http://%LOCAL_IP%:8000
echo =======================================================
echo.

:: Install requirements if needed
echo [INFO] Checking and installing Python requirements...
cd /d "%~dp0backend"
python -m pip install -r requirements.txt --quiet
echo [INFO] Requirements OK.
echo.

echo Press Ctrl+C at any time to stop the server.
echo Starting Web Server...
echo.

:: Start FastAPI backend and frontend together
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

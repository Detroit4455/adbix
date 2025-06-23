@echo off
echo Checking prerequisites...

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Please install Node.js 18.x or later.
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo npm is not installed. Please install npm.
    exit /b 1
)

:: Check if .env.local exists
if not exist .env.local (
    echo MongoDB connection not configured. Running setup script...
    call npm run setup
)

:: Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

:: Start the development server
echo Starting development server...
call npm run dev 
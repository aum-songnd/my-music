@echo off
setlocal enabledelayedexpansion

cd /d %~dp0

set "musicDir=music"
set "output=%musicDir%\playlist.json"

if not exist "%musicDir%" (
    echo ERROR: Folder music does not exist!
    pause
    exit /b
)

echo [ > "%output%"

set first=1

for %%f in ("%musicDir%\*.mp3") do (
    set "name=%%~nf"
    set "file=music/%%~nxf"

    if !first! == 1 (
        set first=0
    ) else (
        echo , >> "%output%"
    )

    echo { "name": "!name!", "file": "!file!" } >> "%output%"
)

echo ] >> "%output%"

echo Done playlist.json created!
pause
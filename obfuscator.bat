copy /y ".\package.json" ".\build\package.json"
echo y|npx javascript-obfuscator ".\main.js" --config ".\js-obfuscator\main.js.json" --output ".\build\main.js"
echo y|npx javascript-obfuscator ".\public\js\login.js" --config ".\js-obfuscator\login.js.json" --output ".\build\js\login.js"
for /f %%f in ('dir /b .\public\js\preload\*.js') do (
    echo y|npx javascript-obfuscator ".\public\js\preload\%%f" --config ".\js-obfuscator\preload.json" --output ".\build\js\preload\%%f"
)
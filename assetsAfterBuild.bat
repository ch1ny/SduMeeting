copy /y ".\builtPackage.json" ".\build\package.json"
echo y|npx javascript-obfuscator ".\main.js" --config ".\js-obfuscator\main.js.json" --output ".\build\main.js"
for /f %%f in ('dir /b .\public\preload\*.js') do (
    echo y|npx javascript-obfuscator ".\public\preload\%%f" --config ".\js-obfuscator\preload.json" --output ".\build\preload\%%f"
)
echo d|xcopy /y /E ".\public\electronAssets" ".\build\electronAssets"
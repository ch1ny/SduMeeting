copy /y ".\builtPackage.json" ".\build\package.json"
echo y|npx javascript-obfuscator ".\main.js" --config ".\js-obfuscator\main.js.json" --output ".\build\main.js"
echo d|xcopy /y /E ".\public\electronAssets" ".\build\electronAssets"
echo d|xcopy /y /E ".\public\emoji" ".\build\main\emoji"
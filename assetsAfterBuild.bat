copy /y ".\builtPackage.json" ".\build\package.json"
echo y|npx javascript-obfuscator ".\electron" --config ".\js-obfuscator\main.js.json" --output ".\build\electron"
echo d|xcopy /y /E ".\public\electronAssets" ".\build\electronAssets"
echo d|xcopy /y /E ".\public\emoji" ".\build\main\emoji"
@echo off
set platform=%1
set arch=%2
mkdir ".\dist\SduMeeting-%platform%-%arch%\resources\node_modules"
set need_modules="ajv" "ajv-formats" "atomically" "conf" "debounce-fn" "dot-prop" "electron-store" "env-paths" "fast-deep-equal" "is-obj" "json-schema-traverse" "json-schema-typed" "lru-cache" "mimic-fn" "onetime" "path-exists" "pkg-up" "p-limit" "p-try" "semver" "type-fest" "uri-js" "yallist" "fluent-ffmpeg" "which" "isexe" "async"
(for %%m in (%need_modules%) do (
    echo d|xcopy /y /E ".\node_modules\%%m" ".\dist\SduMeeting-%platform%-%arch%\resources\node_modules\%%m"
))
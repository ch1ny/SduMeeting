@echo off
set platform=%1
set arch=%2
copy /y ".\ReadyUpdater.exe" ".\dist\SduMeeting-%platform%-%arch%\resources\ReadyUpdater.exe"
mkdir ".\dist\SduMeeting-%platform%-%arch%\resources\node_modules"
set need_modules="adm-zip" "ajv" "ajv-formats" "asn1" "assert-plus" "asynckit" "atomically" "aws4" "aws-sign2" "caseless" "combined-stream" "conf" "debounce-fn" "delayed-stream" "dot-prop" "ecc-jsbn" "electron-asar-hot-updater" "electron-log" "electron-store" "env-paths" "extend" "extsprintf" "fast-deep-equal" "fast-json-stable-stringify" "forever-agent" "form-data" "har-schema" "har-validator" "http-signature" "is-obj" "isstream" "is-typedarray" "jsbn" "json-schema" "json-schema-traverse" "json-schema-typed" "json-stringify-safe" "jsprim" "lru-cache" "mime-db" "mime-types" "mimic-fn" "oauth-sign" "onetime" "path-exists" "performance-now" "pkg-up" "psl" "p-limit" "p-try" "request" "request-progress" "safe-buffer" "safer-buffer" "semver" "semver-diff" "sshpk" "throttleit" "tough-cookie" "tunnel-agent" "tweetnacl" "type-fest" "uri-js" "uuid" "yallist" "fluent-ffmpeg" "verror" "which" "isexe" "async"
(for %%m in (%need_modules%) do (
    echo d|xcopy /y /E ".\node_modules\%%m" ".\dist\SduMeeting-%platform%-%arch%\resources\node_modules\%%m"
))
#!/bin/bash
# Jalankan Newman (semua collection) + k6 lewat runner project, simpan report per run,
# lalu kirim notifikasi Telegram (saat mulai dan saat selesai, berisi LINK report).
#
# Contoh cron:
#   # harian, hari kerja jam 08:00 (Newman + smoke + load)
#   0 8 * * 1-5 /opt/automation-test/run-tests.sh >> /home/ubuntu/automation-test.log 2>&1
#   # mingguan, Sabtu jam 22:00 (stress + soak saja, tanpa Newman)
#   0 22 * * 6  RUN_NEWMAN=false K6_TYPES=stress,soak /opt/automation-test/run-tests.sh >> /home/ubuntu/automation-test.log 2>&1
set -u

PROJECT_DIR="${PROJECT_DIR:-/opt/automation-test}"
cd "$PROJECT_DIR" || exit 1

# Ambil hanya variabel yang dibutuhkan dari .env (aman untuk file berformat Windows/CRLF)
get_env() {
  [ -f .env ] || return 0
  grep -E "^$1=" .env | head -1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}
TG_TOKEN="${TG_TOKEN:-$(get_env TG_TOKEN)}"
TG_CHAT_ID="${TG_CHAT_ID:-$(get_env TG_CHAT_ID)}"
REPORT_BASE_URL="${REPORT_BASE_URL:-$(get_env REPORT_BASE_URL)}"

# Pengaturan run. Prioritas: variabel di terminal/cron > isi .env > default.
NEWMAN_ENV="${NEWMAN_ENV:-$(get_env NEWMAN_ENV)}";   NEWMAN_ENV="${NEWMAN_ENV:-Dev}"
K6_TYPES="${K6_TYPES:-$(get_env K6_TYPES)}";         K6_TYPES="${K6_TYPES:-smoke,load}"
RUN_NEWMAN="${RUN_NEWMAN:-$(get_env RUN_NEWMAN)}";   RUN_NEWMAN="${RUN_NEWMAN:-true}"
RUN_K6="${RUN_K6:-$(get_env RUN_K6)}";               RUN_K6="${RUN_K6:-true}"

# Kirim pesan Telegram (HTML) ke satu atau banyak chat ID (dipisah koma, mis. 123,-100456).
# Error Telegram dicatat ke log per chat, tidak menghentikan script.
tg_send() {
  [ -n "$TG_TOKEN" ] && [ -n "$TG_CHAT_ID" ] || { echo "TG_TOKEN/TG_CHAT_ID kosong, notifikasi dilewati."; return 0; }
  local resp cid
  local IFS=','
  for cid in $TG_CHAT_ID; do
    cid=$(echo "$cid" | tr -d '[:space:]')
    [ -z "$cid" ] && continue
    resp=$(curl -s -m 20 -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
      -d chat_id="$cid" \
      -d parse_mode=HTML \
      -d disable_web_page_preview=true \
      --data-urlencode text="$1")
    echo "$resp" | grep -q '"ok":true' || echo "Notifikasi Telegram ke $cid gagal: $resp"
  done
}

# Format detik -> "1j 05m 30d" / "5m 30d" / "30d"
fmt_duration() {
  local s=$1
  if [ "$s" -ge 3600 ]; then printf '%dj %02dm %02dd' $((s/3600)) $((s%3600/60)) $((s%60))
  elif [ "$s" -ge 60 ]; then printf '%dm %02dd' $((s/60)) $((s%60))
  else printf '%dd' "$s"; fi
}

# Sinkronisasi git yang aman untuk server otomasi (tanpa manusia yang resolve konflik):
#   1. Kalau ada perubahan lokal (mis. file report yang ter-track), commit dulu otomatis.
#   2. Coba fast-forward (paling bersih).
#   3. Kalau tidak bisa fast-forward (divergent), coba merge otomatis.
#   4. Kalau merge bentrok, batalkan merge dan samakan paksa dengan origin
#      (remote dianggap sumber kebenaran untuk server otomasi).
# Return 0 kalau berhasil sync (apapun jalurnya), 1 kalau gagal total (mis. tidak ada koneksi).
git_sync() {
  local branch

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Bukan git repo, skip sync."
    return 1
  fi

  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  if [ -z "$branch" ] || [ "$branch" = "HEAD" ]; then
    echo "HEAD tidak menunjuk ke branch (detached?), skip sync."
    return 1
  fi

  if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -m "chore: auto-commit sebelum pull ($(date '+%Y-%m-%d %H:%M'))" >/dev/null 2>&1
    echo "Ada perubahan lokal, sudah di-commit otomatis sebelum pull."
  fi

  if ! git fetch origin "$branch" 2>&1; then
    echo "git fetch gagal, pakai versi lokal."
    return 1
  fi

  if git merge --ff-only "origin/$branch" >/dev/null 2>&1; then
    echo "git sync: fast-forward berhasil ($(git rev-parse --short HEAD))."
    return 0
  fi

  if git merge --no-edit "origin/$branch" >/dev/null 2>&1; then
    echo "git sync: merge berhasil ($(git rev-parse --short HEAD))."
    return 0
  fi

  echo "git sync: merge konflik, batalkan merge dan samakan paksa dengan origin/$branch."
  git merge --abort >/dev/null 2>&1
  if git reset --hard "origin/$branch" >/dev/null 2>&1; then
    echo "git sync: hard reset ke origin/$branch berhasil ($(git rev-parse --short HEAD))."
    return 0
  fi

  echo "git sync gagal total, pakai versi lokal apa adanya."
  return 1
}

# Cegah dua run berjalan bersamaan (soak test bisa 1+ jam)
exec 200>/tmp/run-tests.lock
flock -n 200 || { echo "Masih ada run berjalan, skip."; exit 1; }

START_TS=$(date +%s)
RUN_ID=$(date +%Y-%m-%d_%H%M)
REPORT_DIR="$PROJECT_DIR/reports/$RUN_ID"
BASE="$REPORT_BASE_URL/$RUN_ID"
mkdir -p "$REPORT_DIR"

echo "=== Mulai: $(date) | newman=$RUN_NEWMAN k6=$RUN_K6 ($K6_TYPES) env=$NEWMAN_ENV ==="
git_sync || echo "git sync gagal, pakai versi lokal."
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "-")

# ---------- 0. Notifikasi mulai ----------
SCOPE=""
[ "$RUN_NEWMAN" = "true" ] && SCOPE+="• API test (Newman)"$'\n'
[ "$RUN_K6" = "true" ]     && SCOPE+="• Load test (k6): ${K6_TYPES//,/, }"$'\n'
[ -z "$SCOPE" ] && SCOPE="• (tidak ada yang dijalankan)"$'\n'

START_MSG="🚀 <b>Automation test dimulai</b>"$'\n\n'
START_MSG+="🕐 $(date '+%d %b %Y, %H:%M %Z')"$'\n'
START_MSG+="🌐 Environment: <b>$NEWMAN_ENV</b>"$'\n'
START_MSG+="🔖 Versi: <code>$COMMIT</code>"$'\n\n'
START_MSG+="<b>Yang dijalankan:</b>"$'\n'"${SCOPE}"$'\n'
START_MSG+="Hasil akan dikirim setelah semua test selesai."
tg_send "$START_MSG"

FAIL=0
NEWMAN_LINES=""
K6_LINES=""

# ---------- 1. Newman (4 collection, berurutan, lengkap dengan before/after) ----------
if [ "$RUN_NEWMAN" = "true" ]; then
  node Newman/run-test.js --auto --env "$NEWMAN_ENV" --report-dir "$REPORT_DIR"
  NEWMAN_CODE=$?
  SUMMARY="$REPORT_DIR/newman-summary.json"

  if [ -f "$SUMMARY" ]; then
    NEWMAN_LINES=$(jq -r --arg base "$BASE" '
      def esc: gsub("&";"&amp;") | gsub("<";"&lt;") | gsub(">";"&gt;");
      .results[] |
      (if (.code == 0 and .setupOk) then "✅" else "❌" end) as $i |
      if .setupOk then
        "\($i) <a href=\"\($base)/newman-\(.slug).html\">\(.name | esc)</a>\n      \(.failed // "?") gagal dari \(.total // "?") assertion"
      else
        "\($i) \(.name | esc)\n      setup gagal, test tidak dijalankan"
      end' "$SUMMARY")$'\n'
    if [ "$(jq -r '.teardownFailed' "$SUMMARY")" = "true" ]; then
      NEWMAN_LINES+="⚠️ Teardown gagal, cek config server (IP blacklist, security header, CORS)"$'\n'
    fi
  else
    NEWMAN_LINES="❌ Runner Newman gagal total, summary tidak terbentuk"$'\n'
    NEWMAN_CODE=1
  fi
  [ $NEWMAN_CODE -ne 0 ] && FAIL=1
fi

# ---------- 2. k6 (selalu jalan, walau Newman ada yang gagal) ----------
if [ "$RUN_K6" = "true" ]; then
  node k6-test/run-test.js --auto --types "$K6_TYPES" --report-dir "$REPORT_DIR"
  K6_CODE=$?
  SUMMARY="$REPORT_DIR/k6-summary.json"

  if [ -f "$SUMMARY" ]; then
    K6_LINES=$(jq -r --arg base "$BASE" '
      def esc: gsub("&";"&amp;") | gsub("<";"&lt;") | gsub(">";"&gt;");
      .results[] |
      (if .code == 0 then "✅" else "❌" end) as $i |
      "\($i) <a href=\"\($base)/k6-\(.slug).html\">\(.name | esc)</a>\n      p95 \(.p95 // "?") ms · error \(.errorRate // "?")%"' "$SUMMARY")$'\n'
  else
    K6_LINES="❌ Runner k6 gagal total, summary tidak terbentuk"$'\n'
    K6_CODE=1
  fi
  [ $K6_CODE -ne 0 ] && FAIL=1
fi

# ---------- 2b. Dashboard satu halaman (index.html) ----------
node scripts/generate-report.js "$REPORT_DIR" --env "$NEWMAN_ENV" || echo "Gagal membuat dashboard, report per scenario tetap tersedia."

# ---------- 3. Notifikasi hasil ----------
DURATION=$(fmt_duration $(( $(date +%s) - START_TS )))
if [ $FAIL -eq 0 ]; then HEADER="✅ <b>Semua test lolos</b>"; else HEADER="❌ <b>Ada test yang gagal</b>"; fi

MSG="$HEADER"$'\n\n'
MSG+="🕐 Selesai $(date '+%d %b %Y, %H:%M %Z')"$'\n'
MSG+="⏱ Durasi: $DURATION"$'\n'
MSG+="🌐 Environment: <b>$NEWMAN_ENV</b> · 🔖 <code>$COMMIT</code>"$'\n'
[ -n "$NEWMAN_LINES" ] && MSG+=$'\n'"<b>API test (Newman)</b>"$'\n'"${NEWMAN_LINES}"
[ -n "$K6_LINES" ]     && MSG+=$'\n'"<b>Load test (k6)</b>"$'\n'"${K6_LINES}"
MSG+=$'\n'"📊 <a href=\"$BASE/\">Buka dashboard report</a>"
tg_send "$MSG"

# ---------- 4. Housekeeping ----------
ln -sfn "$RUN_ID" "$PROJECT_DIR/reports/latest"
find "$PROJECT_DIR/reports" -mindepth 1 -maxdepth 1 -type d -mtime +30 -exec rm -rf {} +

echo "=== Selesai: $(date) | durasi=$DURATION | fail=$FAIL ==="
exit $FAIL
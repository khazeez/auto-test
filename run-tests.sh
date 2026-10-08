#!/bin/bash
# Jalankan Newman (semua collection) + k6 lewat runner project, simpan report per run,
# lalu kirim ringkasan berisi LINK ke Telegram.
#
# Contoh cron:
#   # harian, hari kerja jam 08:00 (Newman + smoke + load)
#   0 8 * * 1-5 /opt/automation-test/run-tests.sh >> /var/log/automation-test.log 2>&1
#   # mingguan, Sabtu jam 22:00 (stress + soak saja, tanpa Newman)
#   0 22 * * 6  RUN_NEWMAN=false K6_TYPES=stress,soak /opt/automation-test/run-tests.sh >> /var/log/automation-test.log 2>&1
set -u

PROJECT_DIR="${PROJECT_DIR:-/opt/automation-test}"
cd "$PROJECT_DIR" || exit 1

NEWMAN_ENV="${NEWMAN_ENV:-Dev}"
K6_TYPES="${K6_TYPES:-smoke,load}"
RUN_NEWMAN="${RUN_NEWMAN:-true}"
RUN_K6="${RUN_K6:-true}"

# Ambil hanya variabel yang dibutuhkan dari .env (aman untuk file berformat Windows/CRLF)
get_env() {
  [ -f .env ] || return 0
  grep -E "^$1=" .env | head -1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}
TG_TOKEN="${TG_TOKEN:-$(get_env TG_TOKEN)}"
TG_CHAT_ID="${TG_CHAT_ID:-$(get_env TG_CHAT_ID)}"
REPORT_BASE_URL="${REPORT_BASE_URL:-$(get_env REPORT_BASE_URL)}"

# Cegah dua run berjalan bersamaan (soak test bisa 1+ jam)
exec 200>/tmp/run-tests.lock
flock -n 200 || { echo "Masih ada run berjalan, skip."; exit 1; }

RUN_ID=$(date +%Y-%m-%d_%H%M)
REPORT_DIR="$PROJECT_DIR/reports/$RUN_ID"
BASE="$REPORT_BASE_URL/$RUN_ID"
mkdir -p "$REPORT_DIR"

echo "=== Mulai: $(date) | newman=$RUN_NEWMAN k6=$RUN_K6 ($K6_TYPES) env=$NEWMAN_ENV ==="
git pull --ff-only || echo "git pull gagal, pakai versi lokal."

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
      .results[] |
      (if (.code == 0 and .setupOk) then "✅" else "❌" end) as $i |
      if .setupOk then
        "\($i) <a href=\"\($base)/newman-\(.slug).html\">\(.name)</a> - \(.failed // "?") gagal dari \(.total // "?") assertion"
      else
        "\($i) \(.name) - setup gagal"
      end' "$SUMMARY")$'\n'
    if [ "$(jq -r '.teardownFailed' "$SUMMARY")" = "true" ]; then
      NEWMAN_LINES+="⚠️ Teardown gagal - cek config server (IP blacklist, security header, CORS)"$'\n'
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
      .results[] |
      (if .code == 0 then "✅" else "❌" end) as $i |
      "\($i) <a href=\"\($base)/k6-\(.slug).html\">\(.name)</a> - p95 \(.p95 // "?") ms, error \(.errorRate // "?")%"' "$SUMMARY")$'\n'
  else
    K6_LINES="❌ Runner k6 gagal total, summary tidak terbentuk"$'\n'
    K6_CODE=1
  fi
  [ $K6_CODE -ne 0 ] && FAIL=1
fi

# ---------- 2b. Dashboard satu halaman (index.html) ----------
node scripts/generate-report.js "$REPORT_DIR" --env "$NEWMAN_ENV" || echo "Gagal membuat dashboard, report per scenario tetap tersedia."

# ---------- 3. Notifikasi Telegram (link saja) ----------
if [ $FAIL -eq 0 ]; then HEADER="✅ Semua test lolos"; else HEADER="❌ Ada test gagal"; fi

MSG="<b>$HEADER</b> - $(date '+%d %b %Y %H:%M') ($NEWMAN_ENV)"$'\n'
[ -n "$NEWMAN_LINES" ] && MSG+=$'\n'"<b>API test (Newman)</b>"$'\n'"${NEWMAN_LINES}"
[ -n "$K6_LINES" ]     && MSG+=$'\n'"<b>Load test (k6)</b>"$'\n'"${K6_LINES}"
MSG+=$'\n'"<a href=\"$BASE/\">Buka dashboard report</a>"

curl -s -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
  -d chat_id="${TG_CHAT_ID}" \
  -d parse_mode=HTML \
  -d disable_web_page_preview=true \
  --data-urlencode text="$MSG" > /dev/null

# ---------- 4. Housekeeping ----------
ln -sfn "$RUN_ID" "$PROJECT_DIR/reports/latest"
find "$PROJECT_DIR/reports" -mindepth 1 -maxdepth 1 -type d -mtime +30 -exec rm -rf {} +

echo "=== Selesai: $(date) | fail=$FAIL ==="
exit $FAIL

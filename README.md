# Core Automation Test

Repositori ini berisi otomasi pengujian API untuk sistem **Lawang API Gateway**, menggunakan dua tools utama:

- **Newman** - untuk menjalankan koleksi API dari Postman
- **k6** - untuk melakukan uji beban (load testing)

---

---

## Collections

| Collection | Keterangan |
|------------|------------|
| Test API Lawang | Test normal flow semua endpoint |
| Test Blacklist IP | Test ketika IP di-blacklist (expect 403) |
| Test Security Header | Test security headers compliance |

---

## 1. Menjalankan Test API dengan Newman

### Persiapan

```bash
cd Newman
npm install
```

### Menjalankan Test

**Interaktif (Recommended):**
```bash
npm test
```

Atau menggunakan Task:
```bash
task test
```

### Menu Interaktif

```
════════════════════════════════════════════════════════════
              NEWMAN API TEST RUNNER               
════════════════════════════════════════════════════════════

COLLECTIONS:

  1  ┃  Test Normal Flow
  2  ┃  Test Blacklist IP
  3  ┃  Test Security Header

────────────────────────────────────────────────────────────
  Pilih collection untuk melihat daftar folder
────────────────────────────────────────────────────────────
```

### Command Langsung

```bash
# Test Normal Flow
task test-dev

# Test Blacklist IP
task test-blacklist

# Test dengan environment local
task test-local
```

---

## 2. Test Security Headers

Collection ini memvalidasi security headers berikut:

| Header | Valid Value | Fungsi |
|--------|-------------|--------|
| X-XSS-Protection | `1; mode=block` | Proteksi XSS attack |
| Content-Security-Policy | Policy string | Mencegah XSS & injection |
| Strict-Transport-Security | `max-age=...` | Memaksa HTTPS (HSTS) |
| X-Frame-Options | `DENY` / `SAMEORIGIN` | Mencegah clickjacking |
| Referrer-Policy | `strict-origin-when-cross-origin`, dll | Kontrol referrer info |
| Permissions-Policy | Policy features | Batasi browser features |
| X-Content-Type-Options | `nosniff` | Cegah MIME sniffing |
| Cross-Origin-Embedder-Policy | `require-corp` / `credentialless` | Kontrol resource embedding |
| Cross-Origin-Opener-Policy | `same-origin`, dll | Isolasi cross-origin |
| Cross-Origin-Resource-Policy | `same-origin`, dll | Kontrol resource sharing |
| Origin-Agent-Cluster | `?1` | Isolasi agent cluster |

---

## 3. Menjalankan Load Test dengan k6

### Persiapan

Pastikan sudah menginstal k6

### Menjalankan Test

```bash
task k6
```

Atau:
```bash
cd k6-test
k6 run test-lawang.js
```

### Konfigurasi Load Test

- **Virtual Users:** 100
- **Duration:** 1 menit
- **Endpoint Categories:**
  - Public (tanpa auth)
  - Private (Basic Auth)
  - User (Basic Auth)

Report otomatis tersimpan di `k6-test/core-report.html`

---

## 4. Task Commands

| Command | Keterangan |
|---------|------------|
| `task test` | Menu interaktif Newman |
| `task test-dev` | Test collection normal (env dev) |
| `task test-local` | Test collection normal (env local) |
| `task test-blacklist` | Test collection Blacklist IP |
| `task test-k6` | Load test dengan k6 |

---

## 5. Environment Variables

Environment file berisi:

```json
{
  "baseUrl": "https://api.example.com",
  "username": "basic_auth_username",
  "password": "basic_auth_password"
}
```

---

## Requirements

- Node.js >= 14
- Newman >= 6.0
- k6 (untuk load testing)
- Task (optional, untuk task runner)

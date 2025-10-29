# 🧪 Console Automation Test

Repositori ini berisi otomatisasi pengujian API untuk sistem **Lawang**, menggunakan dua tools utama:

- **Newman** → untuk menjalankan koleksi API dari Postman  
- **k6** → untuk melakukan uji beban (*load testing*)

---

## 🧩 1. Menjalankan Test API dengan Newman

### 📦 Persiapan

Pastikan kamu sudah menginstal **Node.js** dan **Newman**:

```bash
npm install -g newman
```

Lalu masuk ke folder Newman:
```bash
cd Newman

🚀 Jalankan Test
npm run test:lawang
```

Script ini akan menjalankan file:

Test API Lawang.postman_collection.json

dengan environment: Lawang-Core.postman_environment.json

Jika ingin menambahkan report HTML:

```bash
newman run "Test API Lawang.postman_collection.json" \
  -e "Lawang-Core.postman_environment.json" \
  -r cli,html --reporter-html-export report.html
```

## ⚡ 2. Menjalankan Load Test dengan k6
### 📦 Persiapan

Pastikan kamu sudah menginstal k6

```bash
Masuk ke folder k6-test:

cd k6-test

🚀 Jalankan Test
k6 run test-script.js
```
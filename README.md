# ColdChainGuard 🛡️❄️

**Air-gapped diagnostic co-pilot for solar direct drive (SDD) vaccine refrigerators.**

In rural clinics and humanitarian outposts, internet connectivity is often zero, yet vaccine refrigerators (like Secop/Danfoss BD35F/BD50F systems) cannot afford downtime. When an LED flashes an error code, field technicians often lack service manuals, leading to spoiled vaccines or unnecessary equipment swaps.

**ColdChainGuard** runs completely offline on edge hardware. It takes physical multimeter readings, camera shots of compressor nameplates, and controller LED blink codes, retrieves authoritative WHO PQS guidelines through local vector search, and synthesizes step-by-step electrical isolation instructions using a quantized local LLM.

---

## ⚡ Key Capabilities

* **100% Offline & Air-Gapped:** Zero cloud dependencies, zero external telemetry, zero external API keys needed.
* **Camera Nameplate OCR:** Uploads or snaps photos of compressor labels and parses model numbers directly on-device (`ocr-latin.gguf`).
* **Semantic Retrieval (Local RAG):** Matches symptom parameters against WHO PQS E003 guidelines using vector embeddings (`bge-small-en-v1.5-q8_0.gguf`).
* **Edge Inference Engine:** Generates electrical diagnostic workflows, target pinout checks, and threshold warnings using quantized local LLMs (`qwen2.5-1.5b-instruct-q4_k_m.gguf`).
* **Interactive Controller Pinout:** Visual SVG schematic showing exact multimeter probe points (`+`, `-`, `F`, `D`, `C`, `P`, `T`, and motor stator pins 1–3).
* **Signed Maintenance Manifests:** Generates HMAC-SHA256 encrypted digital service records with scannable offline QR codes for audit tracking.

---

## 📦 Prerequisites

1. **Node.js**: v22+ (recommended for native build tools and modern Fetch/cgroups support).
2. **Build Tools** (for compiling `better-sqlite3` and native bindings):
   * **Linux (Debian/Ubuntu):** `sudo apt update && sudo apt install -y python3 make g++`
   * **Linux (Alpine):** `apk add python3 make g++`
   * **macOS:** Xcode Command Line Tools (`xcode-select --install`)
   * **Windows:** Visual Studio C++ Build Tools and Python 3
3. **RAM:** Minimum 4 GB RAM recommended for local model inference.

---

## 🧠 Local Model Assets Setup (Important)

ColdChainGuard isolates AI workloads in dedicated worker sub-processes using `@qvac/sdk`. For live optical recognition, retrieval, and diagnosis, place the following GGUF models inside a `models/` directory in the project root:

```text
coldchainguard/
└── models/
    ├── ocr-latin.gguf                     # Nameplate scanner model
    ├── bge-small-en-v1.5-q8_0.gguf        # Local vector embeddings model
    └── qwen2.5-1.5b-instruct-q4_k_m.gguf  # Diagnostic reasoning model
```

> **Where to get these models:** Download standard GGUF quantizations from Hugging Face (e.g., from the Qwen, BAAI, or GGML model repositories) and match the filenames listed above.

---

## 🚀 Step-by-Step Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/Philip-Ajayi/coldchainguard.git
cd coldchainguard
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Populate Model Files
Make sure your `models/` directory exists and holds your GGUF files:
```bash
mkdir -p models
# Copy your ocr-latin.gguf, bge-small-en-v1.5-q8_0.gguf, and qwen2.5-1.5b-instruct-q4_k_m.gguf into models/
```

### Step 4: Build Client and Server
Compile the Vite frontend and the TypeScript worker/server scripts:
```bash
npm run build
```

### Step 5: Start the Engine
```bash
npm start
```
Open your browser to `http://localhost:3000`.

---

## 🐳 Running with Docker

ColdChainGuard includes a production-ready, multi-stage Docker build with cgroups memory ceiling monitoring:

```bash
# Build and run with Docker Compose
docker compose up --build
```

Access the dashboard at `http://localhost:3000`. Maintenance databases will persist inside the mapped `./data` directory.

*(Note: Ensure your `models/` folder contains the required model weights before launching the container, or mount your models volume in `docker-compose.yml`).*

---

## 🔍 How to Run Live Field Data

1. **Set Fault Code:** Click the corresponding LED flash count (1 through 5 blinks) observed on the electronic controller.
2. **Enter Multimeter Readings:**
   * **Supply Voltage:** Measure across `[+]` and `[-]` (flags low voltage if under 10.4V DC).
   * **Winding Resistance:** Phase-to-phase across the 3 compressor stator pins (nominal: 2.1Ω).
   * **Fan Current:** Measured at terminal `[F]` (maximum threshold: 0.5A).
   * **Ambient Temperature:** Ambient reading around the compressor bay (WHO limit: 43°C).
3. **Capture Equipment Label:** Use the **Scan label** button to snap or upload a picture of the compressor nameplate. The local OCR engine will detect the compressor and controller codes.
4. **Run Diagnosis:** Click **Run diagnosis**. The engine will:
   * Perform vector similarity lookup over the embedded WHO PQS troubleshooting manual.
   * Spawn an isolated sub-process with memory telemetry monitoring.
   * Return a synthesized diagnosis, step-by-step multimeter instructions, and focus terminals on the schematic.
5. **Save Service Record:** Open **Save service record** to sign technician actions with an HMAC-SHA256 signature and generate a QR code for offline log retention.

*(If you just want to test without a physical fridge, click any of the **Quick test scenarios** at the top of the interface to load calibrated field benchmarks).*

---

## 🗂️ Project Structure

```text
coldchainguard/
├── data/                       # Local SQLite database storage (WAL mode)
├── models/                     # GGUF models for QVAC (OCR, embeddings, LLM)
├── server/
│   ├── db.ts                   # SQLite schema, migrations & telemetry logger
│   ├── seedData.ts             # Embedded WHO PQS E003 documentation & benchmarks
│   ├── server.ts               # Express API, telemetry watcher & process supervisor
│   └── workers/
│       ├── diagnosticWorker.ts # Isolated LLM generation worker
│       ├── ocrWorker.ts        # Isolated GGML optical text parsing worker
│       └── ragWorker.ts        # Isolated embedding & cosine similarity worker
├── src/
│   ├── App.tsx                 # Main application dashboard
│   ├── components/             # Diagnostic UI, multimeters, schemas, modals
│   ├── index.css               # Design system & responsive styles
│   └── types.ts                # TypeScript interfaces
├── Dockerfile                  # Alpine-based production container
├── docker-compose.yml          # Container configuration with memory limits
└── qvac.config.json            # Edge inference runtime settings
```

---

## 🛡️ License & Safety Disclaimer

This project is licensed under the MIT License. 

**Safety Notice:** Always follow electrical safety precautions and the manufacturer’s documentation when probing live compressor electronics and DC solar arrays.
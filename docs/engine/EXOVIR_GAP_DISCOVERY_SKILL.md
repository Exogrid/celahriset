# EXOVIR — Scientific Gap & Novelty Discovery Skill (v2.2 reference)
_Status: spesifikasi agent + engine referensi, bukan bukti penerapan pada backend RC8._

## Misi
Dari satu tema, temukan **kandidat** research gap dan novelty melalui dua jalur paralel (**SOTA-driven** dan **problem-driven**), gabungkan bukti, uji antitesis, lalu keluarkan keputusan sementara yang dapat ditelusuri. TIDAK BOLEH mengubah kekurangan bukti menjadi klaim kebaruan pasti.

## Posisi dalam arsitektur EXOVIR
Pertahankan 10 tahap dan 5 mesin domain. Metode ini masuk dalam T04 (problem), T06 (corpus), T07 (SOTA/gap), T08 (falsification) dan T09 (metode). Keluaran mengikuti jalur profil → hibah → masalah → tema → korpus → SOTA/gap → novelty → metode → proposal. Peneliti tetap dapat memberi tema langsung; kekosongan profil/hibah diberi status UNKNOWN, bukan asumsi.

## A. Input wajib / kontrak data
- `theme`, `discipline`, `research_question` opsional pada awalnya.
- `constraints`: mitra, populasi, wilayah, anggaran, waktu, data, etik, skema hibah. Jangan memperluas subjek melebihi batas pengguna.
- `searchLog[]`: database/provider, exact query, date, filters, number found, screened, included, snowballing and access failures.
- `evidence[]`: canonical ID, DOI/URL, bibliographic metadata, `kind` (study/review/policy/dataset/problem), `claimSpan`, `claimLocator` (halaman/paragraf/tabel), `reviewed`, `relevant`, `fullTextAccess`, `biasFlags`. DOI atau title match bukan bukti isi.
- `coverageAssessed`: penilaian eksplisit apakah pencarian cukup lengkap untuk *klaim yang sedang diuji*; harus didukung alasan, bukan diisi otomatis.
- `candidates[]`: klaim atomik, jalur, bukti pendukung dan pembanding paling mirip, kontribusi, metode, kelayakan, antitesis.

## B. Algoritma penelusuran korpus (T06)
1. **Terminology normalization**: petakan konstruk, definisi operasional, sinonim Indonesia/Inggris, akronim dan konsep terkait. Jangan menganggap sinonim hanya berdasarkan kemiripan judul.
2. **Multisource hybrid retrieval**: panggil OpenAlex/Crossref/Semantic Scholar/CORE/GARUDA/Scopus/WoS (sesuai akses) dan pencarian teks melalui provider berizin; jurnal + policy + indikator resmi. Simpan query persis dan gagal akses.
3. **Forward/backward chaining** pada seed paper yang substantif; telusuri paper paling mirip.
4. **Deduplication** DOI normal → normalized title + author + year bila tanpa DOI; catat merger ambigu.
5. **Bibliometric mapping** co-citation, bibliographic coupling, co-word + temporal. Peta = bukti struktur, bukan otomatis bukti tidak ada studi.
6. **Substantive extraction** teori, konstruk, unit, populasi, metode, hasil, limitation, risk of bias, locator teks; audit sample oleh peninjau.
7. **Evidence matrix** empat arah: supporting, contradicting, inconclusive, not examined. Absennya kata kunci tidak berarti absennya pengetahuan.

## C. Jalur SOTA-driven (T07)
- **Robinson–Saldanha–McKoy (2011)**: klasifikasi `insufficient_information`, `biased_information`, `inconsistent_information`, `wrong_information`; uji dengan matriks bukti.
- **Müller-Bloch & Kranz (2015)**: identifikasi gap dengan urutan scope → konseptualisasi → pencarian → sintesis → lokalisasi/karakterisasi gap; log keputusan.
- **Problematization (Alvesson & Sandberg 2011)**: temukan asumsi dominan → landasan dan batasnya → asumsi alternatif → prediksi pembeda → cari studi yang telah menguji alternatif.
- **Literature-based discovery (Swanson ABC)**: A–B dan B–C yang disokong bukti menghasilkan *hipotesis* A–C; cek arah kausal, mediator, confounding dan studi A–C sebelumnya.
- **Atypical combinations (Uzzi dkk. 2013)**: gunakan z-score kombinasi referensi/klaster sebagai sinyal eksplorasi saja; tidak boleh dianggap novelty otomatis.

## D. Jalur Problem-driven (T04 + T07)
1. Definisikan unit analisis dan apa yang dianggap sebagai masalah.
2. Verifikasi baseline, target dan besaran masalah pada periode/populasi yang **sebanding**; pisahkan mandat regulasi, indikator empiris dan opini.
3. **Causal diagnostic / abductive reasoning**: tulis 2–3 penjelasan pesaing yang berpotensi dipatahkan. Jangan menetapkan kausalitas dari korelasi.
4. **CIMO (Denyer dkk. 2008)**: Context → Intervention → Mechanism → Outcome, sertakan batas penerapan.
5. **Solution-failure analysis**: temukan intervensi sebelumnya, kapan berhasil/gagal, dan mengapa. Pastikan bukan hanya implementation gap yang sudah mempunyai solusi mapan.
6. Jika relevan **Design Science Research (Peffers dkk. 2007)**: problem → objective → artifact design → demonstration → evaluation → communication.
7. Hasilkan gap mekanisme/teori/alat ukur/intervensi/kondisi batas dengan bukti dan hipotesis saingan.

## E. Falsification T08 + decision engine
Pertahankan delapan **N1–N8** (prior art, semantic, theory, method, empirical redundancy, significance, contradiction, independent adversarial review). Untuk pemutus deterministik, gunakan **G1–G8** sebagai *gate kesiapan kandidat*, bukan mengganti N1–N8. G1 bukti substantif relevan; G2 kelengkapan & reproducibility korpus; G3 cek prior art setara; G4 bukan perbedaan kosmetik; G5 kontribusi/fit teori eksplisit; G6 metode layak menjawab; G7 data-sumber daya-etik; G8 antitesis ditinjau manusia.

### Klasifikasi hasil
- `REJECTED`: studi setara terdahulu yang telah diverifikasi, atau perbedaan hanya nama/lokasi/populasi tanpa kontribusi ilmiah.
- `INSUFFICIENT_EVIDENCE`: ada gate belum didukung; khususnya 0 studi substantif relevan / hanya metadata / missing search log.
- `PROVISIONAL`: delapan gate kesiapan terpenuhi dan tidak ditemukan pembantah pada cakupan yang diperiksa; **bukan bukti kebaruan absolut**.
- Jika problem empiris tidak terverifikasi, jalur problem-driven ditangguhkan tanpa menjatuhkan jalur SOTA-driven yang memiliki bukti mandiri.

Gunakan `docs/engine/exovir-gap-engine.mjs` (ESM tanpa dependency) sebagai contoh *fail-closed policy evaluation*. Mesin ini **tidak** melakukan penelusuran daring atau kesimpulan semantik otomatis; yang wajib ditambahkan di backend nyata adalah connector retrieval, semantic/NLI evaluator dan penilaian manusia.

## F. Keluaran per kandidat (wajib)
`{theme,route,gapType,gapStatement,noveltyClaim,problemEvidenceIds,sotaEvidenceIds,nearestPriorArt:[{id,similarities,differences,claimLocator}],supportingSpans,contradictions,rivalHypotheses,contributionVsBaseline,methodFit,feasibility,searchCoverage,gates:{G1..G8},N1toN8Dossier,status,uncertainty,reviewerDecision}`

Dilarang menghasilkan *novelty score* atau gelar "terverifikasi" dari banyaknya publikasi, jumlah sitasi, atau skor embedding semata.

## G. Benchmark penerimaan sebelum deploy
- Paket gold-standard dikurasi oleh reviewer domain: (i) ide jelas redundant; (ii) perbedaan geografis semata; (iii) absent evidence; (iv) contradiction; (v) gap cukup kuat.
- Uji **false-positive novelty** (prioritas keselamatan ilmiah), recall studi ekuivalen, precision span extraction, agreement peninjau, calibration, latency, biaya dan reproducibility query.
- Jalankan ablation SOTA saja vs problem saja vs hybrid; bandingkan LLM-only dan retrieval-only.
- Uji negative controls: DOI valid tetapi konten tidak relevan, metadata-only, paper judul mirip namun konstruk berbeda, istilah lintas bahasa.
- Tetapkan threshold berdasarkan data validasi dan pakar, bukan angka ambang karangan.
- Simpan model version, provider, prompt hash, request id, timestamp, input corpus hash, adjudication trail.

## Referensi dasar (primer)
- Robinson, Saldanha & McKoy (2011), doi:10.1016/j.jclinepi.2011.06.009
- Müller-Bloch & Kranz (2015), https://aisel.aisnet.org/icis2015/proceedings/ResearchMethods/2/
- Alvesson & Sandberg (2011), doi:10.5465/AMR.2011.59330882
- Swanson (1986), doi:10.1353/pbm.1986.0087
- Uzzi et al. (2013), doi:10.1126/science.1240474
- Denyer, Tranfield & van Aken (2008), doi:10.1177/0170840607088020
- Peffers et al. (2007), doi:10.2753/MIS0742-1222240302

**Batas pengujian:** publikasi ilmiah di atas mendukung komponen metodologisnya, tidak secara otomatis memvalidasi kinerja keseluruhan sistem EXOVIR.

'use client';

import { useState } from 'react';

export default function Home() {
  const [youtubeLink, setYoutubeLink] = useState('');
  const [speedBar, setSpeedBar] = useState(50); // 50 adalah titik tengah (Normal di UI)
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    if (!youtubeLink) return alert('Masukkan link YouTube terlebih dahulu!');
    setIsConverting(true);

    // LOGIKA RAHASIA: 
    let actualSpeedMultiplier = 2.303; 
    
    if (speedBar < 50) {
      actualSpeedMultiplier = 2.303 - ((50 - speedBar) * 0.02);
    } else if (speedBar > 50) {
      actualSpeedMultiplier = 2.303 + ((speedBar - 50) * 0.02);
    }

    console.log(`[RAHASIA] Memproses dengan speed: ${actualSpeedMultiplier}x`);

    try {
      // 1. Mengirim perintah ke Backend lokalmu
      const response = await fetch('http://localhost:4000/api/convert', {
        method: 'POST', // Menggunakan metode POST sesuai pintu yang kita buat
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: youtubeLink,
          speed: actualSpeedMultiplier
        }),
      });

      // Jika ada error dari server
      if (!response.ok) {
        // Coba baca pesan error asli dari backend
        let errorMessage = 'Gagal memproses audio di server.';
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      // 2. Mengubah balasan server menjadi file (Blob)
      const blob = await response.blob();
      
      // 3. Membuat sistem download otomatis di browser
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      // Mengambil nama file dari server jika ada, atau pakai nama default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'XelzStudio-Audio.ogg';
      if (contentDisposition && contentDisposition.includes('filename="')) {
         filename = contentDisposition.split('filename="')[1].split('"')[0];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click(); // Mengeklik tombol download secara tak kasat mata
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl); // Membersihkan memori browser

      alert('Berhasil! File audio sedang diunduh.');
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat mengonversi. Pastikan Backend menyala!');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-emerald-500 selection:text-white flex flex-col">
      
      <header className="border-b border-neutral-800 p-6 flex justify-between items-center backdrop-blur-md bg-neutral-950/80 sticky top-0 z-50">
        <h1 className="text-2xl font-black tracking-tighter text-white">
          XELZ<span className="text-emerald-500">STUDIO</span>
        </h1>
        <nav className="space-x-6 text-sm font-medium">
          <a href="#" className="hover:text-emerald-400 transition-colors">Converter</a>
          <a href="#tos" className="hover:text-emerald-400 transition-colors">TOS</a>
        </nav>
      </header>

      
      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-10">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-bold text-white tracking-tight">Roblox Audio Converter</h2>
            <p className="text-neutral-400">Konversi audio YouTube khusus untuk integrasi aset *game* dengan presisi tinggi.</p>
          </div>

          <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-800 shadow-2xl space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">YouTube URL</label>
              <input 
                type="text" 
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
              />
            </div>

            
            <div className="space-y-4 pt-4">
              <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase">
                <span>Lambat</span>
                <span className="text-emerald-500">Normal</span>
                <span>Cepat</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={speedBar}
                onChange={(e) => setSpeedBar(Number(e.target.value))}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            
            <button 
              onClick={handleConvert}
              disabled={isConverting}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                isConverting 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98]'
              }`}
            >
              {isConverting ? 'Memproses Audio...' : 'Konversi & Unduh'}
            </button>
          </div>
        </div>
      </main>

      
      <footer id="tos" className="border-t border-neutral-900 py-8 text-center text-sm text-neutral-500 mt-20">
        <div className="space-x-4 mb-4">
          <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          <span>|</span>
          <a href="/tos" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
        <p>&copy; 2026 XelzStudio. All rights reserved.</p>
        <p className="text-xs mt-2 text-neutral-700">Dilarang menyalahgunakan layanan ini untuk pelanggaran hak cipta.</p>
      </footer>
    </div>
  );
}
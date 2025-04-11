class WindowManager {
  constructor() {
    this.windows = [];
    this.zIndex = 1000;
    this.taskbarItems = new Map();
    this.init();
  }

  init() {
    const startButton = document.getElementById("start-button");
    const startMenu = document.getElementById("start-menu");
  
    // Start butonuna tıklandığında menüyü aç/kapa ve tıklamanın yukarı taşınmasını engelle
    startButton.addEventListener("click", (e) => {
      e.stopPropagation();
      startMenu.classList.toggle("hidden");
    });
  
    // Belirli alanlar dışında bir yere tıklandığında start menüsünü kapat
    document.addEventListener("click", (e) => {
      if (!startMenu.contains(e.target) && e.target !== startButton) {
        startMenu.classList.add("hidden");
      }
    });
  
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
  }


  updateClock() {
    const clock = document.getElementById("clock");
    const now = new Date();
    clock.textContent = now.toLocaleTimeString("tr-TR");
  }

  createWindow(title, content) {
    const id = `window_${Date.now()}`;
    const win = document.createElement("div");
    win.className = "window";
    win.id = id;
    win.style.zIndex = this.zIndex++;
  
    // Viewport merkez noktası
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // Pencere boyutları
    const width = title === 'Terminal' ? 600 : 800;
    const height = title === 'Terminal' ? 400 : 700;
    
    // Offset hesaplama (Her pencere için 30px kaydırma)
    const offset = this.windows.length * 30;
    
    // Merkez pozisyonu + offset
    const left = (vw/2 - width/2) + offset;
    const top = (vh/2 - height/2) + offset;
  
    // Ekran sınır kontrolü
    const clampLeft = Math.max(20, Math.min(left, vw - width - 20));
    const clampTop = Math.max(20, Math.min(top, vh - height - 60));
  
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    win.style.left = `${clampLeft}px`;
    win.style.top = `${clampTop}px`;
  
    win.innerHTML = `
      <div class="window-header">
        <span>${title}</span>
        <div>
          <button class="minimize">🗕</button>
          <button class="fullscreen">🗖</button>
          <button class="close">🗙</button>
        </div>
      </div>
      <div class="window-content">${content}</div>
    `;
  
    document.getElementById("windows").appendChild(win);
    this.windows.push(win);
    this.addTaskbarItem(id, title);
  
    this.makeDraggable(win);
    this.makeResizable(win);
    win.querySelector('.minimize').addEventListener('click', (e) => {
      e.stopPropagation();
      this.minimizeWindow(id);
    });
    
    win.querySelector('.close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeWindow(id);
    });
    
    win.querySelector('.fullscreen').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFullscreen(id);
    });
  
    return id;
  }
  

  bringToFront(id) {
    const win = document.getElementById(id);
    if (!win) return;
    this.zIndex++;
    if (this.zIndex > 10000) this.resetZIndex();
    win.style.zIndex = this.zIndex;
    this.taskbarItems.forEach(item => item.classList.remove('active'));
    this.taskbarItems.get(id).classList.add('active');
  }

  resetZIndex() {
    this.zIndex = 1000;
    this.windows.forEach(w => w.style.zIndex = this.zIndex++);
  }

  closeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
      win.remove();
      this.windows = this.windows.filter(w => w.id !== id);
      const item = this.taskbarItems.get(id);
      if (item) item.remove();
      this.taskbarItems.delete(id);
    }
  }

  minimizeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
      win.style.display = 'none';
      this.taskbarItems.get(id).classList.remove('active');
    }
  }

  restoreWindow(id) {
    const win = document.getElementById(id);
    if (win) {
      win.style.display = 'flex';
      this.bringToFront(id);
    }
  }

  toggleFullscreen(id) {
    const win = document.getElementById(id);
    if (!win) return;

    if (!win.classList.contains('fullscreen')) {
      win.dataset.prevWidth = win.style.width;
      win.dataset.prevHeight = win.style.height;
      win.dataset.prevLeft = win.style.left;
      win.dataset.prevTop = win.style.top;

      win.classList.add('fullscreen');
      win.style.position = 'fixed';
      win.style.left = '0';
      win.style.top = '0';
      win.style.width = '100vw';
      win.style.height = '100vh';
    } else {
      win.classList.remove('fullscreen');
      win.style.position = 'absolute';
      win.style.width = win.dataset.prevWidth;
      win.style.height = win.dataset.prevHeight;
      win.style.left = win.dataset.prevLeft;
      win.style.top = win.dataset.prevTop;

      delete win.dataset.prevWidth;
      delete win.dataset.prevHeight;
      delete win.dataset.prevLeft;
      delete win.dataset.prevTop;
    }
  }

  addTaskbarItem(id, title) {
    const item = document.createElement('div');
    item.className = 'taskbar-item';
    item.textContent = title;
    item.dataset.windowId = id;
    item.draggable = true; // Sürüklenebilirlik eklendi
  
    item.addEventListener('click', () => {
      const win = document.getElementById(id);
      if (win.style.display === 'none') this.restoreWindow(id);
      else this.minimizeWindow(id);
    });
  
    // Drag olayları ekleniyor
    item.addEventListener('dragstart', this.onTaskbarDragStart.bind(this));
    item.addEventListener('dragover', this.onTaskbarDragOver.bind(this));
    item.addEventListener('drop', this.onTaskbarDrop.bind(this));
  
    document.getElementById('taskbar-items').appendChild(item);
    this.taskbarItems.set(id, item);
  }
  
  onTaskbarDragStart(e) {
    // Sürüklenen öğenin windowId'sini veri olarak saklıyoruz
    e.dataTransfer.setData("text/plain", e.target.dataset.windowId);
  }
  
  onTaskbarDragOver(e) {
    e.preventDefault();
    const target = e.target.closest('.taskbar-item');
    if (!target) return;
  
    // Hedef öğenin yarısını baz alarak konumu belirleyin
    const rect = target.getBoundingClientRect();
    const midPoint = rect.left + rect.width / 2;
  
    // Önce mevcut tüm drop indicatorları kaldırın
    document.querySelectorAll('.drop-indicator').forEach(ind => ind.remove());
  
    // Drop indicator oluştur
    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator';
    // Göstergenin konumunu ayarlamak için container'ı ve offset'lerini kullanın
    indicator.style.position = 'absolute';
    indicator.style.width = '2px';
    indicator.style.height = '100%';
    indicator.style.backgroundColor = '#ffffff';
  
    const container = document.getElementById('taskbar-items');
    // Indicator'ı container'ın konumuna göre ayarlamak için container'ın sol offset'ini hesaba katın
    const containerRect = container.getBoundingClientRect();
    let leftPos;
    
    if (e.clientX < midPoint) {
      // Hedef öğenin soluna yerleştir
      leftPos = target.offsetLeft;
      container.insertBefore(indicator, target);
    } else {
      // Hedef öğenin sağına yerleştir
      leftPos = target.offsetLeft + target.offsetWidth;
      container.insertBefore(indicator, target.nextSibling);
    }
    indicator.style.left = `${leftPos}px`;
  }
  
  onTaskbarDrop(e) {
    e.preventDefault();
    // Drop indicator varsa kaldır
    document.querySelectorAll('.drop-indicator').forEach(ind => ind.remove());
    
    const draggedId = e.dataTransfer.getData("text/plain");
    const target = e.target.closest('.taskbar-item');
    if (!target || target.dataset.windowId === draggedId) return;
  
    const container = document.getElementById('taskbar-items');
    const draggedElem = this.taskbarItems.get(draggedId);
    
    // Öğelerin container içindeki index'lerini kontrol edip yer değiştiriyoruz
    const childrenArray = Array.from(container.children);
    const draggedIndex = childrenArray.indexOf(draggedElem);
    const targetIndex = childrenArray.indexOf(target);
  
    if (draggedIndex < targetIndex) {
      container.insertBefore(draggedElem, target.nextSibling);
    } else {
      container.insertBefore(draggedElem, target);
    }
  }
  
  onTaskbarDragLeave(e) {
    // Öğeden ayrılırken drop indicator'ı kaldır
    document.querySelectorAll('.drop-indicator').forEach(ind => ind.remove());
  }
  
  

  makeDraggable(win) {
    const header = win.querySelector('.window-header');
    let offsetX, offsetY;
    const onMouseMove = (e) => {
      win.style.left = `${e.clientX - offsetX}px`;
      win.style.top = `${e.clientY - offsetY}px`;
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    header.addEventListener('mousedown', (e) => {
      this.bringToFront(win.id);
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  makeResizable(win) {
    let startX, startY, startW, startH;
    const onMouseMove = (e) => {
      const newW = Math.max(300, startW + (e.clientX - startX));
      const newH = Math.max(200, startH + (e.clientY - startY));
      win.style.width = `${newW}px`;
      win.style.height = `${newH}px`;
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    win.addEventListener('mousedown', (e) => {
      const rect = win.getBoundingClientRect();
      if (e.clientX >= rect.right - 15 && e.clientY >= rect.bottom - 15) {
        startX = e.clientX;
        startY = e.clientY;
        startW = rect.width;
        startH = rect.height;
        e.preventDefault();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      }
    });
  }

  // İçerik üreticiler
  getContent(id, filePath) {
    switch (id) {
      case 'cv': return this.getPDFContent(filePath);
      case 'github':
      case 'linkedin':
      case 'blackjack':
      case 'calculator':
      case 'musicplayer': return this.getIframeContent(filePath);
      case 'Trash': return this.getTrashContent();
      default: return '<div>Dosya bulunamadı</div>';
    }
  }

  getPDFContent(path) {
    return `<embed src="${path}" type="application/pdf" width="100%" height="100%">`;
  }

  getIframeContent(path) {
    return `<iframe src="${path}" frameborder="0" width="100%" height="100%"></iframe>`;
  }

  getTrashContent() {
    return `
      <div style="color: #fff;">
        <div class="d-flex gap-3 mt-2">
          <div class="text-center" style="cursor:pointer;" onclick="openWindow('Do not Click this!')">
            <img src="icons/top-secret.png" alt="File1" width="48" height="48"/>
            <div>Do not Click this!</div>
          </div>
          <div class="text-center" style="cursor:pointer;" onclick="openWindow('youtube')">
            <img src="icons/youtube.png" alt="File2" width="48" height="48"/>
            <div>youtube</div>
          </div>
        </div>
      </div>
    `;
  }
}

const desktop = new WindowManager();

function animateRickRoll(termWinId) {
  const win = document.getElementById(termWinId);
  const contentDiv = win.querySelector('.window-content');
  const style = 'color:#0f0; font-family: monospace; white-space: pre-wrap;';
  contentDiv.style.overflow = 'hidden';

  // Zaman üretici yardımcı fonksiyon:
  const formatDateTime = (date) => {
    const formattedDate = date.toLocaleDateString('TR-tr').replace(/\//g, '/');
    const formattedTime = date.toLocaleTimeString('TR-tr', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${formattedDate}  ${formattedTime}`;
  };

  // Şu anki zaman:
  const now = new Date();
  const timeNow = formatDateTime(now);

  // -1 dakika önce:
  const minusOneMinute = new Date(now.getTime() - 60_000);
  const timeMinus1 = formatDateTime(minusOneMinute);

  // -2 dakika:
  const minusTwoMinute = new Date(now.getTime() - 120_000);
  const timeMinus2 = formatDateTime(minusTwoMinute);

  const fakeDirOutput = `
$ dir /s
 Volume in drive C has no label.
 Volume Serial Number is 1234-ABCD

 Directory of C:\\Users\\Gotcha\\Desktop

${timeNow}    <DIR>          .
${timeNow}    <DIR>          ..
${timeMinus1}            89,240 cv.pdf
${timeMinus2}            26,662 Github.exe
${timeNow}            16,662 Linkedin.exe
${timeNow}         5,314,159 Blackjack.exe
${timeMinus1}        25,314,152 Music Player.exe
${timeNow}           133,337 important_file.txt
${timeMinus1}            42,069 secrets.txt
${timeNow}           256,000 report.docx
${timeMinus1}           314,159 password_list.docx
${timeNow}            69,420 love_letter.txt
${timeNow}         1,337,000 bitcoin_wallet.dat
${timeNow}           999,999 nuclear_codes.txt
${timeMinus1}         5,000,001 trojan_horse.exe
${timeNow}           777,777 system32_backup.zip
${timeMinus2}           543,210 omg_this_is_real.png
${timeNow}         8,008,008 say gex.jpg
${timeMinus1}         2,222,222 funny_meme.mp4
${timeNow}           888,888 virus_scanner.log
${timeNow}           123,456 not_a_virus.bat
${timeMinus2}           101,010 im_watching_you.txt
${timeNow}         6,969,696 shady_file.mkv
${timeNow}         512,512 hidden_data.bin
${timeNow}         777,000 random_stuff.tmp
${timeNow}         333,333 error_log.log
${timeNow}         444,444 system_update.exe
${timeNow}         555,555 configuration.cfg
${timeNow}         666,666 rickroll.exe
${timeNow}         777,777 archive.rar
${timeNow}         888,888 backup.bak
${timeNow}         999,999 credentials.csv
${timeNow}         101,112 debug_info.txt
${timeNow}         202,224 temp_file.tmp
${timeNow}         303,336 final_version.zip

              28 File(s)     25,678,900 bytes
              10 Dir(s)  42,000,000,000 bytes free
`;
  contentDiv.innerHTML = `<pre style="${style}">${fakeDirOutput}</pre>`;
  const pre = contentDiv.querySelector('pre');

  setTimeout(() => {
    pre.style.transition = 'transform 0.1s linear';
    pre.style.transform = 'translateY(-2000px)';
    
    setTimeout(() => {
      pre.style.transition = 'none';
      pre.style.transform = 'translateY(0)';
      contentDiv.style.overflowY = 'auto';

      pre.textContent = '$ ';
      simulateTyping(pre, 'curl ascii.live/rick\n', 30);

      const frames = [
        "    Never gonna give you up    ",
        "    Never gonna let you down  ",
        "    Never gonna run around   ",
        "    and desert you            ",
        "    Never gonna make you cry  ",
        "    Never gonna say goodbye  ",
        "    Never gonna tell a lie    ",
        "    and hurt you             "
      ];

      let idx = 0;
      const interval = setInterval(() => {
        pre.textContent = `$ curl ascii.live/rick\n${frames[idx]}`;
        idx = (idx + 1) % frames.length;
      }, 500);
      setTimeout(() => {
        clearInterval(interval);
        desktop.closeWindow(termWinId);
      }, 5000);
    }, 300); // Kaydırma tamamlanma süresi (0.3s)
  }, 2500);
}

function simulateTyping(element, text, delay = 5000) {
  let i = 0;
  const timer = setInterval(() => {
    element.textContent += text[i];
    element.scrollTop = element.scrollHeight; // Otomatik kaydırma
    if (++i === text.length) clearInterval(timer);
  }, delay);
}

function openWindow(id, filePath) {
  // Network şakası: Sadece IP alımı
  if (id === 'Network') {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(ipData => {
        const content = `<div style="color: #08cad8; font-family: monospace; padding:20px;">
          <p>Your IP: ${ipData.ip}</p>
          <img src="icons/meme.jpg" alt="Meme" style="max-width:85%;"/>
        </div>`;
        desktop.createWindow('Gotcha!', content);
        // Terminal pencere şakası
        setTimeout(() => {
          const termWinId = desktop.createWindow('Terminal', '');
          animateRickRoll(termWinId);
        }, 2000);
      })
      .catch(() => {
        const content = `<div style="color: #f00; padding:20px;">IP alınamadı.</div>`;
        desktop.createWindow('Hata', content);
      });
    return;
  }

  // Diğer pencereler
  const titleMap = {
    cv: 'CV.pdf',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    blackjack: 'blackjack',
    musicplayer: 'Music Player',
    Trash: 'Trash',
    calculator: 'calculator',
  };
  const title = titleMap[id] || 'Yeni Pencere';
  const content = desktop.getContent(id, filePath);
  desktop.createWindow(title, content);

  if (id === 'Do not Click this!') return window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
  if (id === 'youtube') return window.open('https://youtu.be/eSnHZnnXjjA?list=RDeSnHZnnXjjA', '_blank');
}

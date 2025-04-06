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

    startButton.addEventListener("click", () => {
      startMenu.classList.toggle("hidden");
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

    // Başlangıç boyutları
    win.style.width = "800px";
    win.style.height = "700px";
    win.style.left = `calc(50% - 300px)`;
    win.style.top = `calc(30% - 200px)`;

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

    // Olayları bağla
    this.makeDraggable(win);
    this.makeResizable(win);
    win.querySelector('.minimize').addEventListener('click', () => this.minimizeWindow(id));
    win.querySelector('.close').addEventListener('click', () => this.closeWindow(id));
    win.querySelector('.fullscreen').addEventListener('click', () => this.toggleFullscreen(id));

    return id;
  }

  bringToFront(id) {
    const win = document.getElementById(id);
    if (!win) return;
    this.zIndex++;
    if (this.zIndex > 10000) this.resetZIndex();
    win.style.zIndex = this.zIndex;
    // Taskbar güncelle
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
      // Önceki boyut ve konumu kaydet
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
      // Öncekileri geri yükle
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
    item.addEventListener('click', () => {
      const win = document.getElementById(id);
      if (win.style.display === 'none') this.restoreWindow(id);
      else this.minimizeWindow(id);
    });
    document.getElementById('taskbar-items').appendChild(item);
    this.taskbarItems.set(id, item);
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

function openWindow(id, filePath) {
  const titleMap = {
    cv: 'CV.pdf',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    blackjack: 'blackjack',
    musicplayer: 'Music Player',
    Trash: 'Trash'
  };
  const title = titleMap[id] || 'Yeni Pencere';
  const content = desktop.getContent(id, filePath);
  desktop.createWindow(title, content);

  // Özel dış bağlantılar
  if (id === 'Do not Click this!') return window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
  if (id === 'youtube') return window.open('https://youtu.be/eSnHZnnXjjA?list=RDeSnHZnnXjjA', '_blank');
}

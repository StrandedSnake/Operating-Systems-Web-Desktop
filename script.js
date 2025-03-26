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
    const windowDiv = document.createElement("div");
    windowDiv.className = "window";
    windowDiv.id = id;
    windowDiv.style.zIndex = this.zIndex++;

    // Başlangıç boyutları
    windowDiv.style.width = "800px";
    windowDiv.style.height = "700px";
    windowDiv.style.left = `calc(50% - 300px)`;
    windowDiv.style.top = `calc(30% - 200px)`;

    windowDiv.innerHTML = `
      <div class="window-header" onmousedown="desktop.bringToFront('${id}')">
        <span>${title}</span>
        <div>
          <button onclick="desktop.minimizeWindow('${id}')">🗕</button>
          <button onclick="desktop.toggleFullscreen('${id}')">🗖</button>
          <button onclick="desktop.closeWindow('${id}')">🗙</button>
        </div>
      </div>
      <div class="window-content">${content}</div>
    `;

    document.getElementById("windows").appendChild(windowDiv);
    this.windows.push(windowDiv);
    this.addTaskbarItem(id, title);

    // Pencereyi sürüklenebilir ve yeniden boyutlandırılabilir hale getir
    this.makeDraggable(windowDiv);
    this.makeResizable(windowDiv);

    return id;
  }

  bringToFront(id) {
    const win = document.getElementById(id);
    if (win) {
      win.style.zIndex = ++this.zIndex;
      // Tüm taskbar item'lardan "active" sınıfını kaldırıyoruz.
      this.taskbarItems.forEach(item => item.classList.remove("active"));
      // Şu anki pencerenin taskbar item'ını aktif yapıyoruz.
      this.updateTaskbarItem(id, false);
    }
  }

  updateTaskbarItem(windowId, isMinimized) {
    const taskbarItem = this.taskbarItems.get(windowId);
    if (taskbarItem) {
      if (!isMinimized) {
        taskbarItem.classList.add("active");
      } else {
        taskbarItem.classList.remove("active");
      }
    }
  }



  closeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
      win.remove();
      this.windows = this.windows.filter((w) => w.id !== id);

      const taskbarItem = this.taskbarItems.get(id);
      if (taskbarItem) {
        taskbarItem.remove();
      }
      this.taskbarItems.delete(id);
    }
  }

  minimizeWindow(id) {
    const win = document.getElementById(id);
    if (win) {
      win.style.display = "none";
      this.updateTaskbarItem(id, true);
    }
  }

  restoreWindow(id) {
    const win = document.getElementById(id);
    if (win) {
      win.style.display = "flex";
      this.bringToFront(id);
    }
  }

  toggleFullscreen(id) {
    const win = document.getElementById(id);
    if (!win) return;
  
    win.classList.toggle("fullscreen");
  
    if (win.classList.contains("fullscreen")) {
      win.style.position = "fixed";
      win.style.width = "100vw";
      win.style.height = "100vh";
      win.style.left = "0";
      win.style.top = "0";
    } else {
      win.style.position = "absolute";
      win.style.width = "800px";
      win.style.height = "700px";
      win.style.left = `calc(50% - 300px)`;
      win.style.top = `calc(30% - 200px)`;
    }
  }

  addTaskbarItem(windowId, title) {
    const taskbarItem = document.createElement("div");
    taskbarItem.className = "taskbar-item";
    taskbarItem.textContent = title;
    taskbarItem.dataset.windowId = windowId;

    taskbarItem.addEventListener("click", () => {
      const win = document.getElementById(windowId);
      if (win.style.display === "none") {
        this.restoreWindow(windowId);
      } else {
        this.bringToFront(windowId);
      }
    });

    document.getElementById("taskbar-items").appendChild(taskbarItem);
    this.taskbarItems.set(windowId, taskbarItem);
  }

  updateTaskbarItem(windowId, isMinimized) {
    const taskbarItem = this.taskbarItems.get(windowId);
    if (taskbarItem) {
      taskbarItem.classList.toggle("active", !isMinimized);
    }
  }

  makeDraggable(win) {
    const header = win.querySelector(".window-header");
    let offsetX, offsetY, isDragging = false;

    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      this.bringToFront(win.id);
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        win.style.left = `${e.clientX - offsetX}px`;
        win.style.top = `${e.clientY - offsetY}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  makeResizable(win) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    win.addEventListener("mousedown", (e) => {
      const rect = win.getBoundingClientRect();
      if (
        e.clientX >= rect.right - 15 &&
        e.clientY >= rect.bottom - 15
      ) {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(win.style.width);
        startHeight = parseInt(win.style.height);
        e.preventDefault();
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const width = startWidth + (e.clientX - startX);
      const height = startHeight + (e.clientY - startY);
      win.style.width = `${Math.max(300, width)}px`;
      win.style.height = `${Math.max(200, height)}px`;
    });

    document.addEventListener("mouseup", () => {
      isResizing = false;
    });
  }
}

const desktop = new WindowManager();

function openWindow(id, filePath) {
  let title = "";
  let content = "";

  switch (id) {
    case "cv":
      title = "CV.pdf";
      content = `<embed src="${filePath}" type="application/pdf" width="100%" height="100%">`;
      break;
    case "github":
      title = "GitHub";
      content = `<iframe src="${filePath}" frameborder="0" width="100%" height="100%"></iframe>`;
      break;
    case "linkedin":
      title = "LinkedIn";
      content = `<iframe src="${filePath}" frameborder="0" width="100%" height="100%"></iframe>`;
      break;
    case "Trash":
      title = "Çöp Kutusu";
      content = `
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
      break;
    case "Do not Click this!":
      window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank");
      return;
    case "youtube":
      window.open("https://youtu.be/eSnHZnnXjjA?list=RDeSnHZnnXjjA", "_blank");
      return;
      case "blackjack":
        title = "blackjack";
        content = `<iframe src="${filePath}" frameborder="0" width="100%" height="100%"></iframe>`;
        break;
    default:
      title = "Yeni Pencere";
      content = `<div>Dosya bulunamadı</div>`;
  }

  desktop.createWindow(title, content);
}

document.addEventListener("DOMContentLoaded", () => {
  const selectElement = document.getElementById("note-select");
  const container = document.getElementById("notes-container");
  const titleElement = document.getElementById("file-title");
  const toggleBtn = document.getElementById("furigana-toggle");

  let isFuriganaVisible = false; // Default: OFF

  // 1. Furigana Toggle Initialization
  updateFuriganaUI();

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      isFuriganaVisible = !isFuriganaVisible;
      updateFuriganaUI();
    });
  }

  function updateFuriganaUI() {
    if (isFuriganaVisible) {
      document.body.classList.remove("hide-furigana");
      if (toggleBtn) {
        toggleBtn.classList.add("active");
        toggleBtn.textContent = "Furigana: ON";
      }
    } else {
      document.body.classList.add("hide-furigana");
      if (toggleBtn) {
        toggleBtn.classList.remove("active");
        toggleBtn.textContent = "Furigana: OFF";
      }
    }
  }

  // 2. Load File List from index.json
  async function initFileList() {
    try {
      const response = await fetch("./notes/index.json");
      if (!response.ok) throw new Error("Index file not found");
      const files = await response.json();

      if (selectElement) {
        selectElement.innerHTML = "";
        files.forEach(file => {
          const option = document.createElement("option");
          option.value = file.filename;
          option.textContent = file.title || file.filename;
          selectElement.appendChild(option);
        });
      }

      if (files.length > 0) {
        loadNoteFile(files[0].filename);
      }
    } catch (err) {
      console.error("Index Load Error:", err);
      if (titleElement) titleElement.textContent = "Error Loading Index";
      if (container) {
        container.innerHTML = `<p class="error-msg">Could not load <code>notes/index.json</code>.</p>`;
      }
    }
  }

  if (selectElement) {
    selectElement.addEventListener("change", (e) => {
      loadNoteFile(e.target.value);
    });
  }

  // 3. Load & Render Selected Note File
  async function loadNoteFile(fileName) {
    if (titleElement) titleElement.textContent = `Loading ${fileName}...`;
    if (container) container.innerHTML = "";

    try {
      const response = await fetch(`./notes/${fileName}`);
      if (!response.ok) throw new Error("File not found");

      const rawText = await response.text();
      if (titleElement) titleElement.textContent = fileName.replace(".txt", "");
      renderNotes(rawText);
    } catch (err) {
      console.error("File Load Error:", err);
      if (titleElement) titleElement.textContent = "Error Loading File";
      if (container) {
        container.innerHTML = `<p class="error-msg">Could not load <code>notes/${fileName}</code>.</p>`;
      }
    }
  }

  // 4. Render Content Blocks
  function renderNotes(rawText) {
    const blocks = rawText.trim().split(/\n\s*\n/);

    blocks.forEach((block) => {
      const card = document.createElement("div");
      card.className = "note-block";

      // Detect audio annotation (e.g., (File123.wav) or (AB.wav))
      const audioMatch = block.match(/^\s*\(([^()\r\n]+\.(?:wav|mp3))\)\s*$/im);

      let audioFilename = null;
      let cleanedBlock = block;

      if (audioMatch) {
        audioFilename = audioMatch[1];
        cleanedBlock = block.replace(audioMatch[0], "").trim();
      }

      // Render Block Content
      if (cleanedBlock.includes("★")) {
        card.classList.add("star-block");
        card.innerHTML = formatStarExercise(cleanedBlock);
      } else {
        const lines = cleanedBlock.split("\n").map(line => processLine(line));
        card.innerHTML = lines.join("<br>");
      }

      // Append Audio Player if an audio file was specified
      if (audioFilename) {
        const audioWrapper = document.createElement("div");
        audioWrapper.className = "audio-player-wrapper";

        audioWrapper.innerHTML = `
          <span class="audio-label">🎧 Audio: <code>${audioFilename}</code></span>
          <audio controls preload="metadata" src="./audio/${audioFilename}">
            Your browser does not support the audio element.
          </audio>
        `;
        card.appendChild(audioWrapper);
      }

      if (container) container.appendChild(card);
    });
  }

  // Unified Line Processor
  function processLine(str) {
    let clean = escapeHTML(str);
    clean = parseFurigana(clean);
    clean = clean.replace(/ /g, "&nbsp;");
    return clean;
  }

  // Converts [Kanji|Furigana] to <ruby>
  function parseFurigana(text) {
    return text.replace(/\[([^\vert{}\]]+)\|([^\]]+)\]/g, "<ruby>$1<rt>$2</rt></ruby>");
  }

  function formatStarExercise(block) {
    const lines = block.split("\n");
    let html = `<div class="star-content">`;
    lines.forEach(line => {
      const parsedLine = processLine(line);

      if (line.includes("★")) {
        html += `<p class="star-prompt">${parsedLine}</p>`;
      } else if (/^\d+\./.test(line.trim())) {
        html += `<span class="star-choice">${parsedLine}</span> `;
      } else if (line.includes("→")) {
        html += `<div class="star-answer">Answer: <strong>${parsedLine}</strong></div>`;
      } else {
        html += `<p>${parsedLine}</p>`;
      }
    });
    html += `</div>`;
    return html;
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // Initialize
  initFileList();
});
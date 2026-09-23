document.addEventListener("DOMContentLoaded", () => {
  const selectElement = document.getElementById("note-select");
  const container = document.getElementById("notes-container");
  const titleElement = document.getElementById("file-title");
  const toggleBtn = document.getElementById("furigana-toggle");

  let isFuriganaVisible = false; // Default: OFF

  // 1. Furigana Toggle Initialization
  updateFuriganaUI();

  toggleBtn.addEventListener("click", () => {
    isFuriganaVisible = !isFuriganaVisible;
    updateFuriganaUI();
  });

  function updateFuriganaUI() {
    if (isFuriganaVisible) {
      document.body.classList.remove("hide-furigana");
      toggleBtn.classList.add("active");
      toggleBtn.textContent = "Furigana: ON";
    } else {
      document.body.classList.add("hide-furigana");
      toggleBtn.classList.remove("active");
      toggleBtn.textContent = "Furigana: OFF";
    }
  }

  // 2. Load File List from index.json & Populate Dropdown
  async function initFileList() {
    try {
      const response = await fetch("./notes/index.json");
      if (!response.ok) throw new Error("Index file not found");
      const files = await response.json();

      selectElement.innerHTML = "";
      files.forEach(file => {
        const option = document.createElement("option");
        option.value = file.filename;
        option.textContent = file.title || file.filename;
        selectElement.appendChild(option);
      });

      if (files.length > 0) {
        loadNoteFile(files[0].filename);
      }
    } catch (err) {
      titleElement.textContent = "Error Loading Index";
      container.innerHTML = `<p class="error-msg">Could not load <code>notes/index.json</code>.</p>`;
    }
  }

  selectElement.addEventListener("change", (e) => {
    loadNoteFile(e.target.value);
  });

  // 3. Load & Render Selected Note File
  async function loadNoteFile(fileName) {
    titleElement.textContent = `Loading ${fileName}...`;
    container.innerHTML = "";

    try {
      const response = await fetch(`./notes/${fileName}`);
      if (!response.ok) throw new Error("File not found");

      const rawText = await response.text();
      titleElement.textContent = fileName.replace(".txt", "");
      renderNotes(rawText);
    } catch (err) {
      titleElement.textContent = "Error Loading File";
      container.innerHTML = `<p class="error-msg">Could not load <code>notes/${fileName}</code>.</p>`;
    }
  }

  // 4. Render Content with Furigana Parser
  function renderNotes(rawText) {
    const blocks = rawText.trim().split(/\n\s*\n/);

    blocks.forEach((block) => {
      const card = document.createElement("div");
      card.className = "note-block";

      if (block.includes("★")) {
        card.classList.add("star-block");
        card.innerHTML = formatStarExercise(block);
      } else {
        const lines = block.split("\n").map(line => {
          let parsedLine = escapeHTML(line).replace(/ /g, "&nbsp;");
          parsedLine = parseFurigana(parsedLine); // Properly parses [漢字|ふりがな] to <ruby>
          return parsedLine;
        });
        card.innerHTML = lines.join("<br>");
      }

      container.appendChild(card);
    });
  }

  // FIXED: Corrected Pipe Regex from \Vert{} to \|
  function parseFurigana(text) {
    return text.replace(/\[([^\vert{}]+)\Vert{}([^\]]+)\]/g, "<ruby>$1<rt>$2</rt></ruby>");
  }

  function formatStarExercise(block) {
    const lines = block.split("\n");
    let html = `<div class="star-content">`;
    lines.forEach(line => {
      let parsedLine = escapeHTML(line);
      parsedLine = parseFurigana(parsedLine);

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
    return str.replace(/[&<>'"]/g,
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  initFileList();
});

document.addEventListener("DOMContentLoaded", () => {
  const selectElement = document.getElementById("note-select");
  const container = document.getElementById("notes-container");
  const titleElement = document.getElementById("file-title");

  // Load selected note file on change
  selectElement.addEventListener("change", (e) => {
    loadNoteFile(e.target.value);
  });

  // Initial load
  loadNoteFile(selectElement.value);

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
      container.innerHTML = `<p class="error-msg">Could not load <code>notes/${fileName}</code>. Ensure you are running a local web server.</p>`;
    }
  }

  function renderNotes(rawText) {
    // Split chunks separated by blank lines (double line breaks)
    const blocks = rawText.trim().split(/\n\s*\n/);

    blocks.forEach((block) => {
      const card = document.createElement("div");
      card.className = "note-block";

      // Detect Star ordering exercises
      if (block.includes("★")) {
        card.classList.add("star-block");
        card.innerHTML = formatStarExercise(block);
      } 
      // General Note / Cloze / Vocab block
      else {
        const lines = block.split("\n").map(line => escapeHTML(line).replace(/ /g, "&nbsp;"));
        card.innerHTML = lines.join("<br>");
      }

      container.appendChild(card);
    });
  }

  function formatStarExercise(block) {
    const lines = block.split("\n");
    let html = `<div class="star-content">`;
    lines.forEach(line => {
      if (line.includes("★")) {
        html += `<p class="star-prompt">${escapeHTML(line)}</p>`;
      } else if (/^\d+\./.test(line.trim())) {
        html += `<span class="star-choice">${escapeHTML(line)}</span> `;
      } else if (line.includes("→")) {
        html += `<div class="star-answer">Answer: <strong>${escapeHTML(line)}</strong></div>`;
      } else {
        html += `<p>${escapeHTML(line)}</p>`;
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
});

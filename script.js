// ---------- Draggable helpers ----------
function makeDraggable(img) {
  img.className = "draggable";
  img.draggable = true;
  img.dataset.src = img.src; // unique id to find the original element
  img.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", img.src);
  });
}

// init any preloaded images
document.querySelectorAll(".draggable").forEach(makeDraggable);

// All drop targets (tiers + gallery)
const dropzones = document.querySelectorAll(".dropzone");

dropzones.forEach((zone) => {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("over"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("over");
    const src = e.dataTransfer.getData("text/plain");
    const dragged = document.querySelector(`[data-src='${src}']`);
    if (dragged) zone.appendChild(dragged); // move, don't clone
  });
});

// Upload -> add to gallery
document.getElementById("upload").addEventListener("change", (e) => {
  const pool = document.getElementById("project-pool");
  Array.from(e.target.files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement("img");
      img.src = ev.target.result; // already a data URL (CORS-safe)
      makeDraggable(img);
      pool.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

// ---------- Download (robust) ----------
async function inlineAllImages(root) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return; // already safe
      // fetch image and convert to data URL
      const res = await fetch(src, { cache: "no-store" });
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.readAsDataURL(blob);
      });
      img.setAttribute("src", dataUrl);
    })
  );
}

document.getElementById("download").addEventListener("click", async () => {
  try {
    const node = document.querySelector(".container");
    if (!node) {
      alert("Error: Could not find container!");
      return;
    }

    // clone to avoid flicker while inlining images
    const clone = node.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = "-10000px";
    clone.style.top = "0";
    document.body.appendChild(clone);

    // inline all <img> inside the clone so html2canvas won't be tainted
    await inlineAllImages(clone);

    const canvas = await html2canvas(clone, {
      backgroundColor: "#0f172a",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    });

    document.body.removeChild(clone);

    const link = document.createElement("a");
    link.download = "tierlist.png";
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Download error:", err);
    alert("Screenshot failed. See console for details.");
  }
});

document.getElementById("clear").addEventListener("click", () => {
  const pool = document.getElementById("project-pool");

  // For each tier dropzone, move its children back to the gallery
  document.querySelectorAll("#tier-list .dropzone").forEach((zone) => {
    const imgs = Array.from(zone.querySelectorAll("img"));
    imgs.forEach((img) => {
      pool.appendChild(img);
    });
  });
});



(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const output = $("generated-password");
  const lengthNumber = $("length-number");
  const lengthRange = $("length-range");
  const generatorStatus = $("generator-status");
  const categoryIds = ["uppercase", "lowercase", "numbers", "symbols"];
  const sets = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{};:,.?/|~"
  };
  const ambiguous = new Set(["I", "l", "1", "O", "0"]);

  function randomInt(max) {
    if (!Number.isSafeInteger(max) || max < 1) throw new Error("Intervalo inválido.");
    const limit = Math.floor(256 / max) * max;
    const bytes = new Uint8Array(1);
    do { crypto.getRandomValues(bytes); } while (bytes[0] >= limit);
    return bytes[0] % max;
  }

  function shuffleSecurely(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function selectedSet(id) {
    let chars = sets[id];
    if ($("exclude-ambiguous").checked) chars = [...chars].filter(c => !ambiguous.has(c)).join("");
    return chars;
  }

  function generatePassword() {
    const length = Number(lengthNumber.value);
    const minNumbers = Number($("min-numbers").value);
    const minSymbols = Number($("min-symbols").value);
    const active = categoryIds.filter(id => $(id).checked);
    if (!Number.isInteger(length) || length < 5 || length > 128) throw new Error("O comprimento tem de estar entre 5 e 128.");
    if (!active.length) throw new Error("Ativa pelo menos um tipo de caracteres.");
    if (!Number.isInteger(minNumbers) || minNumbers < 0 || !Number.isInteger(minSymbols) || minSymbols < 0) throw new Error("Os mínimos têm de ser números inteiros iguais ou superiores a zero.");
    if (!$("numbers").checked && minNumbers > 0) throw new Error("Ativa os números ou define o mínimo de números como zero.");
    if (!$("symbols").checked && minSymbols > 0) throw new Error("Ativa os caracteres especiais ou define o mínimo como zero.");
    if (minNumbers + minSymbols > length) throw new Error("A soma dos mínimos não pode exceder o comprimento.");
    const pools = Object.fromEntries(active.map(id => [id, selectedSet(id)]));
    if (Object.values(pools).some(pool => pool.length === 0)) throw new Error("Uma categoria não contém caracteres disponíveis.");

    const chars = [];
    for (let i = 0; i < minNumbers; i++) chars.push(pools.numbers[randomInt(pools.numbers.length)]);
    for (let i = 0; i < minSymbols; i++) chars.push(pools.symbols[randomInt(pools.symbols.length)]);
    const all = Object.values(pools).join("");
    while (chars.length < length) chars.push(all[randomInt(all.length)]);
    return shuffleSecurely(chars).join("");
  }

  function updateStrength() {
    const length = Math.max(0, Number(lengthNumber.value) || 0);
    const alphabet = categoryIds.filter(id => $(id).checked).reduce((sum, id) => sum + selectedSet(id).length, 0);
    const entropy = alphabet > 1 ? length * Math.log2(alphabet) : 0;
    $("entropy-value").textContent = `~ ${Math.round(entropy)} bits`;
    let label = "Fraca", percent = 18;
    if (entropy >= 100) { label = "Muito forte"; percent = 100; }
    else if (entropy >= 70) { label = "Forte"; percent = 68; }
    else if (entropy >= 45) { label = "Moderada"; percent = 42; }
    $("strength-label").textContent = label;
    $("strength-meter").style.width = `${percent}%`;
  }

  function doGenerate() {
    try {
      output.type = "text";
      output.value = generatePassword();
      $("toggle-generated").setAttribute("aria-label", "Ocultar senha");
      $("generated-eye").textContent = "◉";
      generatorStatus.textContent = "";
      updateStrength();
    } catch (error) {
      generatorStatus.textContent = error.message;
    }
  }

  $("generate").addEventListener("click", doGenerate);
  lengthNumber.addEventListener("input", () => {
    lengthRange.value = lengthNumber.value;
    updateStrength();
  });
  lengthRange.addEventListener("input", () => {
    lengthNumber.value = lengthRange.value;
    updateStrength();
  });
  [...categoryIds, "exclude-ambiguous"].forEach(id => $(id).addEventListener("change", updateStrength));
  ["min-numbers", "min-symbols"].forEach(id => $(id).addEventListener("change", () => {
    const input = $(id);
    input.value = Math.max(0, Math.min(128, Number(input.value) || 0));
  }));

  $("toggle-generated").addEventListener("click", () => {
    const hidden = output.type === "text";
    output.type = hidden ? "password" : "text";
    $("toggle-generated").setAttribute("aria-label", hidden ? "Mostrar senha" : "Ocultar senha");
  });

  $("copy-generated").addEventListener("click", async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      generatorStatus.textContent = "Senha copiada para a área de transferência.";
    } catch {
      generatorStatus.textContent = "Não foi possível copiar. Seleciona a senha e copia manualmente.";
    }
  });

  $("copy-to-check").addEventListener("click", () => {
    if (!output.value) {
      $("result-title").textContent = "Gera primeiro uma senha.";
      $("result-description").textContent = "Depois podes transferi-la para o campo de verificação.";
      return;
    }
    $("exposure-password").value = output.value;
    $("exposure-password").focus();
    $("exposure-password").type = "password";
    $("toggle-exposure").textContent = "◉";
    $("toggle-exposure").setAttribute("aria-label", "Mostrar senha");
    $("result-title").textContent = "Senha pronta para verificar.";
    $("result-description").textContent = "Carrega em “Verificar exposição” para iniciar a consulta.";
  });

  $("toggle-exposure").addEventListener("click", () => {
    const input = $("exposure-password");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    $("toggle-exposure").textContent = show ? "◎" : "◉";
    $("toggle-exposure").setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
  });

  async function sha1Hex(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-1", bytes);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  async function checkPwned(password) {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}?Add-Padding=true`, {
        signal: controller.signal, cache: "no-store", headers: { "Add-Padding": "true" }
      });
      if (!response.ok) throw new Error("API");
      const body = await response.text();
      for (const line of body.split(/\r?\n/)) {
        const split = line.indexOf(":");
        if (split < 0) continue;
        const candidate = line.slice(0, split).trim().toUpperCase();
        const countText = line.slice(split + 1).trim();
        if (!/^[0-9A-F]{35}$/.test(candidate) || !/^\d+$/.test(countText)) continue;
        if (candidate === suffix) {
          const count = Number(countText);
          return { found: count > 0, count };
        }
      }
      return { found: false, count: 0 };
    } finally { clearTimeout(timeout); }
  }

  $("exposure-form").addEventListener("submit", async event => {
    event.preventDefault();
    const password = $("exposure-password").value;
    if (!password) return;
    if (!isSecureContext || !crypto?.subtle) {
      $("result-title").textContent = "Contexto seguro necessário.";
      $("result-description").textContent = "Abre esta página através de HTTPS ou localhost.";
      return;
    }
    const button = $("exposure-submit");
    button.disabled = true;
    button.innerHTML = "<span>◌</span> A verificar…";
    $("result-title").textContent = "A verificar a exposição…";
    $("result-description").textContent = "A senha original não é enviada à API.";
    $("result-box").classList.remove("result-found", "result-clear", "result-error");
    try {
      const result = await checkPwned(password);
      if (result.found) {
        $("result-box").classList.add("result-found");
        $("result-title").textContent = "Senha encontrada em registos de exposição.";
        $("result-description").textContent = `Ocorrências na base consultada: ${result.count}. Não utilizes esta senha.`;
      } else {
        $("result-box").classList.add("result-clear");
        $("result-title").textContent = "Não encontrada na base de dados consultada.";
        $("result-description").textContent = "Isto não garante que a senha nunca tenha sido exposta.";
      }
    } catch (error) {
      $("result-box").classList.add("result-error");
      $("result-title").textContent = error.name === "AbortError" ? "A verificação excedeu o tempo limite." : "Não foi possível concluir a verificação.";
      $("result-description").textContent = "Confirma a ligação à Internet e tenta novamente. Não interpretamos uma falha como resultado seguro.";
    } finally {
      button.disabled = false;
      button.innerHTML = "<span>⌕</span> Verificar exposição";
    }
  });

  updateStrength();
  doGenerate();
})();

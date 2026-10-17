(() => {
  const form = document.getElementById("exposure-form");
  const passwordInput = document.getElementById("exposure-password");
  const toggleButton = document.getElementById("exposure-toggle");
  const submitButton = document.getElementById("exposure-submit");
  const status = document.getElementById("exposure-status");

  // Não executar se a secção não estiver presente na página.
  if (!form || !passwordInput || !toggleButton ||
      !submitButton || !status) {
    return;
  }

  toggleButton.addEventListener("click", () => {
    const visible = passwordInput.type === "password";

    passwordInput.type = visible ? "text" : "password";
    toggleButton.textContent = visible ? "Ocultar" : "Mostrar";
    toggleButton.setAttribute(
      "aria-label",
      visible ? "Ocultar senha" : "Mostrar senha"
    );
  });

  async function sha1Hex(value) {
    if (!globalThis.crypto?.subtle) {
      throw new Error("SECURE_CONTEXT");
    }

    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-1", bytes);

    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  async function checkExposure(password) {
    const hash = await sha1Hex(password);

    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const url =
        `https://api.pwnedpasswords.com/range/${prefix}?Add-Padding=true`;

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
        headers: {
          "Accept": "text/plain"
        }
      });

      if (!response.ok) {
        throw new Error("API_ERROR");
      }

      const body = await response.text();

      // Cada linha contém SUFIXO:CONTAGEM.
      for (const line of body.split(/\r?\n/)) {
        const separator = line.indexOf(":");

        if (separator === -1) continue;

        const returnedSuffix = line
          .slice(0, separator)
          .trim()
          .toUpperCase();

        const countText = line.slice(separator + 1).trim();

        if (!/^[0-9A-F]{35}$/.test(returnedSuffix)) {
          continue;
        }

        if (!/^\d+$/.test(countText)) {
          continue;
        }

        // Entradas de padding têm contagem zero.
        if (returnedSuffix === suffix) {
          const count = Number(countText);

          if (count > 0) {
            return { found: true, count };
          }

          return { found: false, count: 0 };
        }
      }

      return { found: false, count: 0 };
    } finally {
      clearTimeout(timeout);
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const password = passwordInput.value;

    if (!password) {
      status.textContent = "Introduz uma senha para verificar.";
      return;
    }

    if (!globalThis.crypto?.subtle || !globalThis.isSecureContext) {
      status.textContent =
        "A verificação requer HTTPS ou localhost e Web Crypto.";
      return;
    }

    submitButton.disabled = true;
    status.textContent = "A verificar a exposição…";

    try {
      const result = await checkExposure(password);

      if (result.found) {
        status.textContent =
          `Atenção: esta senha foi encontrada em registos de exposição. ` +
          `Ocorrências na base consultada: ${result.count}. ` +
          `Não a utilizes.`;
      } else {
        status.textContent =
          "Não encontrada na base de dados consultada. " +
          "Isto não garante que nunca tenha sido exposta.";
      }
    } catch (error) {
      if (error.name === "AbortError") {
        status.textContent =
          "A verificação excedeu o tempo limite. Tenta novamente.";
      } else {
        status.textContent =
          "Não foi possível concluir a verificação. " +
          "Confirma a ligação e tenta novamente.";
      }
    } finally {
      submitButton.disabled = false;
    }
  });
})();

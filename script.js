// Desenvolvido por Kaike Frentzel
// Projeto: Calculadora ISS - Accor
// Ano: 2026

// Credenciais
const CREDENTIALS = {
  tricombo: btoa("Hotel1234"),
  kaike: btoa("Ka200906")
};

// checkCredentials(u,p) -> "func" | "adm" | null
function checkCredentials(rawUser, password) {
  const u = (rawUser || "").trim().toLowerCase();
  const p = (password || "").trim();

  if (!u) return null;
  if (!CREDENTIALS[u]) return null;

  if (atob(CREDENTIALS[u]) === p) {
    return u === "kaike" ? "adm" : "func";
  }

  return null;
}

function round2(v) {
  return Math.round((v + 1e-12) * 100) / 100;
}

function formatR(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(v);
}

// Aceita formatos:
// 15.000,00
// 15,000.00
// 15000,00
// 15000.00
// 15000
function parseCurrencyInput(value) {
  if (typeof value !== "string") return NaN;

  let cleaned = value.trim().replace(/\s+/g, "");

  if (!cleaned) return NaN;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  // Tem vírgula e ponto
  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    if (lastComma > lastDot) {
      // Ex: 15.000,00
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // Ex: 15,000.00
      cleaned = cleaned.replace(/,/g, "");
    }
  }
  // Só vírgula
  else if (hasComma) {
    const parts = cleaned.split(",");

    if (parts.length > 2) {
      // Ex: 1,234,567
      cleaned = cleaned.replace(/,/g, "");
    } else {
      const decimalPart = parts[1] || "";

      if (decimalPart.length === 0) {
        // Ex: 15000,
        cleaned = parts[0] + ".0";
      } else if (decimalPart.length <= 2) {
        // Ex: 15000,50
        cleaned = cleaned.replace(",", ".");
      } else {
        // Ex: 15,000
        cleaned = cleaned.replace(/,/g, "");
      }
    }
  }
  // Só ponto
  else if (hasDot) {
    const parts = cleaned.split(".");

    if (parts.length > 2) {
      // Ex: 1.234.567, mas sem vírgula no final
      const last = parts.pop();
      cleaned = parts.join("") + "." + last;
    } else {
      const decimalPart = parts[1] || "";

      if (decimalPart.length === 0) {
        // Ex: 15000.
        cleaned = parts[0] + ".0";
      } else if (decimalPart.length <= 2) {
        // Ex: 15000.50
        // mantém
      } else {
        // Ex: 15.000
        cleaned = cleaned.replace(/\./g, "");
      }
    }
  }

  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

// Cálculo sem arredondar no meio
function calcula_fluxo(x, b) {
  const Y = x * 1.03;
  const A = Y * 0.97;
  const B = b;
  const N = (x + B) * 1.03;
  const ISS = N * 0.03;
  const PR = N - ISS;

  return {
    Y: round2(Y),
    A: round2(A),
    B: round2(B),
    N: round2(N),
    ISS: round2(ISS),
    PR: round2(PR)
  };
}

function calcularFluxoGeralForView() {
  const entradaEl = document.getElementById("valor");
  const resultadoEl = document.getElementById("resultado");

  if (!entradaEl || !resultadoEl) return null;

  const entrada = (entradaEl.value || "").trim();

  if (!entrada) {
    resultadoEl.innerHTML = "<p class='erro'>Digite um valor.</p>";
    return null;
  }

  const Y_input = parseCurrencyInput(entrada);

  if (isNaN(Y_input)) {
    resultadoEl.innerHTML = "<p class='erro'>Valor inválido.</p>";
    return null;
  }

  const X = Y_input / 1.03;
  const A = Y_input * 0.97;
  const B = X - A;

  let fluxo = calcula_fluxo(X, B);
  let ajuste = null;

  if (round2(fluxo.PR) !== round2(X)) {
    const maxSteps = 10000; // até R$ 100,00

    for (let step = 1; step <= maxSteps; step++) {
      const delta = step / 100;

      const plus = calcula_fluxo(X, B + delta);
      if (round2(plus.PR) === round2(X)) {
        ajuste = {
          delta: round2(delta),
          sign: "+",
          newB: round2(B + delta),
          fluxo: plus
        };
        fluxo = plus;
        break;
      }

      if (B - delta >= 0) {
        const minus = calcula_fluxo(X, B - delta);
        if (round2(minus.PR) === round2(X)) {
          ajuste = {
            delta: round2(delta),
            sign: "-",
            newB: round2(B - delta),
            fluxo: minus
          };
          fluxo = minus;
          break;
        }
      }
    }
  }

  return {
    X: round2(X),
    A: round2(A),
    B: fluxo.B,
    Y: fluxo.Y,
    N: fluxo.N,
    ISS: fluxo.ISS,
    PR: fluxo.PR,
    ajuste,
    formatR
  };
}
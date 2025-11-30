// script.js
// Credenciais ofuscadas (base64) — não exibimos senhas no HTML
const CREDENTIALS = {
  "tricombo": btoa("Hotel1234"),
  "kaike":    btoa("Ka200906")
};

// checkCredentials(u,p) -> "func" | "adm" | null
function checkCredentials(rawUser, password){
  const u = (rawUser || "").trim().toLowerCase();
  if (!u) return null;
  if (!CREDENTIALS[u]) return null;
  if (atob(CREDENTIALS[u]) === password) {
    if (u === "kaike") return "adm";
    return "func";
  }
  return null;
}

/* ---------- cálculo (mesma lógica que validamos) ---------- */
function round2(v) { return Math.round((v + 1e-12) * 100) / 100; }
function formatR(v) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v); }

function calcula_fluxo(x, b) {
  const Y = round2(x * 1.03);
  const A = round2(Y * 0.97);
  const B = round2(b);
  const N = round2((x + B) * 1.03);
  const ISS = round2(N * 0.03);
  const PR = round2(N - ISS);
  return { Y, A, B, N, ISS, PR };
}

// função que faz o processamento a partir do campo "valor" e retorna objeto com tudo
function calcularFluxoGeralForView(){
  const entradaEl = document.getElementById("valor");
  if (!entradaEl) return null;
  const entrada = (entradaEl.value || "").trim();
  if (!entrada) {
    document.getElementById("resultado").innerHTML = "<p class='erro'>Digite um valor.</p>";
    return null;
  }

  // limpar formato pt-BR -> ponto decimal
  let cleaned = entrada.replace(/\s+/g, "");
  if (cleaned.includes(",")) cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
  const Y_input = parseFloat(cleaned);
  if (isNaN(Y_input)) {
    document.getElementById("resultado").innerHTML = "<p class='erro'>Valor inválido.</p>";
    return null;
  }

  const X = round2(Y_input / 1.03);
  const A = round2(Y_input * 0.97);
  const B = round2(X - A);
  const fluxo = calcula_fluxo(X, B);

  // busca ajuste até R$ 1.000.000 (em centavos)
  let ajuste = null;
  if (round2(fluxo.PR) !== round2(X)) {
    const maxSteps = 100000000; // 1.000.000 em centavos
    for (let step = 1; step <= maxSteps; step++) {
      const delta = round2(step / 100);
      const plus = calcula_fluxo(X, round2(B + delta));
      if (round2(plus.PR) === round2(X)) {
        ajuste = { delta, sign: "+", newB: round2(B + delta), fluxo: plus };
        break;
      }
      if (B - delta >= 0) {
        const minus = calcula_fluxo(X, round2(B - delta));
        if (round2(minus.PR) === round2(X)) {
          ajuste = { delta, sign: "-", newB: round2(B - delta), fluxo: minus };
          break;
        }
      }
    }
  }

  return { ...fluxo, X, B, ajuste, formatR };
}

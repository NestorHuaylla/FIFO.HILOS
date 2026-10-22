// FIFO / FCFS: primero llega, primero se ejecuta (sin interrupciones).
const ORIGINAL = [
  { id: 1, llegada: 0, ejecucion: 8 },
  { id: 2, llegada: 1, ejecucion: 4 },
  { id: 3, llegada: 2, ejecucion: 9 },
  { id: 4, llegada: 3, ejecucion: 5 }
];

const COLORES = [
  ["#a78bfa", "#6850b6"],
  ["#67c9c1", "#267d86"],
  ["#8daafa", "#4c61ad"],
  ["#d89bd9", "#85529e"],
  ["#e0ad74", "#91603e"],
  ["#9fd18c", "#477c61"],
  ["#ed8da1", "#9e536a"]
];

let procesos = ORIGINAL.map(p => ({ ...p }));
let siguienteId = 5;
const cuerpo = document.getElementById("process-rows");
const estado = document.getElementById("status-text");
const gantt = document.getElementById("gantt-track");
const leyenda = document.getElementById("gantt-legend");

function colorDe(id) {
  return COLORES[(id - 1) % COLORES.length];
}

function datoValido(valor, minimo) {
  return Number.isSafeInteger(valor) && valor >= minimo && valor <= 99999;
}

// Crea las filas solo al añadir, eliminar o restablecer procesos.
function pintarFilas() {
  cuerpo.innerHTML = procesos.map(p => {
    const [color] = colorDe(p.id);
    return `<tr data-id="${p.id}">
      <td><span class="process-label"><span class="process-dot" style="--process-color:${color}"></span>P${p.id}</span></td>
      <td><input class="number-input" aria-label="Llegada de P${p.id}" data-field="llegada" type="number" min="0" max="99999" step="1" value="${p.llegada}"></td>
      <td><input class="number-input" aria-label="Ejecución de P${p.id}" data-field="ejecucion" type="number" min="1" max="99999" step="1" value="${p.ejecucion}"></td>
      <td><span class="value-result" data-result="inicio">—</span></td>
      <td><span class="value-result" data-result="final">—</span></td>
      <td><span class="value-result value-highlight" data-result="retorno">—</span></td>
      <td><span class="value-result value-highlight" data-result="espera">—</span></td>
      <td><button class="delete-button" type="button" data-delete="${p.id}" aria-label="Eliminar proceso P${p.id}" title="Eliminar P${p.id}">×</button></td>
    </tr>`;
  }).join("");
  document.getElementById("process-count").textContent = procesos.length;
  calcular();
}

// La lógica es equivalente al bucle principal del archivo C++.
function calcular() {
  const invalido = procesos.some(p => !datoValido(p.llegada, 0) || !datoValido(p.ejecucion, 1));
  if (invalido || procesos.length === 0) {
    document.querySelectorAll("[data-result]").forEach(e => { e.textContent = "—"; });
    ["avg-return", "avg-wait", "total-time"].forEach(id => { document.getElementById(id).textContent = "—"; });
    gantt.innerHTML = '<div class="gantt-empty">Introduce valores válidos para visualizar la planificación.</div>';
    leyenda.innerHTML = "";
    estado.classList.add("error");
    estado.innerHTML = '<span class="status-symbol">!</span> Revisa las entradas: llegada ≥ 0 y ejecución ≥ 1 (enteros).';
    return;
  }

  // sort conserva el orden de la lista cuando las llegadas coinciden.
  const ordenados = [...procesos].sort((a, b) => a.llegada - b.llegada || procesos.indexOf(a) - procesos.indexOf(b));
  let reloj = 0, sumaRetorno = 0, sumaEspera = 0;
  const resultados = new Map();
  const segmentos = [];

  for (const proceso of ordenados) {
    const inicio = Math.max(reloj, proceso.llegada);
    if (inicio > reloj) segmentos.push({ id: null, desde: reloj, hasta: inicio });
    const final = inicio + proceso.ejecucion;
    const retorno = final - proceso.llegada;
    const espera = inicio - proceso.llegada;
    resultados.set(proceso.id, { inicio, final, retorno, espera });
    segmentos.push({ id: proceso.id, desde: inicio, hasta: final });
    reloj = final;
    sumaRetorno += retorno;
    sumaEspera += espera;
  }

  document.querySelectorAll("#process-rows tr").forEach(fila => {
    const r = resultados.get(Number(fila.dataset.id));
    for (const campo of ["inicio", "final", "retorno", "espera"]) {
      fila.querySelector(`[data-result="${campo}"]`).textContent = r[campo];
    }
  });

  document.getElementById("avg-return").textContent = (sumaRetorno / procesos.length).toFixed(2);
  document.getElementById("avg-wait").textContent = (sumaEspera / procesos.length).toFixed(2);
  document.getElementById("total-time").textContent = reloj;
  estado.classList.remove("error");
  estado.innerHTML = '<span class="status-symbol">✓</span> Todos los cálculos están actualizados.';
  pintarGantt(segmentos);
}

function pintarGantt(segmentos) {
  gantt.classList.remove("replay");
  let demora = 0;
  gantt.innerHTML = segmentos.map(s => {
    const duracion = s.hasta - s.desde;
    const esEspera = s.id === null;
    const [inicioColor, finColor] = esEspera ? ["#383542", "#282630"] : colorDe(s.id);
    const nombre = esEspera ? "Inactiva" : `P${s.id}`;
    const info = `${nombre}: ${s.desde}–${s.hasta} (${duracion} u.t.)`;
    const html = `<div class="gantt-segment${esEspera ? " idle" : ""}" style="--units:${duracion};--replay-delay:${demora}ms">
      <div class="gantt-block" title="${info}" style="--block-bg:linear-gradient(115deg,${inicioColor},${finColor})">${esEspera ? "…" : nombre}</div>
      <span class="gantt-start">${s.desde}</span><span class="gantt-end">${s.hasta}</span>
    </div>`;
    demora += 160;
    return html;
  }).join("");

  const idsUnicos = [...new Set(segmentos.filter(s => s.id !== null).map(s => s.id))];
  leyenda.innerHTML = idsUnicos.map(id => `<span class="gantt-legend-item"><span class="legend-swatch" style="--process-color:${colorDe(id)[0]}"></span>Proceso P${id}</span>`).join("") +
    (segmentos.some(s => s.id === null) ? '<span class="gantt-legend-item"><span class="legend-swatch" style="--process-color:#575361"></span>CPU inactiva</span>' : "");
}

// Actualiza sin reconstruir inputs, así no se pierde el foco al escribir.
cuerpo.addEventListener("input", e => {
  const input = e.target.closest("input[data-field]");
  if (!input) return;
  const fila = input.closest("tr");
  const proceso = procesos.find(p => p.id === Number(fila.dataset.id));
  const campo = input.dataset.field;
  const valor = input.value.trim() === "" ? NaN : Number(input.value);
  const valido = datoValido(valor, campo === "llegada" ? 0 : 1);
  input.classList.toggle("is-invalid", !valido);
  proceso[campo] = valido ? valor : NaN;
  calcular();
});

cuerpo.addEventListener("click", e => {
  const boton = e.target.closest("[data-delete]");
  if (!boton) return;
  procesos = procesos.filter(p => p.id !== Number(boton.dataset.delete));
  pintarFilas();
});

document.getElementById("add-button").addEventListener("click", () => {
  procesos.push({ id: siguienteId++, llegada: 0, ejecucion: 1 });
  pintarFilas();
  const ultimo = cuerpo.querySelector("tr:last-child input");
  if (ultimo) ultimo.focus();
});

document.getElementById("reset-button").addEventListener("click", () => {
  procesos = ORIGINAL.map(p => ({ ...p }));
  siguienteId = 5;
  pintarFilas();
});

document.getElementById("animate-button").addEventListener("click", () => {
  gantt.classList.remove("replay");
  void gantt.offsetWidth; // Reinicia la animación CSS.
  gantt.classList.add("replay");
});

pintarFilas();

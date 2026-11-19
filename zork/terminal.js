/*
  terminal.js: una "pantalla" mínima para jugar aventuras de texto en el navegador.

  Cómo encaja todo:
    historia .z3  ->  ZVM (lib/zvm.min.js, la máquina virtual Z-machine de Infocom)
                  ->  Glk (lib/glkapi.js, la capa de ventanas/entrada/salida)
                  ->  WebGlkOte (este archivo: dibuja el texto en HTML y lee el teclado)

  Glk y WebGlkOte hablan con mensajes JSON: Glk manda "update" con texto nuevo y
  pide entrada; WebGlkOte responde con eventos "line" o "char" cuando escribes.
*/
(function () {
  "use strict";

  // ---------- Archivos guardados (save/restore) en localStorage ----------
  const PREFIJO = "zork-guardado:";
  const almacen = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  const Dialog = {
    streaming: false,
    file_construct_ref(filename, usage, gameid) {
      return { filename: filename || "partida", usage: usage || "data", gameid: gameid || "" };
    },
    file_construct_temp_ref(usage) { return { filename: "temp-" + Date.now(), usage: usage || "data", gameid: "" }; },
    file_clean_fixed_name(name) { return String(name).replace(/[^\w\- ]/g, "").trim() || "partida"; },
    clave(ref) { return PREFIJO + (ref.gameid || "") + ":" + ref.usage + ":" + ref.filename; },
    file_ref_exists(ref) { return almacen.get(this.clave(ref)) !== null; },
    file_remove_ref(ref) { almacen.del(this.clave(ref)); },
    file_read(ref) {
      const s = almacen.get(this.clave(ref));
      return s === null ? null : JSON.parse(s);
    },
    file_write(ref, content) {
      const arr = typeof content === "string" ? Array.from(content, c => c.charCodeAt(0)) : Array.from(content);
      return almacen.set(this.clave(ref), JSON.stringify(arr));
    },
  };

  // ---------- GlkOte para la web ----------
  class WebGlkOte {
    constructor(el) {
      this.el = el;
      this.estado = el.querySelector(".estado");
      this.texto = el.querySelector(".texto");
      this.form = el.querySelector("form");
      this.input = el.querySelector("input");
      this.generation = 0;
      this.ventanas = {};       // id -> {type}
      this.pendiente = null;    // entrada pedida: {id, type}
      this.historial = [];
      this.posHist = 0;

      this.form.addEventListener("submit", e => { e.preventDefault(); this.enviarLinea(); });
      this.input.addEventListener("keydown", e => this.teclaLinea(e));
      document.addEventListener("keydown", e => this.teclaChar(e));
      el.addEventListener("click", () => { if (!getSelection().toString()) this.input.focus(); });
    }

    // --- API que llama Glk ---
    init(iface) {
      this.interface = iface;
      this.enviar({ type: "init", gen: this.generation, metrics: this.medidas(), support: [] });
    }
    getinterface() { return this.interface; }
    log() {}
    warning(m) { console.warn(m); }
    error(m) { this.agregarLinea([{ style: "alert", text: "Error: " + m }]); throw new Error(m); }
    save_allstate() { return {}; }

    update(data) {
      if (data.type === "error") return this.error(data.message);
      if (data.type === "pass" || data.gen <= this.generation && data.type !== "exit") return;
      this.generation = data.gen;
      if (data.windows) {
        this.ventanas = {};
        data.windows.forEach(w => { this.ventanas[w.id] = w; });
      }
      if (data.content) data.content.forEach(c => this.contenido(c));
      this.pendiente = null;
      if (data.input) {
        const i = data.input[0];
        if (i) this.pendiente = { id: i.id, type: i.type };
      }
      if (data.specialinput) this.pedirArchivo(data.specialinput);
      if (data.type === "exit") {
        this.pendiente = null;
        this.agregarLinea([{ style: "note", text: "[Fin de la partida. Recarga la página para volver a jugar.]" }]);
      }
      this.actualizarEntrada();
    }

    // --- Dibujo ---
    contenido(c) {
      const w = this.ventanas[c.id];
      if (!w) return;
      if (w.type === "grid") {
        // Barra de estado (ubicación, puntaje, turnos)
        if (c.lines) c.lines.forEach(l => {
          if (l.line === 0) this.estado.textContent = this.plano(l.content || []).replace(/\s+$/, "");
        });
        return;
      }
      if (c.clear) this.texto.innerHTML = "";
      (c.text || []).forEach(p => {
        const partes = this.partes(p.content || []);
        if (p.append && this.texto.lastElementChild) this.pintar(this.texto.lastElementChild, partes);
        else this.agregarLinea(partes);
      });
      this.texto.scrollTop = this.texto.scrollHeight;
    }
    partes(content) {
      const out = [];
      for (let i = 0; i < content.length; i++) {
        if (typeof content[i] === "string") { out.push({ style: content[i], text: content[i + 1] }); i++; }
        else out.push(content[i]);
      }
      return out;
    }
    plano(content) { return this.partes(content).map(p => p.text).join(""); }
    agregarLinea(partes) {
      const div = document.createElement("div");
      div.className = "linea";
      this.pintar(div, partes);
      this.texto.appendChild(div);
      this.texto.scrollTop = this.texto.scrollHeight;
    }
    pintar(div, partes) {
      partes.forEach(p => {
        const s = document.createElement("span");
        s.className = "s-" + (p.style || "normal");
        s.textContent = p.text;
        div.appendChild(s);
      });
    }

    // --- Entrada ---
    actualizarEntrada() {
      const linea = this.pendiente && this.pendiente.type === "line";
      this.input.disabled = !linea;
      this.form.classList.toggle("tecla", !!(this.pendiente && this.pendiente.type === "char"));
      if (linea) this.input.focus();
    }
    enviarLinea() {
      if (!this.pendiente || this.pendiente.type !== "line") return;
      const v = this.input.value;
      if (v.trim()) { this.historial.push(v); }
      this.posHist = this.historial.length;
      this.input.value = "";
      const id = this.pendiente.id;
      this.pendiente = null;
      this.enviar({ type: "line", gen: this.generation, window: id, value: v });
    }
    teclaLinea(e) {
      if (e.key === "ArrowUp" && this.posHist > 0) { this.input.value = this.historial[--this.posHist]; e.preventDefault(); }
      if (e.key === "ArrowDown") {
        this.posHist = Math.min(this.historial.length, this.posHist + 1);
        this.input.value = this.historial[this.posHist] || ""; e.preventDefault();
      }
    }
    teclaChar(e) {
      if (!this.pendiente || this.pendiente.type !== "char") return;
      const especiales = { Enter: "return", Backspace: "delete", Escape: "escape", Tab: "tab",
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
      const v = especiales[e.key] || (e.key.length === 1 ? e.key : null);
      if (!v) return;
      e.preventDefault();
      const id = this.pendiente.id;
      this.pendiente = null;
      this.actualizarEntrada();
      this.enviar({ type: "char", gen: this.generation, window: id, value: v });
    }

    // Pide nombre de archivo para SAVE / RESTORE
    pedirArchivo(si) {
      if (si.type !== "fileref_prompt") return;
      const leer = si.filemode === "read";
      const caja = document.getElementById("dialogo");
      const campo = caja.querySelector("input");
      caja.querySelector("p").textContent = leer ? "¿Qué partida quieres cargar?" : "Nombre para guardar la partida:";
      campo.value = "partida";
      caja.hidden = false;
      campo.focus(); campo.select();
      const responder = nombre => {
        caja.hidden = true;
        caja.onsubmit = null; caja.querySelector(".cancelar").onclick = null;
        const ref = nombre ? Dialog.file_construct_ref(Dialog.file_clean_fixed_name(nombre), si.filetype, si.gameid) : null;
        this.enviar({ type: "specialresponse", gen: this.generation, response: "fileref_prompt", value: ref });
      };
      caja.onsubmit = e => { e.preventDefault(); responder(campo.value.trim()); };
      caja.querySelector(".cancelar").onclick = () => responder(null);
    }

    enviar(ev) { setTimeout(() => this.interface.accept(ev), 0); }
    medidas() {
      const cols = 80;
      return { width: cols, height: 25, buffercharwidth: 1, buffercharheight: 1, buffermarginx: 0, buffermarginy: 0,
        gridcharwidth: 1, gridcharheight: 1, gridmarginx: 0, gridmarginy: 0, graphicsmarginx: 0, graphicsmarginy: 0,
        inspacingx: 0, inspacingy: 0, outspacingx: 0, outspacingy: 0 };
    }
  }

  // ---------- Arranque ----------
  window.iniciarAventura = async function (urlHistoria, el) {
    const r = await fetch(urlHistoria);
    if (!r.ok) throw new Error("No se pudo cargar " + urlHistoria);
    const datos = new Uint8Array(await r.arrayBuffer());
    const vm = new ZVM();
    const opciones = { vm, Glk, GlkOte: new WebGlkOte(el), Dialog };
    vm.prepare(datos, opciones);
    Glk.init(opciones);
  };
})();

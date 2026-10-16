
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let marcador = 0;
const TOTAL_OBJETOS = 25;

let objetos = [];
let particulas = [];
let textosFlotantes = [];

// ========================================
// 1. AUDIO ESPACIAL CON WEB AUDIO API
// ========================================

let audioContext = null;

function obtenerAudioContext() {
  if (!audioContext) {
    const AudioClass = window.AudioContext || window.webkitAudioContext;

    if (AudioClass) {
      audioContext = new AudioClass();
    }
  }

  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function crearTono(tipo, frecuenciaInicial, frecuenciaFinal, duracion, volumenMax) {
  const audio = obtenerAudioContext();

  if (!audio) return;

  const ahora = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = tipo;

  osc.frequency.setValueAtTime(frecuenciaInicial, ahora);
  osc.frequency.exponentialRampToValueAtTime(
    frecuenciaFinal,
    ahora + duracion
  );

  gain.gain.setValueAtTime(0.0001, ahora);
  gain.gain.exponentialRampToValueAtTime(
    volumenMax,
    ahora + 0.015
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ahora + duracion
  );

  osc.connect(gain);
  gain.connect(audio.destination);

  osc.start(ahora);
  osc.stop(ahora + duracion + 0.01);
}

function sonidoLaser() {
  crearTono("sawtooth", 900, 140, 0.14, 0.16);
}

function sonidoExplosion() {
  crearTono("triangle", 125, 38, 0.34, 0.25);
}

// ========================================
// 2. ESTRELLAS CON EFECTO PARALLAX
// ========================================

const estrellas = Array.from({ length: 125 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radio: Math.random() * 1.5 + 0.35,
  velocidad: Math.random() * 0.55 + 0.12,
  fase: Math.random() * Math.PI * 2,
  brillo: Math.random() * 0.55 + 0.35
}));

function dibujarEstrellas(context) {
  estrellas.forEach(e => {
    e.y += e.velocidad;

    if (e.y > canvas.height) {
      e.y = 0;
      e.x = Math.random() * canvas.width;
    }

    e.fase += 0.035;

    context.save();

    context.globalAlpha =
      e.brillo * (0.65 + Math.sin(e.fase) * 0.35);

    context.fillStyle = "#d9faff";
    context.shadowColor = "#55ddff";
    context.shadowBlur = 5;

    context.beginPath();
    context.arc(e.x, e.y, e.radio, 0, Math.PI * 2);
    context.fill();

    context.restore();
  });
}

// ========================================
// 3. DESTELLOS LÁSER DESDE LAS ESQUINAS
// ========================================

let destellosLaser = [];

function crearDestellosLaser(x, y) {
  destellosLaser = [
    [0, 0],
    [canvas.width, 0],
    [0, canvas.height],
    [canvas.width, canvas.height]
  ].map(p => ({
    x1: p[0],
    y1: p[1],
    x2: x,
    y2: y,
    vida: 1
  }));
}

function dibujarDestellosLaser(context) {
  for (let i = destellosLaser.length - 1; i >= 0; i--) {
    const r = destellosLaser[i];

    context.save();

    context.globalAlpha = r.vida;
    context.strokeStyle = "#35f5ff";
    context.shadowColor = "#35f5ff";
    context.shadowBlur = 18;
    context.lineWidth = 2.5;

    context.beginPath();
    context.moveTo(r.x1, r.y1);
    context.lineTo(r.x2, r.y2);
    context.stroke();

    context.restore();

    r.vida -= 0.12;

    if (r.vida <= 0) {
      destellosLaser.splice(i, 1);
    }
  }
}

// ========================================
// POSICIÓN DE LA MIRA
// ========================================

let mousePos = {
  x: canvas.width / 2,
  y: canvas.height / 2
};

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Capturar el movimiento del ratón
canvas.addEventListener("mousemove", event => {
  const rect = canvas.getBoundingClientRect();

  mousePos.x = event.clientX - rect.left;
  mousePos.y = event.clientY - rect.top;
});

// ========================================
// TIPOS DE CUERPOS CELESTES
// ========================================

const TIPOS_PLANETAS = [
  "SOL_AURORA",
  "SOL_AZUL",
  "GIGANTE_ANILLO",
  "ROCOSO_MAGMA",
  "HELADO_NEON",
  "TERRESTRE",
  "ROCOSO_CRATERES",
  "GIGANTE_PURPURA",
  "GALAXIA_ESPIRAL",
  "AGUJERO_NEGRO"
];

// ========================================
// TEXTO FLOTANTE DE PUNTOS
// ========================================

class TextoFlotante {
  constructor(x, y, texto, color) {
    this.x = x;
    this.y = y;
    this.texto = texto;
    this.color = color;
    this.alpha = 1;
    this.speedY = -1.5;
    this.decay = 0.025;
  }

  draw(context) {
    context.save();

    context.globalAlpha = this.alpha;
    context.fillStyle = this.color;
    context.shadowColor = this.color;
    context.shadowBlur = 10;
    context.font = "bold 22px 'Segoe UI', Roboto, sans-serif";
    context.textAlign = "center";

    context.fillText(this.texto, this.x, this.y);

    context.restore();
  }

  update(context) {
    this.y += this.speedY;
    this.alpha -= this.decay;
    this.draw(context);
  }
}

// ========================================
// PARTÍCULAS DE EXPLOSIÓN
// ========================================

class Particula {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 3 + 2;
    this.speedX = (Math.random() - 0.5) * 8;
    this.speedY = (Math.random() - 0.5) * 8;
    this.alpha = 1;
    this.decay = Math.random() * 0.03 + 0.02;
  }

  draw(context) {
    context.save();

    context.globalAlpha = this.alpha;
    context.fillStyle = this.color;
    context.shadowColor = this.color;
    context.shadowBlur = 10;

    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }

  update(context) {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= this.decay;

    this.draw(context);
  }
}

function crearExplosion(x, y, colorPers) {
  const color = colorPers || "#ffffff";
  const cantidadParticulas = 22;

  for (let i = 0; i < cantidadParticulas; i++) {
    particulas.push(new Particula(x, y, color));
  }
}

// ========================================
// CLASE DE PLANETAS Y AGUJEROS NEGROS
// ========================================

class ObjetoPlanetaGenerado {
  constructor() {
    this.reset();
  }

  reset() {
    this.radius = Math.random() * 20 + 16;

    this.posX =
      Math.random() * Math.max(1, canvas.width - this.radius * 2)
      + Math.min(this.radius, canvas.width / 2);

    this.posY = -this.radius - Math.random() * 150;

    if (this.radius < 22) {
      this.puntos = 3;
    } else if (this.radius < 28) {
      this.puntos = 2;
    } else {
      this.puntos = 1;
    }

    this.tipo =
      TIPOS_PLANETAS[
        Math.floor(Math.random() * TIPOS_PLANETAS.length)
      ];

    const velocidadBase = Math.random() * 2.5 + 3.0;
    const multiplicadorProgresivo = 1 + (marcador * 0.015);

    this.dx = (Math.random() - 0.5) * 1.8;
    this.dy = velocidadBase * multiplicadorProgresivo;
    this.gravedad = 0.22;
    this.rebote = 0.6;

    this.rotacion = Math.random() * Math.PI * 2;
    this.velocidadRotacion = (Math.random() - 0.5) * 0.04;

    this.hueAleatorio = Math.floor(Math.random() * 360);
    this.colorGlow = `hsl(${this.hueAleatorio}, 100%, 50%)`;
    this.colorCentro = `hsl(${this.hueAleatorio}, 100%, 75%)`;
  }

  draw(context) {
    context.save();
    context.translate(this.posX, this.posY);

    switch (this.tipo) {
      case "SOL_AURORA":
        this.dibujarSol(context, "#ff7700", "#ffdd00", "#ff5500");
        break;

      case "SOL_AZUL":
        this.dibujarSol(context, "#00d2ff", "#ffffff", "#0055ff");
        break;

      case "GIGANTE_ANILLO":
        this.dibujarPlanetaConAnillos(context);
        break;

      case "ROCOSO_MAGMA":
        this.dibujarPlanetaMagma(context);
        break;

      case "HELADO_NEON":
        this.dibujarPlanetaHelado(context);
        break;

      case "TERRESTRE":
        this.dibujarPlanetaTerrestre(context);
        break;

      case "ROCOSO_CRATERES":
        this.dibujarPlanetaRocoso(context);
        break;

      case "GIGANTE_PURPURA":
        this.dibujarGigantePurpura(context);
        break;

      case "GALAXIA_ESPIRAL":
        this.dibujarGalaxia(context);
        break;

      case "AGUJERO_NEGRO":
        this.dibujarAgujeroNegro(context);
        break;
    }

    context.restore();
  }

  dibujarSol(ctx, colorGlow, colorCentro, colorBorde) {
    ctx.save();

    ctx.shadowColor = colorGlow;
    ctx.shadowBlur = 25;

    const grad = ctx.createRadialGradient(
      0, 0, this.radius * 0.1,
      0, 0, this.radius
    );

    grad.addColorStop(0, colorCentro);
    grad.addColorStop(0.7, colorGlow);
    grad.addColorStop(1, colorBorde);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colorCentro;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  dibujarPlanetaConAnillos(ctx) {
    ctx.save();
    ctx.rotate(Math.PI / 7);

    ctx.beginPath();
    ctx.ellipse(
      0, 0,
      this.radius * 2,
      this.radius * 0.45,
      0, Math.PI, Math.PI * 2
    );

    ctx.strokeStyle = "rgba(255, 215, 0, 0.85)";
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    const grad = ctx.createRadialGradient(
      -this.radius * 0.3,
      -this.radius * 0.3,
      this.radius * 0.1,
      0, 0, this.radius
    );

    grad.addColorStop(0, "#ffe082");
    grad.addColorStop(0.7, "#ff8f00");
    grad.addColorStop(1, "#3e2723");

    ctx.fillStyle = grad;
    ctx.shadowColor = "#ffab00";
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(
      0, 0,
      this.radius * 2,
      this.radius * 0.45,
      0, 0, Math.PI
    );

    ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
    ctx.stroke();

    ctx.restore();
  }

  dibujarPlanetaMagma(ctx) {
    ctx.save();

    ctx.shadowColor = "#ff3d00";
    ctx.shadowBlur = 18;

    const grad = ctx.createRadialGradient(
      -this.radius * 0.2,
      -this.radius * 0.2,
      this.radius * 0.1,
      0, 0, this.radius
    );

    grad.addColorStop(0, "#ff9100");
    grad.addColorStop(0.6, "#dd2c00");
    grad.addColorStop(1, "#212121");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ff6d00";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  dibujarPlanetaHelado(ctx) {
    ctx.save();

    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 20;

    const grad = ctx.createRadialGradient(
      -this.radius * 0.3,
      -this.radius * 0.3,
      this.radius * 0.1,
      0, 0, this.radius
    );

    grad.addColorStop(0, "#e0f7fa");
    grad.addColorStop(0.5, "#00b0ff");
    grad.addColorStop(1, "#01579b");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#80d8ff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  dibujarPlanetaTerrestre(ctx) {
    ctx.save();

    ctx.shadowColor = "#00e676";
    ctx.shadowBlur = 15;

    const grad = ctx.createRadialGradient(
      -this.radius * 0.3,
      -this.radius * 0.3,
      this.radius * 0.1,
      0, 0, this.radius
    );

    grad.addColorStop(0, "#80e27e");
    grad.addColorStop(0.5, "#0091ea");
    grad.addColorStop(1, "#002171");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#69f0ae";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  }

  dibujarPlanetaRocoso(ctx) {
    ctx.save();

    ctx.shadowColor = "#b0bec5";
    ctx.shadowBlur = 12;

    const grad = ctx.createRadialGradient(
      -this.radius * 0.3,
      -this.radius * 0.3,
      this.radius * 0.1,
      0, 0, this.radius
    );

    grad.addColorStop(0, "#eceff1");
    grad.addColorStop(0.7, "#78909c");
    grad.addColorStop(1, "#263238");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();

    ctx.arc(
      -this.radius * 0.3,
      -this.radius * 0.2,
      this.radius * 0.22,
      0, Math.PI * 2
    );

    ctx.arc(
      this.radius * 0.3,
      this.radius * 0.3,
      this.radius * 0.28,
      0, Math.PI * 2
    );

    ctx.arc(
      -this.radius * 0.1,
      this.radius * 0.4,
      this.radius * 0.16,
      0, Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#cfd8dc";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  dibujarGigantePurpura(ctx) {
    ctx.save();

    ctx.shadowColor = "#e040fb";
    ctx.shadowBlur = 20;

    const grad = ctx.createRadialGradient(
      -this.radius * 0.3,
      -this.radius * 0.3,
      this.radius * 0.1,
      0, 0, this.radius
    );

    grad.addColorStop(0, "#f3e5f5");
    grad.addColorStop(0.5, "#aa00ff");
    grad.addColorStop(1, "#311b92");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ea80fc";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  dibujarGalaxia(ctx) {
    ctx.save();
    ctx.rotate(this.rotacion);

    ctx.shadowColor = this.colorGlow;
    ctx.shadowBlur = 22;
    ctx.strokeStyle = this.colorGlow;
    ctx.lineWidth = 2.5;

    for (let brazo = 0; brazo < 2; brazo++) {
      ctx.beginPath();

      const offsetBrazo = brazo * Math.PI;

      for (let a = 0; a < Math.PI * 2.5; a += 0.1) {
        const r = (this.radius / (Math.PI * 2.5)) * a;
        const x = Math.cos(a + offsetBrazo) * r;
        const y = Math.sin(a + offsetBrazo) * r;

        if (a === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    const grad = ctx.createRadialGradient(
      0, 0, 0,
      0, 0, this.radius * 0.4
    );

    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.5, this.colorGlow);
    grad.addColorStop(1, "transparent");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  dibujarAgujeroNegro(ctx) {
    ctx.save();
    ctx.rotate(this.rotacion);

    ctx.shadowColor = this.colorGlow;
    ctx.shadowBlur = 25;

    const discoGrad = ctx.createRadialGradient(
      0, 0, this.radius * 0.4,
      0, 0, this.radius * 1.5
    );

    discoGrad.addColorStop(0, "#ffffff");
    discoGrad.addColorStop(0.4, this.colorGlow);

    discoGrad.addColorStop(
      0.8,
      `hsl(${(this.hueAleatorio + 60) % 360}, 100%, 40%)`
    );

    discoGrad.addColorStop(1, "transparent");

    ctx.fillStyle = discoGrad;
    ctx.beginPath();

    ctx.ellipse(
      0, 0,
      this.radius * 1.5,
      this.radius * 0.6,
      0, 0, Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#000000";

    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.colorCentro;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  update(context) {
    this.dy += this.gravedad;
    this.posX += this.dx;
    this.posY += this.dy;
    this.rotacion += this.velocidadRotacion;

    if (this.posY + this.radius >= canvas.height) {
      this.posY = canvas.height - this.radius;
      this.dy = -this.dy * this.rebote;

      if (Math.abs(this.dy) < 1.8) {
        this.reset();
      }
    }

    if (
      this.posX - this.radius <= 0 ||
      this.posX + this.radius >= canvas.width
    ) {
      this.dx = -this.dx;
    }

    this.draw(context);
  }

  fueClickeado(mouseX, mouseY) {
    const dx = mouseX - this.posX;
    const dy = mouseY - this.posY;
    const distancia = Math.sqrt(dx * dx + dy * dy);

    return distancia <= this.radius * 1.3;
  }

  obtenerColorExplosion() {
    if (
      this.tipo === "GALAXIA_ESPIRAL" ||
      this.tipo === "AGUJERO_NEGRO"
    ) {
      return this.colorGlow;
    }

    const colores = {
      SOL_AURORA: "#ffaa00",
      SOL_AZUL: "#00d2ff",
      GIGANTE_ANILLO: "#ffd700",
      ROCOSO_MAGMA: "#ff3d00",
      HELADO_NEON: "#00e5ff",
      TERRESTRE: "#00e676",
      ROCOSO_CRATERES: "#eceff1",
      GIGANTE_PURPURA: "#e040fb"
    };

    return colores[this.tipo] || "#ffffff";
  }
}

// ========================================
// MIRA TELESCÓPICA NEÓN
// ========================================

function dibujarMira(context) {
  context.save();
  context.translate(mousePos.x, mousePos.y);

  const radioMira = 18;
  const largoLinea = 12;
  const colorMira = "#ff2a2a";

  context.strokeStyle = colorMira;
  context.fillStyle = colorMira;
  context.shadowColor = colorMira;
  context.shadowBlur = 12;
  context.lineWidth = 2;

  context.beginPath();
  context.arc(0, 0, radioMira, 0, Math.PI * 2);
  context.stroke();

  context.beginPath();
  context.arc(0, 0, 3.5, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.moveTo(0, -radioMira - 4);
  context.lineTo(0, -radioMira - largoLinea);
  context.stroke();

  context.beginPath();
  context.moveTo(0, radioMira + 4);
  context.lineTo(0, radioMira + largoLinea);
  context.stroke();

  context.beginPath();
  context.moveTo(-radioMira - 4, 0);
  context.lineTo(-radioMira - largoLinea, 0);
  context.stroke();

  context.beginPath();
  context.moveTo(radioMira + 4, 0);
  context.lineTo(radioMira + largoLinea, 0);
  context.stroke();

  context.restore();
}

// ========================================
// GENERAR LOS 25 OBJETOS
// ========================================

function generateObjects() {
  objetos = [];

  for (let i = 0; i < TOTAL_OBJETOS; i++) {
    objetos.push(new ObjetoPlanetaGenerado());
  }
}

// ========================================
// 4. MARCADOR FUTURISTA TIPO HUD
// ========================================

function drawCounter(context) {
  context.save();

  const ancho = 220;
  const alto = 62;
  const x = canvas.width - ancho - 22;
  const y = 20;

  context.shadowColor = "#00eaff";
  context.shadowBlur = 18;

  context.fillStyle = "rgba(4, 18, 38, 0.68)";
  context.strokeStyle = "rgba(0, 238, 255, 0.85)";
  context.lineWidth = 1.5;

  context.beginPath();
  context.roundRect(x, y, ancho, alto, 12);
  context.fill();
  context.stroke();

  context.shadowBlur = 0;
  context.textAlign = "right";
  context.textBaseline = "middle";

  context.fillStyle = "#8afaff";
  context.font = "600 11px Orbitron, sans-serif";
  context.fillText("PUNTUACIÓN", x + ancho - 17, y + 18);

  context.fillStyle = "#ffffff";
  context.shadowColor = "#00f0ff";
  context.shadowBlur = 12;
  context.font = "800 23px Orbitron, sans-serif";

  context.fillText(
    String(marcador).padStart(4, "0"),
    x + ancho - 17,
    y + 43
  );

  context.restore();
}

// ========================================
// BUCLE PRINCIPAL DE ANIMACIÓN
// ========================================

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Estrellas del espacio
  dibujarEstrellas(ctx);

  // 2. Dibujar planetas y agujeros negros
  objetos.forEach(obj => obj.update(ctx));

  // 3. Partículas de explosión
  for (let i = particulas.length - 1; i >= 0; i--) {
    particulas[i].update(ctx);

    if (particulas[i].alpha <= 0) {
      particulas.splice(i, 1);
    }
  }

  // 4. Textos flotantes de puntuación
  for (let i = textosFlotantes.length - 1; i >= 0; i--) {
    textosFlotantes[i].update(ctx);

    if (textosFlotantes[i].alpha <= 0) {
      textosFlotantes.splice(i, 1);
    }
  }

  // 5. Destellos láser
  dibujarDestellosLaser(ctx);

  // 6. Marcador futurista
  drawCounter(ctx);

  // 7. Mira telescópica
  dibujarMira(ctx);

  requestAnimationFrame(animate);
}

// ========================================
// EVENTO DE DISPARO CON EL RATÓN
// ========================================

canvas.addEventListener("click", event => {
  const rect = canvas.getBoundingClientRect();

  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // Sonido de disparo
  sonidoLaser();

  // Destellos desde las cuatro esquinas
  crearDestellosLaser(mouseX, mouseY);

  // Comprobar si se hizo clic sobre un objeto
  for (let i = objetos.length - 1; i >= 0; i--) {
    if (objetos[i].fueClickeado(mouseX, mouseY)) {
      const colorExp = objetos[i].obtenerColorExplosion();
      const puntosObtenidos = objetos[i].puntos;

      // Crear explosión visual
      crearExplosion(
        objetos[i].posX,
        objetos[i].posY,
        colorExp
      );

      // Sonido grave de explosión
      sonidoExplosion();

      // Mostrar puntos obtenidos
      textosFlotantes.push(
        new TextoFlotante(
          objetos[i].posX,
          objetos[i].posY,
          `+${puntosObtenidos}`,
          colorExp
        )
      );

      // Sumar puntos
      marcador += puntosObtenidos;

      // Generar otro objeto
      objetos[i].reset();

      break;
    }
  }
});

// ========================================
// INICIAR EL JUEGO
// ========================================

generateObjects();
animate();

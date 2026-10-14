const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const window_height = window.innerHeight;
const window_width = window.innerWidth;

canvas.height = window_height;
canvas.width = window_width;
canvas.style.background = "rgb(255, 255, 255)";

class Circle {
  constructor(x, y, radius, color, text, speed) {
    this.posX = x;
    this.posY = y;
    this.radius = radius;
    this.color = color;
    this.originalColor = color;
    this.text = text;
    this.speed = speed;
    
    this.dx = (Math.random() < 0.5 ? -1 : 1) * this.speed;
    this.dy = (Math.random() < 0.5 ? -1 : 1) * this.speed;

    // Contador para mantener el flash azul activo durante unos cuadros
    this.flashFrames = 0;
  }

  draw(context) {
    context.beginPath();
    context.strokeStyle = this.color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "20px Arial";
    context.fillText(this.text, this.posX, this.posY);
    context.lineWidth = 2;
    context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2, false);
    context.stroke();
    context.closePath();
  }

  update(context) {
    // Si tiene cuadros de flash pendientes, se pinta de azul
    if (this.flashFrames > 0) {
      this.color = "#0000FF";
      this.flashFrames--;
    } else {
      this.color = this.originalColor;
    }

    this.draw(context);

    // Actualizar posición X
    this.posX += this.dx;
    if (this.posX + this.radius > window_width || this.posX - this.radius < 0) {
      this.dx = -this.dx;
    }

    // Actualizar posición Y
    this.posY += this.dy;
    if (this.posY + this.radius > window_height || this.posY - this.radius < 0) {
      this.dy = -this.dy;
    }
  }

  isCollidingWith(otherCircle) {
    const dx = this.posX - otherCircle.posX;
    const dy = this.posY - otherCircle.posY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= (this.radius + otherCircle.radius);
  }

  bounceWith(otherCircle) {
    // Activar el flash por 8 cuadros de animación
    this.flashFrames = 8;
    otherCircle.flashFrames = 8;

    // Invertir direcciones
    this.dx = -this.dx;
    this.dy = -this.dy;
    otherCircle.dx = -otherCircle.dx;
    otherCircle.dy = -otherCircle.dy;

    // Separación física para evitar que se solapen
    const dx = otherCircle.posX - this.posX;
    const dy = otherCircle.posY - this.posY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const overlap = (this.radius + otherCircle.radius) - distance;

    if (distance > 0 && overlap > 0) {
      const separateX = (dx / distance) * (overlap / 2);
      const separateY = (dy / distance) * (overlap / 2);

      this.posX -= separateX;
      this.posY -= separateY;
      otherCircle.posX += separateX;
      otherCircle.posY += separateY;
    }
  }
}

let circles = [];

// Función para generar colores RGB excluyendo tonos azules
function getRandomNonBlueColor() {
  let r, g, b;
  do {
    r = Math.floor(Math.random() * 200); // Evitar tonos extremadamente claros/blancos
    g = Math.floor(Math.random() * 200);
    b = Math.floor(Math.random() * 100); // Limitar el canal azul a un valor bajo
  } while (b > r && b > g); // Asegurar que el azul nunca predomine

  return `rgb(${r}, ${g}, ${b})`;
}

function generateCircles(n) {
  circles = [];
  for (let i = 0; i < n; i++) {
    let radius = Math.random() * 20 + 20;
    let x = Math.random() * (window_width - radius * 2) + radius;
    let y = Math.random() * (window_height - radius * 2) + radius;
    let color = getRandomNonBlueColor(); // Color generado sin tonalidades de azul
    let speed = Math.random() * 1.5 + 0.5; // Velocidad reducida entre 0.5 y 2.0
    let text = `C${i + 1}`;

    let newCircle = new Circle(x, y, radius, color, text, speed);

    if (i !== 0) {
      for (let j = 0; j < circles.length; j++) {
        if (newCircle.isCollidingWith(circles[j])) {
          x = Math.random() * (window_width - radius * 2) + radius;
          y = Math.random() * (window_height - radius * 2) + radius;
          newCircle.posX = x;
          newCircle.posY = y;
          j = -1;
        }
      }
    }

    circles.push(newCircle);
  }
}

function animate() {
  ctx.clearRect(0, 0, window_width, window_height);

  // Evaluar colisiones
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      if (circles[i].isCollidingWith(circles[j])) {
        circles[i].bounceWith(circles[j]);
      }
    }
  }

  // Dibujar y actualizar la posición de cada círculo
  circles.forEach(circle => {
    circle.update(ctx);
  });

  requestAnimationFrame(animate);
}

generateCircles(20);
animate();
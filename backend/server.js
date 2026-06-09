const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta absoluta al archivo de datos
const archivoAspirantes = path.join(__dirname, "data", "aspirantes.json");

// Garantizar que backend/data/ y aspirantes.json existen al arrancar
// (el archivo está en .gitignore, así que no existe tras un git clone)
const dirData = path.dirname(archivoAspirantes);
if (!fs.existsSync(dirData)) fs.mkdirSync(dirData, { recursive: true });
if (!fs.existsSync(archivoAspirantes)) fs.writeFileSync(archivoAspirantes, "[]", "utf-8");

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// Servir el frontend desde la raíz del proyecto (index.html está en /, no en /frontend)
app.use(express.static(path.join(__dirname, "..")));

// Ruta principal explícita
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// ── API LOGIN ──────────────────────────────────────────────────────────────────

app.post("/api/login", (req, res) => {
  const { usuario, password } = req.body;

  if (usuario === "admin" && password === "12345") {
    return res.json({ message: "Login correcto", autorizado: true });
  }

  res.status(401).json({ message: "Usuario o contraseña incorrectos", autorizado: false });
});

// ── API ASPIRANTES ─────────────────────────────────────────────────────────────

// Leer lista completa
app.get("/api/aspirantes", (req, res) => {
  try {
    if (!fs.existsSync(archivoAspirantes)) return res.json([]);
    const contenido = fs.readFileSync(archivoAspirantes, "utf-8");
    res.json(JSON.parse(contenido));
  } catch {
    res.status(500).json({ message: "Error al cargar aspirantes" });
  }
});

// Crear aspirante
app.post("/api/aspirantes", (req, res) => {
  const data = req.body;

  const camposObligatorios = ["nombre", "edad", "telefono", "email", "descripcion"];
  const faltanCampos = camposObligatorios.some(campo => !data[campo] || data[campo].trim() === "");

  if (faltanCampos) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  if (parseInt(data.edad, 10) < 18) {
    return res.status(422).json({ message: "Debes tener al menos 18 años." });
  }

  let aspirantes = [];

  if (fs.existsSync(archivoAspirantes)) {
    try {
      aspirantes = JSON.parse(fs.readFileSync(archivoAspirantes, "utf-8"));
    } catch {
      return res.status(500).json({ message: "Error al leer los datos" });
    }
  }

  const emailNormalizado = data.email.trim().toLowerCase();
  const telefonoNormalizado = data.telefono.trim();

  if (aspirantes.some(a => a.email.toLowerCase() === emailNormalizado)) {
    return res.status(400).json({ message: "Correo ya registrado" });
  }

  if (aspirantes.some(a => a.telefono === telefonoNormalizado)) {
    return res.status(400).json({ message: "Teléfono ya registrado" });
  }

  const fechaActual = new Date().toISOString();

  const nuevoRegistro = {
    ...data,
    email: emailNormalizado,
    telefono: telefonoNormalizado,
    estado: "Nuevo",
    timestamp: fechaActual,
    id: aspirantes.length + 1,
    historialEstados: [
      { estado: "Nuevo", fecha: fechaActual, nota: "Solicitud registrada" }
    ]
  };

  aspirantes.push(nuevoRegistro);
  fs.writeFileSync(archivoAspirantes, JSON.stringify(aspirantes, null, 2));

  res.json({ message: "Solicitud guardada" });
});

// Actualizar estado
app.put("/api/aspirantes/:id/estado", (req, res) => {
  const id = Number(req.params.id);
  const { estado } = req.body;

  const estadosPermitidos = ["Nuevo", "Contactado", "En proceso", "Aprobado", "Rechazado"];

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({ message: "Estado inválido" });
  }

  const aspirantes = JSON.parse(fs.readFileSync(archivoAspirantes, "utf-8"));
  const aspirante = aspirantes.find(a => a.id === id);

  if (!aspirante) return res.status(404).json({ message: "Aspirante no encontrado" });

  aspirante.estado = estado;

  if (!aspirante.historialEstados) aspirante.historialEstados = [];

  aspirante.historialEstados.push({
    estado,
    fecha: new Date().toISOString(),
    nota: "Estado actualizado desde el panel"
  });

  fs.writeFileSync(archivoAspirantes, JSON.stringify(aspirantes, null, 2));

  res.json({ message: "Estado actualizado" });
});

// Eliminar aspirante
app.delete("/api/aspirantes/:id", (req, res) => {
  const id = Number(req.params.id);

  const aspirantes = JSON.parse(fs.readFileSync(archivoAspirantes, "utf-8"));
  const nuevos = aspirantes.filter(a => a.id !== id);

  fs.writeFileSync(archivoAspirantes, JSON.stringify(nuevos, null, 2));

  res.json({ message: "Eliminado" });
});

// ── ARRANQUE ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

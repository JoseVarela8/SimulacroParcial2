const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generar una clave secreta aleatoria de 32 bytes (256 bits)

const app = express();
const secretKey = crypto.randomBytes(32).toString('hex');

app.use(bodyParser.json());



const personas = [];
const empresas = [];

const usuarios = [];

// ---------------------------------------------------------------------------------------------
// MIDDLEWARE DE AUTENTICACIÓN
// ---------------------------------------------------------------------------------------------
const authenticate = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Acceso no autorizado' });

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};


// ---------------------------------------------------------------------------------------------
// USUARIOS
// ---------------------------------------------------------------------------------------------

// Función para registrar un nuevo usuario
function registrarUsuario(nuevoUsuario) {
    usuarios.push(nuevoUsuario);
}

// Función para encontrar un usuario por su nombre de usuario y contraseña
function encontrarUsuario(username, password) {
    return usuarios.find(user => user.username === username && user.password === password);
}

// Ruta para el registro de usuarios
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    // Verificar si el usuario ya existe
    if (usuarios.find(user => user.username === username)) {
        return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Registrar al nuevo usuario
    const nuevoUsuario = { username, password };
    registrarUsuario(nuevoUsuario);

    // Emitir un token JWT
    const token = jwt.sign({ username }, secretKey);
    res.json({ message: 'Registro exitoso', token });
});

// Ruta para el login de usuarios
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
  
    // Verificar las credenciales del usuario
    const usuario = encontrarUsuario(username, password);
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
  
    // Emitir un token JWT
    const token = jwt.sign({ username }, secretKey);
    res.json({ message: 'Login exitoso', token });
  });


// ---------------------------------------------------------------------------------------------
// PERSONAS
// ---------------------------------------------------------------------------------------------

// Función para agregar una persona
function agregarPersona(nuevaPersona) {
    personas.push(nuevaPersona);
}
// Agregar una persona
app.post('/api/personas', authenticate, (req, res) => {
    const nuevaPersona = req.body; // Se espera que la solicitud incluya los datos de la persona en el cuerpo (body)
    agregarPersona(nuevaPersona);
    res.json({ message: 'Persona agregada correctamente' });
});

// Función para eliminar una persona por su ID
function eliminarPersona(idPersona) {
    const indice = personas.findIndex(persona => persona.id === idPersona);
    if (indice !== -1) {
        personas.splice(indice, 1);
        return true; // Éxito al eliminar
    }
    return false; // La persona no fue encontrada
}
// Eliminar una persona por su ID
app.delete('/api/personas/:id', authenticate, (req, res) => {
    const idPersonaAEliminar = parseInt(req.params.id);
    const eliminacionExitosa = eliminarPersona(idPersonaAEliminar);
    if (eliminacionExitosa) {
        res.json({ message: `Persona con ID ${idPersonaAEliminar} eliminada correctamente` });
    } else {
        res.status(404).json({ message: `No se encontró la persona con ID ${idPersonaAEliminar}` });
    }
});

// Función para obtener todas las personas
function obtenerTodasLasPersonas() {
    return personas;
}
// Obtener todas las personas
app.get('/api/personas', authenticate, (req, res) => {
    const todasLasPersonas = obtenerTodasLasPersonas();
    res.json(todasLasPersonas);
});

// Ver los datos de una persona por su ID
app.get('/api/personas/:id', authenticate, (req, res) => {
    const idPersona = parseInt(req.params.id);
    const personaEncontrada = personas.find(persona => persona.id === idPersona);
    if (personaEncontrada) {
        res.json(personaEncontrada);
    } else {
        res.status(404).json({ message: `No se encontró la persona con ID ${idPersona}` });
    }
});


// ---------------------------------------------------------------------------------------------
// EMPRESAS
// ---------------------------------------------------------------------------------------------

// Función para agregar una empresa
function agregarEmpresa(nuevaEmpresa) {
    empresas.push(nuevaEmpresa);
}
// Agregar una empresa
app.post('/api/empresas', authenticate, (req, res) => {
    const nuevaEmpresa = req.body; // Se espera que la solicitud incluya los datos de la empresa en el cuerpo (body)
    agregarEmpresa(nuevaEmpresa);
    res.json({ message: 'Empresa agregada correctamente' });
});


// Función para eliminar una empresa por su ID
function eliminarEmpresa(idEmpresa) {
    const indice = empresas.findIndex(empresa => empresa.id === idEmpresa);
    if (indice !== -1) {
        const empresa = empresas[indice];
        const personaEncontrada = personas.find(persona => persona.empresa === empresa);
        if (personaEncontrada){
            empresas.splice(indice, 1);
            return 1; // Éxito al eliminar
        } else {
            return 2; //la empresa tiene personas
        }
    }
    return 3; // La empresa no fue encontrada
}

// Eliminar una empresa por su ID
app.delete('/api/empresas/:id', authenticate, (req, res) => {
    const idEmpresaAEliminar = parseInt(req.params.id);
    const eliminacionExitosa = eliminarEmpresa(idEmpresaAEliminar);
    if (eliminacionExitosa==3) {
        res.json({ message: `Empresa con ID ${idEmpresaAEliminar} eliminada correctamente` });
    } else {
        if (eliminacionExitosa == 2){
            res.status(404).json({ message: `La empresa con ID ${idEmpresaAEliminar} tiene personas todavia` });
        } else {
            res.status(404).json({ message: `No se encontró la empresa con ID ${idEmpresaAEliminar}` }); 
        } 
    }
});

// Función para obtener todas las empresas
function obtenerTodasLasEmpresas() {
    return empresas;
}
// Obtener todas las empresas
app.get('/api/empresas', authenticate, (req, res) => {
    const todasLasEmpresas = obtenerTodasLasEmpresas();
    res.json(todasLasEmpresas);
});

// Ver los datos de una empresa por su ID
app.get('/api/empresas/:id', authenticate,(req, res) => {
    const idEmpresa = parseInt(req.params.id);
    const empresaEncontrada = empresas.find(empresa => empresa.id === idEmpresa);
    if (empresaEncontrada) {
        res.json(empresaEncontrada);
    } else {
        res.status(404).json({ message: `No se encontró la empresa con ID ${idEmpresa}` });
    }
});



// Estructura básica de una persona
// Puedes ajustar esto según tus necesidades
class Persona {
    constructor(id, nombres, apellidos, email, telefono, empresa, notas) {
        this.id = id;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.email = email;
        this.telefono = telefono;
        this.empresa = empresa;
        this.notas = notas;
    }
}

// Estructura básica de una empresa
// Puedes ajustar esto según tus necesidades
class Empresa {
    constructor(id, nombre, sitioWeb, notas) {
        this.id = id;
        this.nombre = nombre;
        this.sitioWeb = sitioWeb;
        this.notas = notas;
    }
}

// Ejemplo de uso de las funciones y clases
const nuevaPersona = new Persona(1, 'Juan', 'Pérez', 'juan@email.com', '123456789', 'Empresa1', 'Notas...');
agregarPersona(nuevaPersona);

const nuevaEmpresa = new Empresa(1, 'Empresa1', 'http://empresa1.com', 'Notas...');
agregarEmpresa(nuevaEmpresa);

console.log(obtenerTodasLasPersonas());
console.log(obtenerTodasLasEmpresas());


/*
const idPersonaAEliminar = 1;
if (eliminarPersona(idPersonaAEliminar)) {
    console.log(`Persona con ID ${idPersonaAEliminar} eliminada correctamente`);
} else {
    console.log(`No se encontró la persona con ID ${idPersonaAEliminar}`);
}

const idEmpresaAEliminar = 1;
if (eliminarEmpresa(idEmpresaAEliminar)) {
    console.log(`Empresa con ID ${idEmpresaAEliminar} eliminada correctamente`);
} else {
    console.log(`No se encontró la empresa con ID ${idEmpresaAEliminar}`);
}

console.log(obtenerTodasLasPersonas());
console.log(obtenerTodasLasEmpresas());
*/


// ---------------------------------------------------------------------------------------------

// RUTAS PROTEGIDAS
app.use('/api', authenticate);
// Ruta protegida (ejemplo)
app.get('/api/protegida', authenticate, (req, res) => {
    res.json({ message: 'Ruta protegida, usuario autenticado' });
  });


// INICIA EL SERVIDOR
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});

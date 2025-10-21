const express = require('express');
const app = express()
const cors = require("cors");
const cookieParser = require('cookie-parser');
require('dotenv').config();


//*Puerto Servidor
const puerto = process.env.PUERTO || 3000;

//* Configuración de Seguridad Mejorada
const corsOptions = {
    origin: process.env.ORIGENES_PERMITIDOS?.split(',') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

//*middlewares 
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Aumentado para soportar archivos
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//*Ruta Principal
app.get("/", (req, res) => {
    console.log("Corriento")
    res.send("Hola mundo")
})

//*Rutas
app.use("/api/auth", require("./modulos/auth/auth.routes"))


//* Inicio del Servidor
app.listen(puerto, () => {
    console.log(`Servidor ejecutándose en el puerto: ${puerto}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'Desarrollo'}`);
})
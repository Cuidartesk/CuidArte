require('dotenv').config();
require('./config/connectiondb');
const express = require('express');
const app = express();


app.use(express.json());
app.get('/', (req, res) => res.send('CuidArte pagina web'))


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log('Servidor en ejecución en el puerto', PORT);  
});
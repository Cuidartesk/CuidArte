require('dotenv').config();
require('./config/connectiondb');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.get('/', (req, res) => res.send('CuidArte pagina web'))



app.listen(PORT, () => {
    console.log('Servidor en ejecución en el puerto', PORT);  
});
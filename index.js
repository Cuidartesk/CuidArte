require('dotenv').config();
require('./config/connectiondb');
const express = require('express');
const app = express();
const routes = require('./router/enrutamiento.router');
const path = require('path'); 
const PORT = process.env.PORT || 8000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(routes);
app.get('/', (req, res) => {
  res.render('pages/index');
});
app.listen(PORT, () => {
    console.log('Servidor en ejecución en el puerto', PORT);  
});
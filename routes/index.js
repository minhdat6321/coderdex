var express = require('express');
var router = express.Router();
var fs = require('fs')

router.get('/', function (req, res, next) {
  res.status(200).send("Welcome to HomePage Coderdex!")
});



const pokemonRouter = require("./pokemon.api.js")
router.use('/pokemons', pokemonRouter)
module.exports = router;

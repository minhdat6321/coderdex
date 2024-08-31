var express = require('express');
var router = express.Router();
var fs = require("fs");


/* GET home page. */
router.get('/', function (req, res, next) {

  const allowedFilter = [
    "name",
    "type",
    "page",
    "limit",
    "search"
  ];
  try {
    // lấy obj mà user gửi đi để tìm kiếm
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;

    //

    // lấy key của filter & check coi có key nào k trùng với key trong allowedFilter obj
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });
    // processing logic


    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    let result = [];

    // Logic, check coi filterKeys có giá trị kh 
    if (filterKeys.length) {
      filterKeys.forEach((key) => {
        result = result.length // dùng kiểm tra xem đã có result chưa
          ? result.filter((pokemon) =>
            key !== 'type' // chỉ có key: "types" trong pokemon là array 
              ? pokemon["name"].toLowerCase().includes(filterQuery[key].toLowerCase())
              // Dùng some để check coi 1 trong 2 type pokemon có trong filterQuery[key]
              : pokemon["types"].some(type => type.includes(filterQuery[key].toLowerCase()))
          )
          : data.filter((pokemon) =>
            key !== 'type'
              ? pokemon["name"].toLowerCase().includes(filterQuery[key].toLowerCase())
              : pokemon["types"].some(type => type.includes(filterQuery[key].toLowerCase()))
          );
      });
    } else {
      result = data;
    }
    //check coi co data nao phu hop khong
    if (!result.length) {
      const exception = new Error(`NOT FOUND POKEMON ! TRY ANOTHER TYPE OR NAME`);
      exception.statusCode = 401;
      throw exception;
    }

    //Number of items skip for selection
    let offset = limit * (page - 1);
    //
    result = result.slice(offset, offset + limit);
    const newdb = { ...db, data: result };
    //send response
    res.status(200).send(newdb)


  } catch (error) {
    error.statusCode = 500
    next(error);
  }
});



// Get data detail a Pokemon 
router.get('/:pokemonId', function (req, res, next) {
  try {
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    let { data, totalPokemons } = db;

    // Lấy Id của các obj pokemon, previousPokemon, nextPokemon
    let { pokemonId } = req.params
    pokemonId = parseInt(pokemonId)
    totalPokemons = parseInt(totalPokemons)
    let previousPokemonId;
    let nextPokemonId;

    //Check các trường hợp xảy ra: 2TH đặc biệt, 1 bình thường
    if (pokemonId === 1) {
      previousPokemonId = totalPokemons
      nextPokemonId = 2
    } else if (pokemonId === totalPokemons) {
      previousPokemonId = totalPokemons - 1
      nextPokemonId = 1
    } else {
      previousPokemonId = pokemonId - 1
      nextPokemonId = pokemonId + 1
    }


    // obj pokemon
    const pokemon = data.find(pokemon => parseInt(pokemon.id) === pokemonId)

    // obj previousPokemon & nextPokemon
    const previousPokemon = data.find(pokemon => parseInt(pokemon.id) === previousPokemonId)
    const nextPokemon = data.find(pokemon => parseInt(pokemon.id) === nextPokemonId)

    const result = { pokemon, previousPokemon, nextPokemon }
    const newdb = { data: result }

    //
    console.log("pokemon", pokemon)
    console.log("previousPokemon", previousPokemon)
    console.log("nextPokemon", nextPokemon)

    //send response
    res.status(200).send(newdb)

  } catch (error) {
    error.statusCode = 500
    next(error);
  }
})

//Creating pokemon
router.post('/', function (req, res, next) {
  //The valid type array:
  const pokemonTypes = [
    "bug", "dragon", "fairy", "fire", "ghost",
    "ground", "normal", "psychic", "steel", "dark",
    "electric", "fighting", "flyingText", "grass", "ice",
    "poison", "rock", "water"
  ]

  try {
    const { name, id, url, types } = req.body;
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    // Check user có nhập thiếu data để tạo thành 1 pokemon kh?
    if (!name || !id || !url || !types.length) {
      const exception = new Error(`Missing required data.`);
      exception.statusCode = 401;
      throw exception;
    }

    // Check Pokemon này đã xuất hiện trong array chưa
    const pokemonCheckExist = data.find(pokemon => parseInt(pokemon.id) === parseInt(id) || pokemon.name.toLowerCase() === name.toLowerCase())
    if (pokemonCheckExist) {
      const exception = new Error(`The Pokémon already exists.`);
      exception.statusCode = 401;
      throw exception;
    }


    // Check types có lớn hơn 2 không
    //& Check types có nằm ở trong array cho sănx kh
    if (types.length <= 2) {
      types.find((type) => {
        if (!pokemonTypes.includes(type.toLowerCase())) {
          const exception = new Error(`Pokémon's type is invalid`);
          exception.statusCode = 401;
          throw exception;
        }
      })
    } else {
      const exception = new Error(`Pokémon can only have one or two types.`);
      exception.statusCode = 401;
      throw exception;
    }


    //post processing
    const newPokemon = {
      name, id, url, types,
    };


    //Add new pokemon to pokemon JS object
    data.push(newPokemon)
    //Add new pokemon to db JS object
    db.data = data
    //db JSobject to JSON string
    db = JSON.stringify(db)
    //write and save to db.json
    fs.writeFileSync("db.json", db)
    //post send response
    res.status(200).send(newPokemon)
  } catch (error) {
    next(error)
  } z

})

//Updating pokemon
router.put('/:pokemonId', function (req, res, next) {
  try {
    const allowUpdate = ["name", "id", "url", "types"]

    const { pokemonId } = req.params

    // Thông tin update của user gửi về server
    const updates = req.body
    const updateKeys = Object.keys(updates)
    //find update request that not allow
    const notAllow = updateKeys.filter(el => !allowUpdate.includes(el));

    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }
    //put processing
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    //find pokemon by id
    const targetIndex = data.findIndex(pokemon => parseInt(pokemon.id) === pokemonId)

    console.log("pokemonId", pokemonId)
    console.log("targetIndex", targetIndex)
    console.log("updates", updates)
    console.log("notAllow", notAllow)


    if (targetIndex < 0) {
      const exception = new Error(`pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }
    //Update new content to db pokemon JS object
    const updatedPokemon = { ...db.data[targetIndex], ...updates }
    db.data[targetIndex] = updatedPokemon

    //db JSobject to JSON string

    db = JSON.stringify(db)
    //write and save to db.json
    fs.writeFileSync("db.json", db)
    //put send response
    res.status(200).send(updatedPokemon)

  } catch (error) {
    next(error)
  }
})

//Deleting pokemon
router.delete('/:pokemonId', function (req, res, next) {
  try {
    const { pokemonId } = req.params
    //delete processing
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    //find pokemon by id
    const targetIndex = data.findIndex(pokemon => parseInt(pokemon.id) === pokemonId)
    if (targetIndex < 0) {
      const exception = new Error(`pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }
    //filter db data object
    db.data = data.filter(pokemon => parseInt(pokemon.id) !== pokemonId)
    //db JSobject to JSON string

    db = JSON.stringify(db)
    //write and save to db.json

    fs.writeFileSync("db.json", db)
    //delete send response
    res.status(200).send({})
  } catch (error) {
    next(error)
  }
})

module.exports = router;

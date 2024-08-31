const fs = require("fs")
const csv = require("csvtojson")
const { faker } = require("@faker-js/faker");
const path = require("path")
const BASE_URL = "https://coderdex-be-diaytio6.onrender.com";


const createPokemons = async () => {
  // Đọc tên files trong folder 
  let imageIndexFiles = fs.readdirSync("./public/images");
  const pokemonNames = imageIndexFiles.map((item) =>
    path.basename(item, path.extname(item))
  )

  //Đọc data từ file pokemon.csv
  let newData = await csv().fromFile("pokemon.csv")
  // turn JSON to Js object
  let data = JSON.parse(fs.readFileSync("db.json"))
  // Process newData

  newData = newData.map((e, index) => {
    return {
      "id": (index + 1).toString(),
      "name": e.Name,
      "description":
        faker.person.bio()[0].toUpperCase() + faker.person.bio().slice(1),
      "height": `${faker.number.float({ min: 0.01, max: 2, multipleOf: 0.01 })} m`,
      "weight": `${faker.number.float({ min: 10, max: 100, multipleOf: 0.02 })} kg`,
      "category": faker.person.jobType(),
      "abilities": faker.person.jobDescriptor(),

      "types": !e.Type2.toLowerCase() ? [e.Type1.toLowerCase()] : [e.Type1.toLowerCase(), e.Type2.toLowerCase()],
      "url": `${BASE_URL}/images/${pokemonNames[index]}.png`,

    }
  })
  data.count = pokemonNames.length
  data.data = newData
  data.totalPokemons = pokemonNames.length
  fs.writeFileSync("db.json", JSON.stringify(data))
  console.log('done')
  console.log(`data:`, newData)

}
createPokemons();
const express = require("express");

const server = express();

server.use(express.json());

// Query params = ?teste=1
// Route params = /users/1
// Request body = {name: "Diego", email: "diego@bol.br", tell: 3392-1222}

// GRUD - Create, Read, Update, Delete

const users = ["Heloisa", "Gabriel", "Yago"];

server.use((req, res, next) => {
  console.time("request");
  console.log(`method: ${req.method}; url: ${req.url}`);

  next();
  console.timeEnd("request");
});

// Middleware são funções chamadas antes da resposta ou requisão de um server/função:
function checkUserExists(req, res, next) {
  if (!req.body.name) {
    return res.status(400).json({ error: "username is required!" });
  }

  return next();
}

function checkUserInArray(req, res, next) {
  const name = users[req.params.i];
  if (!name) {
    return res.status(400).json({ error: "User does not exist" });
  }

  req.user = name;

  return next();
}

server.get("/users", (req, res) => {
  return res.json(users);
});

server.get("/users/:i", checkUserInArray, (req, res) => {
  return res.json(req.user);
});

// ex de chamada de um middleware
server.post("/users", checkUserExists, (req, res) => {
  const { name } = req.body;

  users.push(name);

  return res.json(users);
});

server.put("/users/:i", checkUserInArray, checkUserExists, (req, res) => {
  const { name } = req.body;
  const { i } = req.params;
  users[i] = name;

  return res.json(users);
});

server.delete("/users/:i", checkUserInArray, (req, res) => {
  const { i } = req.params;
  users.splice(i, 1);

  return res.json(users);
});

server.listen(3000);

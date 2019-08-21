const express = require("express");

const server = express();

server.use(express.json());

const projects = [];
let qtd = 0;

function requestCounter(req, res, next) {
  console.log(`qtd: ${qtd++}`);

  return next();
}

function checkProjectExists(req, res, next) {
  const title = projects[req.params.id];
  if (!title) {
    return res.status(400).json({ error: "Project does not exist" });
  }

  return next();
}

server.use(requestCounter);

server.get("/projects", (req, res) => {
  return res.json(projects);
});

/*server.get("/projects/:i", checkProjectExists, (req, res) => {
  const { i } = req.params;

  return res.json(users[i]);
});*/

server.post("/projects", (req, res) => {
  const { id, title } = req.body;
  const projeto = { id, title, tasks: [] };

  projects.push(projeto);

  return res.json(projects);
});

server.put("/projects/:id", checkProjectExists, (req, res) => {
  const { title } = req.body;
  const { id } = req.params;
  projects[id].title = title;

  return res.json(projects);
});

server.delete("/projects/:id", checkProjectExists, (req, res) => {
  const { id } = req.params;
  projects.splice(id, 1);

  return res.json(projects);
});

server.post("/projects/:id/tasks", checkProjectExists, (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  projects[id].tasks.push(title);

  return res.json(projects);
});

server.listen(3000);

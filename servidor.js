const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const PORT = process.env.PORT || 3001;

function getRoomPlayers(sala) {
  const room = io.sockets.adapter.rooms.get(sala);
  return room ? Array.from(room) : [];
}

function emitirJogadoresDaSala(sala) {
  const players = getRoomPlayers(sala);
  const jogadores = {
    primeiro: players[0],
    segundo: players[1],
  };

  io.to(sala).emit("jogadores", jogadores);
  return jogadores;
}

io.on("connection", (socket) => {
  console.log("Usuário %s conectado no servidor.", socket.id);

  socket.on("entrar-na-sala", (sala) => {
    const players = getRoomPlayers(sala);

    if (players.length >= 2) {
      console.log("Sala %s cheia. Conexão rejeitada para %s.", sala, socket.id);
      socket.emit("sala-cheia", sala);
      return;
    }

    socket.join(sala);
    console.log("Usuário %s entrou na sala %s.", socket.id, sala);

    if (players.length + 1 === 2) {
      console.log("Sala %s com 2 jogadores. Partida pronta para iniciar.", sala);
    }

    emitirJogadoresDaSala(sala);
  });

  socket.on("offer", (sala, description) => {
    socket.to(sala).emit("offer", description);
  });

  socket.on("candidate", (sala, candidate) => {
    socket.to(sala).emit("candidate", candidate);
  });

  socket.on("answer", (sala, description) => {
    socket.to(sala).emit("answer", description);
  });

  socket.on("limpar-sala", (sala) => {
    console.log("Limpar sala solicitado por %s em %s", socket.id, sala);
    socket.leave(sala);
    emitirJogadoresDaSala(sala);
  });

  socket.on("proxima-fase", (sala, dados) => {
    socket.to(sala).emit("proxima-fase", dados);
  });

  socket.on("disconnect", () => {
    console.log("Usuário %s desconectou.", socket.id);

    socket.rooms.forEach((sala) => {
      if (sala === socket.id) return;

      console.log("Removendo %s da sala %s.", socket.id, sala);
      emitirJogadoresDaSala(sala);
      io.to(sala).emit("jogador-desconectado", socket.id);
    });
  });
});

app.use(express.static("./cliente/"));
server.listen(PORT, () =>
  console.log(`Servidor em execução na porta ${PORT}!`)
);

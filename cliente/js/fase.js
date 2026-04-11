/*global Phaser*/
/*eslint no-undef: "error"*/
export default class fase extends Phaser.Scene {
  constructor() {
    super("fase");
    this.speed = 200;
    this.scoreRemoto = 0;
    this.tirosRestantes = 10;
    this.botaoTiroPressionado = false;
    this.totalPassarosGerados = 0;
    this.maxPassaros = 15;
  }

  init(data) {
    this.game.cenaAtual = "fase";
    this.score = data.score || 0;
  }

  preload() {
    this.load.audio("musica-de-fundo", "assets/musica-de-fundo.mp3");
    this.load.audio("fire", "assets/fire.mp3");

    this.load.image("mira", "assets/mira.png");
    this.load.image("mira-remoto", "assets/mira-remoto.png");
    this.load.image("background", "assets/background.png");

    this.load.spritesheet("pomba-branca", "assets/pomba-branca.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet("pomba-cinza", "assets/pomba-cinza.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet("corvo", "assets/corvo.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet(
      "pomba-branca-caindo",
      "assets/pomba-branca-caindo.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );
  }

  create() {
    this.fire = this.sound.add("fire");
    this.musicaDeFundo = this.sound
      .add("musica-de-fundo", { loop: true })
      .play();

    this.add.image(400, 190, "background");

    this.anims.create({
      key: "voar-direita-pomba-branca",
      frames: this.anims.generateFrameNumbers("pomba-branca", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-esquerda-pomba-branca",
      frames: this.anims.generateFrameNumbers("pomba-branca", {
        start: 6,
        end: 11,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-direita-pomba-cinza",
      frames: this.anims.generateFrameNumbers("pomba-cinza", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-esquerda-pomba-cinza",
      frames: this.anims.generateFrameNumbers("pomba-cinza", {
        start: 6,
        end: 11,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-direita-corvo",
      frames: this.anims.generateFrameNumbers("corvo", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "voar-esquerda-corvo",
      frames: this.anims.generateFrameNumbers("corvo", {
        start: 6,
        end: 11,
      }),
      frameRate: 12,
      repeat: -1,
    });

    this.passaros = this.physics.add.group();

    this.iniciarContagem(() => {
      if (this.game.jogadores.primeiro === this.game.socket.id) {
        this.criarRevoadaInicial();

        setInterval(() => {
          this.criarProximaRevoada();
        }, 10000);
      }
    });

    this.initConexao();

    this.scoreText = this.add.text(16, 16, "Pontuação: " + this.score, {
      fontSize: "32px",
      fill: "#fff",
    });
    this.scoreRemotoText = this.add.text(540, 16, "Adversário: 0", {
      fontSize: "28px",
      fill: "#fff",
    });
    this.tirosText = this.add.text(16, 56, "Tiros: " + this.tirosRestantes, {
      fontSize: "28px",
      fill: "#fff",
    });

    this.input.gamepad.on("down", (pad) => {
      if (pad.buttons[9].pressed) window.location.reload();
    });

    this.input.on("pointermove", (pointer) => {
      if (this.personagemLocal) {
        const worldPoint = this.getPointerWorld(pointer);
        this.personagemLocal.setPosition(worldPoint.x, worldPoint.y);
      }
    });

    this.input.on("pointerdown", (pointer, currentlyOver) => {
      this.botaoTiroPressionado = false;
      if (this.personagemLocal) {
        const worldPoint = this.getPointerWorld(pointer);
        this.personagemLocal.setPosition(worldPoint.x, worldPoint.y);
      }

      const clickedBird = currentlyOver
        ? currentlyOver.find(
            (obj) =>
              obj.texture &&
              (obj.texture.key.startsWith("pomba") || obj.texture.key === "corvo")
          )
        : null;

      this.handleTiro(pointer, clickedBird || null);
    });

    this.input.on("pointerup", () => {
      this.botaoTiroPressionado = false;
    });

    this.input.on("pointerupoutside", () => {
      this.botaoTiroPressionado = false;
    });
  }

  criarRevoadaInicial() {
    for (let i = 0; i < 15; i++) {
      this.spawnPassaroPrimeiraRevoada();
    }
  }

  spawnPassaroPrimeiraRevoada() {
    if (this.totalPassarosGerados >= this.maxPassaros) return;

    const backgroundY = 190;
    const backgroundHeight = 380;
    const topLimit = backgroundY - backgroundHeight / 2;
    const bottomLimit = backgroundY + backgroundHeight / 2;
    const y = Phaser.Math.Between(topLimit + 20, bottomLimit - 20);

    const direcao = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    const x = direcao === 1 ? -50 : 850;

    const texturas = ["pomba-branca", "pomba-cinza", "corvo"];
    const tipoPassaro = texturas[Math.floor(Math.random() * 3)];

    const animacao =
      direcao === 1
        ? "voar-direita-" + tipoPassaro
        : "voar-esquerda-" + tipoPassaro;

    const passaro = this.passaros.create(x, y, tipoPassaro);
    this.setupPassaroInteractive(passaro);

    const atraso = Math.random() * 5000;
    setTimeout(() => {
      passaro.setVelocity(
        Phaser.Math.Between(100, 150) * direcao,
        Phaser.Math.Between(-80, 80)
      );
    }, atraso);

    passaro.direcao = direcao;
    passaro.atingido = false;

    if (this.game.jogadores.primeiro === this.game.socket.id) {
      passaro.anims.play(animacao, true);
    }

    this.totalPassarosGerados++;
  }

  criarProximaRevoada() {
    this.passaros.clear(true, true);
    this.totalPassarosGerados = 0;
    this.criarRevoadaInicial();

    this.tirosRestantes += 10;
    this.tirosText.setText("Tiros: " + this.tirosRestantes);
    this.game.dadosJogo.send(
      JSON.stringify({
        cena: this.game.cenaAtual,
        tiros: 10,
        passaros: this.passaros.children.entries.map((p) => ({
          x: p.x,
          y: p.y,
          texture: p.texture.key,
          frame: p.frame.name,
          visible: p.visible,
          direcao: p.direcao,
          atingido: p.atingido || false,
        })),
      })
    );
  }
  receberDados(event) {
    const dados = JSON.parse(event.data);

    if (dados.cena === this.game.cenaAtual) {
      if (dados.personagem && this.personagemRemoto) {
        this.personagemRemoto.x = dados.personagem.x;
        this.personagemRemoto.y = dados.personagem.y;
      }

      if (dados.passaros) {
        dados.passaros.forEach((passaro, i) => {
          let p = this.passaros.children.entries[i];

          if (!p) {
            p = this.passaros.create(passaro.x, passaro.y, passaro.texture);
            this.setupPassaroInteractive(p);
          }

          p.x = passaro.x;
          p.y = passaro.y;
          p.setTexture(passaro.texture);
          p.setFrame(passaro.frame);
          p.setVisible(passaro.visible);
          p.direcao = passaro.direcao;
          p.atingido = passaro.atingido || false;

          if (p.atingido) {
            p.setTexture("pomba-branca-caindo");
            p.setFrame(0);
            p.setVelocity(0, 0);
            p.setVelocityY(100);
            p.anims.stop();
            if (!passaro.visible) {
              p.setVisible(false);
            }
          } else {
            const anim =
              p.direcao === 1
                ? "voar-direita-" + p.texture.key
                : "voar-esquerda-" + p.texture.key;
            if (p.visible) {
              p.anims.play(anim, true);
            } else {
              p.anims.stop();
            }
          }
        });

        if (this.passaros.children.entries.length > dados.passaros.length) {
          const excesso = this.passaros.children.entries.length - dados.passaros.length;
          for (let j = 0; j < excesso; j++) {
            const extra = this.passaros.children.entries.pop();
            if (extra) extra.destroy(true);
          }
        }
      }

      if (dados.passaroAtingido !== undefined) {
        const p = this.passaros.children.entries[dados.passaroAtingido];
        if (p) {
          p.atingido = true;
          p.setVelocity(0, 0);
          p.setTexture("pomba-branca-caindo");
          p.setFrame(0);
          p.setVelocityY(100);
          this.time.delayedCall(800, () => p.setVisible(false));
        }
      }

      if (dados.novoScore) {
        this.scoreRemoto = dados.novoScore;
        this.scoreRemotoText.setText("Adversário: " + this.scoreRemoto);
      }

      if (dados.tiros) {
        this.tirosRestantes += dados.tiros;
        this.tirosText.setText("Tiros: " + this.tirosRestantes);
      }

      if (dados.proximaFase) {
        this.scene.stop();
        this.scene.start(dados.proximaFase, { score: dados.score || this.score });
      }
    }
  }

  initConexao() {
    const isPrimeiro = this.game.jogadores.primeiro === this.game.socket.id;
    const rtc = new RTCPeerConnection(this.game.iceServers);

    this.game.dadosJogo = rtc.createDataChannel("dadosJogo", {
      negotiated: true,
      id: 0,
    });
    this.game.dadosJogo.onopen = () => console.log("Canal de dados aberto");
    this.game.dadosJogo.onmessage = (event) => this.receberDados(event);

    rtc.onicecandidate = ({ candidate }) => {
      if (candidate)
        this.game.socket.emit("candidate", this.game.sala, candidate);
    };

    rtc.ontrack = ({ streams: [stream] }) => {
      this.game.audio.srcObject = stream;
    };

    if (this.game.midias) {
      this.game.midias
        .getTracks()
        .forEach((track) => rtc.addTrack(track, this.game.midias));
    }

    if (isPrimeiro) {
      this.game.remoteConnection = rtc;
      this.configurarPrimeiroJogador();
    } else {
      this.game.localConnection = rtc;
      this.configurarSegundoJogador();
    }
  }

  configurarPrimeiroJogador() {
    this.game.socket.on("offer", (description) => {
      this.game.remoteConnection
        .setRemoteDescription(description)
        .then(() => this.game.remoteConnection.createAnswer())
        .then((answer) =>
          this.game.remoteConnection.setLocalDescription(answer)
        )
        .then(() => {
          this.game.socket.emit(
            "answer",
            this.game.sala,
            this.game.remoteConnection.localDescription
          );
        });
    });

    this.game.socket.on("candidate", (candidate) => {
      this.game.remoteConnection.addIceCandidate(candidate);
    });

    this.personagemLocal = this.physics.add
      .sprite(225, 225, "mira")
      .setCollideWorldBounds(true);

    this.personagemRemoto = this.add.sprite(700, -100, "mira-remoto");

    this.iniciarContagem(() => {
      this.passaros.children.entries.forEach((passaro) => {
        passaro.setVelocity(
          Phaser.Math.Between(50, 80) * passaro.direcao,
          Phaser.Math.Between(-15, 15)
        );
      });
    });
  }

  configurarSegundoJogador() {
    this.game.localConnection
      .createOffer()
      .then((offer) => this.game.localConnection.setLocalDescription(offer))
      .then(() =>
        this.game.socket.emit(
          "offer",
          this.game.sala,
          this.game.localConnection.localDescription
        )
      );

    this.game.socket.on("answer", (description) => {
      this.game.localConnection.setRemoteDescription(description);
    });

    this.game.socket.on("candidate", (candidate) => {
      this.game.localConnection.addIceCandidate(candidate);
    });

    this.personagemLocal = this.physics.add
      .sprite(700, 100, "mira")
      .setCollideWorldBounds(true);
    this.personagemRemoto = this.add.sprite(100, 100, "mira-remoto");
    this.iniciarContagem();
  }

  getPointerWorld(pointer) {
    return this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  }

  setupPassaroInteractive(passaro) {
    passaro.setInteractive({ useHandCursor: true });
  }

  handleTiro(pointer, clickedPassaro) {
    if (!this.personagemLocal || this.tirosRestantes <= 0 || this.botaoTiroPressionado) {
      return;
    }

    this.fire.play();
    let acertou = false;
    const worldPoint = pointer ? this.getPointerWorld(pointer) : null;

    this.passaros.children.entries.forEach((passaro, i) => {
      if (!passaro.visible || passaro.atingido) return;

      const colidiu = clickedPassaro
        ? passaro === clickedPassaro
        : worldPoint
        ? passaro.getBounds().contains(worldPoint.x, worldPoint.y)
        : false;

      if (colidiu && !acertou) {
        acertou = true;
        passaro.atingido = true;

        if (passaro.texture.key === "pomba-branca") this.score += 50;
        else if (passaro.texture.key === "pomba-cinza") this.score += 100;
        else if (passaro.texture.key === "corvo") this.score -= 50;
        this.scoreText.setText("Pontuação: " + this.score);

        passaro.setTexture("pomba-branca-caindo");
        passaro.setFrame(0);
        passaro.setVelocity(0, 0);
        passaro.setVelocityY(100);
        passaro.anims.stop();
        this.time.delayedCall(800, () => {
          passaro.setVisible(false);
        });

        if (this.game.dadosJogo && this.game.dadosJogo.readyState === "open") {
          this.game.dadosJogo.send(
            JSON.stringify({
              cena: this.game.cenaAtual,
              passaroAtingido: i,
              novoScore: this.score,
            })
          );
        }
      }
    });

    if (acertou) {
      this.game.registry.set("score", this.score);
    }

    this.tirosRestantes--;
    this.tirosText.setText("Tiros: " + this.tirosRestantes);
    this.botaoTiroPressionado = true;
  }

  iniciarContagem(callback) {
    let i = 5;
    this.contador = this.add
      .text(400, 200, "", {
        fontSize: "128px",
        fill: "#fff",
      })
      .setOrigin(0.5);

    this.time.addEvent({
      delay: 1000,
      repeat: 5,
      callback: () => {
        if (i > 0) {
          this.contador.setText(i.toString());
        } else {
          this.contador.setVisible(false);
          if (callback) callback();
        }
        i--;
      },
    });
  }

  update() {
    try {
      // Só envia dados se o canal de dados estiver aberto
      if (this.game.dadosJogo && this.game.dadosJogo.readyState === "open") {
        if (this.personagemLocal) {
          // Envia posição do personagem local
          this.game.dadosJogo.send(
            JSON.stringify({
              cena: this.game.cenaAtual,
              personagem: {
                x: this.personagemLocal.x,
                y: this.personagemLocal.y,
              },
            })
          );
        }

        // Só o jogador 1 envia a posição dos pássaros
        if (
          this.passaros &&
          this.game.jogadores.primeiro === this.game.socket.id
        ) {
          this.game.dadosJogo.send(
            JSON.stringify({
              cena: this.game.cenaAtual,
              passaros: this.passaros.children.entries.map((p) => ({
                x: p.x,
                y: p.y,
                texture: p.texture.key,
                frame: p.frame.name,
                visible: p.visible,
                direcao: p.direcao,
                atingido: p.atingido || false,
              })),
            })
          );
        }
      }
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
    }

    // Lógica dos pássaros só para o jogador 1
    if (this.game.jogadores.primeiro === this.game.socket.id) {
      const backgroundY = 190;
      const backgroundHeight = 380;
      const topLimit = backgroundY - backgroundHeight / 2;
      const bottomLimit = backgroundY + backgroundHeight / 2;

      this.passaros.children.entries.forEach((passaro) => {
        // Ignora pássaros atingidos ou invisíveis para não interferir
        if (!passaro.visible || passaro.atingido) return;

        // Inverter direção horizontal se sair da tela
        if (passaro.x < -50 || passaro.x > 850) {
          passaro.direcao = passaro.x < -50 ? 1 : -1;
          passaro.setVelocityX(passaro.direcao * Phaser.Math.Between(100, 150));
          passaro.anims.play(
            passaro.direcao === 1
              ? "voar-direita-" + passaro.texture.key
              : "voar-esquerda-" + passaro.texture.key,
            true
          );
        }

        // Rebater verticalmente se bater nos limites do fundo
        if (passaro.y < topLimit || passaro.y > bottomLimit) {
          passaro.setVelocityY(-passaro.body.velocity.y);
        }
      });
    }

    // CONTROLE DO GAMEPAD para o jogador local
    if (this.input.gamepad && this.input.gamepad.total > 0) {
      const pad = this.input.gamepad.getPad(0);
      const axisH = pad.axes[0].getValue();
      const axisV = pad.axes[1].getValue();
      const botaoTiro = pad.buttons[2].pressed;

      this.personagemLocal.setVelocity(this.speed * axisH, this.speed * axisV);

      if (botaoTiro && !this.botaoTiroPressionado && this.tirosRestantes > 0) {
        this.fire.play(); // Som do tiro

        let acertou = false;

        this.passaros.children.entries.forEach((passaro, i) => {
          if (!passaro.visible || passaro.atingido) return; // Ignora pássaros já atingidos

          const colidiu = Phaser.Geom.Intersects.RectangleToRectangle(
            this.personagemLocal.getBounds(),
            passaro.getBounds()
          );

          if (colidiu && !acertou) {
            acertou = true;
            passaro.atingido = true; // Marca como atingido para bloquear movimento

            if (passaro.texture.key === "pomba-branca") this.score += 50;
            else if (passaro.texture.key === "pomba-cinza") this.score += 100;
            else if (passaro.texture.key === "corvo") this.score -= 50;
            this.scoreText.setText("Pontuação: " + this.score);

            passaro.setTexture("pomba-branca-caindo");
            passaro.setFrame(0);
            passaro.setVelocity(0, 0);
            passaro.setVelocityY(100);
            passaro.anims.stop();
            this.time.delayedCall(800, () => {
              passaro.setVisible(false);
            });

            // Envia mensagem para o outro jogador
            if (
              this.game.dadosJogo &&
              this.game.dadosJogo.readyState === "open"
            ) {
              this.game.dadosJogo.send(
                JSON.stringify({
                  cena: this.game.cenaAtual,
                  passaroAtingido: i,
                  novoScore: this.score,
                })
              );
            }
          }
        });

        if (acertou) {
          this.game.registry.set("score", this.score);
        }

        this.tirosRestantes--;
        this.tirosText.setText("Tiros: " + this.tirosRestantes);
        this.botaoTiroPressionado = true;
      }

      // Reset do botão de tiro quando soltar
      if (!botaoTiro) {
        this.botaoTiroPressionado = false;
      }
    }
    // Verifica se o jogador alcançou a pontuação de vitória
    if (this.score >= 2000) {
      if (this.game.dadosJogo && this.game.dadosJogo.readyState === "open") {
        this.game.dadosJogo.send(
          JSON.stringify({
            cena: this.game.cenaAtual,
            proximaFase: "gameover",
            score: this.score,
          })
        );
      }

      this.scene.stop();
      this.scene.start("finalfeliz", { score: this.score });
    }
  }
}

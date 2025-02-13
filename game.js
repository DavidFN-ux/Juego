function preload() {
    this.load.image("fondo", "images/Fondo-juego.png");
    this.load.image("base", "images/pj-base.png");
    this.load.image("arriba", "images/pj-subiendo.png");
    this.load.image("abajo", "images/pj-bajando.png");
    this.load.image("zombie", "images/zombie.png");
    this.load.image("bala", "images/bala.png");
    this.load.image("vida4", "images/vida4.png");
    this.load.image("vida3", "images/vida3.png");
    this.load.image("vida2", "images/vida2.png");
    this.load.image("vida1", "images/vida1.png");
    this.load.image("vida0", "images/vida0.png");
    this.load.image("gameover", "images/game-over.png");
}

function create() {
    let fondo = this.add.image(0, 0, "fondo").setOrigin(0, 0);
    fondo.setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

    personaje = this.add.sprite(100, 300, "base");
    personaje.setOrigin(0.5, 0.5);
    personaje.setDisplaySize(200, 240);

    cursors = this.input.keyboard.createCursorKeys();

    imagenArriba = this.add.sprite(100, 300, "arriba");
    imagenAbajo = this.add.sprite(50, 300, "abajo");

    imagenArriba.setDisplaySize(160, 190);
    imagenAbajo.setDisplaySize(160, 190);

    imagenArriba.setVisible(false);
    imagenAbajo.setVisible(false);

    zombies = this.add.group();
    balas = this.add.group({ runChildUpdate: true });

    // Agregar pared de vida con imagen inicial
    let pared = this.add.sprite(ANCHO_PANTALLA / 3.9, 300, "vida4");
    pared.setOrigin(0.6, 0.5);
    pared.setDisplaySize(5, 700);
    pared.setVisible(true);  // Asegurarse de que la pared sea visible
    imagenVidaPared.push(pared);

    this.time.addEvent({
        delay: 2000,
        callback: () => spawnZombie(this),
        loop: true
    });

    this.input.keyboard.on('keydown-SPACE', function () {
        dispararBala(this);
    });

    gameOverImage = this.add.image(ANCHO_PANTALLA / 1.55, 250, "gameover");
    gameOverImage.setVisible(false);
    gameOverImage.setDepth(10);

    this.input.keyboard.on('keydown', () => {
        if (gameOverImage.visible) {
            reiniciarJuego(this);
        }
    });
}

function update(time) {
    if (vidaPared <= 0) {
        gameOverImage.setVisible(true);
        return;
    }

    imagenArriba.setVisible(false);
    imagenAbajo.setVisible(false);
    personaje.setVisible(true);

    imagenArriba.setPosition(personaje.x, personaje.y);
    imagenAbajo.setPosition(personaje.x, personaje.y);

    if (cursors.up.isDown && personaje.y > TOPE_SUPERIOR) {
        imagenArriba.setVisible(true);
        personaje.setVisible(false);
        personaje.y -= VELOCIDAD;
    }
    else if (cursors.down.isDown && personaje.y < TOPE_INFERIOR) {
        imagenAbajo.setVisible(true);
        personaje.setVisible(false);
        personaje.y += VELOCIDAD;
    }

    if (!cursors.up.isDown && !cursors.down.isDown) {
        personaje.setVisible(true);
        if (time - tiempoUltimoDisparo > INTERVALO_DISPARO_AUTOMATICO) {
            dispararBala(this);
            tiempoUltimoDisparo = time;
        }
    }

    zombies.children.iterate((zombie) => {
        if (zombie) {
            if (zombie.x > ANCHO_PANTALLA / 4.2 + 20 || zombie.x < ANCHO_PANTALLA / 4.2 - 20) {
                zombie.x -= VELOCIDAD_ZOMBIE;
            } else {
                vidaPared--;
                zombie.destroy();
            }

            if (zombie.x < -50) zombie.destroy();
        }
    });

    balas.children.iterate((bala) => {
        if (bala) {
            if (bala.x < BORDE_IZQUIERDO_BALA - 1) {
                bala.destroy();
            }

            zombies.children.iterate((zombie) => {
                if (zombie && Phaser.Geom.Intersects.RectangleToRectangle(bala.getBounds(), zombie.getBounds())) {
                    impactosZombie[zombie] = (impactosZombie[zombie] || 0) + 1;
                    bala.destroy();

                    if (impactosZombie[zombie] >= 2) {
                        zombie.destroy();
                        delete impactosZombie[zombie];
                    }
                }
            });
        }
    });

    // Actualizar la imagen de vida según la cantidad de vida
    if (vidaPared != prevVidaPared) {
        prevVidaPared = vidaPared;
        if (vidaPared == 3) {
            imagenVidaPared[0].setTexture("vida3");
        } else if (vidaPared == 2) {
            imagenVidaPared[0].setTexture("vida2");
        } else if (vidaPared == 1) {
            imagenVidaPared[0].setTexture("vida1");
        } else if (vidaPared == 0) {
            imagenVidaPared[0].setTexture("vida0");
        }
    }
}

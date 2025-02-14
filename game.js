class Juego extends Phaser.Scene {
    constructor() {
        super({ key: 'Juego' }); // Asegúrate de que el nombre sea 'Juego'
    }

    preload() {
        // Cargar recursos para el juego
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
        this.load.image("marco", "images/marco.png");
    }

    create() {
        let fondo = this.add.image(0, 0, "fondo").setOrigin(0, 0);
        fondo.setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

        this.personaje = this.add.sprite(100, 300, "base");
        this.personaje.setOrigin(0.5, 0.5);
        this.personaje.setDisplaySize(200, 240);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.imagenArriba = this.add.sprite(100, 300, "arriba");
        this.imagenAbajo = this.add.sprite(50, 300, "abajo");

        this.imagenArriba.setDisplaySize(160, 190);
        this.imagenAbajo.setDisplaySize(160, 190);

        this.imagenArriba.setVisible(false);
        this.imagenAbajo.setVisible(false);

        this.zombies = this.add.group();
        this.balas = this.add.group({ runChildUpdate: true });

        this.imagenVidaPared = this.add.sprite(50, 50, "vida4");
        this.imagenVidaPared.setOrigin(0.15, 0.5);
        this.imagenVidaPared.setDisplaySize(300, 90);

        this.time.addEvent({
            delay: 2000,
            callback: () => this.spawnZombie(),
            loop: true
        });

        this.input.keyboard.on('keydown-SPACE', () => this.dispararBala());

        this.gameOverImage = this.add.image(ANCHO_PANTALLA / 1.55, 250, "gameover");
        this.gameOverImage.setVisible(false);
        this.gameOverImage.setDepth(10);

        this.input.keyboard.on('keydown', () => {
            if (this.gameOverImage.visible) {
                this.reiniciarJuego();
            }
        });

        // 🕒 Agregar temporizador
        this.startTime = this.time.now;
        this.timerText = this.add.text(ANCHO_PANTALLA - 140, 25, "00:00", {
            fontSize: '40px',
            fill: '#FFFFFF'
        });

        let marco = this.add.image(this.sys.game.config.width, 0, "marco");
        marco.setOrigin(1, 0.2); // Cambiar el origen a la esquina superior derecha
        marco.setDisplaySize(400, 150); // Establecer el tamaño de la imagen
    }

    update(time) {
        if (this.vidaPared <= 0) {
            this.gameOverImage.setVisible(true);
            return;
        }

        this.imagenArriba.setVisible(false);
        this.imagenAbajo.setVisible(false);
        this.personaje.setVisible(true);

        this.imagenArriba.setPosition(this.personaje.x, this.personaje.y);
        this.imagenAbajo.setPosition(this.personaje.x, this.personaje.y);

        if (this.cursors.up.isDown && this.personaje.y > TOPE_SUPERIOR) {
            this.imagenArriba.setVisible(true);
            this.personaje.setVisible(false);
            this.personaje.y -= VELOCIDAD;
        }
        else if (this.cursors.down.isDown && this.personaje.y < TOPE_INFERIOR) {
            this.imagenAbajo.setVisible(true);
            this.personaje.setVisible(false);
            this.personaje.y += VELOCIDAD;
        }

        if (!this.cursors.up.isDown && !this.cursors.down.isDown) {
            this.personaje.setVisible(true);
            if (time - this.tiempoUltimoDisparo > INTERVALO_DISPARO_AUTOMATICO) {
                this.dispararBala();
                this.tiempoUltimoDisparo = time;
            }
        }

        this.zombies.children.iterate((zombie) => {
            if (zombie) {
                if (zombie.x > ANCHO_PANTALLA / 4.2 + 20 || zombie.x < ANCHO_PANTALLA / 4.2 - 20) {
                    zombie.x -= VELOCIDAD_ZOMBIE;
                } else {
                    this.vidaPared--;
                    zombie.destroy();
                }

                if (zombie.x < -50) zombie.destroy();
            }
        });

        this.balas.children.iterate((bala) => {
            if (bala) {
                if (Math.abs(bala.x - bala.inicioX) > distanciaMaximaBala) {
                    bala.destroy();
                }

                this.zombies.children.iterate((zombie) => {
                    if (zombie && Phaser.Geom.Intersects.RectangleToRectangle(bala.getBounds(), zombie.getBounds())) {
                        this.impactosZombie[zombie] = (this.impactosZombie[zombie] || 0) + 1;
                        bala.destroy();

                        if (this.impactosZombie[zombie] >= 2) {
                            zombie.destroy();
                            delete this.impactosZombie[zombie];
                        }
                    }
                });
            }
        });

        if (this.vidaPared != this.prevVidaPared) {
            this.prevVidaPared = this.vidaPared;
            this.imagenVidaPared.setTexture(`vida${Math.max(this.vidaPared, 0)}`);
        }

        // 🕒 Actualizar temporizador
        this.elapsedTime = Math.floor((this.time.now - this.startTime) / 1000);
        let minutes = Math.floor(this.elapsedTime / 60);
        let seconds = this.elapsedTime % 60;
        this.timerText.setText(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }

    dispararBala() {
        const bala = this.add.sprite(this.personaje.x + 50, this.personaje.y, "bala");
        bala.setDisplaySize(50, 50);
        bala.inicioX = this.personaje.x + 50;
        this.balas.add(bala);
        this.physics.add.existing(bala);
        bala.body.setVelocityX(1000);
    }

    spawnZombie() {
        const zombie = this.add.sprite(ANCHO_PANTALLA + 50, Phaser.Math.Between(100, 500), "zombie");
        this.zombies.add(zombie);
        zombie.setDisplaySize(150, 150);
        this.physics.add.existing(zombie);
    }

    reiniciarJuego() {
        this.scene.restart(); // Reinicia la escena actual
    }
}

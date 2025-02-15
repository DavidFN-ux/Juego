const config = {
    type: Phaser.AUTO,
    parent: "game",
    scene: {
        preload,
        create,
        update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
}

new Phaser.Game(config);

let personaje;
let cursors;
let imagenArriba;
let imagenAbajo;
let zombies;
let balas;
let impactosZombie = {};
let tiempoUltimoDisparo = 0;
let gameOverImage;
let timerText;
let startTime;
let elapsedTime;

const TOPE_SUPERIOR = 250;
const TOPE_INFERIOR = 500;
const VELOCIDAD = 4;
const VELOCIDAD_ZOMBIE = 2;
const INTERVALO_DISPARO_AUTOMATICO = 500;
const ANCHO_PANTALLA = 900;
const BORDE_DERECHO = ANCHO_PANTALLA + 200;
let distanciaMaximaBala = 850;

let vidaPared = 4;
let imagenVidaPared;
let prevVidaPared = -1;

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
    this.load.image("marco", "images/marco.png");

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

    imagenVidaPared = this.add.sprite(50, 50, "vida4");
    imagenVidaPared.setOrigin(0.15, 0.5);
    imagenVidaPared.setDisplaySize(300, 90);

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

    // 🕒 Agregar temporizador
    startTime = this.time.now;
    timerText = this.add.text(ANCHO_PANTALLA - 120, 25, "00:00", {
        fontSize: '30px',
        fill: '#FFFFFF'
    });
    let marco = this.add.image(this.sys.game.config.width, 0, "marco");

marco.setOrigin(1, 0.2); // Cambiar el origen a la esquina superior derecha
marco.setDisplaySize(400, 150); // Establecer el tamaño de la imagen (ajústalo según lo que necesites)
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
            if (Math.abs(bala.x - bala.inicioX) > distanciaMaximaBala) {
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

    if (vidaPared != prevVidaPared) {
        prevVidaPared = vidaPared;
        imagenVidaPared.setTexture(`vida${Math.max(vidaPared, 0)}`);
    }

    // 🕒 Actualizar temporizador
    elapsedTime = Math.floor((this.time.now - startTime) / 1000);
    let minutes = Math.floor(elapsedTime / 60);
    let seconds = elapsedTime % 60;
    timerText.setText(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
}

function spawnZombie(scene) {
    let y = Phaser.Math.Between(TOPE_SUPERIOR, TOPE_INFERIOR);
    let zombie = scene.add.sprite(BORDE_DERECHO + 200, y, "zombie");
    zombie.setOrigin(0.5, 0.5);
    zombie.setDisplaySize(zombie.width * 0.5, zombie.height * 0.5);
    zombie.setFlipX(true);
    zombies.add(zombie);
}

function dispararBala(scene) {
    let bala = scene.add.sprite(personaje.x + 50, personaje.y - 40, "bala");
    bala.setOrigin(0.5, 0.5);
    bala.setDisplaySize(30, 15);
    bala.inicioX = bala.x;
    scene.physics.world.enable(bala);
    bala.body.setVelocityX(500);
    balas.add(bala);
}

function reiniciarJuego(scene) {
    vidaPared = 4;
    imagenVidaPared.setTexture("vida4");
    gameOverImage.setVisible(false);
    zombies.clear(true, true);
    balas.clear(true, true);
    personaje.setPosition(100, 300);
    startTime = scene.time.now; // Reiniciar temporizador
}

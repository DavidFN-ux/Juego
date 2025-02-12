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
let boss;
let boss_nuevo;
let tiempoUltimoBoss = 0;
let balas;
let impactosZombie = {};
let impactosBoss = 0;
let tiempoUltimoDisparo = 0;
let gameOverImage;

const TOPE_SUPERIOR = 250;
const TOPE_INFERIOR = 500;
const VELOCIDAD = 4;
const VELOCIDAD_ZOMBIE = 2;
const VELOCIDAD_BOSS = 1;
const INTERVALO_BOSS = 30000;
const INTERVALO_DISPARO_AUTOMATICO = 500;
const ANCHO_PANTALLA = 800;
const BORDE_DERECHO = ANCHO_PANTALLA + 200;
const BORDE_IZQUIERDO_BALA = 100;

let vidaPared = 4;
let imagenVidaPared = [];
let prevVidaPared = -1;

let contadorMuertesBoss = 0;  // Contador de muertes del boss

function preload() {
    this.load.image("fondo", "images/Fondo-juego.png");
    this.load.image("base", "images/pj-base.png");
    this.load.image("arriba", "images/pj-subiendo.png");
    this.load.image("abajo", "images/pj-bajando.png");
    this.load.image("zombie", "images/zombie.png");
    this.load.image("boss", "images/boss.png");
    this.load.image("boss_nuevo", "images/zombie-boss.png");
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

    let pared = this.add.sprite(ANCHO_PANTALLA / 3.9, 300, "vida4");
    pared.setOrigin(0.6, 0.5);
    pared.setDisplaySize(5, 700);
    imagenVidaPared.push(pared);

    this.time.addEvent({
        delay: 2000,
        callback: () => spawnZombie(this),
        loop: true
    });

    tiempoUltimoBoss = this.time.now;

    this.input.keyboard.on('keydown-SPACE', function () {
        dispararBala(this);
    });

    // Agregar la imagen de "Game Over" pero mantenerla oculta al inicio
    gameOverImage = this.add.image(ANCHO_PANTALLA / 1.55, 250, "gameover");
    gameOverImage.setVisible(false);

    // Asegurar que la imagen de Game Over esté siempre encima
    gameOverImage.setDepth(10);

    // Reiniciar el juego al presionar cualquier tecla
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

    if (time - tiempoUltimoBoss > INTERVALO_BOSS) {
        spawnBoss(this);
        tiempoUltimoBoss = time;
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
            // Mover zombie hacia la izquierda si no ha tocado la pared
            if (zombie.x > ANCHO_PANTALLA / 4.2 + 20 || zombie.x < ANCHO_PANTALLA / 4.2 - 20) {
                zombie.x -= VELOCIDAD_ZOMBIE;
            } else {
                // Si el zombie toca la pared, se le quita 1 de vida a la pared y se destruye el zombie
                vidaPared--;
                zombie.destroy();
            }

            // Destruir zombie si pasa el borde
            if (zombie.x < -50) zombie.destroy();
        }
    });

    if (boss) {
        boss.x -= VELOCIDAD_BOSS;
        if (boss.x < ANCHO_PANTALLA / 4.2) {
            vidaPared -= 3; // Reducir 3 de vida
            boss.destroy();
            boss = null;
            contadorMuertesBoss++;  // Incrementar contador de muertes

            // Cambiar el boss después de 5 muertes
            if (contadorMuertesBoss >= 1) {
                this.time.delayedCall(5000, () => spawnBossNuevo(this)); // Aparecer el nuevo boss después de 5 segundos
                contadorMuertesBoss = 0;  // Resetear el contador de muertes
            }
        }
    }

    if (boss_nuevo) {
        boss_nuevo.x -= VELOCIDAD_BOSS;
        if (boss_nuevo.x < ANCHO_PANTALLA / 4.2) {
            vidaPared -= 3; // Reducir 3 de vida
            boss_nuevo.destroy();
            boss_nuevo = null;
        }
    }

    if (time - tiempoUltimoBoss > INTERVALO_BOSS) {
        spawnBoss(this);
        tiempoUltimoBoss = time;
    }

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

            if (boss && Phaser.Geom.Intersects.RectangleToRectangle(bala.getBounds(), boss.getBounds())) {
                impactosBoss++;
                bala.destroy();

                if (impactosBoss >= 6) {
                    boss.destroy();
                    impactosBoss = 0;
                }
            }
            
            // Corregir el impacto con el nuevo boss
            if (boss_nuevo && Phaser.Geom.Intersects.RectangleToRectangle(bala.getBounds(), boss_nuevo.getBounds())) {
                impactosBoss++;
                bala.destroy();

                if (impactosBoss >= 15) {
                    boss_nuevo.destroy();
                    impactosBoss = 0;
                }
            }
        }
    });

    // Actualizar la vida de la pared según la vida restante
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


function spawnZombie(scene) {
    let y = Phaser.Math.Between(TOPE_SUPERIOR, TOPE_INFERIOR);
    let zombie = scene.add.sprite(BORDE_DERECHO + 200, y, "zombie");
    zombie.setOrigin(0.5, 0.5);
    zombie.setDisplaySize(zombie.width * 0.5, zombie.height * 0.5);
    zombie.setFlipX(true);
    zombies.add(zombie);
}

function spawnBoss(scene) {
    if (!boss) {
        let y = Phaser.Math.Between(TOPE_SUPERIOR, TOPE_INFERIOR);
        boss = scene.add.sprite(BORDE_DERECHO + 250, y, "boss");
        boss.setOrigin(0.5, 0.5);
        boss.setDisplaySize(boss.width * 0.5, boss.height * 0.5);
        boss.setFlipX(true);
    }
}

function spawnBossNuevo(scene) {
    if (!boss) {
        let y = Phaser.Math.Between(TOPE_SUPERIOR, TOPE_INFERIOR);
        boss = scene.add.sprite(BORDE_DERECHO + 250, y, "boss_nuevo");
        boss.setOrigin(0.5, 0.5);
        boss.setDisplaySize(boss.width * 0.3, boss.height * 0.3);
        boss.setFlipX(true);
    }
}

function dispararBala(scene) {
    let bala = scene.add.sprite(personaje.x + 50, personaje.y - 40, "bala");
    bala.setOrigin(0.5, 0.5);
    bala.setDisplaySize(30, 15);

    scene.physics.world.enable(bala);
    bala.body.setVelocityX(500);
    balas.add(bala);
}

function reiniciarJuego(scene) {
    vidaPared = 4;
    imagenVidaPared[0].setTexture("vida4");
    gameOverImage.setVisible(false);
    zombies.clear(true, true);
    balas.clear(true, true);
    boss = null;
    impactosZombie = {};
    impactosBoss = 0;
    tiempoUltimoDisparo = 0;
    personaje.setPosition(100, 300);

    tiempoUltimoBoss = scene.time.now;
}

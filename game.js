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
let tiempoUltimoBoss = 0;
let balas;
let impactosZombie = {}; // Almacenar impactos por cada zombie
let impactosBoss = 0; // Contador de impactos del boss
let tiempoUltimoDisparo = 0; // Temporizador de disparo automático

const TOPE_SUPERIOR = 250;
const TOPE_INFERIOR = 500;
const VELOCIDAD = 4;
const VELOCIDAD_ZOMBIE = 2;
const VELOCIDAD_BOSS = 1;
const INTERVALO_BOSS = 30000; // 30 segundos
const INTERVALO_DISPARO_AUTOMATICO = 500; // Intervalo en milisegundos para disparo automático
const ANCHO_PANTALLA = 800; // Asumimos que la pantalla tiene un ancho de 800 píxeles
const BORDE_DERECHO = ANCHO_PANTALLA + 200; // Aseguramos que los enemigos salgan más allá del borde (200 píxeles de offset)

function preload() {
    console.log("Preload");
    this.load.image("fondo", "images/Fondo-juego.png");
    this.load.image("base", "images/pj-base.png");
    this.load.image("arriba", "images/pj-subiendo.png");
    this.load.image("abajo", "images/pj-bajando.png");
    
    // Cargar imágenes de los enemigos
    this.load.image("zombie", "images/zombie.png");
    this.load.image("boss", "images/boss.png");

    // Cargar imagen de la bala
    this.load.image("bala", "images/bala.png");
}

function create() {
    let fondo = this.add.image(0, 0, "fondo").setOrigin(0, 0);
    fondo.setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

    personaje = this.add.sprite(100, 300, "base");
    personaje.setOrigin(0.5, 0.5);
    personaje.setDisplaySize(200, 240);

    cursors = this.input.keyboard.createCursorKeys();

    imagenArriba = this.add.sprite(100, 300, "arriba");
    imagenAbajo = this.add.sprite(100, 300, "abajo");

    imagenArriba.setDisplaySize(160, 190);
    imagenAbajo.setDisplaySize(160, 190);

    imagenArriba.setVisible(false);
    imagenAbajo.setVisible(false);

    // Inicializar grupo de zombies y balas
    zombies = this.add.group();
    balas = this.add.group({
        runChildUpdate: true // Habilitar actualización de las balas
    });

    // Crear zombies cada 2 segundos
    this.time.addEvent({
        delay: 2000, 
        callback: () => spawnZombie(this),
        loop: true
    });

    tiempoUltimoBoss = this.time.now;
    
    // Configurar la tecla para disparar
    this.input.keyboard.on('keydown-SPACE', function () {
        dispararBala(this);
    });
}

function update(time) {
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
    else {
        personaje.setVisible(true);
        // Disparar automáticamente cuando el personaje esté quieto
        if (time - tiempoUltimoDisparo > INTERVALO_DISPARO_AUTOMATICO) {
            dispararBala(this);
            tiempoUltimoDisparo = time; // Resetear el temporizador
        }
    }

    // Mover zombies hacia la izquierda
    zombies.children.iterate((zombie) => {
        if (zombie) {
            zombie.x -= VELOCIDAD_ZOMBIE;
            if (zombie.x < -50) {
                zombie.destroy();
            }
        }
    });

    // Mover el boss si existe
    if (boss) {
        boss.x -= VELOCIDAD_BOSS;
        if (boss.x < -100) {
            boss.destroy();
            boss = null;
        }
    }

    // Crear boss cada 30 segundos
    if (time - tiempoUltimoBoss > INTERVALO_BOSS) {
        spawnBoss(this);
        tiempoUltimoBoss = time;
    }

    // Verificar colisiones entre las balas y los zombies/boss
    balas.children.iterate((bala) => {
        if (bala) {
            zombies.children.iterate((zombie) => {
                if (zombie && Phaser.Geom.Intersects.RectangleToRectangle(bala.getBounds(), zombie.getBounds())) {
                    // Contar impactos por cada zombie
                    if (!impactosZombie[zombie]) {
                        impactosZombie[zombie] = 0;
                    }
                    impactosZombie[zombie]++;

                    bala.destroy();  // Eliminar bala después de impactar

                    if (impactosZombie[zombie] >= 2) { // El zombie muere después de 2 disparos
                        zombie.destroy();
                        delete impactosZombie[zombie]; // Resetear impactos
                    }
                }
            });

            if (boss && Phaser.Geom.Intersects.RectangleToRectangle(bala.getBounds(), boss.getBounds())) {
                impactosBoss++;  // Incrementar los impactos del boss
                bala.destroy();  // Eliminar bala después de impactar

                if (impactosBoss >= 6) { // El boss muere después de 6 disparos
                    boss.destroy();
                    impactosBoss = 0;  // Resetear los impactos
                }
            }
        }
    });
}

function spawnZombie(scene) {
    let y = Phaser.Math.Between(TOPE_SUPERIOR, TOPE_INFERIOR);
    let zombie = scene.add.sprite(BORDE_DERECHO + 200, y, "zombie"); // Ajustamos la posición de aparición a la derecha
    zombie.setOrigin(0.5, 0.5);
    
    // Reducir el tamaño a la mitad y voltearlos
    zombie.setDisplaySize(zombie.width * 0.5, zombie.height * 0.5);
    zombie.setFlipX(true); 

    zombies.add(zombie);
}

function spawnBoss(scene) {
    if (!boss) {
        let y = Phaser.Math.Between(TOPE_SUPERIOR, TOPE_INFERIOR);
        boss = scene.add.sprite(BORDE_DERECHO + 250, y, "boss"); // Ajustamos la posición de aparición a la derecha
        boss.setOrigin(0.5, 0.5);
        
        // Reducir el tamaño a la mitad y voltearlo
        boss.setDisplaySize(boss.width * 0.5, boss.height * 0.5);
        boss.setFlipX(true);
    }
}

function dispararBala(scene) {
    let bala = scene.add.sprite(personaje.x + 50, personaje.y - 40, "bala");
    bala.setOrigin(0.5, 0.5);
    bala.setDisplaySize(30, 15); // Tamaño de la bala

    // Habilitar física para la bala
    scene.physics.world.enable(bala);
    bala.body.setVelocityX(500); // Velocidad de la bala hacia la derecha
    balas.add(bala);
}

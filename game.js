const config = {
    type: Phaser.AUTO,
    parent: "game",
    scene: {
        preload,
        create,
        update
    }
}

new Phaser.Game(config);

let personaje;
let cursors;
let imagenArriba;
let imagenAbajo;

const TOPE_SUPERIOR = 250;
const TOPE_INFERIOR = 500;
const VELOCIDAD = 4;

function preload() {
    console.log("Preload");
    this.load.image("fondo", "images/Fondo-juego.png");
    this.load.image("base", "images/pj-base.png");
    this.load.image("arriba", "images/pj-subiendo.png");
    this.load.image("abajo", "images/pj-bajando.png");
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
}

function update() {
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
    }
}

var Controller = Class({
    $const: {
        CONTROLLER_1_PORT: 0x4016,
        CONTROLLER_1_BUTTON_A: 's',
        CONTROLLER_1_BUTTON_B: 'a',
        CONTROLLER_1_BUTTON_SELECT: '\'',
        CONTROLLER_1_BUTTON_START: 'enter',
        CONTROLLER_1_BUTTON_UP: 'up',
        CONTROLLER_1_BUTTON_DOWN: 'down',
        CONTROLLER_1_BUTTON_LEFT: 'left',
        CONTROLLER_1_BUTTON_RIGHT: 'right',
        CONTROLLER_2_PORT: 0x4017
    },

    constructor: function(options) {
        this.mobo = options.mobo;
        this.port = options.port;
        this.displayDevice = options.displayDevice;
        this.inputs = new Array(24);  // A, B, Select, Start, Up, Down, Left, Right, 0, 0, 0, 0, 0, 0, 0, 0, Signature, Signature, Signature, Signature, 0, 0, 0, 0 (http://tuxnes.sourceforge.net/nestech100.txt).
        this.inputIndex = -1;
    },

    load: function() {
        var self = this,
            mousetrap = new Mousetrap(this.displayDevice);

        _.each(this.inputs, function(val, index, list) {
            list[index] = 0;
        });

        if (this.port == Controller.CONTROLLER_1_PORT) {
            // NES A button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_A, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyDown(Controller.CONTROLLER_1_BUTTON_A);
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_A, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyUp(Controller.CONTROLLER_1_BUTTON_A);
            }, 'keyup');

            // NES B button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_B, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyDown(Controller.CONTROLLER_1_BUTTON_B);
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_B, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyUp(Controller.CONTROLLER_1_BUTTON_B);
            }, 'keyup');

            // NES Select button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_SELECT, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyDown(Controller.CONTROLLER_1_BUTTON_SELECT);
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_SELECT, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyUp(Controller.CONTROLLER_1_BUTTON_SELECT);
            }, 'keyup');

            // NES Start button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_START, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyDown(Controller.CONTROLLER_1_BUTTON_START);
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_START, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyUp(Controller.CONTROLLER_1_BUTTON_START);
            }, 'keyup');

            // NES up button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_UP, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyDown(Controller.CONTROLLER_1_BUTTON_UP);
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_UP, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyUp(Controller.CONTROLLER_1_BUTTON_UP);
            }, 'keyup');

            // NES down button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_DOWN, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyDown(Controller.CONTROLLER_1_BUTTON_DOWN);
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_DOWN, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyUp(Controller.CONTROLLER_1_BUTTON_DOWN);
            }, 'keyup');

            // NES left button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_LEFT, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyDown(Controller.CONTROLLER_1_BUTTON_LEFT);
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_LEFT, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyUp(Controller.CONTROLLER_1_BUTTON_LEFT);
            }, 'keyup');

            // NES right button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_RIGHT, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyDown(Controller.CONTROLLER_1_BUTTON_RIGHT);
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_RIGHT, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.keyUp(Controller.CONTROLLER_1_BUTTON_RIGHT);
            }, 'keyup');
        } else if (this.port == Controller.CONTROLLER_2_PORT) {

        }
    },

    keyUp: function(key) {
        switch (key) {
            case Controller.CONTROLLER_1_BUTTON_A:
                this.inputs[0] = 0;
            break;

            case Controller.CONTROLLER_1_BUTTON_B:
                this.inputs[1] = 0;
            break;

            case Controller.CONTROLLER_1_BUTTON_SELECT:
                this.inputs[2] = 0;
            break;

            case Controller.CONTROLLER_1_BUTTON_START:
                this.inputs[3] = 0;
            break;

            case Controller.CONTROLLER_1_BUTTON_UP:
                this.inputs[4] = 0;
            break;

            case Controller.CONTROLLER_1_BUTTON_DOWN: 
                this.inputs[5] = 0;
            break;

            case Controller.CONTROLLER_1_BUTTON_LEFT:
                this.inputs[6] = 0;
            break;

            case Controller.CONTROLLER_1_BUTTON_RIGHT:
                this.inputs[7] = 0;
            break;

            default:
        }
    },

    keyDown: function(key) {
        switch (key) {
            case Controller.CONTROLLER_1_BUTTON_A:
                this.inputs[0] = 1;
            break;

            case Controller.CONTROLLER_1_BUTTON_B:
                this.inputs[1] = 1;
            break;

            case Controller.CONTROLLER_1_BUTTON_SELECT:
                this.inputs[2] = 1;
            break;

            case Controller.CONTROLLER_1_BUTTON_START:
                this.inputs[3] = 1;
            break;

            case Controller.CONTROLLER_1_BUTTON_UP:
                this.inputs[4] = 1;
            break;

            case Controller.CONTROLLER_1_BUTTON_DOWN: 
                this.inputs[5] = 1;
            break;

            case Controller.CONTROLLER_1_BUTTON_LEFT:
                this.inputs[6] = 1;
            break;

            case Controller.CONTROLLER_1_BUTTON_RIGHT:
                this.inputs[7] = 1;
            break;

            default:
        }
    },

    reset: function() {
        this.inputIndex = -1;
    },

    getNextInput: function(index) {
        var val = this.inputs[++this.inputIndex];

        return val;
    },

    dump: function() {
        
    }
});
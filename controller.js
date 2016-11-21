var Controller = Class({
    $const: {
        CONTROLLER_1_PORT: 0x4016,
        CONTROLLER_1_BUTTON_A: 's',
        CONTROLLER_1_BUTTON_B: 'a',
        CONTROLLER_1_BUTTON_SELECT: 'shift',
        CONTROLLER_1_BUTTON_START: 'enter',
        CONTROLLER_1_BUTTON_UP: 'up',
        CONTROLLER_1_BUTTON_DOWN: 'down',
        CONTROLLER_1_BUTTON_LEFT: 'left',
        CONTROLLER_1_BUTTON_RIGHT: 'right',
        CONTROLLER_2_PORT: 0x4017
    },

    inputs: new Array(24),  // A, B, Select, Start, Up, Down, Left, Right, 0, 0, 0, 0, 0, 0, 0, 0, Signature, Signature, Signature, Signature, 0, 0, 0, 0 (http://tuxnes.sourceforge.net/nestech100.txt).
    inputIndex: -1,

    constructor: function(options) {
        this.mobo = options.mobo;
        this.port = options.port;
        this.displayDevice = options.displayDevice;
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
                self.inputs[0] = 1;
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_A, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[0] = 0;
            }, 'keyup');

            // NES B button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_B, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[1] = 1;
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_B, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[1] = 0;
            }, 'keyup');

            // NES Select button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_SELECT, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[2] = 1;
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_SELECT, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[2] = 0;
            }, 'keyup');

            // NES Start button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_START, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[3] = 1;
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_START, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[3] = 0;
            }, 'keyup');

            // NES up button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_UP, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[4] = 1;
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_UP, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[4] = 0;
            }, 'keyup');

            // NES down button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_DOWN, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[5] = 1;
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_DOWN, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[5] = 0;
            }, 'keyup');

            // NES left button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_LEFT, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[6] = 1; 
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_LEFT, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[6] = 0;
            }, 'keyup');

            // NES right button.
            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_RIGHT, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[7] = 1;
            }, 'keydown');

            mousetrap.bind(Controller.CONTROLLER_1_BUTTON_RIGHT, function(e) {
                e.stopPropagation();
                e.preventDefault();
                self.inputs[7] = 0;
            }, 'keyup');
        } else if (this.port == Controller.CONTROLLER_2_PORT) {

        }
    },

    reset: function() {
        this.inputIndex = -1;
    },

    getNextInput: function(index) {
        var val = this.inputs[++this.inputIndex];

        if (this.inputIndex > 7) {
            val = 1;
        }

        return val;
    },

    dump: function() {

    }
});
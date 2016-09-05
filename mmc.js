var MMC0 = Class({
    $const: {

    },

    constructor: function(mobo) {
        this.mobo = mobo;
    },

    load: function() {
        this.mobo.ram.writeTo(0x8000, this.mobo.rom.readPRG(0));
        this.mobo.ram.writeTo(0xC000, this.mobo.rom.readPRGLastBank());
    },

    dump: function() {

    }
});


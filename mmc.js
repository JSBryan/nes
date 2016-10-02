var MMC0 = Class({
    $const: {

    },

    mapperName: 'UNROM',  // UNROM Switch.

    constructor: function(mobo) {
        this.mobo = mobo;
    },

    load: function() {
        // Read PRG data.
        this.mobo.ram.writeTo(0x8000, this.mobo.rom.readPRG(0));
        this.mobo.ram.writeTo(0xC000, this.mobo.rom.readPRGLastBank());

        // Read CHR data.
        this.mobo.ppu.vram.writeTo(0x0000, this.mobo.rom.readCHR(0));
        this.mobo.ppu.vram.writeTo(0x1000, this.mobo.rom.readCHR(1));
        this.mobo.ppu.loadTiles();
    },

    dump: function() {
        
    }
});
var MMC = Class({
    $const: {

    },

    constructor: function(options) {
        this.mobo = options.mobo;
        this.rom = options.rom;
        this.firstPRGBank = -1;
        this.secondPRGBank = -1;
    },

    load: function() {
        this.mobo.mmc = this;       // Let other components access ROM infomation.
    },

    cpuRegWrite: function(address, value) {
        var value = (_.isArray(value) ? value[0] : value);

        if (address >= 0x8000 && address <= 0xFFFF) {
            if (this.firstPRGBank != value) {
                this.mobo.ram.writeTo(0x8000, this.mobo.rom.readPRG(value));
                this.firstPRGBank = value;
            }
        }
    },

    dump: function() {

    }
});

var MMC0 = Class(MMC, {
    $const: {

    },

    mapperName: 'UNROM',  // UNROM Switch.

    constructor: function(options) {
        MMC0.$super.call(this, options);
    },

    load: function() {
        MMC0.$superp.load.call(this);

        // Read PRG data.
        this.mobo.ram.writeTo(0x8000, this.mobo.rom.readPRG(0));
        this.mobo.ram.writeTo(0xC000, this.mobo.rom.readPRGLastBank());

        // Read CHR data.
        if (this.rom.numOfCHR > 0) {
            this.mobo.ppu.vram.writeTo(0x0000, this.mobo.rom.readCHR(0));
            this.mobo.ppu.vram.writeTo(0x1000, this.mobo.rom.readCHR(1));
        }        
    },

    dump: function() {
        
    }
});

var MMC2 = Class(MMC, {
    $const: {

    },

    mapperName: 'UNROM',  // UNROM Switch.

    constructor: function(options) {
        MMC2.$super.call(this, options);
    },

    load: function() {
        MMC2.$superp.load.call(this);

        // Read PRG data.
        if (this.rom.numOfPRG > 1) {
            this.mobo.ram.writeTo(0x8000, this.mobo.rom.readPRG(0));
            this.mobo.ram.writeTo(0xC000, this.mobo.rom.readPRGLastBank());
        } else {
            this.mobo.ram.writeTo(0xC000, this.mobo.rom.readPRG(0));
        }
    },

    
    dump: function() {
        
    }
});

var MMC3 = Class(MMC, {
    $const: {

    },

    mapperName: 'UNROM',  // UNROM Switch.

    constructor: function(options) {
        MMC3.$super.call(this, options);
    },

    load: function() {
        MMC3.$superp.load.call(this);

        // Read PRG data.
        if (this.rom.numOfPRG > 1) {
            this.mobo.ram.writeTo(0x8000, this.mobo.rom.readPRG(0));
            this.mobo.ram.writeTo(0xC000, this.mobo.rom.readPRGLastBank());
        } else {
            this.mobo.ram.writeTo(0xC000, this.mobo.rom.readPRG(0));
        }

        // Read CHR data.
        this.mobo.ppu.vram.writeTo(0x0000, this.mobo.rom.readCHR(0));
        // this.mobo.ppu.vram.writeTo(0x1000, this.mobo.rom.readCHR(1));
    },

    dump: function() {
        
    }
});
var ROM = Class({
    $const: {
        PRG_BANK_SIZE: 16384,    // 16KB per RPG bank.
        CHR_BANK_SIZE: 4096,     // 4KB per CHR bank.
        TRAINER_SIZE: 512        // Trainer size if any.
    },

    constructor: function(options) {
        this.rom = options.rom;              // ROM.
        this.mobo = options.mobo;            // Mobo.
        this.numOfPRG = 0;                   // Number of PRG (program) banks.
        this.numOfCHR = 0;                   // Number of CHR (character) banks.
        this.verticalMirroring = false;      
        this.horizontalMirroring = false;    
        this.fourScreenVRAM= false;
        this.batteryRAM = false;
        this.hasTrainer = false;
        this.lowerNibbleMapper = 0;
        this.upperNibbleMapper = 0;
        this.nibbleMapper = 0;
        this.prgBanks = [];
        this.chrBanks= [];
        this.mmc = null;
    },

    /*
        Load a ROM and store information about it (http://wiki.nesdev.com/w/index.php/INES).
    */
    load: function() {
        try {
            this.validateHeader();
            this.numOfPRG = this.rom[4];
            this.numOfCHR = this.rom[5];    // Number of 8KB CHR rom.
            this.verticalMirroring = ((this.rom[6] & 1) == 1);
            this.horizontalMirroring = ((this.rom[6] & 1) == 0);
            this.fourScreenVRAM = (this.rom[6] >> 3 == 1);
            this.batteryRAM = (this.rom[6] >> 1 == 1);
            this.hasTrainer = (this.rom[6] >> 2 == 1);
            this.lowerNibbleMapper = this.rom[6] >> 4;
            this.upperNibbleMapper = this.rom[7] >> 4;
            this.nibbleMapper = this.lowerNibbleMapper | this.upperNibbleMapper << 4;
            this.loadPRG();
            this.loadCHR();
            this.dump();
            this.mapMemory();
        } catch(e) {
            throw e;
        }
    },

    /*
        Load program code.
    */
    loadPRG: function() {
        var i = 0,
            j = 0,
            startingByte = 16;

        if (this.hasTrainer) {
            startingByte += ROM.TRAINER_SIZE;
        }

        for (i = 0; i < this.numOfPRG; i++) {
            this.prgBanks.push(i);
            this.prgBanks[i] = [];

            for (j = 0; j < ROM.PRG_BANK_SIZE; j++) {
                this.prgBanks[i].push(this.rom[startingByte + j]);
            }

            startingByte += ROM.PRG_BANK_SIZE;
        }
    },

    /*
        Load character code.
    */
    loadCHR: function() {
        var i = 0,
            j = 0,
            startingByte = 16 + this.numOfPRG * ROM.PRG_BANK_SIZE;

        if (this.hasTrainer) {
            startingByte += ROM.TRAINER_SIZE;
        }

        this.chrBanks = new Array(this.numOfCHR * 2);

        for (i = 0; i < this.chrBanks.length; i++) {
            this.chrBanks[i] = [];

            for (j = 0; j < ROM.CHR_BANK_SIZE; j++) {
                this.chrBanks[i].push(this.rom[startingByte++]);
            }
        }
    },

    validateHeader: function() {
        var firstByte = String.fromCharCode(this.rom[0]),
            secondByte = String.fromCharCode(this.rom[1]),
            thirdByte = String.fromCharCode(this.rom[2]),
            fourthByte = this.rom[3];

        if (firstByte != 'N' || secondByte != 'E' || thirdByte != 'S' || fourthByte != 0x1A) {
            throw new Error ('Invalid ROM file.');
        }
    },

    mapMemory: function() {
        var options = {
                mobo: this.mobo,
                rom: this
            };

        try {
            this.mmc = eval('new MMC' + this.nibbleMapper + '(options)');
            this.mmc.load();
        } catch(e) {
            console.log ('Mapper not implemented.', this.nibbleMapper);
            throw e;
        }
    },

    readPRG: function(bank) {
        if (bank < this.prgBanks.length) {
            return this.prgBanks[bank];
        } else {
            throw new Error ('Invalid RPG bank at ' + bank);
        }
    },

    readPRGLastBank: function() {
        return this.prgBanks[this.prgBanks.length - 1];
    },

    readCHR: function(bank) {
        if (bank < this.chrBanks.length) {
            return this.chrBanks[bank];
        } else {
            throw new Error ('Invalid CHR bank at ' + bank);
        }
    },

    dump: function() {
        var dumpMap = {
                numOfPRG: 'Number of PRG banks',
                numOfCHR: 'Number of CHR banks',
                verticalMirroring: 'Vertical mirroring',
                horizontalMirroring: 'Horizontal mirroring',
                fourScreenVRAM: 'Use four screen VRAM',
                batteryRAM: 'Use battery RAM',
                hasTrainer: 'Has trainer program',
                nibbleMapper: 'MMC number'
            };

        console.log('ROM dump:');
        _.each(this, function(val, index) {
            if (dumpMap[index]) {
                console.log(dumpMap[index], val);
            }
        });
    }
});
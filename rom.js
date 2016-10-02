var ROM = Class({
    $const: {
        PRG_BANK_SIZE: 16384,    // 16KB per RPG bank.
        CHR_BANK_SIZE: 4092,     // 4KB per CHR bank.
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
            this.verticalMirroring = (this.rom[6] & 0x01 == 0);
            this.horizontalMirroring = (this.rom[6] & 0x01 == 1);
            this.fourScreenVRAM = (this.rom[6] & 0x08 > 0);
            this.batteryRAM = (this.rom[6] & 0x02 == 1);
            this.hasTrainer = (this.rom[6] & 0x04 == 1);
            this.lowerNibbleMapper = this.rom[6] >> 4;
            this.upperNibbleMapper = this.rom[7] & 0xF;
            this.nibbleMapper = this.lowerNibbleMapper | this.upperNibbleMapper;
            this.loadPRG();
            this.loadCHR();
            this.mapMemory();
            this.dump();
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

        for (i = 0; i < this.numOfCHR * 2; i++) {   // 4KB per bank but number of CHAR bank stores in ROM is per 8KB. So times 2.
            this.chrBanks.push(i);
            this.chrBanks[i] = [];

            for (j = 0; j < ROM.CHR_BANK_SIZE; j++) {
                this.chrBanks[i].push(this.rom[startingByte + j]);
            }

            startingByte += ROM.CHR_BANK_SIZE;
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
        try {
            this.mmc = eval('new MMC' + this.nibbleMapper + '(this.mobo)');
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
            throw new Error ('Invalid RPG bank.');
        }
    },

    readPRGLastBank: function() {
        return this.prgBanks[this.prgBanks.length - 1];
    },

    readCHR: function(bank) {
        if (bank < this.chrBanks.length) {
            return this.chrBanks[bank];
        } else {
            throw new Error ('Invalid CHR bank.');
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
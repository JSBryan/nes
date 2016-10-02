var RAM = Class({
    $const: {
        RAM_SIZE: 0x10000   // 64KB
    },

    constructor: function(options) {
        this.mobo = options.mobo;
        this.memory = new Array(RAM.RAM_SIZE);
    },

    load: function() {
        this.reset();
    },

	/*  
        Reset main memory (http://nesdev.com/NESDoc.pdf, page 11).
    */
    reset: function() {
        var i = 0;

        this.memory.length = 0;

        // RAM.
        for (i = 0; i < 0x2000; i++) {
            this.memory[i] = 0xFF;
        }

        // I/O registers.
        for (i = 0x2000; i < 0x4020; i++) {
            this.memory[i] = 0x00;
        }

        // Expansion ROM.
        for (i = 0x4020; i < 0x6000; i++) {
            this.memory[i] = 0x00;
        }

        // SRAM.
        for (i = 0x6000; i < 0x8000; i++) {
            this.memory[i] = 0xFF;
        }

        // PRG-ROM.
        for (i = 0x8000; i < 0x10000; i++) {
            this.memory[i] = 0x00;
        }
    },

    writeTo: function(address, data) {
    	var i = 0;

    	for (i = 0; i < data.length; i++) {
    		this.memory[address + i] = data[i];
    	}
    },

    readFrom: function(address) {
        try {
            return this.memory[address];
        } catch(e) {
            console.log('Invalid memory address.', address);
            throw e;
        }
    },

    dump: function() {
        console.log('RAM content:', this.memory);
    }
});
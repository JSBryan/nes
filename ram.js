var RAM = Class({
    $const: {

    },

    memory: null,

    constructor: function() {

    },

    load: function() {
        this.reset();
    },

	/*  
        Reset main memory (http://nesdev.com/NESDoc.pdf, page 11).
    */
    reset: function() {
        var i = 0;

        delete this.memory;
        this.memory = new Array(0x10000);

        for (i = 0; i < 0x2000; i++) {
            this.memory[i] = 0xFF;
        }

        for (i = 0x2000; i < 0x8000; i++) {
            this.memory[i] = 0;
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
            console.log('Invalie memory address.', address);
            throw e;
        }
    },

    dump: function() {

    }
});
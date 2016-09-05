var CPU = Class({
    $const: {
        PROGRAM_COUNTER_START: 0x8000,
        STACK_POINTER_START: 0x0100,
        STACK_POINTER_END: 0x01FF,
        ADDR_MODE_ZERO_PAGE: 0,         // Address modes. http://nesdev.com/NESDoc.pdf, Appendix E.
        ADDR_MODE_ZERO_PAGE_X: 1,
        ADDR_MODE_ZERO_PAGE_Y: 2,
        ADDR_MODE_ABSOLUTE: 3,
        ADDR_MODE_ABSOLUTE_X: 4,
        ADDR_MODE_ABSOLUTE_Y: 5,
        ADDR_MODE_INDIRECT: 6,
        ADDR_MODE_IMPLIED: 7,
        ADDR_MODE_ACCUMULATOR: 8,
        ADDR_MODE_IMMEDIATE: 9,
        ADDR_MODE_RELATIVE: 10,
        ADDR_MODE_INDEXED_INDIRECT: 11,
        ADDR_MODE_INDIRECT_INDEXED: 12
    },

    ops: _.range(255),
    opInstances: {},

    constructor: function(options) {
        this.mobo = options.mobo;   // Mobo.
        this.pc_reg = null;         // Program counter register.
        this.sp_reg = null;         // Stack pointer register.
        this.ps_reg = null;         // Processor status register.
        this.acc_reg = null;        // Accumulator register.
        this.x_reg = null;          // X index register.
        this.y_reg = null;          // Y index register.

        this.negative_flag = null;  // Processor negative status flag (bit 7).
        this.overflow_flag = null;  // Processor overflow status flag (bit 6).
        this.unused_flag = 1;       // Processor unused status flag (bit 5).
        this.break_flag = null;     // Processor break status flag (bit 4).
        this.decimal_mode_flag = null;   // Process decimal mode status flag (bit 3).
        this.interrupt_disabled_flag = null;    // Process interrupt disabled status flag (bit 2).
        this.zero_flag = null;      // Processor zero status flag (bit 1).
        this.carry_flag = null;     // Processor carry status flag (bit 0).
    },

    load: function() {
        this.reset();
        this.loadOpCodes();
    },

    /*
        Load Op codes and store its information (http://obelisk.me.uk/6502/reference.html).
    */
    loadOpCodes: function() {
        // ADC
        this.ops[0x69] = {instruction: 'ADC', addrMode: CPU.ADDR_MODE_IMMEDIATE, bytes: 2, cycles: 2};
        this.ops[0x65] = {instruction: 'ADC', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0x75] = {instruction: 'ADC', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 4};
        this.ops[0x6D] = {instruction: 'ADC', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};
        this.ops[0x7D] = {instruction: 'ADC', addrMode: CPU.ADDR_MODE_ABSOLUTE_X, bytes: 3, cycles: 4};
        this.ops[0x79] = {instruction: 'ADC', addrMode: CPU.ADDR_MODE_ABSOLUTE_Y, bytes: 3, cycles: 4};
        this.ops[0x61] = {instruction: 'ADC', addrMode: CPU.ADDR_MODE_INDIRECT_INDEXED, bytes: 2, cycles: 6};
        this.ops[0x71] = {instruction: 'ADC', addrMode: CPU.ADDR_MODE_INDEXED_INDIRECT, bytes: 2, cycles: 5};

        // AND
        this.ops[0x29] = {instruction: 'AND', addrMode: CPU.ADDR_MODE_IMMEDIATE, bytes: 2, cycles: 2};
        this.ops[0x25] = {instruction: 'AND', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0x35] = {instruction: 'AND', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 4};
        this.ops[0x2D] = {instruction: 'AND', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};
        this.ops[0x3D] = {instruction: 'AND', addrMode: CPU.ADDR_MODE_ABSOLUTE_X, bytes: 3, cycles: 4};
        this.ops[0x39] = {instruction: 'AND', addrMode: CPU.ADDR_MODE_ABSOLUTE_Y, bytes: 3, cycles: 4};
        this.ops[0x21] = {instruction: 'AND', addrMode: CPU.ADDR_MODE_INDIRECT_INDEXED, bytes: 2, cycles: 6};
        this.ops[0x31] = {instruction: 'AND', addrMode: CPU.ADDR_MODE_INDEXED_INDIRECT, bytes: 2, cycles: 5};
        
        // ASL
        this.ops[0x0A] = {instruction: 'ASL', addrMode: CPU.ADDR_MODE_ACCUMULATOR, bytes: 1, cycles: 2};
        this.ops[0x06] = {instruction: 'ASL', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 5};
        this.ops[0x16] = {instruction: 'ASL', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 6};
        this.ops[0x0E] = {instruction: 'ASL', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 6};
        this.ops[0x1E] = {instruction: 'ASL', addrMode: CPU.ADDR_MODE_INDIRECT_INDEXED, bytes: 3, cycles: 7};

        // BCC
        this.ops[0x90] = {instruction: 'BCC', addrMode: this.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BCS
        this.ops[0xB0] = {instruction: 'BCS', addrMode: this.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BEQ
        this.ops[0xF0] = {instruction: 'BEQ', addrMode: this.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BIT
        this.ops[0x24] = {instruction: 'BIT', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0x2C] = {instruction: 'BIT', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};

        // BMI
        this.ops[0x30] = {instruction: 'BMI', addrMode: this.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BNE
        this.ops[0xD0] = {instruction: 'BNE', addrMode: this.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BPL
        this.ops[0x10] = {instruction: 'BPL', addrMode: this.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BRK
        this.ops[0x00] = {instruction: 'BRK', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 7};

        // BVC
        this.ops[0x50] = {instruction: 'BVC', addrMode: this.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BVS
        this.ops[0x70] = {instruction: 'BVS', addrMode: this.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // CLC
        this.ops[0x18] = {instruction: 'CLC', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // CLD
        this.ops[0xD8] = {instruction: 'CLD', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // CLI
        this.ops[0x58] = {instruction: 'CLI', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // CLV
        this.ops[0xB8] = {instruction: 'CLV', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // CMP
        this.ops[0xC9] = {instruction: 'CMP', addrMode: CPU.ADDR_MODE_IMMEDIATE, bytes: 2, cycles: 2};
        this.ops[0xC5] = {instruction: 'CMP', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0xD5] = {instruction: 'CMP', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 4};
        this.ops[0xCD] = {instruction: 'CMP', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};
        this.ops[0xDD] = {instruction: 'CMP', addrMode: CPU.ADDR_MODE_ABSOLUTE_X, bytes: 3, cycles: 4};
        this.ops[0xD9] = {instruction: 'CMP', addrMode: CPU.ADDR_MODE_ABSOLUTE_Y, bytes: 3, cycles: 4};
        this.ops[0xC1] = {instruction: 'CMP', addrMode: CPU.ADDR_MODE_INDIRECT_INDEXED, bytes: 2, cycles: 6};
        this.ops[0xD1] = {instruction: 'CMP', addrMode: CPU.ADDR_MODE_INDEXED_INDIRECT, bytes: 2, cycles: 5};

        // CPX
        this.ops[0xE0] = {instruction: 'CPX', addrMode: CPU.ADDR_MODE_IMMEDIATE, bytes: 2, cycles: 2};
        this.ops[0xE4] = {instruction: 'CPX', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0xEC] = {instruction: 'CPX', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};

        // CPY
        this.ops[0xC0] = {instruction: 'CPY', addrMode: CPU.ADDR_MODE_IMMEDIATE, bytes: 2, cycles: 2};
        this.ops[0xC4] = {instruction: 'CPY', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0xCC] = {instruction: 'CPY', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};

        // DEC
        this.ops[0xC6] = {instruction: 'DEC', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 5};
        this.ops[0xD6] = {instruction: 'DEC', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 6};
        this.ops[0xCE] = {instruction: 'DEC', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 6};
        this.ops[0xDE] = {instruction: 'DEC', addrMode: CPU.ADDR_MODE_ABSOLUTE_X, bytes: 3, cycles: 7};

        // DEX
        this.ops[0xCA] = {instruction: 'DEX', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // DEY
        this.ops[0x88] = {instruction: 'DEY', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // EOR
        this.ops[0x49] = {instruction: 'EOR', addrMode: CPU.ADDR_MODE_IMMEDIATE, bytes: 2, cycles: 2};
        this.ops[0x45] = {instruction: 'EOR', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0x55] = {instruction: 'EOR', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 4};
        this.ops[0x4D] = {instruction: 'EOR', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};
        this.ops[0x5D] = {instruction: 'EOR', addrMode: CPU.ADDR_MODE_ABSOLUTE_X, bytes: 3, cycles: 4};
        this.ops[0x59] = {instruction: 'EOR', addrMode: CPU.ADDR_MODE_ABSOLUTE_Y, bytes: 3, cycles: 4};
        this.ops[0x41] = {instruction: 'EOR', addrMode: CPU.ADDR_MODE_INDIRECT_INDEXED, bytes: 2, cycles: 6};
        this.ops[0x51] = {instruction: 'EOR', addrMode: CPU.ADDR_MODE_INDEXED_INDIRECT, bytes: 2, cycles: 5};

        // INC
        this.ops[0xE6] = {instruction: 'INC', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 5};
        this.ops[0xF6] = {instruction: 'INC', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 6};
        this.ops[0xEE] = {instruction: 'INC', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 6};
        this.ops[0xFE] = {instruction: 'INC', addrMode: CPU.ADDR_MODE_ABSOLUTE_X, bytes: 3, cycles: 7};

        // INX
        this.ops[0xE8] = {instruction: 'INX', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // INY
        this.ops[0xC8] = {instruction: 'INY', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // JMP
        this.ops[0x4C] = {instruction: 'JMP', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 3};
        this.ops[0x6C] = {instruction: 'JMP', addrMode: CPU.ADDR_MODE_INDIRECT, bytes: 3, cycles: 5};

        // JSR
        this.ops[0x20] = {instruction: 'JSR', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 6};

        // LDA
        this.ops[0xA9] = {instruction: 'LDA', addrMode: CPU.ADDR_MODE_IMMEDIATE, bytes: 2, cycles: 2};
        this.ops[0xA5] = {instruction: 'LDA', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0xB5] = {instruction: 'LDA', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 4};
        this.ops[0xAD] = {instruction: 'LDA', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};
        this.ops[0xBD] = {instruction: 'LDA', addrMode: CPU.ADDR_MODE_ABSOLUTE_X, bytes: 3, cycles: 4};
        this.ops[0xB9] = {instruction: 'LDA', addrMode: CPU.ADDR_MODE_ABSOLUTE_Y, bytes: 3, cycles: 4};
        this.ops[0xA1] = {instruction: 'LDA', addrMode: CPU.ADDR_MODE_INDIRECT_INDEXED, bytes: 2, cycles: 6};
        this.ops[0xB1] = {instruction: 'LDA', addrMode: CPU.ADDR_MODE_INDEXED_INDIRECT, bytes: 2, cycles: 5};

        // LDX
        this.ops[0xA2] = {instruction: 'LDX', addrMode: CPU.ADDR_MODE_IMMEDIATE, bytes: 2, cycles: 2};
        this.ops[0xA6] = {instruction: 'LDX', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0xB6] = {instruction: 'LDX', addrMode: CPU.ADDR_MODE_ZERO_PAGE_Y, bytes: 2, cycles: 4};
        this.ops[0xAE] = {instruction: 'LDX', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};
        this.ops[0xBE] = {instruction: 'LDX', addrMode: CPU.ADDR_MODE_ABSOLUTE_Y, bytes: 3, cycles: 4};

        // LDY
        this.ops[0xA0] = {instruction: 'LDY', addrMode: CPU.ADDR_MODE_IMMEDIATE, bytes: 2, cycles: 2};
        this.ops[0xA4] = {instruction: 'LDY', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0xB4] = {instruction: 'LDY', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 4};
        this.ops[0xAC] = {instruction: 'LDY', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};
        this.ops[0xBC] = {instruction: 'LDY', addrMode: CPU.ADDR_MODE_ABSOLUTE_XS, bytes: 3, cycles: 4};

        // LSR
        this.ops[0x4A] = {instruction: 'LSR', addrMode: CPU.ADDR_MODE_ACCUMULATOR, bytes: 1, cycles: 2};
        this.ops[0x46] = {instruction: 'LSR', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 5};
        this.ops[0x56] = {instruction: 'LSR', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 6};
        this.ops[0x4E] = {instruction: 'LSR', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 6};
        this.ops[0x5E] = {instruction: 'LSR', addrMode: CPU.ADDR_MODE_ABSOLUTE_XS, bytes: 3, cycles: 7};

        // NOP
        this.ops[0xEA] = {instruction: 'NOP', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // ORA
        this.ops[0x09] = {instruction: 'ORA', addrMode: CPU.ADDR_MODE_IMMEDIATE, bytes: 2, cycles: 2};
        this.ops[0x05] = {instruction: 'ORA', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0x15] = {instruction: 'ORA', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 4};
        this.ops[0x0D] = {instruction: 'ORA', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};
        this.ops[0x1D] = {instruction: 'ORA', addrMode: CPU.ADDR_MODE_ABSOLUTE_X, bytes: 3, cycles: 4};
        this.ops[0x19] = {instruction: 'ORA', addrMode: CPU.ADDR_MODE_ABSOLUTE_Y, bytes: 3, cycles: 4};
        this.ops[0x01] = {instruction: 'ORA', addrMode: CPU.ADDR_MODE_INDIRECT_INDEXED, bytes: 2, cycles: 6};
        this.ops[0x11] = {instruction: 'ORA', addrMode: CPU.ADDR_MODE_INDEXED_INDIRECT, bytes: 2, cycles: 5};

        // PHA
        this.ops[0x48] = {instruction: 'PHA', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 3};

        // PHP
        this.ops[0x08] = {instruction: 'PHP', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 3};

        // PLA
        this.ops[0x68] = {instruction: 'PLA', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 4};

        // PLP
        this.ops[0x28] = {instruction: 'PLP', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 4};

        // ROL
        this.ops[0x2A] = {instruction: 'ROL', addrMode: CPU.ADDR_MODE_ACCUMULATOR, bytes: 1, cycles: 2};
        this.ops[0x26] = {instruction: 'ROL', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 5};
        this.ops[0x36] = {instruction: 'ROL', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 6};
        this.ops[0x2E] = {instruction: 'ROL', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 6};
        this.ops[0x3E] = {instruction: 'ROL', addrMode: CPU.ADDR_MODE_ABSOLUTE_XS, bytes: 3, cycles: 7};

        // ROR
        this.ops[0x6A] = {instruction: 'ROR', addrMode: CPU.ADDR_MODE_ACCUMULATOR, bytes: 1, cycles: 2};
        this.ops[0x66] = {instruction: 'ROR', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 5};
        this.ops[0x76] = {instruction: 'ROR', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 6};
        this.ops[0x6E] = {instruction: 'ROR', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 6};
        this.ops[0x7E] = {instruction: 'ROR', addrMode: CPU.ADDR_MODE_ABSOLUTE_XS, bytes: 3, cycles: 7};

        // RTI
        this.ops[0x40] = {instruction: 'RTI', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 6};

        // RTS
        this.ops[0x60] = {instruction: 'RTS', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 6};

        // SBC
        this.ops[0xE9] = {instruction: 'SBC', addrMode: CPU.ADDR_MODE_IMMEDIATE, bytes: 2, cycles: 2};
        this.ops[0xE5] = {instruction: 'SBC', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0xF5] = {instruction: 'SBC', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 4};
        this.ops[0xED] = {instruction: 'SBC', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};
        this.ops[0xFD] = {instruction: 'SBC', addrMode: CPU.ADDR_MODE_ABSOLUTE_X, bytes: 3, cycles: 4};
        this.ops[0xF9] = {instruction: 'SBC', addrMode: CPU.ADDR_MODE_ABSOLUTE_Y, bytes: 3, cycles: 4};
        this.ops[0xE1] = {instruction: 'SBC', addrMode: CPU.ADDR_MODE_INDIRECT_INDEXED, bytes: 2, cycles: 6};
        this.ops[0xF1] = {instruction: 'SBC', addrMode: CPU.ADDR_MODE_INDEXED_INDIRECT, bytes: 2, cycles: 5};

        // SEC
        this.ops[0x38] = {instruction: 'SEC', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // SED
        this.ops[0xF8] = {instruction: 'SED', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // SEI
        this.ops[0x78] = {instruction: 'SEI', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // STA
        this.ops[0x85] = {instruction: 'STA', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0x95] = {instruction: 'STA', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 4};
        this.ops[0x8D] = {instruction: 'STA', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};
        this.ops[0x9D] = {instruction: 'STA', addrMode: CPU.ADDR_MODE_ABSOLUTE_X, bytes: 3, cycles: 5};
        this.ops[0x99] = {instruction: 'STA', addrMode: CPU.ADDR_MODE_ABSOLUTE_Y, bytes: 3, cycles: 5};
        this.ops[0x81] = {instruction: 'STA', addrMode: CPU.ADDR_MODE_INDIRECT_INDEXED, bytes: 2, cycles: 6};
        this.ops[0x91] = {instruction: 'STA', addrMode: CPU.ADDR_MODE_INDEXED_INDIRECT, bytes: 2, cycles: 6};

        // STX
        this.ops[0x86] = {instruction: 'STX', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0x96] = {instruction: 'STX', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 4};
        this.ops[0x8E] = {instruction: 'STX', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};

        // STY
        this.ops[0x84] = {instruction: 'STY', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0x94] = {instruction: 'STY', addrMode: CPU.ADDR_MODE_ZERO_PAGE_X, bytes: 2, cycles: 4};
        this.ops[0x8C] = {instruction: 'STY', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};

        // TAX
        this.ops[0xAA] = {instruction: 'TAX', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // TAY
        this.ops[0xA8] = {instruction: 'TAY', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // TSX
        this.ops[0xBA] = {instruction: 'TSX', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // TXA
        this.ops[0x8A] = {instruction: 'TXA', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // TXS
        this.ops[0x9A] = {instruction: 'TXS', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        // TYA
        this.ops[0x98] = {instruction: 'TYA', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 2};

        _.each(this.ops, function(op, index) {
            var found = false,
                options = { 
                    cpu: this,
                    op: op
                };

            if (_.isObject(op)) {
                found = this.opInstances[op.instruction];

                if (!found) {
                    try {
                        this.opInstances[op.instruction] = eval('new ' + op.instruction + 'op' + '(options)');
                    } catch(e) {
                        console.log ('Op not implemented.', op.instruction, index);
                        console.log(e.stack);
                    }  
                }
            }
        }.bind(this));
    },

    reset: function() {
        this.pc_reg = CPU.PROGRAM_COUNTER_START;
        this.s_reg = CPU.STACK_POINTER_START;
    },

    run: function() {
        var i = 0;

        try {
            for (i = 0; i < 0x2000; i++) {
                var opCode = this.mobo.ram.readFrom(this.pc_reg),
                    op = this.ops[opCode],
                    opInstance = null;

                if (_.isObject(op)) {
                    opInstance = this.opInstances[op.instruction];
                    opInstance.execute();
                    this.pc_reg += op.bytes;
                } else {
                    throw new Error('Op code not implemented.', opCode);
                }
            }
            
        } catch(e) {
            throw e;
        }
        
    },

    setProcessorStatusRegister: function() {

    },

    dump: function() {

    }
});

var Op = Class({

    constructor: function(options) {
        this.cpu = options.cpu;
        this.op = options.op;
    },

    execute: function() {
        console.log('Executing instruction', this.op.instruction);
    },

    toString: function() {

    }
});

var ADCop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var ANDop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var ASLop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var BCCop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var BCSop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var BEQop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var BITop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var BMIop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var BNEop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var BPLop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var BRKop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var BVCop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var BVSop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var CLCop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var CLDop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var CLIop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var CLVop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var CMPop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var CPXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var CPYop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var DECop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var DEXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var DEYop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var EORop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var INCop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var INXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var INYop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var JMPop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var JSRop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var LDAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var LDXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var LDYop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var LSRop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var NOPop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var ORAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var PHAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var PHPop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var PLAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var PLPop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var ROLop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var RORop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var RTIop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var RTSop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var SBCop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var SECop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var SEDop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var SEIop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var STAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var STXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var STYop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var TAXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var TAYop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var TSXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var TXAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var TXSop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});

var TYAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);
    }
});
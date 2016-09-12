var CPU = Class({
    $const: {
        PROGRAM_COUNTER_START: 0x8000,
        STACK_POINTER_START: 0x01FF,                // Stack pointer address, store in the order of top to bottom in NES.
        STACK_POINTER_END: 0x0100,
        ADDR_MODE_ZERO_PAGE: 'Zero Page',         // Memory address modes (http://nesdev.com/NESDoc.pdf, Appendix E).
        ADDR_MODE_ZERO_PAGE_X: 'Zero Page X',
        ADDR_MODE_ZERO_PAGE_Y: 'Zero Page Y',
        ADDR_MODE_ABSOLUTE: 'Absolute',
        ADDR_MODE_ABSOLUTE_X: 'Absolute X',
        ADDR_MODE_ABSOLUTE_Y: 'Absolute Y',
        ADDR_MODE_INDIRECT: 'Indirect',
        ADDR_MODE_IMPLIED: 'Implied',
        ADDR_MODE_ACCUMULATOR: 'Accumulator',
        ADDR_MODE_IMMEDIATE: 'Immediate',
        ADDR_MODE_RELATIVE: 'Relative',
        ADDR_MODE_INDEXED_INDIRECT: 'Indexed Indirect',
        ADDR_MODE_INDIRECT_INDEXED: 'Indirect Indexed'
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

        this.isInterrupted = null;
        this.runningAddress = 0x00; // For debugging.
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
        this.ops[0x90] = {instruction: 'BCC', addrMode: CPU.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BCS
        this.ops[0xB0] = {instruction: 'BCS', addrMode: CPU.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BEQ
        this.ops[0xF0] = {instruction: 'BEQ', addrMode: CPU.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BIT
        this.ops[0x24] = {instruction: 'BIT', addrMode: CPU.ADDR_MODE_ZERO_PAGE, bytes: 2, cycles: 3};
        this.ops[0x2C] = {instruction: 'BIT', addrMode: CPU.ADDR_MODE_ABSOLUTE, bytes: 3, cycles: 4};

        // BMI
        this.ops[0x30] = {instruction: 'BMI', addrMode: CPU.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BNE
        this.ops[0xD0] = {instruction: 'BNE', addrMode: CPU.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BPL
        this.ops[0x10] = {instruction: 'BPL', addrMode: CPU.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BRK
        this.ops[0x00] = {instruction: 'BRK', addrMode: CPU.ADDR_MODE_IMPLIED, bytes: 1, cycles: 7};

        // BVC
        this.ops[0x50] = {instruction: 'BVC', addrMode: CPU.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

        // BVS
        this.ops[0x70] = {instruction: 'BVS', addrMode: CPU.ADDR_MODE_RELATIVE, bytes: 2, cycles: 2};

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
                        throw e;
                    }  
                }
            }
        }.bind(this));
    },

    reset: function() {
        this.pc_reg = CPU.PROGRAM_COUNTER_START;
        this.sp_reg = CPU.STACK_POINTER_START;
        this.ps_reg = null;         // Processor status register.
        this.acc_reg = 0x00;        // Accumulator register.
        this.x_reg = 0x00;          // X index register.
        this.y_reg = 0x00;          // Y index register.
    },

    pushStack: function(data) {
        this.mobo.ram.writeTo(this.sp_reg, [data]);
        this.sp_reg--;
    },

    popStack: function() {
        var val = 0x00;

        this.sp_reg++;
        val = this.mobo.ram.readFrom(this.sp_reg);
        this.mobo.ram.writeTo(this.sp_reg, [0x00]);

        return val;
    },

    run: function() {
        var i = 0;

        try {
            for (i = 0; i < 0x2000; i++) {
                var opCode = this.mobo.ram.readFrom(this.pc_reg),
                    op = this.ops[opCode],
                    opInstance = null,
                    operandAddr = null;

                this.runningAddress = this.pc_reg;

                if (_.isObject(op)) {
                    opInstance = this.opInstances[op.instruction];
                    opInstance.execute();
                    opInstance.dump();
                } else {
                    throw new Error('Op code ' + opCode + ' not implemented.');
                }
            }
            
        } catch(e) {
            throw e;
        }
    },

    setProcessStatusRegister: function(value) {
        this.carry_flag = value & 1;
        this.zero_flag = (value >> 1 & 1 == 0 ? 1 : 0);
        this.interrupt_disabled_flag = value >> 2 & 1;
        this.decimal_mode_flag = value >> 3 & 1;
        this.break_flag = value >> 4 & 1;
        this.unused_flag = value >> 5 & 1;
        this.overflow_flag = value >> 6 & 1;
        this.negative_flag = value >> 7 & 1;
    },

    getProcessorStatusRegister: function() {
        return this.carry_flag | this.zero_flag << 1 | this.interrupt_disabled_flag << 2 | this.decimal_mode_flag << 3 | this.break_flag << 4 | this.unused_flag << 5 | this.overflow_flag << 6 | this.negative_flag << 7;
    },

    dump: function() {

    }
});

/*
    Op code instruction classes (http://obelisk.me.uk/6502/reference.html, http://users.telenet.be/kim1-6502/6502/proman.html).
*/
var Op = Class({
    constructor: function(options) {
        this.cpu = options.cpu;
        this.op = options.op;
        this.operand = 0x00;
        this.operandAddr = 0x00;
    },

    execute: function() {
        this.getOperand();
        this.cpu.pc_reg += this.op.bytes;    // Incrase program counter register by the size of instruction.
    },

    getOperand: function() {
        var temp = 0x00,
            firstOperand = this.cpu.mobo.ram.readFrom(this.cpu.pc_reg + 1),     // First operand after op code.
            secondOperand = this.cpu.mobo.ram.readFrom(this.cpu.pc_reg + 2),    // Second operand after first operand if any.
            address16Bits = 0x0000,     // Use to combine two 8 bits value into one 16 bits value.
            signedByte = 0x00;          // Signed byte converted from an unsigned byte.

        // Memory address modes (http://nesdev.com/NESDoc.pdf, Appendix E).
        switch (this.op.addrMode) {
            case CPU.ADDR_MODE_ZERO_PAGE:
                this.operandAddr = firstOperand;
                this.operand = this.cpu.mobo.ram.readFrom(this.operandAddr);
            break;

            case CPU.ADDR_MODE_ZERO_PAGE_X:
                this.operandAddr = firstOperand + this.cpu.x_reg;
                this.operand = this.cpu.mobo.ram.readFrom(this.operandAddr) & 0xFF;
            break;  

            case CPU.ADDR_MODE_ZERO_PAGE_Y:
                this.operandAddr = firstOperand + this.cpu.y_reg;
                this.operand = this.cpu.mobo.ram.readFrom(this.operandAddr) & 0xFF;
            break;  

            case CPU.ADDR_MODE_ABSOLUTE:
                this.operandAddr = firstOperand | secondOperand << 8;
                this.operand = this.cpu.mobo.ram.readFrom(this.operandAddr);
            break;

            case CPU.ADDR_MODE_ABSOLUTE_X:
                this.operandAddr = firstOperand | secondOperand << 8;
                this.operand = this.cpu.mobo.ram.readFrom(this.operandAddr) + this.cpu.x_reg;
            break;

            case CPU.ADDR_MODE_ABSOLUTE_Y:
                this.operandAddr = firstOperand | secondOperand << 8;
                this.operand = this.cpu.mobo.ram.readFrom(this.operandAddr) + this.cpu.y_reg;
            break;

            case CPU.ADDR_MODE_INDIRECT:
                address16Bits = firstOperand | secondOperand << 8;
                firstOperand = this.cpu.mobo.ram.readFrom(address16Bits);
                secondOperand = this.cpu.mobo.ram.readFrom(address16Bits + 1);
                this.operandAddr = firstOperand | secondOperand << 8;
                this.operand = this.cpu.mobo.ram.readFrom(this.operandAddr);
            break;

            case CPU.ADDR_MODE_IMPLIED:

            break;

            case CPU.ADDR_MODE_ACCUMULATOR:
                this.operandAddr = firstOperand;
                this.operand = firstOperand;
            break;

            case CPU.ADDR_MODE_IMMEDIATE:
                this.operandAddr = firstOperand;
                this.operand = firstOperand;
            break;

            case CPU.ADDR_MODE_RELATIVE:
                this.operandAddr = firstOperand;
                this.operandAddr = (this.operandAddr > 127 ? this.operandAddr - 256 : this.operandAddr);
                this.operandAddr = this.cpu.pc_reg + 2 + this.operandAddr;  // Offset starting at the end of this instruction size (2 bytes).
                this.operand = firstOperand;
            break;

            case CPU.ADDR_MODE_INDEXED_INDIRECT:
                this.operandAddr = firstOperand;
                firstOperand = this.cpu.mobo.ram.readFrom(this.operandAddr + this.cpu.x_reg);
                secondOperand = this.cpu.mobo.ram.readFrom(this.operandAddr + this.cpu.x_reg + 1);
                this.operandAddr = firstOperand | secondOperand << 8;
                this.operand = this.cpu.mobo.ram.readFrom(this.operandAddr);
            break;

            case CPU.ADDR_MODE_INDIRECT_INDEXED:
                this.operandAddr = firstOperand;
                firstOperand = this.cpu.mobo.ram.readFrom(this.operandAddr);
                secondOperand = this.cpu.mobo.ram.readFrom(this.operandAddr + 1);
                this.operandAddr = (firstOperand | secondOperand << 8) + this.cpu.y_reg;
                this.operand = this.cpu.mobo.ram.readFrom(this.operandAddr);
            break;

            default:
        }
    },

    dump: function() {
        var prefix = '$';

        if (this.op.addrMode == CPU.ADDR_MODE_IMMEDIATE || this.op.addrMode == CPU.ADDR_MODE_INDIRECT_INDEXED) {
            prefix = '#' + prefix;
        }

        console.log((this.cpu.runningAddress).toString(16).toUpperCase(), this.op.instruction, prefix + (this.operandAddr).toString(16).toUpperCase(), this.op.addrMode);
    }
});

var ADCop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        var temp = 0x00;

        BRKop.$superp.execute.call(this);

        temp = this.cpu.acc_reg + this.operand + this.cpu.carry_flag;
        this.cpu.carry_flag = (temp > 0xFF ? 1 : 0);
        this.cpu.zero_flag = (temp == 0 ? 1 : 0);
        this.cpu.overflow_flag = ((this.cpu.acc_reg ^ temp) & (this.operand ^ temp) & 0x80 != 0 ? 1 : 0)   // (M^result)&(N^result)&0x80 is non zero, from http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
        this.cpu.negative_flag = temp >> 7 & 1;
        this.cpu.acc_reg = temp;
    }   
});

var ANDop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.acc_reg = this.cpu.acc_reg & this.operand;
        this.cpu.zero_flag = (this.cpu.acc_reg == 0x00 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.acc_reg >> 7 & 1;
    }
});

var ASLop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        if (this.op.addrMode == CPU.ADDR_MODE_ACCUMULATOR) {
            this.cpu.carry_flag = this.cpu.acc_reg >> 7 & 1;
            this.cpu.acc_reg = this.cpu.acc_reg << 1;
            this.cpu.zero_flag = (this.cpu.acc_reg == 0x00 ? 1 : 0);
            this.cpu.negative_flag = this.cpu.acc_reg >> 7 & 1;
        } else {
            this.cpu.carry_flag = this.operand >> 7 & 1;
            this.operand = this.operand << 1;
            this.zero_flag = (this.operand == 0x00 ? 1 : 0);
            this.cpu.negative_flag = this.operand >> 7 & 1;
            this.cpu.mobo.ram.writeTo(this.operandAddr, [this.operand]);
        }
    }
});

var BCCop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        if (!this.cpu.carry_flag) {
            this.cpu.pc_reg = this.operandAddr;
        }
    }
});

var BCSop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        if (this.cpu.carry_flag) {
            this.cpu.pc_reg = this.operandAddr;
        }
    }
});

var BEQop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        if (this.cpu.zero_flag) {
            this.cpu.pc_reg = this.operandAddr;
        }
    }
});

var BITop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.zero_flag = this.operand & this.cpu.acc_reg;
        this.cpu.overflow_flag = this.operand >> 6 & 1;
        this.cpu.negative_flag = this.operand >> 7 & 1;
    }
});

var BMIop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        if (this.cpu.negative_flag) {
            this.cpu.pc_reg = this.operandAddr;
        }
    }
});

var BNEop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        if (!this.cpu.zero_flag) {
            this.cpu.pc_reg = this.operandAddr;
        }
    }
});

var BPLop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        if (!this.cpu.negative_flag) {
            this.cpu.pc_reg = this.operandAddr;
        }
    }
});

var BRKop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        var temp = this.cpu.pc_reg + 1,
            IRQLowAddressValue = 0x00,
            IRQHighAddressValue = 0x00;

        BRKop.$superp.execute.call(this);

        this.cpu.pushStack(temp >> 8 & 0xFF);    // High bits.
        this.cpu.pushStack(temp & 0xFF);         // Low bits.
        this.pushStack(this.cpu.getProcessorStatusRegister());

        IRQLowAddressValue = this.cpu.mobo.ram.readFrom(0xFFFE);
        IRQHighAddressValue = this.cpu.mobo.ram.readFrom(0xFFFF);
        this.cpu.pc_reg = IRQLowAddressValue | IRQHighAddressValue << 8;

        this.cpu.break_flag = 1;
    }
});

var BVCop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        if (!this.cpu.overflow_flag) {
            this.cpu.pc_reg = this.operandAddr;
        }
    }
});

var BVSop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        if (this.cpu.overflow_flag) {
            this.cpu.pc_reg = this.operandAddr;
        }
    }
});

var CLCop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.carry_flag = 0;
    }
});

var CLDop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.decimal_mode_flag = 0;
    }
});

var CLIop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.interrupt_disabled_flag = 0;
    }
});

var CLVop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.overflow_flag = 0;
    }
});

var CMPop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.carry_flag = (this.cpu.acc_reg >= this.operand ? 1 : 0);
        this.cpu.zero_flag = (this.cpu.acc_reg == this.operand ? 1 : 0);
        this.cpu.negative_flag = (this.cpu.acc_reg - this.operand) >> 7 & 1;
    }
});

var CPXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.carry_flag = (this.cpu.x_reg >= this.operand ? 1 : 0);
        this.cpu.zero_flag = (this.cpu.x_reg == this.operand ? 1 : 0);
        this.cpu.negative_flag = (this.cpu.x_reg - this.operand) >> 7 & 1;
    }
});

var CPYop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.carry_flag = (this.cpu.y_reg >= this.operand ? 1 : 0);
        this.cpu.zero_flag = (this.cpu.y_reg == this.operand ? 1 : 0);
        this.cpu.negative_flag = (this.cpu.y_reg - this.operand) >> 7 & 1;
    }
});

var DECop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.operand = this.operand - 1;
        this.cpu.zero_flag = (this.operand == 0 ? 1 : 0);
        this.cpu.negative_flag = (this.operand >> 7 & 1);
    }
});

var DEXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.x_reg--;
        this.cpu.zero_flag = (this.cpu.x_reg == 0 ? 1: 0);
        this.cpu.negative_flag = this.cpu.x_reg >> 7 & 1;
    }
});

var DEYop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.y_reg--;
        this.cpu.zero_flag = (this.cpu.y_reg == 0 ? 1: 0);
        this.cpu.negative_flag = this.cpu.y_reg >> 7 & 1;
    }
});

var EORop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.acc_reg = this.operand ^ this.cpu.acc_reg;
        this.cpu.zero_flag = (this.cpu.acc_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.acc_reg >> 7 & 1;
    }
});

var INCop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.operand++;
        this.cpu.mobo.ram.writeTo(this.operandAddr, [this.operand]);
        this.cpu.zero_flag = (this.operand == 0 ? 1 : 0);
        this.cpu.negative_flag = this.operand >> 7 & 1;
    }
});

var INXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.x_reg++;
        this.cpu.zero_flag = (this.cpu.x_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.x_reg >> 7 & 1;
    }
});

var INYop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.y_reg++;
        this.cpu.zero_flag = (this.cpu.y_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.y_reg >> 7 & 1;
    }
});

var JMPop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.pc_reg = this.operandAddr;
    }
});

var JSRop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.pushStack(this.cpu.pc_reg >> 8 & 0xFF);    // High bits.
        this.cpu.pushStack(this.cpu.pc_reg & 0xFF);         // Low bits.
        this.cpu.pc_reg = this.operandAddr;
    }
});

var LDAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.acc_reg = this.operand;
        this.cpu.zero_flag = (this.cpu.acc_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.acc_reg >> 7 & 1;
    }
});

var LDXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.x_reg = this.operand;
        this.cpu.zero_flag = (this.cpu.x_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.x_reg >> 7 & 1;
    }
});

var LDYop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.y_reg = this.operand;
        this.cpu.zero_flag = (this.cpu.y_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.y_reg >> 7 & 1;
    }
});

var LSRop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        if (this.instruction.addrMode == this.cpu.ADDR_MODE_ACCUMULATOR) {
            this.cpu.acc_reg >>= 1;
            this.cpu.carry_flag = this.cpu.acc_reg & 1;
            this.cpu.zero_flag = (this.cpu.acc_reg == 0 ? 1 : 0);
            this.cpu.negative_flag = this.cpu.acc_reg >> 7 & 1;
        } else {
            this.operand >>= 1;
            this.cpu.carry_flag = this.operand & 1;
            this.cpu.mobo.ram.writeTo(this.operandAddr, [this.operand]);
            this.cpu.zero_flag = (this.operand == 0 ? 1 : 0);
            this.cpu.negative_flag = this.operand >> 7 & 1;
        }
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

        this.cpu.acc_reg = this.operand | this.cpu.acc_reg;
        this.cpu.zero_flag = (this.cpu.acc_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.acc_reg >> 7 & 1;
    }
});

var PHAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.pushStack(this.cpu.acc_reg);
    }
});

var PHPop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.pushStack(this.cpu.getProcessorStatusRegister());
    }
});

var PLAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.acc_reg = this.cpu.popStack();
        this.cpu.zero_flag = (this.cpu.acc_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.acc_reg >> 7 & 1;
    }
});

var PLPop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.setProcessStatusRegister(this.cpu.popStack());
    }
});

var ROLop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        if (this.op.addrMode == this.cpu.ADDR_MODE_ACCUMULATOR) {
            this.cpu.carry_flag = this.cpu.acc_reg >> 7 & 1;
            this.cpu.acc_reg = this.cpu.acc_reg << 1 + temp;
            this.cpu.zero_flag = (this.cpu.acc_reg == 0 ? 1 : 0);
            this.cpu.negative_flag = this.cpu.acc_reg >> 7 & 1;
        } else {
            this.cpu.carry_flag = this.operand >> 7 & 1;
            this.operand = this.operand << 1 + temp;
            this.cpu.zero_flag = (this.operand == 0 ? 1 : 0);
            this.cpu.negative_flag = this.operand >> 7 & 1;
        }
    }
});

var RORop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        var temp = 0;

        BRKop.$superp.execute.call(this);

        temp = this.cpu.carry_flag;

        if (this.op.addrMode == this.cpu.ADDR_MODE_ACCUMULATOR) {
            this.cpu.carry_flag = this.cpu.acc_reg >> 7 & 1;
            this.cpu.acc_reg = this.cpu.acc_reg >> 1 + temp;
            this.cpu.zero_flag = (this.cpu.acc_reg == 0 ? 1 : 0);
            this.cpu.negative_flag = this.cpu.acc_reg >> 7 & 1;
        } else {
            this.cpu.carry_flag = this.operand >> 7 & 1;
            this.operand = this.operand >> 1 + temp;
            this.cpu.zero_flag = (this.operand == 0 ? 1 : 0);
            this.cpu.negative_flag = this.operand >> 7 & 1;
        }
    }
});

var RTIop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.setProcessStatusRegister(this.cpu.popStack());
        this.cpu.pc_reg = this.cpu.popStack();
    }
});

var RTSop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.pc_reg = this.cpu.popStack();
        this.cpu.pc_reg += this.cpu.popStack() << 8;    // Combine both low bits and high bits into a 16-bits value. See JSRop.
    }
});

var SBCop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        var temp = 0x00;

        BRKop.$superp.execute.call(this);

        temp = this.cpu.acc_reg - this.operand - (1 - this.cpu.carry_flag);
        this.cpu.carry_flag = (temp < 0 ? 0 : 1);
        this.cpu.zero_flag = (temp == 0 ? 1 : 0);
        this.cpu.overflow_flag = ((this.cpu.acc_reg ^ temp) & (this.operand ^ temp) & 0x80 != 0 ? 1 : 0)   // (M^result)&(N^result)&0x80 is non zero, from http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
        this.cpu.negative_flag = temp >> 7 & 1;
        this.cpu.acc_reg = temp;
    }
});

var SECop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.carry_flag = 1;
    }
});

var SEDop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.decimal_mode_flag = 1;
    }
});

var SEIop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.interrupt_disabled_flag = 1;
    }
});

var STAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.mobo.ram.writeTo(this.operandAddr, [this.cpu.acc_reg]);
    }
});

var STXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.mobo.ram.writeTo(this.operandAddr, [this.cpu.x_reg]);
    }
});

var STYop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.mobo.ram.writeTo(this.operandAddr, [this.cpu.y_reg]);
    }
});

var TAXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.x_reg = this.cpu.acc_reg;
        this.cpu.zero_flag = (this.cpu.x_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.x_reg >> 7 & 1;
    }
});

var TAYop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.y_reg = this.cpu.acc_reg;
        this.cpu.zero_flag = (this.cpu.y_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.y_reg >> 7 & 1;
    }
});

var TSXop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.x_reg = this.cpu.sp_reg;
        this.cpu.zero = (this.cpu.x_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.x_reg >> 7 & 1;
    }
});

var TXAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.acc_reg = this.cpu.sp_reg;
        this.cpu.zero = (this.cpu.acc_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.acc_reg >> 7 & 1;
    }
});

var TXSop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.sp_reg = this.cpu.x_reg;
    }
});

var TYAop = Class(Op, {
    constructor: function(options) {
        BRKop.$super.call(this, options);
    },

    execute: function() {
        BRKop.$superp.execute.call(this);

        this.cpu.acc_reg = this.cpu.y_reg;
        this.cpu.zero = (this.cpu.acc_reg == 0 ? 1 : 0);
        this.cpu.negative_flag = this.cpu.acc_reg >> 7 & 1;
    }
});
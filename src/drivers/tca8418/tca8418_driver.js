const i2c = require('i2c-bus');
const { Gpio } = require('onoff');
//const { Gpio } = require('pigpio');
const { exec } = require('child_process');

const TCA8418_ADDR = 0x34;

/* TCA8418 hardware limits */
const TCA8418_MAX_ROWS	    = 8;
const TCA8418_MAX_COLS	    = 10;

/* TCA8418 register offsets */
const REG_CFG			    = 0x01;
const REG_INT_STAT		    = 0x02;
const REG_KEY_LCK_EC		= 0x03;
const REG_KEY_EVENT_A		= 0x04;
const REG_KEY_EVENT_B		= 0x05;
const REG_KEY_EVENT_C		= 0x06;
const REG_KEY_EVENT_D		= 0x07;
const REG_KEY_EVENT_E		= 0x08;
const REG_KEY_EVENT_F		= 0x09;
const REG_KEY_EVENT_G		= 0x0A;
const REG_KEY_EVENT_H		= 0x0B;
const REG_KEY_EVENT_I		= 0x0C;
const REG_KEY_EVENT_J		= 0x0D;
const REG_KP_LCK_TIMER	    = 0x0E;
const REG_UNLOCK1		    = 0x0F;
const REG_UNLOCK2		    = 0x10;
const REG_GPIO_INT_STAT1	= 0x11;
const REG_GPIO_INT_STAT2	= 0x12;
const REG_GPIO_INT_STAT3	= 0x13;
const REG_GPIO_DAT_STAT1	= 0x14;
const REG_GPIO_DAT_STAT2	= 0x15;
const REG_GPIO_DAT_STAT3	= 0x16;
const REG_GPIO_DAT_OUT1	    = 0x17;
const REG_GPIO_DAT_OUT2	    = 0x18;
const REG_GPIO_DAT_OUT3	    = 0x19;
const REG_GPIO_INT_EN1	    = 0x1A;
const REG_GPIO_INT_EN2	    = 0x1B;
const REG_GPIO_INT_EN3	    = 0x1C;
const REG_KP_GPIO1		    = 0x1D;
const REG_KP_GPIO2		    = 0x1E;
const REG_KP_GPIO3		    = 0x1F;
const REG_GPI_EM1		    = 0x20;
const REG_GPI_EM2		    = 0x21;
const REG_GPI_EM3		    = 0x22;
const REG_GPIO_DIR1		    = 0x23;
const REG_GPIO_DIR2		    = 0x24;
const REG_GPIO_DIR3		    = 0x25;
const REG_GPIO_INT_LVL1	    = 0x26;
const REG_GPIO_INT_LVL2	    = 0x27;
const REG_GPIO_INT_LVL3	    = 0x28;
const REG_DEBOUNCE_DIS1	    = 0x29;
const REG_DEBOUNCE_DIS2	    = 0x2A;
const REG_DEBOUNCE_DIS3	    = 0x2B;
const REG_GPIO_PULL1		= 0x2C;
const REG_GPIO_PULL2		= 0x2D;
const REG_GPIO_PULL3		= 0x2E;

/* TCA8418 bit definitions */
const CFG_AI			    = 0x80; //BIT(7)
const CFG_GPI_E_CFG		    = 0x40; //BIT(6)
const CFG_OVR_FLOW_M		= 0x20; //BIT(5)
const CFG_INT_CFG		    = 0x10; //BIT(4)
const CFG_OVR_FLOW_IEN	    = 0x08; //BIT(3)
const CFG_K_LCK_IEN		    = 0x04; //BIT(2)
const CFG_GPI_IEN		    = 0x02; //BIT(1)
const CFG_KE_IEN		    = 0x01; //BIT(0)

const INT_STAT_CAD_INT	    = 0x10; //BIT(4)
const INT_STAT_OVR_FLOW_INT	= 0x08; //BIT(3)
const INT_STAT_K_LCK_INT	= 0x04; //BIT(2)
const INT_STAT_GPI_INT	    = 0x02; //BIT(1)
const INT_STAT_K_INT		= 0x01; //BIT(0)

/* TCA8418 register masks */
const KEY_LCK_EC_KEC		= 0x7;
const KEY_EVENT_CODE		= 0x7f;
const KEY_EVENT_VALUE		= 0x80;

/*
 * Configure the TCA8418 for keypad operation
 */
const tca8418_configure = (rows, cols, callbackFunc) => {
    let reg, error;

    /* set GPIO 17 */
 
    exec('raspi-gpio set 17 pn');

    const tcaInt = new Gpio(17, 'in', 'falling');
    tcaInt.watch((err, value) => {
        if(err){
            throw err;
        }
	    tca8418_read_byte(REG_KEY_EVENT_A)
        .then(reg => {
            if (reg > 0x80){
                callbackFunc(reg);
            }
        })
        tca8418_write_byte(0x02,0xff);
    });

    /* Assemble a mask for row and column registers */
    reg  =  ~(~0 << rows);
    reg += (~(~0 << cols)) << 8;

    /* Write config register, if this fails assume device not present */
    /* Set registers to keypad mode */
    return tca8418_write_byte(REG_CFG, CFG_INT_CFG | CFG_OVR_FLOW_IEN | CFG_KE_IEN).
    then(() => tca8418_write_byte(REG_KP_GPIO1, reg)).
    then(() => tca8418_write_byte(REG_KP_GPIO2, reg >> 8)).
    then(() => tca8418_write_byte(REG_KP_GPIO3, reg >> 16)).
    /* Enable column debouncing */
    then(() => tca8418_write_byte(REG_DEBOUNCE_DIS1, reg)).
    then(() => tca8418_write_byte(REG_DEBOUNCE_DIS2, reg >> 8)).
    then(() => tca8418_write_byte(REG_DEBOUNCE_DIS3, reg >> 16)).
    then(() => tca8418_write_byte(REG_INT_STAT, 0xff));
}

const tca8418_write_byte = (reg, val) => {
    return i2c.openPromisified(1).
        then(i2c1 => i2c1.writeByte(TCA8418_ADDR, 0xff & reg, 0xff & val).
            then(() => i2c1.close())
    );
}

/*
 * Read a byte from the TCA8418
 */
const tca8418_read_byte = (reg) => {
    return i2c.openPromisified(1).
        then(i2c1 => i2c1.readByte(TCA8418_ADDR, reg).
            then((val) => {
                return i2c1.close().then(() => val);
            })
    );
}

module.exports = {
    "tca8418_configure": tca8418_configure,
} 

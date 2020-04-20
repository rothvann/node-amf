const { AMF } = require('../amf');


test('a', () => {
    let hex = '03 00 04 6e 61 6d 65 02 00 04 4d 69 6b 65 00 03 61 67 65 00 40 3e 00 00 00 00 00 00 00 05 61 6c 69 61 73 02 00 04 4d 69 6b 65 00 00 09'.replace(/\s/g, '');
    let buf = Buffer.from(hex, 'hex');
    let decoder = new AMF();
    let res = decoder.decode(buf)[0];
    console.log(res);
});
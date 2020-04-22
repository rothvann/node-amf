const AMF  = require('../amf');

const decoder = new AMF();

test('AMF0 Number', () => {
    let amf0 = '00 41 ce 7d 0d ca 00 00 00'.replace(/\s/g, '');
    let buf = Buffer.from(amf0, 'hex');
    let res = decoder.decode(buf);
    expect(res).toEqual(1023024020);
});

test('AMF0 Boolean', () => {
    let amf0 = '01 01'.replace(/\s/g, '');
    let buf = Buffer.from(amf0, 'hex');
    let res = decoder.decode(buf);
    expect(res).toBeTruthy();
});

test('AMF0 String', () => {
    let amf0 = '02 00 0c 41 4d 46 30 20 42 6f 6f 6c 65 61 6e'.replace(/\s/g, '');
    let buf = Buffer.from(amf0, 'hex');
    let res = decoder.decode(buf);
    expect(res).toEqual('AMF0 Boolean');
});

test('AMF0 Object', () => {
    let amf0 = '03 00 04 6e 61 6d 65 02 00 04 4d 69 6b 65 00 03 61 67 65 00 40 3e 00 00 00 00 00 00 00 05 61 6c 69 61 73 02 00 04 4d 69 6b 65 00 00 09'.replace(/\s/g, '');
    let buf = Buffer.from(amf0, 'hex');
    let res = decoder.decode(buf);
    expect(res).toEqual({name: 'Mike', age: 30, alias: 'Mike'});
});

test('AMF0 Null', () => {
    let amf0 = '05'.replace(/\s/g, '');
    let buf = Buffer.from(amf0, 'hex');
    let res = decoder.decode(buf);
    expect(res).toBeNull();
});

test('AMF0 ECMA Array', () => {
    let amf0 = '08 00 00 00 00 00 04 6e 61 6d 65 02 00 04 4d 69 6b 65 00 03 61 67 65 00 40 3e 00 00 00 00 00 00 00 05 61 6c 69 61 73 02 00 04 4d 69 6b 65 00 00 09'.replace(/\s/g, '');
    let buf = Buffer.from(amf0, 'hex');
    let res = decoder.decode(buf);
    expect(res).toEqual({name: 'Mike', age: 30, alias: 'Mike'});
});

test('AMF0 Strict Array', () => {
    let amf0 = '0a 00 00 00 04 02 00 0c 41 4d 46 30 20 42 6f 6f 6c 65 61 6e 00 41 ce 7d 0d ca 00 00 00 01 01 0b 00 00 41 d7 a7 cf 97 40 00 00'.replace(/\s/g, '');
    let buf = Buffer.from(amf0, 'hex');
    let res = decoder.decode(buf);
    //string number boolean date
    expect(res).toEqual(['AMF0 Boolean', 1023024020, true, new Date(1587494493)]);
});

test('AMF0 Date', () => {
    let amf0 = '0b 00 00 41 d7 a7 cf 97 40 00 00'.replace(/\s/g, '');
    let buf = Buffer.from(amf0, 'hex');
    //1587494493
    let res = decoder.decode(buf);
    expect(res).toEqual(new Date(1587494493));
});

test('AMF0 Long String', () => {
    let amf0 = '0c 00 00 00 10 41 4d 46 30 20 4c 6f 6e 67 20 53 74 72 69 6e 67'.replace(/\s/g, '');
    let buf = Buffer.from(amf0, 'hex');
    let res = decoder.decode(buf);
    expect(res).toEqual('AMF0 Long String');
});

test('AMF0 XML', () => {
    let xml_string = 
        `<?xml version="1.0"?>
        <Catalog>
           <Book id="bk101">
              <Author>Garghentini, Davide</Author>
              <Title>XML Developer's Guide</Title>
              <Genre>Computer</Genre>
              <Price>44.95</Price>
              <PublishDate>2000-10-01</PublishDate>
              <Description>An in-depth look at creating applications
              with XML.</Description>
           </Book>
           <Book id="bk102">
              <Author>Garcia, Debra</Author>
              <Title>Midnight Rain</Title>
              <Genre>Fantasy</Genre>
              <Price>5.95</Price>
              <PublishDate>2000-12-16</PublishDate>
              <Description>A former architect battles corporate zombies,
              an evil sorceress, and her own childhood to become queen
              of the world.</Description>
           </Book>
        </Catalog>`.replace(/\s/g, '');
    let xml = Buffer.from(xml_string, 'utf8');
    let amf0 = Buffer.from('0f'.replace(/\n/g, ''), 'hex');
    let length = Buffer.alloc(4);
    length.writeUIntBE(xml_string.length, 0, 4);this.position++;
    let buf = Buffer.concat([amf0, length, xml]);
    let res = decoder.decode(buf);
});

test('AMF0 Typed Object', () => {
    
});


test('AMF3 Integer', () => {
    let binary = 
    ['11010101 10101010 11010101 01010101'.replace(/\s/g, ''),
    '11010101 10101010 01010101'.replace(/\s/g, ''),
    '11010101 00101010'.replace(/\s/g, ''),
    '01010101'.replace(/\s/g, ''),];
    
    for(let i = 0; i < 4; i++) {
        
        
    }
});






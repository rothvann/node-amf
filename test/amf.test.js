const AMF = require('../amf');

const amfEncoder = new AMF();

function testDecode(hexString) {
  const buffer = Buffer.from(hexString, 'hex');
  return amfEncoder.decode(buffer);
}

function testEncodeAndDecode(obj) {
  const amf0 = amfEncoder.encodeAMF0(obj);
  return amfEncoder.decode(amf0);
}

describe('AMF0', () => {
  test('Number', () => {
    const orig = [1023024020];
    const res = testEncodeAndDecode(orig);
    expect(res).toEqual(orig);
  });

  test('Boolean', () => {
    const orig = [true];
    const res = testEncodeAndDecode(orig);
    expect(res).toEqual(orig);
  });

  test('String', () => {
    const orig = ['Random String'];
    const res = testEncodeAndDecode(orig);
    expect(res).toEqual(orig);
  });

  test('Object', () => {
    const orig = [{ name: 'Mike', age: 30, alias: 'Mike' }];
    const res = testEncodeAndDecode(orig);
    expect(res).toEqual(orig);
  });

  test('Null', () => {
    const amf0 = '05'.replace(/\s/g, '');
    const res = testDecode(amf0);
    expect(res[0]).toBeNull();
  });

  test('ECMA Array', () => {
    const amf0 = '08 00 00 00 00 00 04 6e 61 6d 65 02 00 04 4d 69 6b 65 00 03 61 67 65 00 40 3e 00 00 00 00 00 00 00 05 61 6c 69 61 73 02 00 04 4d 69 6b 65 00 00 09'.replace(/\s/g, '');
    const res = testDecode(amf0);
    expect(res).toEqual([{ name: 'Mike', age: 30, alias: 'Mike' }]);
  });

  test('Strict Array', () => {
    const amf0 = '0a 00 00 00 04 02 00 0c 41 4d 46 30 20 42 6f 6f 6c 65 61 6e 00 41 ce 7d 0d ca 00 00 00 01 01 0b 00 00 41 d7 a7 cf 97 40 00 00'.replace(/\s/g, '');
    const res = testDecode(amf0);
    // string number boolean date
    expect(res).toEqual([['AMF0 Boolean', 1023024020, true, new Date(1587494493)]]);
  });

  test('Date', () => {
    const date = Date.now();
    const amf0 = Buffer.alloc(11);
    amf0.write('0b 00 00'.replace(/\s/g, ''), 'hex');
    amf0.writeDoubleBE(date, 3, 8);
    const res = amfEncoder.decode(amf0);
    // 1587494493
    expect(res).toEqual([new Date(date)]);
  });

  test('Long String', () => {
    const amf0 = '0c 00 00 00 10 41 4d 46 30 20 4c 6f 6e 67 20 53 74 72 69 6e 67'.replace(/\s/g, '');
    const res = testDecode(amf0);
    expect(res).toEqual(['AMF0 Long String']);
  });

  test('XML', () => {
    const xmlString = `<?xml version="1.0"?>
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
            </Catalog>`.replace(/[>]\s+/g, '>');
    const xml = Buffer.from(xmlString, 'utf8');
    const amf0 = Buffer.from('0f'.replace(/\n/g, ''), 'hex');
    const length = Buffer.alloc(4);
    length.writeUIntBE(xmlString.length, 0, 4);
    const buffer = Buffer.concat([amf0, length, xml]);
    const res = amfEncoder.decode(buffer);
    expect(res).toEqual([xmlString]);
  });

  test('Typed Object', () => {

  });
});

describe('AMF3', () => {
  test('Undefined', () => {
    const amf3 = '1100';
    const res = testDecode(amf3);
    expect(res[0]).toBeUndefined();
  });

  test('Null', () => {
    const amf3 = '1101';
    const res = testDecode(amf3);
    expect(res[0]).toBeNull();
  });

  test('Boolean False', () => {
    const amf3 = '1102';
    const res = testDecode(amf3);
    expect(res[0]).toEqual(false);
  });

  test('Boolean True', () => {
    const amf3 = '1103';
    const res = testDecode(amf3);
    expect(res[0]).toEqual(true);
  });


  test('Integer', () => {
    const binary = [
      [0x11, 0x04, 0b11010101, 0b10101010, 0b11010101, 0b01010101],
      [0x11, 0x04, 0b11010101, 0b10101010, 0b01010101],
      [0x11, 0x04, 0b11010101, 0b00101010],
      [0x11, 0x04, 0b01010101]];

    const result = [
      357913941,
      1398101,
      10922,
      85];

    for (let i = 0; i < 4; i++) {
      const res = testDecode(binary[i]);
      expect(res).toEqual([result[i]]);
    }
  });

  test('Double', () => {
    const amf3 = '11 05 40 c8 1c d6 e6 31 f8 a1'.replace(/\s/g, '');
    const res = testDecode(amf3);
    expect(res).toEqual([12345.6789]);
  });

  test('String', () => {
    const string = Buffer.from('dynamic', 'utf8');
    const length = Buffer.from([string.length * 2 + 1], 'hex');
    let amf3 = Buffer.from('1106', 'hex');
    amf3 = Buffer.concat([amf3, length, string]);
    const res = amfEncoder.decode(amf3);
    expect(res).toEqual(['dynamic']);
  });

  test('XMLDocument', () => {
    const xmlString = `<?xml version="1.0"?>
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
            </Catalog>`.replace(/[>]\s+/g, '>');
    const xml = Buffer.from(xmlString, 'utf8');
    const length = Buffer.from([0b10001010, 0b00111111]);
    let amf3 = Buffer.from('1107', 'hex');
    amf3 = Buffer.concat([amf3, length, xml]);
    const res = amfEncoder.decode(amf3);
    expect(res).toEqual([xmlString]);
  });

  test('Date', () => {
    const date = Date.now();
    const amf3 = Buffer.alloc(11);
    amf3[0] = 0x11;
    amf3[1] = 0x08;
    amf3[2] = 0b00000001;
    amf3.writeDoubleBE(date, 3, 8);
    const res = amfEncoder.decode(amf3);
    expect(res).toEqual([new Date(date)]);
  });

  // 11 06 21 74 65 73 74 20 61 6d 66 33 20 73 74 72 69 6e 67 'test amf3 string'
  // 11 06 09 64 61 74 65 'date'
  // 08 01 42 77 1c 3b d8 23 b0 00    1588126908987 date milliseconds
  // 11 06 09 74 65 73 74 'test'
  test('Array', () => {
    let amf3 = Buffer.from([0x11, 0x09, 0b00001001], 'hex');
    let associative = '09 74 65 73 74 06 21 74 65 73 74 20 61 6d 66 33 20 73 74 72 69 6e 67 09 64 61 74 65 08 01 42 77 1c 3b d8 23 b0 00 00'.replace(/\s/g, '');
    associative = Buffer.from(associative, 'hex');
    let dense = '06 21 74 65 73 74 20 61 6d 66 33 20 73 74 72 69 6e 67 06 09 74 65 73 74 06 09 64 61 74 65 08 01 42 77 1c 3b d8 23 b0 00'.replace(/\s/g, '');
    dense = Buffer.from(dense, 'hex');
    amf3 = Buffer.concat([amf3, associative, dense]);
    const res = amfEncoder.decode(amf3);
    expect(res).toEqual([{ associative: { test: 'test amf3 string', date: new Date(1588126908987) }, dense: ['test amf3 string', 'test', 'date', new Date(1588126908987)] }]);
  });


  test('Object', () => {
    const amf3 = Buffer.from([0x11, 0x0a, 0b00101011], 'hex');
    let members = '00 09 74 65 73 74 06 21 74 65 73 74 20 61 6d 66 33 20 73 74 72 69 6e 67 09 64 61 74 65 08 01 42 77 1c 3b d8 23 b0 00'.replace(/\s/g, '');
    members = Buffer.from(members, 'hex');
    let dynamic = '0f 64 79 6e 61 6d 69 63 06 1d 64 79 6e 61 6d 69 63 20 73 74 72 69 6e 67 00'.replace(/\s/g, '');
    dynamic = Buffer.from(dynamic, 'hex');

    const res = amfEncoder.decode(Buffer.concat([amf3, members, dynamic]));
    expect(res).toEqual([{
      test: 'test amf3 string', date: new Date(1588126908987), dynamic: 'dynamic string', name: '',
    }]);
  });

  test('XML', () => {
    const xmlString = `<?xml version="1.0"?>
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
            </Catalog>`.replace(/[>]\s+/g, '>');
    const xml = Buffer.from(xmlString, 'utf8');
    const length = Buffer.from([0b10001010, 0b00111111]);
    let amf3 = Buffer.from('1107', 'hex');
    amf3 = Buffer.concat([amf3, length, xml]);
    const res = amfEncoder.decode(amf3);
    expect(res).toEqual([xmlString]);
  });

  test('Byte Array', () => {
    const amf3 = Buffer.from([0x11, 0x0c, 0b00010101, 0x11, 0x21, 0x31, 0x41, 0x51, 0x61, 0x71, 0x81, 0x91, 0x10], 'hex');
    const res = amfEncoder.decode(amf3);
    expect(res).toEqual([Buffer.from([0x11, 0x21, 0x31, 0x41, 0x51, 0x61, 0x71, 0x81, 0x91, 0x10])]);
  });
});

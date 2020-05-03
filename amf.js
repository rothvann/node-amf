class AMF {
  constructor() {
    this.isVersion0 = true;
    this.position = 0;

    this.AMF0 = {
      NUMBER: 0x00,
      BOOLEAN: 0x01,
      STRING: 0x02,
      OBJECT: 0x03,
      NULL: 0x05,
      ECMA_ARRAY: 0x08,
      OBJECT_END: 0x09,
      STRICT_ARRAY: 0x0a,
      DATE: 0x0b,
      LONG_STRING: 0x0c,
      XML: 0X0f,
      TYPED_OBJECT: 0x10,
      AMF3: 0x11,
    };

    this.AMF3 = {
      UNDEFINED: 0x00,
      NULL: 0x01,
      FALSE: 0x02,
      TRUE: 0x03,
      INTEGER: 0x04,
      DOUBLE: 0x05,
      STRING: 0x06,
      XML: 0x07,
      DATE: 0x08,
      ARRAY: 0x09,
      OBJECT: 0x0a,
      XML_END: 0x0b,
      BYTE_ARRAY: 0x0c,
    };

    this.objTable = [];
    this.stringTable = [];
    this.traitTable = [];
  }

  decodeAMF0Obj(buffer) {
    const result = {};
    while (true) {
      const key = this.readAMF0Value(buffer, this.AMF0.STRING);
      if (key == '') {
        this.position += 2;
        return result;
      }

      const type = buffer[this.position];
      this.position++;

      if (type === this.AMF0.OBJECT) {
        result[key] = this.decodeAMF0Obj(buffer);
      } else {
        result[key] = this.readAMF0Value(buffer, type);
      }
    }
  }

  readAMF0Value(buffer, type) {
    switch (type) {
      case this.AMF0.NUMBER:
        this.position += 8;
        return buffer.readDoubleBE(this.position - 8);
      case this.AMF0.BOOLEAN:
        this.position += 1;
        return !!buffer.readUIntBE(this.position - 1, 1);
      case this.AMF0.STRING: {
        const length = buffer.readUIntBE(this.position, 2);
        this.position += 2;
        const key = buffer.toString('utf8', this.position, this.position + length);
        this.position += length;
        return key;
      }
      case this.AMF0.NULL:
        return null;
      case this.AMF0.LONG_STRING:
      case this.AMF0.XML: {
        const length = buffer.readUIntBE(this.position, 4);
        this.position += 4;
        const key = buffer.toString('utf8', this.position, this.position + length);
        this.position += length;
        return key;
      }
      case this.AMF0.DATE:
        this.position += 10;
        return new Date(buffer.readDoubleBE(this.position - 8));
      case this.AMF0.AMF3:
        this.isVersion0 = false;
        return;
      default:
        throw new Error(`Unknown AMF0 Value ${type}`);
    }
  }

  readAMF0StrictArray(buffer) {
    const length = buffer.readUIntBE(this.position, 4);
    this.position += 4;
    const result = [];
    for (let i = 0; i < length; i++) {
      const type = buffer[this.position];
      this.position++;
      result.push(this.readAMF0Value(buffer, type));
    }
    return result;
  }

  readAMF3Array(buffer) {
    let length = this.readU29(buffer);
    if (length & 1 === 0) {
      const index = length >> 1;
    } else {
      length >>= 1;
      const associative = {};
      while (true) {
        const key = this.readAMF3Value(buffer, this.AMF3.STRING);
        if (key == '') {
          break;
        } else {
          const type = buffer[this.position];
          this.position++;
          associative[key] = this.readAMF3Value(buffer, type);
        }
      }
      const dense = [];
      for (let i = 0; i < length; i++) {
        const type = buffer[this.position];
        this.position++;
        dense.push(this.readAMF3Value(buffer, type));
      }
      return { dense, associative };
    }
  }

  readAMF3Object(buffer) {
    const flags = this.readU29(buffer);
    let traits;
    if (flags & 0b1 === 0) {
      // U29O-ref
      const index = flags >> 1;
      // return ref
    } else if ((flags & 0b10) == 0) {
      const index = flags >> 1;
      traits = this.traitTable[index];
      // set traits from ref
    } else if ((flags & 0b100) == 0) {
      if (flags & 0b1000 === 0) {
        traits = 0b00;
      } else {
        traits = 0b10;
      }
    } else {
      traits = 0b01;
    }

    if ((traits & 1) == 0) {
      const length = flags >> 4;
      const result = {};

      const name = this.readAMF3Value(buffer, this.AMF3.STRING);
      result.name = name;


      for (let i = 0; i < length; i++) {
        const key = this.readAMF3Value(buffer, this.AMF3.STRING);
        const type = buffer[this.position];
        this.position++;
        result[key] = this.readAMF3Value(buffer, type);
      }


      if ((traits & 0b10) != 0) {
        while (true) {
          const key = this.readAMF3Value(buffer, this.AMF3.STRING);
          if (key == '') {
            return result;
          }
          const type = buffer[this.position];
          this.position++;
          result[key] = this.readAMF3Value(buffer, type);
        }
      }

      return result;
    }
    // U29O-traits-ext
    throw new Error('Externalizable not implemented');
  }

  readU29(buffer) {
    let bits = 0;
    let currentByte = buffer.readUIntBE(this.position, 1);
    this.position++;
    bits <<= 7;
    bits |= (currentByte & 0b01111111);
    if (currentByte < 128) {
      return bits;
    }

    currentByte = buffer.readUIntBE(this.position, 1);
    this.position++;

    bits <<= 7;
    bits |= (currentByte & 0b01111111);
    if (currentByte < 128) {
      return bits;
    }

    currentByte = buffer.readUIntBE(this.position, 1);
    this.position++;

    bits <<= 7;
    bits |= (currentByte & 0b01111111);
    if (currentByte < 128) {
      return bits;
    }

    currentByte = buffer.readUIntBE(this.position, 1);
    this.position++;

    bits <<= 8;
    bits |= (currentByte);
    return bits;
  }

  readAMF3Value(buffer, type) {
    switch (type) {
      case this.AMF3.UNDEFINED:
        return undefined;
      case this.AMF3.NULL:
        return null;
      case this.AMF3.FALSE:
        return false;
      case this.AMF3.TRUE:
        return true;
      case this.AMF3.INTEGER:
        return this.readU29(buffer);
      case this.AMF3.DOUBLE:
        this.position += 8;
        return buffer.readDoubleBE(this.position - 8);
      case this.AMF3.STRING: {
        let length = this.readU29(buffer);
        if (length & 1 === 0) {
          const index = length >> 1;
          return this.stringTable[index];
        }
        length >>= 1;
        const key = buffer.toString('utf8', this.position, this.position + length);
        this.position += length;
        this.stringTable.push(key);
        return key;
      }

      case this.AMF3.XMLDocument:
      case this.AMF3.XML: {
        let length = this.readU29(buffer);
        if (length & 1 === 0) {
          const index = length >> 1;
          return this.objTable[index];
        }
        length >>= 1;
        const key = buffer.toString('utf8', this.position, this.position + length);
        this.position += length;
        this.objTable.push(key);
        return key;
      }
      case this.AMF3.DATE: {
        const length = this.readU29(buffer);
        if (length & 1 === 0) {
          const index = length >> 1;
          return this.objTable[index];
        }
        this.position += 8;
        const val = new Date(buffer.readDoubleBE(this.position - 8));
        this.objTable.push(val);
        return val;
      }
      case this.AMF3.BYTE_ARRAY: {
        let length = this.readU29(buffer);
        if (length & 1 === 0) {
          const index = length >> 1;
          // byte array ref
        } else {
          length >>= 1;
          const byteArr = buffer.slice(this.position, this.position + length);
          this.objTable.push(byteArr);
          this.position += length;
          return byteArr;
        }
      }
      default:
        throw new Error(`Unknown AMF3 Value ${type}`);
    }
  }

  decode(buffer) {
    this.isVersion0 = true;
    this.position = 0;

    const result = [];
    while (this.position < buffer.length) {
      const type = buffer[this.position];
      this.position++;
      if (this.isVersion0) {
        switch (type) {
          case this.AMF0.AMF3:
            this.readAMF0Value(buffer, type);
            break;
          case this.AMF0.TYPED_OBJECT:
          case this.AMF0.ECMA_ARRAY: {
            if (type == this.AMF0.TYPED_OBJECT) {
              const name = this.readAMF0Value(buffer, this.AMF0.STRING);
              // Treat as anonymous
            } else {
              this.position += 4;
            }
          }
          case this.AMF0.OBJECT: {
            const val = this.decodeAMF0Obj(buffer);
            this.objTable.push(val);
            result.push(val);
            break;
          }
          case this.AMF0.STRICT_ARRAY: {
            const val = this.readAMF0StrictArray(buffer);
            this.objTable.push(val);
            result.push(val);
            break;
          }
          default:
            result.push(this.readAMF0Value(buffer, type));
            break;
        }
      } else {
        switch (type) {
          case this.AMF3.ARRAY:
            result.push(this.readAMF3Array(buffer));
            break;
          case this.AMF3.OBJECT:
            result.push(this.readAMF3Object(buffer));
            break;
          default:
            result.push(this.readAMF3Value(buffer, type));
            break;
        }
      }
    }
    return result;
  }
}

module.exports = AMF;

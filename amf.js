class AMF {
    constructor() {
        this.is_Ver_0 = true;
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
            AMF3: 0x11    
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
            BYTE_ARRAY: 0x0c
        };
        
        this.objTable = [];
        this.stringTable = [];
        this.traitTable = [];
    }
    
    decodeAMF0Obj(buf) {
        let result = {};
        while(true) {
            let key = this.readAMF0Value(buf, this.AMF0.STRING);
            if(key == '') {
                this.position += 2;
                return result;
            }
            
            let type = buf[this.position];
            this.position++;
            
            switch(type) {
                case this.AMF0.OBJECT_END:
                    return result;
                default:
                    let val = this.readAMF0Value(buf, type);
                    result[key] = val;
            }
        }
    }

    readAMF0Value(buf, type) {
        switch(type) {
            case this.AMF0.NUMBER:
                this.position += 8;
                return buf.readDoubleBE(this.position - 8);
            case this.AMF0.BOOLEAN:
                this.position += 1;
                return !!buf.readUIntBE(this.position - 1, 1);
            case this.AMF0.STRING: {
                let length = buf.readUIntBE(this.position, 2);
                this.position += 2;
                let key = buf.toString('utf8', this.position, this.position + length);
                this.position += length;
                return key;
            }
            case this.AMF0.NULL:
                return null;
            case this.AMF0.LONG_STRING:
            case this.AMF0.XML: {
                let length = buf.readUIntBE(this.position, 4);
                this.position += 4;
                let key = buf.toString('utf8', this.position, this.position + length);
                this.position += length;
                return key;
            }.replace(/\s/g, '');
            case this.AMF0.DATE:
                this.position += 10;
                return new Date(buf.readDoubleBE(this.position - 8));
            case this.AMF0.AMF3: 
                this.is_Ver_0 = false;
                return;            
            default:
                console.log('Unknown AMF0 Value ${type}');
                return null;
        }
    }

    readAMF0StrictArray(buf) {
        let length = buf.readUIntBE(this.position, 4);
        this.position += 4;
        let result = [];
        for(let i = 0; i < length; i++) {
            let type = buf[this.position];
            this.position++;
            result.push(this.readAMF0Value(buf, type));
        }
        return result;
    }
    
    readAMF3Array(buf) {
        let length = this.readU29(buf);
        if(length & 1 == 0) {
            let index = length >> 1;
        } else {
            length = length >> 1;
            let dense = [];
            for(let i = 0; i < length; i++) {
                let type = buf[this.position];
                this.position++;
                dense.push(this.readAMF3Value(buf, type));
            }
            let associative = {};
            while(true) {
                let key = this.readAMF3Value(buf, this.AMF3.STRING);
                if(key == '') {
                    return {dense: dense, associative: associative};
                } else {
                    let type = buf[this.position];
                    this.position++;
                    associative[key] = this.readAMF3Value(buf, type);
                }
            }
        }
    }
    
    readAMF3Object(buf) {
        let flags = this.readU29(buf);
        let traits;
        if(flags & 0b1 == 0) {
            //U29O-ref
            let index = flags >> 1;
            //return ref
            
        } else {
            if(flags & 0b10 == 0) {
                let index = flags >> 1;
                
                //set traits from ref
                
            } else {=
                if(flags & 0b100 == 0) {
                    if(flags & 0b1000 == 0) {
                        traits = 0b00;
                    } else {
                        traits = 0b10;
                    }
                } else {
                    traits = 0b01;
                }
            }
        }
        
        if(traits & 1 == 0) {
            let length = flags >> 4;
            let result = {};
            
            let name = this.readAMF3Value(buf, this.AMF3.STRING);
            result['name'] = name;
            
            
            for(let i = 0; i < length; i++) {
                let key = this.readAMF3Value(buf, this.AMF3.STRING);
                let type = buf[this.position];
                this.position++;
                result[key] = this.readAMF3Value(buf, type);
            }
            
            
           
            if(traits & 0b10 != 0) {
                while(true) {
                    let key = this.readAMF3Value(buf, this.AMF3.STRING);
                    if(key == '') {
                        return result;
                    }
                    let type = buf[this.position];
                    this.position++;
                    result[key] = this.readAMF3Value(buf, type);
                }
            }
            
            return result;
        } else {
            //U29O-traits-ext
            console.log('Externalizable not implemented');
            return null;
        }
            
        
        
    }
    
    readU29(buf) {
        let bits = 0;
        let cur_byte = buf[this.position];
        this.position++;
        bits += (cur_byte & 0b01111111) * Math.pow(2, 24);
        if(cur_byte & 0b10000000) {
            cur_byte = buf[this.position];
            this.position++;
            bits += (cur_byte & 0b01111111) * Math.pow(2, 16);
            if(cur_byte & 0b10000000) {
                cur_byte = buf[this.position];
                this.position++;
                bits += (cur_byte & 0b01111111) * Math.pow(2, 8);
                if(cur_byte & 0b10000000) {
                    cur_byte = buf[this.position];
                    this.position++;                        
                    bits += cur_byte;
                }
            }
        }
        return bits;
    }

    readAMF3Value(buf, type) {
         switch(type) {
            case this.AMF3.UNDEFINED:
                return undefined;
            case this.AMF3.NULL:
                return null;
            case this.AMF3.FALSE:
                return false;
            case this.AMF3.TRUE:
                return true;
            case this.AMF3.INTEGER:
                return this.readU29(buf);
            case this.AMF3.DATE:
                let length = readU29(buf);
                if(length & 1 == 0) {
                    let index = length >> 1;
                    //date ref
                } else {
                    this.position += 8;
                    let val = new Date(buf.readDoubleBE(this.position - 8));
                    objTable.push(val);
                    return val;                    
                }
            case this.AMF3.DOUBLE:
                this.position += 8;
                return new Date(buf.readDoubleBE(this.position - 8));
            case this.AMF3.STRING:
                let length = this.readU29(buf);
                if(length & 1 == 0) {
                    let index = length >> 1;
                    return stringTable[index];
                } else {
                    length = length >> 1;
                    let key = buf.toString('utf8', this.position, this.position + length);
                    this.position += length;
                    stringTable.push(key);
                    return key;
                }
            case this.AMF3.XMLDocument:
            case this.AMF3.XML:
                let length = this.readU29(buf);
                if(length & 1 == 0) {
                    let index = length >> 1;
                    return objTable[index];
                } else {
                    length = length >> 1;
                    let key = buf.toString('utf8', this.position, this.position + length);
                    this.position += length;
                    objTable.push(key);
                    return key;
                }
            case this.AMF3.BYTE_ARRAY:
                let length = this.readU29(buf);
                if(length & 1 == 0) {
                    let index = length >> 1;
                    //byte array ref
                } else {
                    length = length >> 1;
                    let byte_arr = buf.slice(this.position, this.position + length);
                    objTable.push(byte_arr);
                    return byte_arr;
                }
            default:
                console.log('Unknown AMF3 Value ${type}');
                return null;
         }
    }
    
    decode(buf) {
        this.is_Ver_0 = true;
        this.position = 0;
        
        let type = buf[this.position];
        this.position++;
        if(this.is_Ver_0) {
            switch(type) {
                case this.AMF0.AMF3:
                    this.readAMF0Value(buf, type);
                case this.AMF0.TYPED_OBJECT:
                case this.AMF0.ECMA_ARRAY:
                    if(type == this.AMF0.TYPED_OBJECT) {
                        let name = this.readAMF0Value(buf, this.AMF0.STRING);
                        //Treat as anonymous
                    } else {
                        this.position += 4;
                    }
                case this.AMF0.OBJECT:
                    let val = this.decodeAMF0Obj(buf);
                    objTable.push(val);
                    return val;
                case this.AMF0.STRICT_ARRAY:
                    let val = this.readAMF0StrictArray(buf);
                    objTable.push(val);
                    return val;
                default:
                    return this.readAMF0Value(buf, type);
            }
        } else {
            switch(type) {
             case this.AMF3.ARRAY:
                return this.readAMF3Array(buf);
             case this.AMF3.OBJECT:
                return this.readAMF3Object(buf);
             default:
                return this.readAMF3Value(buf, type);
            }
        }
        
        return null;
    }
}

module.exports = AMF;
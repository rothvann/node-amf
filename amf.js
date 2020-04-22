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
                case this.AMF0.NUMBER:
                case this.AMF0.BOOLEAN:
                case this.AMF0.STRING:   
                case this.AMF0.NULL:
                case this.AMF0.LONG_STRING:
                case this.AMF0.XML:
                case this.AMF0.DATE:
                    let val = this.readAMF0Value(buf, type);
                    result[key] = val;
                    break;
                case this.AMF0.OBJECT_END:
                    return result;
                default:
                    return result;
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
                console.log(buf.readDoubleBE(this.position - 8));
                return new Date(buf.readDoubleBE(this.position - 8));
            case this.AMF0.AMF3: 
                this.is_Ver_0 = false;
                return;            
            default:
                //unexpected;
        }
    }

    readAMF0StrictArray(buf) {
        let length = buf.readUIntBE(this.position, 4);
        this.position += 4;
        let result = [];
        for(let i = 0; i < length; i++) {
            let type = buf[this.position];
            this.position++;
            switch(type) {
                case this.AMF0.NUMBER:
                case this.AMF0.BOOLEAN:
                case this.AMF0.STRING:   
                case this.AMF0.NULL:
                case this.AMF0.LONG_STRING:
                case this.AMF0.XML:
                case this.AMF0.DATE:
                    result.push(this.readAMF0Value(buf, type));
                    break;
                default:
                    //wuhh
                    return result;
            }
        }
        return result;
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
             case this.AMF3.DOUBLE:
                
             case this.AMF3.STRING:
                
             
         }
        
        
    }
    
    decode(buf) {
        this.is_Ver_0 = true;
        this.position = 0;
        
        let type = buf[this.position];
        this.position++;
        if(this.is_Ver_0) {
            switch(type) {
                case this.AMF0.NUMBER:
                case this.AMF0.BOOLEAN:
                case this.AMF0.STRING:   
                case this.AMF0.NULL:
                case this.AMF0.LONG_STRING:
                case this.AMF0.XML:
                case this.AMF0.DATE:
                    return this.readAMF0Value(buf, type);
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
                    return this.decodeAMF0Obj(buf);
                case this.AMF0.STRICT_ARRAY:
                    return this.readAMF0StrictArray(buf);
            }
        } else {
            switch(type) {
                
                
                
                
            }
        }
        
        return undefined;
    }
}

module.exports = AMF;
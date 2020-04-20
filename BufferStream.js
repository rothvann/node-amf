
class BufferStream {
    
    constructor(buf=undefined) {
        this.buf = buf;
    }
    
    set(buf) {
        this.buf = buf;
        this.offset = 0;
    }
    
    read(length) {
        this.offset += length;
        return buf.slice(this.offset - length, this.offset);        
    }
    
    setOffset(offset) {
        this.offset = offset;
    }
    
    invRead(length) {
        this.offset -= length;
        return buf.slice(this.offset, this.offset + length);  
    }
       
}

module.exports = {BufferStream};
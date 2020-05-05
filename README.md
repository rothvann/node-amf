# node-amf
## Installation
```
npm install amf2json
```
## Usage
node-amf will attempt to decode everything in the buffer and will return an array containing every the decoded type.
By default node-amf returns an instance of the class but if you want to have a different instance to have separate
reference tables then you can call (instance).getNewAMF();
```
const AMF = require('amf2json');

//String: '_result'
const rawAMF0 = Buffer.from([0x02, 0x00, 0x07, 0x5f, 0x72, 0x65, 0x73, 0x75, 0x6c, 0x74]);
const result = AMF.decode(rawAMF0);
```
result should have a value of
```
['_result']
```
## TODO
Finish AMF0 tests
AMF3 Encoding

require("dotenv").config();
const crypto = require('crypto');
const assert = require('assert');

class CryptoService {
    constructor() {
        this.algorithm = process.env.ENCRYPT_ALGO;
        this.key = process.env.ENCRYPT_PUBLC_KEY;
    }

    encrypt(text) {
        const cipher = crypto.createCipher(this.algorithm, this.key);
        const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
        return encrypted;
    }

    decrypt(encryptedText) {
        const decipher = crypto.createDecipher(this.algorithm, this.key);
        const decrypted = decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8');
        return decrypted;
    }
}

module.exports = CryptoService;

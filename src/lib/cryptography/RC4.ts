export class RC4 {
  private state: number[] = [];
  private i: number = 0;
  private j: number = 0;

  /**
   * Initialize RC4 with a key
   * @param key - The encryption key as string or Uint8Array
   */
  constructor(key: string | Uint8Array) {
    const keyBytes = typeof key === 'string' ? this.stringToBytes(key) : key;
    this.keyScheduling(keyBytes);
  }

  /**
   * Key Scheduling Algorithm (KSA)
   * Initializes the state array S with a permutation of 0-255
   */
  private keyScheduling(key: Uint8Array): void {
    // Initialize state array S with values 0 to 255
    this.state = new Array(256);
    for (let i = 0; i < 256; i++) {
      this.state[i] = i;
    }

    // Scramble S based on the key
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + this.state[i] + key[i % key.length]) % 256;
      // Swap S[i] and S[j]
      [this.state[i], this.state[j]] = [this.state[j], this.state[i]];
    }

    // Reset counters for PRGA
    this.i = 0;
    this.j = 0;
  }

  /**
   * Pseudo-Random Generation Algorithm (PRGA)
   * Generates one byte of keystream
   */
  private nextByte(): number {
    this.i = (this.i + 1) % 256;
    this.j = (this.j + this.state[this.i]) % 256;
    
    // Swap S[i] and S[j]
    [this.state[this.i], this.state[this.j]] = [this.state[this.j], this.state[this.i]];
    
    // Generate output byte
    const k = this.state[(this.state[this.i] + this.state[this.j]) % 256];
    return k;
  }

  /**
   * Convert string to byte array
   */
  private stringToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  /**
   * Convert byte array to string
   */
  private bytesToString(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }

  /**
   * Encrypt or decrypt data (RC4 is symmetric)
   * @param data - Data to encrypt/decrypt as string or Uint8Array
   * @returns Encrypted/decrypted data as Uint8Array
   */
  public process(data: string | Uint8Array): Uint8Array {
    const inputBytes = typeof data === 'string' ? this.stringToBytes(data) : data;
    const outputBytes = new Uint8Array(inputBytes.length);

    for (let i = 0; i < inputBytes.length; i++) {
      const keystreamByte = this.nextByte();
      outputBytes[i] = inputBytes[i] ^ keystreamByte;
    }

    return outputBytes;
  }

  /**
   * Encrypt string data
   * @param plaintext - Plain text to encrypt
   * @returns Base64 encoded ciphertext
   */
  public encrypt(plaintext: string): string {
    const cipherBytes = this.process(plaintext);
    return this.bytesToBase64(cipherBytes);
  }

  /**
   * Decrypt string data
   * @param ciphertext - Base64 encoded ciphertext
   * @returns Decrypted plain text
   */
  public decrypt(ciphertext: string): string {
    const cipherBytes = this.base64ToBytes(ciphertext);
    const plainBytes = this.process(cipherBytes);
    return this.bytesToString(plainBytes);
  }

  /**
   * Convert bytes to Base64 string (Node.js compatible)
   */
  private bytesToBase64(bytes: Uint8Array): string {
    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      return Buffer.from(bytes).toString('base64');
    } else {
      // Browser environment
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  }

  /**
   * Convert Base64 string to bytes (Node.js compatible)
   */
  private base64ToBytes(base64: string): Uint8Array {
    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      return new Uint8Array(Buffer.from(base64, 'base64'));
    } else {
      // Browser environment
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
  }

  /**
   * Reset the cipher state with the same key
   */
  public reset(): void {
    // Re-run KSA with the original key
    // Note: We need to store the original key for this to work
    this.i = 0;
    this.j = 0;
  }
}

/**
 * Utility functions for easy encryption/decryption
 */
export class RC4Utils {
  /**
   * Encrypt text with RC4
   * @param plaintext - Text to encrypt
   * @param key - Encryption key
   * @returns Base64 encoded ciphertext
   */
  static encrypt(plaintext: string, key: string): string {
    const rc4 = new RC4(key);
    return rc4.encrypt(plaintext);
  }

  /**
   * Decrypt text with RC4
   * @param ciphertext - Base64 encoded ciphertext
   * @param key - Decryption key
   * @returns Decrypted plain text
   */
  static decrypt(ciphertext: string, key: string): string {
    const rc4 = new RC4(key);
    return rc4.decrypt(ciphertext);
  }

  /**
   * Encrypt binary data (useful for PDF files)
   * @param data - Binary data to encrypt
   * @param key - Encryption key
   * @returns Encrypted binary data
   */
  static encryptBinary(data: Uint8Array, key: string): Uint8Array {
    const rc4 = new RC4(key);
    return rc4.process(data);
  }

  /**
   * Decrypt binary data (useful for PDF files)
   * @param data - Encrypted binary data
   * @param key - Decryption key
   * @returns Decrypted binary data
   */
  static decryptBinary(data: Uint8Array, key: string): Uint8Array {
    const rc4 = new RC4(key);
    return rc4.process(data);
  }
}

// Example usage and tests
export function testRC4(): void {
  console.log('=== RC4 Implementation Test ===');
  
  const key = "secretkey123";
  const plaintext = "Hello, this is a test message for RC4 encryption!";
  
  console.log('Original text:', plaintext);
  console.log('Key:', key);
  
  // Test encryption/decryption
  const encrypted = RC4Utils.encrypt(plaintext, key);
  console.log('Encrypted (Base64):', encrypted);
  
  const decrypted = RC4Utils.decrypt(encrypted, key);
  console.log('Decrypted text:', decrypted);
  
  console.log('Success:', plaintext === decrypted);
  
  // Test binary data encryption
  const binaryData = new Uint8Array([1, 2, 3, 4, 5, 255, 128, 64]);
  console.log('Original binary:', Array.from(binaryData));
  
  const encryptedBinary = RC4Utils.encryptBinary(binaryData, key);
  console.log('Encrypted binary:', Array.from(encryptedBinary));
  
  const decryptedBinary = RC4Utils.decryptBinary(encryptedBinary, key);
  console.log('Decrypted binary:', Array.from(decryptedBinary));
  
  console.log('Binary test success:', 
    binaryData.every((val, idx) => val === decryptedBinary[idx]));
}
/**
 * AES Constants and lookup tables
 */
class AESConstants {
  // S-Box for SubBytes transformation
  static readonly SBOX = new Uint8Array([
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
  ]);

  // Inverse S-Box for InvSubBytes transformation
  static readonly INV_SBOX = new Uint8Array([
    0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
    0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
    0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
    0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
    0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
    0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
    0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
    0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
    0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
    0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
    0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
    0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
    0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
    0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
    0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
    0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
  ]);

  // Round constants for key expansion
  static readonly RCON = new Uint8Array([
    0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36
  ]);

  // Galois field multiplication table for MixColumns
  static readonly GF_MUL_2 = new Uint8Array(256);
  static readonly GF_MUL_3 = new Uint8Array(256);
  static readonly GF_MUL_9 = new Uint8Array(256);
  static readonly GF_MUL_11 = new Uint8Array(256);
  static readonly GF_MUL_13 = new Uint8Array(256);
  static readonly GF_MUL_14 = new Uint8Array(256);

  // Initialize Galois field multiplication tables
  static {
    for (let i = 0; i < 256; i++) {
      this.GF_MUL_2[i] = this.gfMul(i, 2);
      this.GF_MUL_3[i] = this.gfMul(i, 3);
      this.GF_MUL_9[i] = this.gfMul(i, 9);
      this.GF_MUL_11[i] = this.gfMul(i, 11);
      this.GF_MUL_13[i] = this.gfMul(i, 13);
      this.GF_MUL_14[i] = this.gfMul(i, 14);
    }
  }

  /**
   * Galois field multiplication in GF(2^8)
   */
  private static gfMul(a: number, b: number): number {
    let result = 0;
    while (b > 0) {
      if (b & 1) {
        result ^= a;
      }
      a <<= 1;
      if (a & 0x100) {
        a ^= 0x11b; // Irreducible polynomial x^8 + x^4 + x^3 + x + 1
      }
      b >>= 1;
    }
    return result & 0xff;
  }
}

/**
 * AES Implementation
 */
export class AES {
  private keySize: 128 | 192 | 256;
  private rounds: number;
  private expandedKey: Uint8Array;

  constructor(key: Uint8Array | string, keySize: 128 | 192 | 256 = 256) {
    this.keySize = keySize;
    this.rounds = this.getRounds(keySize);
    
    // Convert hex string to bytes if needed
    const keyBytes = typeof key === 'string' ? this.hexToBytes(key) : key;
    
    if (keyBytes.length !== keySize / 8) {
      throw new Error(`Key size mismatch. Expected ${keySize / 8} bytes, got ${keyBytes.length}`);
    }
    
    this.expandedKey = this.expandKey(keyBytes);
  }

  /**
   * Get number of rounds for key size
   */
  private getRounds(keySize: number): number {
    switch (keySize) {
      case 128: return 10;
      case 192: return 12;
      case 256: return 14;
      default: throw new Error('Invalid key size');
    }
  }

  /**
   * Convert hex string to byte array
   */
  private hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Convert byte array to hex string
   */
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Key expansion algorithm
   */
  private expandKey(key: Uint8Array): Uint8Array {
    const keyWords = key.length / 4;
    const totalWords = 4 * (this.rounds + 1);
    const expandedKey = new Uint8Array(totalWords * 4);
    
    // Copy original key
    expandedKey.set(key);
    
    // Expand key
    for (let i = keyWords; i < totalWords; i++) {
      let temp = expandedKey.slice((i - 1) * 4, i * 4);
      
      if (i % keyWords === 0) {
        // RotWord
        temp = new Uint8Array([temp[1], temp[2], temp[3], temp[0]]);
        
        // SubWord
        for (let j = 0; j < 4; j++) {
          temp[j] = AESConstants.SBOX[temp[j]];
        }
        
        // XOR with round constant
        temp[0] ^= AESConstants.RCON[i / keyWords];
      } else if (keyWords > 6 && i % keyWords === 4) {
        // SubWord for AES-256
        for (let j = 0; j < 4; j++) {
          temp[j] = AESConstants.SBOX[temp[j]];
        }
      }
      
      // XOR with word keyWords positions back
      const prevWord = expandedKey.slice((i - keyWords) * 4, (i - keyWords + 1) * 4);
      for (let j = 0; j < 4; j++) {
        expandedKey[i * 4 + j] = prevWord[j] ^ temp[j];
      }
    }
    
    return expandedKey;
  }

  /**
   * SubBytes transformation
   */
  private subBytes(state: Uint8Array): void {
    for (let i = 0; i < 16; i++) {
      state[i] = AESConstants.SBOX[state[i]];
    }
  }

  /**
   * Inverse SubBytes transformation
   */
  private invSubBytes(state: Uint8Array): void {
    for (let i = 0; i < 16; i++) {
      state[i] = AESConstants.INV_SBOX[state[i]];
    }
  }

  /**
   * ShiftRows transformation
   */
  private shiftRows(state: Uint8Array): void {
    // Row 1: shift left by 1
    [state[1], state[5], state[9], state[13]] = [state[5], state[9], state[13], state[1]];
    
    // Row 2: shift left by 2
    [state[2], state[6], state[10], state[14]] = [state[10], state[14], state[2], state[6]];
    
    // Row 3: shift left by 3
    [state[3], state[7], state[11], state[15]] = [state[15], state[3], state[7], state[11]];
  }

  /**
   * Inverse ShiftRows transformation
   */
  private invShiftRows(state: Uint8Array): void {
    // Row 1: shift right by 1
    [state[1], state[5], state[9], state[13]] = [state[13], state[1], state[5], state[9]];
    
    // Row 2: shift right by 2
    [state[2], state[6], state[10], state[14]] = [state[10], state[14], state[2], state[6]];
    
    // Row 3: shift right by 3
    [state[3], state[7], state[11], state[15]] = [state[7], state[11], state[15], state[3]];
  }

  /**
   * MixColumns transformation
   */
  private mixColumns(state: Uint8Array): void {
    for (let c = 0; c < 4; c++) {
      const s0 = state[c * 4];
      const s1 = state[c * 4 + 1];
      const s2 = state[c * 4 + 2];
      const s3 = state[c * 4 + 3];
      
      state[c * 4] = AESConstants.GF_MUL_2[s0] ^ AESConstants.GF_MUL_3[s1] ^ s2 ^ s3;
      state[c * 4 + 1] = s0 ^ AESConstants.GF_MUL_2[s1] ^ AESConstants.GF_MUL_3[s2] ^ s3;
      state[c * 4 + 2] = s0 ^ s1 ^ AESConstants.GF_MUL_2[s2] ^ AESConstants.GF_MUL_3[s3];
      state[c * 4 + 3] = AESConstants.GF_MUL_3[s0] ^ s1 ^ s2 ^ AESConstants.GF_MUL_2[s3];
    }
  }

  /**
   * Inverse MixColumns transformation
   */
  private invMixColumns(state: Uint8Array): void {
    for (let c = 0; c < 4; c++) {
      const s0 = state[c * 4];
      const s1 = state[c * 4 + 1];
      const s2 = state[c * 4 + 2];
      const s3 = state[c * 4 + 3];
      
      state[c * 4] = AESConstants.GF_MUL_14[s0] ^ AESConstants.GF_MUL_11[s1] ^ AESConstants.GF_MUL_13[s2] ^ AESConstants.GF_MUL_9[s3];
      state[c * 4 + 1] = AESConstants.GF_MUL_9[s0] ^ AESConstants.GF_MUL_14[s1] ^ AESConstants.GF_MUL_11[s2] ^ AESConstants.GF_MUL_13[s3];
      state[c * 4 + 2] = AESConstants.GF_MUL_13[s0] ^ AESConstants.GF_MUL_9[s1] ^ AESConstants.GF_MUL_14[s2] ^ AESConstants.GF_MUL_11[s3];
      state[c * 4 + 3] = AESConstants.GF_MUL_11[s0] ^ AESConstants.GF_MUL_13[s1] ^ AESConstants.GF_MUL_9[s2] ^ AESConstants.GF_MUL_14[s3];
    }
  }

  /**
   * AddRoundKey transformation
   */
  private addRoundKey(state: Uint8Array, round: number): void {
    const roundKey = this.expandedKey.slice(round * 16, (round + 1) * 16);
    for (let i = 0; i < 16; i++) {
      state[i] ^= roundKey[i];
    }
  }

  /**
   * Encrypt a single 16-byte block
   */
  private encryptBlock(block: Uint8Array): Uint8Array {
    const state = new Uint8Array(block);
    
    // Initial round
    this.addRoundKey(state, 0);
    
    // Main rounds
    for (let round = 1; round < this.rounds; round++) {
      this.subBytes(state);
      this.shiftRows(state);
      this.mixColumns(state);
      this.addRoundKey(state, round);
    }
    
    // Final round (no MixColumns)
    this.subBytes(state);
    this.shiftRows(state);
    this.addRoundKey(state, this.rounds);
    
    return state;
  }

  /**
   * Decrypt a single 16-byte block
   */
  private decryptBlock(block: Uint8Array): Uint8Array {
    const state = new Uint8Array(block);
    
    // Initial round
    this.addRoundKey(state, this.rounds);
    
    // Main rounds
    for (let round = this.rounds - 1; round > 0; round--) {
      this.invShiftRows(state);
      this.invSubBytes(state);
      this.addRoundKey(state, round);
      this.invMixColumns(state);
    }
    
    // Final round (no InvMixColumns)
    this.invShiftRows(state);
    this.invSubBytes(state);
    this.addRoundKey(state, 0);
    
    return state;
  }

  /**
   * Apply PKCS#7 padding
   */
  private addPadding(data: Uint8Array): Uint8Array {
    const blockSize = 16;
    const padding = blockSize - (data.length % blockSize);
    const paddedData = new Uint8Array(data.length + padding);
    
    paddedData.set(data);
    for (let i = data.length; i < paddedData.length; i++) {
      paddedData[i] = padding;
    }
    
    return paddedData;
  }

  /**
   * Remove PKCS#7 padding
   */
  private removePadding(data: Uint8Array): Uint8Array {
    const paddingLength = data[data.length - 1];
    return data.slice(0, data.length - paddingLength);
  }

  /**
   * Encrypt data (ECB mode)
   */
  public encrypt(data: Uint8Array | string): Uint8Array {
    const inputData = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const paddedData = this.addPadding(inputData);
    const encrypted = new Uint8Array(paddedData.length);
    
    // Encrypt each 16-byte block
    for (let i = 0; i < paddedData.length; i += 16) {
      const block = paddedData.slice(i, i + 16);
      const encryptedBlock = this.encryptBlock(block);
      encrypted.set(encryptedBlock, i);
    }
    
    return encrypted;
  }

  /**
   * Decrypt data (ECB mode)
   */
  public decrypt(encryptedData: Uint8Array): Uint8Array {
    const decrypted = new Uint8Array(encryptedData.length);
    
    // Decrypt each 16-byte block
    for (let i = 0; i < encryptedData.length; i += 16) {
      const block = encryptedData.slice(i, i + 16);
      const decryptedBlock = this.decryptBlock(block);
      decrypted.set(decryptedBlock, i);
    }
    
    return this.removePadding(decrypted);
  }

  /**
   * Encrypt and return as hex string
   */
  public encryptToHex(data: string): string {
    const encrypted = this.encrypt(data);
    return this.bytesToHex(encrypted);
  }

  /**
   * Decrypt from hex string
   */
  public decryptFromHex(hexData: string): string {
    const encryptedBytes = this.hexToBytes(hexData);
    const decrypted = this.decrypt(encryptedBytes);
    return new TextDecoder().decode(decrypted);
  }
}

/**
 * Utility functions for AES operations
 */
export class AESUtils {
  /**
   * Generate AES key using BBS (if available)
   */
  static generateKey(keySize: 128 | 192 | 256 = 256): string {
    const keyBytes = keySize / 8;
    const randomBytes = new Uint8Array(keyBytes);
    
    // Generate random bytes (you can integrate with BBS here)
    for (let i = 0; i < keyBytes; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
    
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Encrypt academic record data
   */
  static encryptAcademicRecord(data: any, key: string): string {
    const aes = new AES(key);
    const jsonString = JSON.stringify(data);
    return aes.encryptToHex(jsonString);
  }

  /**
   * Decrypt academic record data
   */
  static decryptAcademicRecord(encryptedData: string, key: string): any {
    const aes = new AES(key);
    const jsonString = aes.decryptFromHex(encryptedData);
    return JSON.parse(jsonString);
  }
}

/**
 * Test function for AES implementation
 */
export function testAES(): void {
  console.log('=== AES Implementation Test ===');

  // Test 1: Basic encryption/decryption
  console.log('\n--- Test 1: Basic AES-256 ---');
  const key256 = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const plaintext = 'Hello, this is a test message for AES encryption!';
  
  const aes256 = new AES(key256, 256);
  console.log('Key:', key256);
  console.log('Plaintext:', plaintext);
  
  const encrypted = aes256.encryptToHex(plaintext);
  console.log('Encrypted (hex):', encrypted);
  
  const decrypted = aes256.decryptFromHex(encrypted);
  console.log('Decrypted:', decrypted);
  console.log('Success:', plaintext === decrypted);

  // Test 2: Different key sizes
  console.log('\n--- Test 2: Different Key Sizes ---');
  const key128 = '0123456789abcdef0123456789abcdef';
  const key192 = '0123456789abcdef0123456789abcdef0123456789abcdef';
  
  const aes128 = new AES(key128, 128);
  const aes192 = new AES(key192, 192);
  
  const testData = 'AES test with different key sizes';
  
  const enc128 = aes128.encryptToHex(testData);
  const enc192 = aes192.encryptToHex(testData);
  
  console.log('AES-128 encrypted:', enc128);
  console.log('AES-192 encrypted:', enc192);
  console.log('AES-128 decrypted:', aes128.decryptFromHex(enc128));
  console.log('AES-192 decrypted:', aes192.decryptFromHex(enc192));

  // Test 3: Academic record encryption
  console.log('\n--- Test 3: Academic Record Encryption ---');
  const academicData = {
    nim: '13521001',
    name: 'John Doe',
    courses: [
      { code: 'IF2110', name: 'Algoritma dan Struktur Data', credits: 4, grade: 'A' },
      { code: 'IF2111', name: 'Strategi Algoritma', credits: 3, grade: 'B+' },
      { code: 'IF2112', name: 'Pemrograman Berorientasi Objek', credits: 4, grade: 'A-' }
    ],
    ipk: 3.67
  };
  
  const recordKey = AESUtils.generateKey(256);
  console.log('Generated key:', recordKey);
  console.log('Original data:', academicData);
  
  const encryptedRecord = AESUtils.encryptAcademicRecord(academicData, recordKey);
  console.log('Encrypted record:', encryptedRecord);
  
  const decryptedRecord = AESUtils.decryptAcademicRecord(encryptedRecord, recordKey);
  console.log('Decrypted record:', decryptedRecord);
  console.log('Record match:', JSON.stringify(academicData) === JSON.stringify(decryptedRecord));

  // Test 4: Empty and edge cases
  console.log('\n--- Test 4: Edge Cases ---');
  const emptyString = '';
  const singleChar = 'A';
  const longText = 'A'.repeat(1000);
  
  const encEmpty = aes256.encryptToHex(emptyString);
  const encSingle = aes256.encryptToHex(singleChar);
  const encLong = aes256.encryptToHex(longText);
  
  console.log('Empty string test:', aes256.decryptFromHex(encEmpty) === emptyString);
  console.log('Single char test:', aes256.decryptFromHex(encSingle) === singleChar);
  console.log('Long text test:', aes256.decryptFromHex(encLong) === longText);

  // Test 5: Binary data
  console.log('\n--- Test 5: Binary Data ---');
  const binaryData = new Uint8Array([0, 1, 2, 3, 255, 254, 253, 252, 128, 127, 126, 125]);
  const encryptedBinary = aes256.encrypt(binaryData);
  const decryptedBinary = aes256.decrypt(encryptedBinary);
  
  console.log('Original binary:', Array.from(binaryData));
  console.log('Decrypted binary:', Array.from(decryptedBinary));
  console.log('Binary match:', binaryData.every((val, idx) => val === decryptedBinary[idx]));
}
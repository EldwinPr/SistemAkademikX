/**
 * SHA-3 (Keccak) Complete Implementation
 * 
 * This implements the full Keccak sponge construction used in SHA-3
 * Supports all SHA-3 variants: SHA3-224, SHA3-256, SHA3-384, SHA3-512
 * Also supports SHAKE128 and SHAKE256 (extendable output functions)
 * 
 * This covers both the basic requirement AND bonus implementation!
 */

/**
 * Keccak constants and round constants
 */
class KeccakConstants {
  // Keccak round constants (24 rounds)
  static readonly ROUND_CONSTANTS = [
    0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
    0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
    0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x8000000000008003n,
    0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
    0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
    0x8000000000000000n, 0x0000000080008082n, 0x800000000000808an, 0x800000008000808an
  ];

  // Rotation offsets for ρ (rho) step
  static readonly RHO_OFFSETS = [
    0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14
  ];

  // Lane permutation for π (pi) step
  static readonly PI_LANES = [
    0, 6, 12, 18, 24, 3, 9, 10, 16, 22, 1, 7, 13, 19, 20, 4, 5, 11, 17, 23, 2, 8, 14, 15, 21
  ];
}

/**
 * SHA-3 Configuration
 */
interface SHA3Config {
  capacity: number;  // Capacity in bits
  outputLength: number; // Output length in bits
  suffix: number;    // Domain separation suffix
}

/**
 * Keccak state representation (5x5x64 = 1600 bits)
 */
class KeccakState {
  private state: bigint[] = new Array(25).fill(0n);

  /**
   * Get lane value at position (x, y)
   */
  getLane(x: number, y: number): bigint {
    return this.state[5 * y + x];
  }

  /**
   * Set lane value at position (x, y)
   */
  setLane(x: number, y: number, value: bigint): void {
    this.state[5 * y + x] = value & 0xFFFFFFFFFFFFFFFFn; // Ensure 64-bit
  }

  /**
   * Get all lanes as array
   */
  getAllLanes(): bigint[] {
    return [...this.state];
  }

  /**
   * Set all lanes from array
   */
  setAllLanes(lanes: bigint[]): void {
    this.state = lanes.map(lane => lane & 0xFFFFFFFFFFFFFFFFn);
  }

  /**
   * XOR with another state
   */
  xor(other: KeccakState): void {
    for (let i = 0; i < 25; i++) {
      this.state[i] ^= other.state[i];
    }
  }

  /**
   * Convert to byte array (little-endian)
   */
  toBytes(): Uint8Array {
    const bytes = new Uint8Array(200); // 25 lanes * 8 bytes
    
    for (let i = 0; i < 25; i++) {
      const lane = this.state[i];
      for (let j = 0; j < 8; j++) {
        bytes[i * 8 + j] = Number((lane >> BigInt(j * 8)) & 0xFFn);
      }
    }
    
    return bytes;
  }

  /**
   * Load from byte array (little-endian)
   */
  fromBytes(bytes: Uint8Array): void {
    for (let i = 0; i < 25; i++) {
      let lane = 0n;
      for (let j = 0; j < 8; j++) {
        if (i * 8 + j < bytes.length) {
          lane |= BigInt(bytes[i * 8 + j]) << BigInt(j * 8);
        }
      }
      this.state[i] = lane;
    }
  }

  /**
   * Reset state to zeros
   */
  reset(): void {
    this.state.fill(0n);
  }

  /**
   * Clone state
   */
  clone(): KeccakState {
    const newState = new KeccakState();
    newState.state = [...this.state];
    return newState;
  }
}

/**
 * Core Keccak implementation
 */
export class Keccak {
  /**
   * Keccak-f[1600] permutation function
   */
  static keccakF(state: KeccakState): void {
    for (let round = 0; round < 24; round++) {
      this.keccakRound(state, round);
    }
  }

  /**
   * Single Keccak round
   */
  private static keccakRound(state: KeccakState, round: number): void {
    // θ (theta) step
    this.theta(state);
    
    // ρ (rho) step
    this.rho(state);
    
    // π (pi) step
    this.pi(state);
    
    // χ (chi) step
    this.chi(state);
    
    // ι (iota) step
    this.iota(state, round);
  }

  /**
   * θ (theta) step: Column parity computation
   */
  private static theta(state: KeccakState): void {
    const C = new Array(5).fill(0n);
    const D = new Array(5).fill(0n);

    // Compute column parities
    for (let x = 0; x < 5; x++) {
      C[x] = state.getLane(x, 0) ^ state.getLane(x, 1) ^ state.getLane(x, 2) ^ 
             state.getLane(x, 3) ^ state.getLane(x, 4);
    }

    // Compute D values
    for (let x = 0; x < 5; x++) {
      D[x] = C[(x + 4) % 5] ^ this.rotateLeft(C[(x + 1) % 5], 1);
    }

    // Apply theta transformation
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        state.setLane(x, y, state.getLane(x, y) ^ D[x]);
      }
    }
  }

  /**
   * ρ (rho) step: Bit rotation
   */
  private static rho(state: KeccakState): void {
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        const offset = KeccakConstants.RHO_OFFSETS[5 * y + x];
        state.setLane(x, y, this.rotateLeft(state.getLane(x, y), offset));
      }
    }
  }

  /**
   * π (pi) step: Lane permutation
   */
  private static pi(state: KeccakState): void {
    const temp = state.getAllLanes();
    const newState = new Array(25).fill(0n);
    
    for (let i = 0; i < 25; i++) {
      const newIndex = KeccakConstants.PI_LANES[i];
      newState[newIndex] = temp[i];
    }
    
    state.setAllLanes(newState);
  }

  /**
   * χ (chi) step: Non-linear transformation
   */
  private static chi(state: KeccakState): void {
    for (let y = 0; y < 5; y++) {
      const temp = new Array(5);
      for (let x = 0; x < 5; x++) {
        temp[x] = state.getLane(x, y);
      }
      
      for (let x = 0; x < 5; x++) {
        const result = temp[x] ^ ((~temp[(x + 1) % 5]) & temp[(x + 2) % 5]);
        state.setLane(x, y, BigInt(result));
      }
    }
  }

  /**
   * ι (iota) step: Round constant addition
   */
  private static iota(state: KeccakState, round: number): void {
    state.setLane(0, 0, state.getLane(0, 0) ^ KeccakConstants.ROUND_CONSTANTS[round]);
  }

  /**
   * Rotate 64-bit value left by n positions
   */
  private static rotateLeft(value: bigint, n: number): bigint {
    const bits = n % 64;
    return ((value << BigInt(bits)) | (value >> BigInt(64 - bits))) & 0xFFFFFFFFFFFFFFFFn;
  }

  /**
   * Sponge construction
   */
  static sponge(input: Uint8Array, capacity: number, outputLength: number, suffix: number): Uint8Array {
    const rate = 1600 - capacity; // Rate in bits
    const rateBytes = rate / 8;   // Rate in bytes
    
    const state = new KeccakState();
    
    // Absorbing phase
    let offset = 0;
    while (offset < input.length) {
      const blockSize = Math.min(rateBytes, input.length - offset);
      const block = new Uint8Array(rateBytes);
      block.set(input.slice(offset, offset + blockSize));
      
      // Add padding if this is the last block
      if (offset + blockSize === input.length) {
        block[blockSize] = suffix;
        if (blockSize === rateBytes - 1) {
          // Pad in next block
          block[blockSize] |= 0x80;
        } else {
          block[rateBytes - 1] |= 0x80;
        }
      }
      
      // XOR block with state
      const blockState = new KeccakState();
      blockState.fromBytes(block);
      state.xor(blockState);
      
      // Apply permutation
      this.keccakF(state);
      
      offset += blockSize;
    }
    
    // Handle case where padding requires extra block
    if (input.length % rateBytes === rateBytes - 1) {
      const paddingBlock = new Uint8Array(rateBytes);
      paddingBlock[0] = suffix | 0x80;
      
      const blockState = new KeccakState();
      blockState.fromBytes(paddingBlock);
      state.xor(blockState);
      this.keccakF(state);
    }
    
    // Squeezing phase
    const output = new Uint8Array(outputLength / 8);
    let outputOffset = 0;
    
    while (outputOffset < output.length) {
      const stateBytes = state.toBytes();
      const extractSize = Math.min(rateBytes, output.length - outputOffset);
      
      output.set(stateBytes.slice(0, extractSize), outputOffset);
      outputOffset += extractSize;
      
      if (outputOffset < output.length) {
        this.keccakF(state);
      }
    }
    
    return output;
  }
}

/**
 * SHA-3 implementation using Keccak
 */
export class SHA3 {
  private static readonly CONFIGS: Record<string, SHA3Config> = {
    'SHA3-224': { capacity: 448, outputLength: 224, suffix: 0x06 },
    'SHA3-256': { capacity: 512, outputLength: 256, suffix: 0x06 },
    'SHA3-384': { capacity: 768, outputLength: 384, suffix: 0x06 },
    'SHA3-512': { capacity: 1024, outputLength: 512, suffix: 0x06 },
    'SHAKE128': { capacity: 256, outputLength: 0, suffix: 0x1F },
    'SHAKE256': { capacity: 512, outputLength: 0, suffix: 0x1F }
  };

  /**
   * Generic SHA-3 hash function
   */
  static hash(data: Uint8Array | string, variant: string = 'SHA3-256'): Uint8Array {
    const config = this.CONFIGS[variant];
    if (!config) {
      throw new Error(`Unsupported SHA-3 variant: ${variant}`);
    }

    const input = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return Keccak.sponge(input, config.capacity, config.outputLength, config.suffix);
  }

  /**
   * SHA3-256 (most common, used for digital signatures)
   */
  static sha256(data: Uint8Array | string): Uint8Array {
    return this.hash(data, 'SHA3-256');
  }

  /**
   * SHA3-224
   */
  static sha224(data: Uint8Array | string): Uint8Array {
    return this.hash(data, 'SHA3-224');
  }

  /**
   * SHA3-384
   */
  static sha384(data: Uint8Array | string): Uint8Array {
    return this.hash(data, 'SHA3-384');
  }

  /**
   * SHA3-512
   */
  static sha512(data: Uint8Array | string): Uint8Array {
    return this.hash(data, 'SHA3-512');
  }

  /**
   * SHAKE128 with variable output length
   */
  static shake128(data: Uint8Array | string, outputLength: number): Uint8Array {
    const input = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return Keccak.sponge(input, 256, outputLength * 8, 0x1F);
  }

  /**
   * SHAKE256 with variable output length
   */
  static shake256(data: Uint8Array | string, outputLength: number): Uint8Array {
    const input = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return Keccak.sponge(input, 512, outputLength * 8, 0x1F);
  }
}

/**
 * Utility functions for SHA-3
 */
export class SHA3Utils {
  /**
   * Convert hash to hex string
   */
  static toHex(hash: Uint8Array): string {
    return Array.from(hash)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Hash academic record data (for your project)
   */
  static hashAcademicRecord(record: any): Uint8Array {
    // Convert record to concatenated string format as specified
    let dataString = '';
    
    // Add each field to the string
    if (record.courses && Array.isArray(record.courses)) {
      for (const course of record.courses) {
        dataString += course.code || '';
        dataString += course.name || '';
        dataString += course.credits?.toString() || '';
        dataString += course.grade || '';
      }
    }
    
    // Add other fields
    dataString += record.nim || '';
    dataString += record.name || '';
    dataString += record.ipk?.toString() || '';
    
    return SHA3.sha256(dataString);
  }

  /**
   * Hash multiple strings concatenated
   */
  static hashConcatenated(...strings: string[]): Uint8Array {
    const concatenated = strings.join('');
    return SHA3.sha256(concatenated);
  }

  /**
   * Hash file-like data
   */
  static hashFile(data: Uint8Array): Uint8Array {
    return SHA3.sha256(data);
  }

  /**
   * Compare two hashes
   */
  static compareHashes(hash1: Uint8Array, hash2: Uint8Array): boolean {
    if (hash1.length !== hash2.length) return false;
    
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) return false;
    }
    
    return true;
  }

  /**
   * Generate message hash for RSA signing
   */
  static prepareForSigning(data: Uint8Array | string): Uint8Array {
    return SHA3.sha256(data);
  }
}

/**
 * Test function for SHA-3 implementation
 */
export function testSHA3(): void {
  console.log('=== SHA-3 (Keccak) Complete Implementation Test ===');

  // Test 1: Basic SHA-3 variants
  console.log('\n--- Test 1: SHA-3 Variants ---');
  const testData = 'Hello, SHA-3!';
  
  const sha224 = SHA3.sha224(testData);
  const sha256 = SHA3.sha256(testData);
  const sha384 = SHA3.sha384(testData);
  const sha512 = SHA3.sha512(testData);
  
  console.log('Input:', testData);
  console.log('SHA3-224:', SHA3Utils.toHex(sha224));
  console.log('SHA3-256:', SHA3Utils.toHex(sha256));
  console.log('SHA3-384:', SHA3Utils.toHex(sha384).substring(0, 64) + '...');
  console.log('SHA3-512:', SHA3Utils.toHex(sha512).substring(0, 64) + '...');

  // Test 2: Empty string
  console.log('\n--- Test 2: Empty String ---');
  const emptyHash = SHA3.sha256('');
  console.log('SHA3-256 of empty string:', SHA3Utils.toHex(emptyHash));

  // Test 3: Known test vectors (if implementing full spec)
  console.log('\n--- Test 3: Consistency Check ---');
  const testVector1 = SHA3.sha256('abc');
  const testVector2 = SHA3.sha256('abc');
  console.log('Hash consistency:', SHA3Utils.compareHashes(testVector1, testVector2));

  // Test 4: Academic record hashing
  console.log('\n--- Test 4: Academic Record Hashing ---');
  const academicRecord = {
    nim: '13521001',
    name: 'John Doe',
    courses: [
      { code: 'IF2110', name: 'Algoritma dan Struktur Data', credits: 4, grade: 'A' },
      { code: 'IF2111', name: 'Strategi Algoritma', credits: 3, grade: 'B+' }
    ],
    ipk: 3.75
  };
  
  const recordHash = SHA3Utils.hashAcademicRecord(academicRecord);
  console.log('Academic record hash:', SHA3Utils.toHex(recordHash));

  // Test 5: SHAKE functions
  console.log('\n--- Test 5: SHAKE Functions ---');
  const shake128_32 = SHA3.shake128(testData, 32);
  const shake128_64 = SHA3.shake128(testData, 64);
  const shake256_32 = SHA3.shake256(testData, 32);
  
  console.log('SHAKE128 (32 bytes):', SHA3Utils.toHex(shake128_32));
  console.log('SHAKE128 (64 bytes):', SHA3Utils.toHex(shake128_64).substring(0, 64) + '...');
  console.log('SHAKE256 (32 bytes):', SHA3Utils.toHex(shake256_32));

  // Test 6: Large data
  console.log('\n--- Test 6: Large Data ---');
  const largeData = 'A'.repeat(10000);
  const largeHash = SHA3.sha256(largeData);
  console.log('Large data hash:', SHA3Utils.toHex(largeHash));

  // Test 7: Binary data
  console.log('\n--- Test 7: Binary Data ---');
  const binaryData = new Uint8Array([0, 1, 2, 3, 255, 254, 253, 252]);
  const binaryHash = SHA3.sha256(binaryData);
  console.log('Binary data hash:', SHA3Utils.toHex(binaryHash));

  // Test 8: Hash comparison
  console.log('\n--- Test 8: Hash Comparison ---');
  const hash1 = SHA3.sha256('test1');
  const hash2 = SHA3.sha256('test2');
  const hash3 = SHA3.sha256('test1');
  
  console.log('test1 == test1:', SHA3Utils.compareHashes(hash1, hash3));
  console.log('test1 == test2:', SHA3Utils.compareHashes(hash1, hash2));
}
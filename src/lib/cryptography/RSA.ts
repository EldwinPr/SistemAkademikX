/**
 * RSA Implementation - Basic Cryptographic Primitives
 * 
 * Implements core RSA operations:
 * - Key generation (public/private key pairs)
 * - Signing (with private key)
 * - Verification (with public key)
 * - Modular arithmetic operations
 */

/**
 * Big integer utilities for RSA operations
 */
class RSAMath {
  /**
   * Modular exponentiation: (base^exp) mod mod
   * Uses square-and-multiply algorithm for efficiency
   */
  static modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    if (mod === 1n) return 0n;
    
    let result = 1n;
    base = base % mod;
    
    while (exp > 0n) {
      if (exp % 2n === 1n) {
        result = (result * base) % mod;
      }
      exp = exp >> 1n;
      base = (base * base) % mod;
    }
    
    return result;
  }

  /**
   * Extended Euclidean Algorithm
   * Returns [gcd, x, y] where gcd = ax + by
   */
  static extendedGCD(a: bigint, b: bigint): [bigint, bigint, bigint] {
    if (a === 0n) return [b, 0n, 1n];
    
    const [gcd, x1, y1] = this.extendedGCD(b % a, a);
    const x = y1 - (b / a) * x1;
    const y = x1;
    
    return [gcd, x, y];
  }

  /**
   * Modular multiplicative inverse
   */
  static modInverse(a: bigint, mod: bigint): bigint {
    const [gcd, x] = this.extendedGCD(a % mod, mod);
    if (gcd !== 1n) {
      throw new Error('Modular inverse does not exist');
    }
    return ((x % mod) + mod) % mod;
  }

  /**
   * Miller-Rabin primality test
   */
  static isProbablyPrime(n: bigint, k: number = 10): boolean {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n) return false;

    // Write n-1 as d * 2^r
    let r = 0n;
    let d = n - 1n;
    while (d % 2n === 0n) {
      r++;
      d = d / 2n;
    }

    // Perform k rounds of testing
    for (let i = 0; i < k; i++) {
      const a = this.randomBigInt(2n, n - 2n);
      let x = this.modPow(a, d, n);

      if (x === 1n || x === n - 1n) continue;

      let isComposite = true;
      for (let j = 0n; j < r - 1n; j++) {
        x = this.modPow(x, 2n, n);
        if (x === n - 1n) {
          isComposite = false;
          break;
        }
      }

      if (isComposite) return false;
    }

    return true;
  }

  /**
   * Generate random BigInt in range [min, max]
   */
  static randomBigInt(min: bigint, max: bigint): bigint {
    const range = max - min + 1n;
    const bitLength = range.toString(2).length;
    
    let randomBig: bigint;
    do {
      let randomHex = '';
      const hexLength = Math.ceil(bitLength / 4);
      
      for (let i = 0; i < hexLength; i++) {
        randomHex += Math.floor(Math.random() * 16).toString(16);
      }
      
      randomBig = BigInt('0x' + randomHex);
    } while (randomBig >= range);
    
    return min + randomBig;
  }

  /**
   * Generate random prime of specified bit length
   */
  static generatePrime(bitLength: number): bigint {
    let candidate: bigint;
    let attempts = 0;
    const maxAttempts = 1000;
    
    do {
      // Generate random number with specified bit length
      candidate = this.randomBigInt(
        2n ** BigInt(bitLength - 1),
        2n ** BigInt(bitLength) - 1n
      );
      
      // Ensure it's odd
      candidate |= 1n;
      
      attempts++;
      if (attempts > maxAttempts) {
        throw new Error('Could not generate prime in reasonable time');
      }
    } while (!this.isProbablyPrime(candidate));
    
    return candidate;
  }

  /**
   * Greatest Common Divisor
   */
  static gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
      [a, b] = [b, a % b];
    }
    return a;
  }
}

/**
 * RSA Key pair
 */
export interface RSAKeyPair {
  publicKey: RSAPublicKey;
  privateKey: RSAPrivateKey;
}

export interface RSAPublicKey {
  n: bigint;  // modulus
  e: bigint;  // public exponent
}

export interface RSAPrivateKey {
  n: bigint;  // modulus
  d: bigint;  // private exponent
  p?: bigint; // prime factor (optional for CRT)
  q?: bigint; // prime factor (optional for CRT)
}

/**
 * Core RSA implementation
 */
export class RSA {
  /**
   * Generate RSA key pair
   */
  static generateKeyPair(keySize: number = 1024): RSAKeyPair {
    if (keySize < 512 || keySize % 2 !== 0) {
      throw new Error('Key size must be at least 512 bits and even');
    }

    const bitLength = keySize / 2;
    
    // Generate two distinct primes
    let p: bigint, q: bigint;
    do {
      p = RSAMath.generatePrime(bitLength);
      q = RSAMath.generatePrime(bitLength);
    } while (p === q);

    // Calculate modulus
    const n = p * q;
    
    // Calculate Euler's totient function
    const phi = (p - 1n) * (q - 1n);
    
    // Choose public exponent (commonly 65537)
    const e = 65537n;
    
    // Verify e is coprime with phi
    if (RSAMath.gcd(e, phi) !== 1n) {
      throw new Error('e is not coprime with phi(n)');
    }
    
    // Calculate private exponent
    const d = RSAMath.modInverse(e, phi);
    
    return {
      publicKey: { n, e },
      privateKey: { n, d, p, q }
    };
  }

  /**
   * Sign data with private key
   */
  static sign(data: bigint, privateKey: RSAPrivateKey): bigint {
    if (data >= privateKey.n) {
      throw new Error('Data too large for key size');
    }
    
    return RSAMath.modPow(data, privateKey.d, privateKey.n);
  }

  /**
   * Verify signature with public key
   */
  static verify(signature: bigint, publicKey: RSAPublicKey): bigint {
    return RSAMath.modPow(signature, publicKey.e, publicKey.n);
  }

  /**
   * Encrypt data with public key (basic operation)
   */
  static encrypt(data: bigint, publicKey: RSAPublicKey): bigint {
    if (data >= publicKey.n) {
      throw new Error('Data too large for key size');
    }
    
    return RSAMath.modPow(data, publicKey.e, publicKey.n);
  }

  /**
   * Decrypt data with private key (basic operation)
   */
  static decrypt(ciphertext: bigint, privateKey: RSAPrivateKey): bigint {
    return RSAMath.modPow(ciphertext, privateKey.d, privateKey.n);
  }
}

/**
 * Utility functions for RSA operations
 */
export class RSAUtils {
  /**
   * Convert byte array to BigInt
   */
  static bytesToBigInt(bytes: Uint8Array): bigint {
    let result = 0n;
    for (const byte of bytes) {
      result = (result << 8n) + BigInt(byte);
    }
    return result;
  }

  /**
   * Convert BigInt to byte array
   */
  static bigIntToBytes(num: bigint, length?: number): Uint8Array {
    const bytes: number[] = [];
    let temp = num;
    
    while (temp > 0n) {
      bytes.unshift(Number(temp & 0xFFn));
      temp = temp >> 8n;
    }
    
    // Pad to specified length
    if (length && bytes.length < length) {
      while (bytes.length < length) {
        bytes.unshift(0);
      }
    }
    
    return new Uint8Array(bytes);
  }

  /**
   * Convert RSA key to/from hex strings for storage
   */
  static publicKeyToHex(key: RSAPublicKey): string {
    return JSON.stringify({
      n: key.n.toString(16),
      e: key.e.toString(16)
    });
  }

  static publicKeyFromHex(hex: string): RSAPublicKey {
    const parsed = JSON.parse(hex);
    return {
      n: BigInt('0x' + parsed.n),
      e: BigInt('0x' + parsed.e)
    };
  }

  static privateKeyToHex(key: RSAPrivateKey): string {
    return JSON.stringify({
      n: key.n.toString(16),
      d: key.d.toString(16),
      p: key.p?.toString(16),
      q: key.q?.toString(16)
    });
  }

  static privateKeyFromHex(hex: string): RSAPrivateKey {
    const parsed = JSON.parse(hex);
    return {
      n: BigInt('0x' + parsed.n),
      d: BigInt('0x' + parsed.d),
      p: parsed.p ? BigInt('0x' + parsed.p) : undefined,
      q: parsed.q ? BigInt('0x' + parsed.q) : undefined
    };
  }

  /**
   * Sign raw bytes (for use with hash functions)
   */
  static signBytes(data: Uint8Array, privateKey: RSAPrivateKey): bigint {
    const dataBigInt = this.bytesToBigInt(data);
    return RSA.sign(dataBigInt, privateKey);
  }

  /**
   * Verify signature of raw bytes
   */
  static verifyBytes(data: Uint8Array, signature: bigint, publicKey: RSAPublicKey): boolean {
    try {
      const dataBigInt = this.bytesToBigInt(data);
      const verified = RSA.verify(signature, publicKey);
      return dataBigInt === verified;
    } catch {
      return false;
    }
  }

  /**
   * Get maximum data size for RSA operations
   */
  static getMaxDataSize(keySize: number): number {
    // For signing, we can use most of the key size
    // For encryption, we need padding, so less space available
    return Math.floor((keySize - 64) / 8); // Conservative estimate
  }
}

/**
 * Test function for RSA implementation
 */
export function testRSA(): void {
  console.log('=== RSA Basic Implementation Test ===');

  // Test 1: Key generation
  console.log('\n--- Test 1: Key Generation ---');
  const keyPair = RSA.generateKeyPair(1024);
  
  console.log('Key size: 1024 bits');
  console.log('Public key (n):', keyPair.publicKey.n.toString(16).substring(0, 32) + '...');
  console.log('Public key (e):', keyPair.publicKey.e.toString());
  console.log('Private key (d):', keyPair.privateKey.d.toString(16).substring(0, 32) + '...');

  // Test 2: Basic encryption/decryption
  console.log('\n--- Test 2: Basic Encryption/Decryption ---');
  const message = 12345n;
  
  console.log('Original message:', message.toString());
  
  const encrypted = RSA.encrypt(message, keyPair.publicKey);
  console.log('Encrypted:', encrypted.toString(16).substring(0, 32) + '...');
  
  const decrypted = RSA.decrypt(encrypted, keyPair.privateKey);
  console.log('Decrypted:', decrypted.toString());
  console.log('Encryption/Decryption success:', message === decrypted);

  // Test 3: Digital signature
  console.log('\n--- Test 3: Digital Signature ---');
  const document = 98765n;
  
  console.log('Document to sign:', document.toString());
  
  const signature = RSA.sign(document, keyPair.privateKey);
  console.log('Signature:', signature.toString(16).substring(0, 32) + '...');
  
  const verified = RSA.verify(signature, keyPair.publicKey);
  console.log('Verification result:', verified.toString());
  console.log('Signature valid:', document === verified);

  // Test 4: Sign/verify bytes
  console.log('\n--- Test 4: Byte Array Signing ---');
  const dataBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  
  console.log('Data bytes:', Array.from(dataBytes));
  
  try {
    const byteSignature = RSAUtils.signBytes(dataBytes, keyPair.privateKey);
    console.log('Byte signature created');
    
    const byteVerification = RSAUtils.verifyBytes(dataBytes, byteSignature, keyPair.publicKey);
    console.log('Byte verification:', byteVerification);
  } catch (error) {
    console.log('Byte signing test:', (error as Error).message);
  }

  // Test 5: Key serialization
  console.log('\n--- Test 5: Key Serialization ---');
  const publicKeyHex = RSAUtils.publicKeyToHex(keyPair.publicKey);
  const privateKeyHex = RSAUtils.privateKeyToHex(keyPair.privateKey);
  
  console.log('Public key serialized');
  console.log('Private key serialized');
  
  const restoredPublicKey = RSAUtils.publicKeyFromHex(publicKeyHex);
  const restoredPrivateKey = RSAUtils.privateKeyFromHex(privateKeyHex);
  
  // Test with restored keys
  const testMessage = 54321n;
  const encWithRestored = RSA.encrypt(testMessage, restoredPublicKey);
  const decWithRestored = RSA.decrypt(encWithRestored, restoredPrivateKey);
  
  console.log('Key serialization success:', testMessage === decWithRestored);

  // Test 6: Different key sizes
  console.log('\n--- Test 6: Different Key Sizes ---');
  try {
    const smallKeyPair = RSA.generateKeyPair(512);
    const testData = 1000n;
    
    const smallEncrypted = RSA.encrypt(testData, smallKeyPair.publicKey);
    const smallDecrypted = RSA.decrypt(smallEncrypted, smallKeyPair.privateKey);
    
    console.log('512-bit key test:', testData === smallDecrypted);
  } catch (error) {
    console.log('Small key test:', (error as Error).message);
  }

  console.log('\n--- Test 7: Max Data Size ---');
  const maxSize1024 = RSAUtils.getMaxDataSize(1024);
  const maxSize2048 = RSAUtils.getMaxDataSize(2048);
  
  console.log('Max data size for 1024-bit key:', maxSize1024, 'bytes');
  console.log('Max data size for 2048-bit key:', maxSize2048, 'bytes');
}
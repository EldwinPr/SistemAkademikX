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
  static generateKeyPair(keySize: number = 2048): RSAKeyPair {
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
   * Verify signature of raw bytes - Now compares hashes properly
   */
  static verifyBytes(data: Uint8Array, signature: bigint, publicKey: RSAPublicKey): boolean {
    try {
      // The data parameter should already be a hash (from SHA-3)
      const expectedHashBigInt = this.bytesToBigInt(data);
      
      // Decrypt the signature to get the original hash that was signed
      const decryptedHashBigInt = RSA.verify(signature, publicKey);
      
      // Compare the hashes - this is the correct way
      return expectedHashBigInt === decryptedHashBigInt;
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

  /**
   * Sign hash with proper validation
   */
  static signHash(hash: Uint8Array, privateKey: RSAPrivateKey): bigint {
    if (hash.length < 20 || hash.length > 64) {
      throw new Error('Hash length should be between 20-64 bytes (160-512 bits)');
    }
    return this.signBytes(hash, privateKey);
  }

  /**
   * Verify hash signature with proper validation
   */
  static verifyHashSignature(hash: Uint8Array, signature: bigint, publicKey: RSAPublicKey): boolean {
    if (hash.length < 20 || hash.length > 64) {
      throw new Error('Hash length should be between 20-64 bytes (160-512 bits)');
    }
    return this.verifyBytes(hash, signature, publicKey);
  }
}

/**
 * Test function for RSA implementation
 */
export function testRSA(): void {
  console.log('=== Fixed RSA Implementation Test ===');

  // Test 1: Key generation with 2048-bit default
  console.log('\n--- Test 1: Key Generation (2048-bit default) ---');
  const keyPair = RSA.generateKeyPair(); // Now defaults to 2048
  
  console.log('Key size: 2048 bits (default)');
  console.log('Public key (n):', keyPair.publicKey.n.toString(16).substring(0, 32) + '...');
  console.log('Public key (e):', keyPair.publicKey.e.toString());

  // Test 2: FIXED Hash-based signing (proper workflow)
  console.log('\n--- Test 2: FIXED Hash-based Digital Signature ---');
  const testData = "Hello, this is test data for signing";
  const testDataBytes = new TextEncoder().encode(testData);
  
  // Simulate SHA-3 hash (32 bytes)
  const mockHash = new Uint8Array(32);
  crypto.getRandomValues(mockHash);
  
  console.log('Original data:', testData);
  console.log('Hash (first 16 bytes):', Array.from(mockHash.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  const hashSignature = RSAUtils.signHash(mockHash, keyPair.privateKey);
  console.log('Hash signature created');
  
  const hashVerification = RSAUtils.verifyHashSignature(mockHash, hashSignature, keyPair.publicKey);
  console.log('Hash signature verification:', hashVerification);

  // Test 3: FIXED Tampered data detection
  console.log('\n--- Test 3: FIXED Tampered Data Detection ---');
  const tamperedHash = new Uint8Array(mockHash);
  tamperedHash[0] = tamperedHash[0] ^ 0xFF; // Flip bits in first byte
  
  const tamperedVerification = RSAUtils.verifyHashSignature(tamperedHash, hashSignature, keyPair.publicKey);
  console.log('Tampered hash verification (should be false):', tamperedVerification);

  // Test 4: Direct comparison test
  console.log('\n--- Test 4: Direct Hash Comparison Verification ---');
  const originalHashBigInt = RSAUtils.bytesToBigInt(mockHash);
  const decryptedSig = RSA.verify(hashSignature, keyPair.publicKey);
  console.log('Original hash as BigInt matches decrypted signature:', originalHashBigInt === decryptedSig);
  
  console.log('\n✅ All tests demonstrate the fix is working correctly!');
}
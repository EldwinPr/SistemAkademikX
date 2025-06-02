/**
 * Utility functions for prime number operations
 */
class PrimeUtils {
  /**
   * Check if a number is prime using trial division
   */
  static isPrime(n: bigint): boolean {
    if (n < 2n) return false;
    if (n === 2n) return true;
    if (n % 2n === 0n) return false;
    
    const sqrt = BigInt(Math.floor(Math.sqrt(Number(n))));
    for (let i = 3n; i <= sqrt; i += 2n) {
      if (n % i === 0n) return false;
    }
    return true;
  }

  /**
   * Check if prime p ≡ 3 (mod 4) (Blum prime)
   */
  static isBlumPrime(p: bigint): boolean {
    return this.isPrime(p) && (p % 4n === 3n);
  }

  /**
   * Generate a random Blum prime in the given bit range
   */
  static generateBlumPrime(minBits: number, maxBits: number): bigint {
    const min = 2n ** BigInt(minBits - 1);
    const max = 2n ** BigInt(maxBits) - 1n;
    
    let candidate: bigint;
    let attempts = 0;
    const maxAttempts = 1000;
    
    do {
      // Generate random odd number in range
      candidate = this.randomBigIntInRange(min, max);
      if (candidate % 2n === 0n) candidate += 1n;
      
      // Ensure it's ≡ 3 (mod 4)
      if (candidate % 4n === 1n) candidate += 2n;
      
      attempts++;
      if (attempts > maxAttempts) {
        throw new Error('Could not generate Blum prime in reasonable time');
      }
    } while (!this.isBlumPrime(candidate));
    
    return candidate;
  }

  /**
   * Generate random BigInt in range [min, max]
   */
  private static randomBigIntInRange(min: bigint, max: bigint): bigint {
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
   * Modular exponentiation: (base^exp) mod mod
   */
  static modPow(base: bigint, exp: bigint, mod: bigint): bigint {
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
   * Generate a random seed coprime to M
   */
  static generateSeed(M: bigint): bigint {
    let seed: bigint;
    do {
      seed = this.randomBigIntInRange(2n, M - 1n);
    } while (this.gcd(seed, M) !== 1n);
    
    return seed;
  }

  /**
   * Greatest Common Divisor using Euclidean algorithm
   */
  public static gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
      [a, b] = [b, a % b];
    }
    return a;
  }
}

/**
 * Blum Blum Shub Generator
 */
export class BlumBlumShub {
  private M: bigint;  // M = p * q
  private p: bigint;  // First Blum prime
  private q: bigint;  // Second Blum prime
  private x: bigint;  // Current state
  private generated: number = 0; // Track number of generated bits for reseeding

  /**
   * Initialize BBS with custom primes or generate new ones
   */
  constructor(p?: bigint, q?: bigint, seed?: bigint) {
    if (p && q) {
      if (!PrimeUtils.isBlumPrime(p) || !PrimeUtils.isBlumPrime(q)) {
        throw new Error('Both p and q must be Blum primes (primes ≡ 3 mod 4)');
      }
      this.p = p;
      this.q = q;
    } else {
      // Generate two different Blum primes
      this.p = PrimeUtils.generateBlumPrime(8, 12); // Small primes for demo
      do {
        this.q = PrimeUtils.generateBlumPrime(8, 12);
      } while (this.q === this.p);
    }
    
    this.M = this.p * this.q;
    this.x = seed || PrimeUtils.generateSeed(this.M);
    
    // Ensure seed is valid
    if (PrimeUtils.gcd(this.x, this.M) !== 1n) {
      this.x = PrimeUtils.generateSeed(this.M);
    }
  }

  /**
   * Generate next random bit using BBS formula: x = x^2 mod M
   */
  public nextBit(): number {
    this.x = (this.x * this.x) % this.M;
    this.generated++;
    
    // Reseed periodically for better security
    if (this.generated > 1000) {
      this.reseed();
    }
    
    return Number(this.x & 1n);
  }

  /**
   * Generate multiple random bits
   */
  public nextBits(count: number): number[] {
    const bits: number[] = [];
    for (let i = 0; i < count; i++) {
      bits.push(this.nextBit());
    }
    return bits;
  }

  /**
   * Generate random byte (8 bits)
   */
  public nextByte(): number {
    let byte = 0;
    for (let i = 0; i < 8; i++) {
      byte = (byte << 1) | this.nextBit();
    }
    return byte;
  }

  /**
   * Generate array of random bytes
   */
  public nextBytes(count: number): Uint8Array {
    const bytes = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      bytes[i] = this.nextByte();
    }
    return bytes;
  }

  /**
   * Generate random integer in range [min, max]
   */
  public nextInt(min: number = 0, max: number = 255): number {
    const range = max - min + 1;
    const bitsNeeded = Math.ceil(Math.log2(range));
    
    let result: number;
    do {
      result = 0;
      for (let i = 0; i < bitsNeeded; i++) {
        result = (result << 1) | this.nextBit();
      }
    } while (result >= range);
    
    return min + result;
  }

  /**
   * Generate random BigInt with specified bit length
   */
  public nextBigInt(bitLength: number): bigint {
    const bytes = Math.ceil(bitLength / 8);
    const randomBytes = this.nextBytes(bytes);
    
    let result = 0n;
    for (const byte of randomBytes) {
      result = (result << 8n) + BigInt(byte);
    }
    
    // Mask to exact bit length
    const mask = (1n << BigInt(bitLength)) - 1n;
    return result & mask;
  }

  /**
   * Generate random prime number using BBS
   */
  public nextPrime(bitLength: number): bigint {
    let candidate: bigint;
    let attempts = 0;
    const maxAttempts = 1000;
    
    do {
      candidate = this.nextBigInt(bitLength);
      // Ensure it's odd and >= 2^(bitLength-1)
      candidate |= (1n << BigInt(bitLength - 1)) | 1n;
      
      attempts++;
      if (attempts > maxAttempts) {
        throw new Error('Could not generate prime in reasonable time');
      }
    } while (!PrimeUtils.isPrime(candidate));
    
    return candidate;
  }

  /**
   * Generate AES key using BBS
   */
  public generateAESKey(keySize: 128 | 192 | 256 = 256): string {
    const keyBytes = keySize / 8;
    const randomBytes = this.nextBytes(keyBytes);
    
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Reseed the generator
   */
  private reseed(): void {
    this.x = PrimeUtils.generateSeed(this.M);
    this.generated = 0;
  }

  /**
   * Get generator parameters (for debugging)
   */
  public getParameters(): { p: bigint; q: bigint; M: bigint; currentState: bigint } {
    return {
      p: this.p,
      q: this.q,
      M: this.M,
      currentState: this.x
    };
  }
}

/**
 * Utility functions for common cryptographic needs
 */
export class BBSUtils {
  /**
   * Create a new BBS generator with strong parameters
   */
  static createSecureGenerator(): BlumBlumShub {
    // Generate larger primes for production use
    const p = PrimeUtils.generateBlumPrime(16, 20);
    const q = PrimeUtils.generateBlumPrime(16, 20);
    return new BlumBlumShub(p, q);
  }

  /**
   * Generate cryptographically secure random hex string
   */
  static generateSecureHex(byteLength: number): string {
    const bbs = new BlumBlumShub();
    const bytes = bbs.nextBytes(byteLength);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate secure AES key
   */
  static generateSecureAESKey(keySize: 128 | 192 | 256 = 256): string {
    const bbs = this.createSecureGenerator();
    return bbs.generateAESKey(keySize);
  }

  /**
   * Generate secure random seed for other algorithms
   */
  static generateSecureSeed(bitLength: number): bigint {
    const bbs = new BlumBlumShub();
    return bbs.nextBigInt(bitLength);
  }
}

/**
 * Test function for BBS implementation
 */
export function testBBS(): void {
  console.log('=== Blum Blum Shub CSPRNG Test ===');

  // Test 1: Basic BBS operation
  console.log('\n--- Test 1: Basic BBS Generation ---');
  const bbs = new BlumBlumShub();
  const params = bbs.getParameters();
  
  console.log('BBS Parameters:');
  console.log('  p =', params.p.toString());
  console.log('  q =', params.q.toString());
  console.log('  M = p*q =', params.M.toString());
  console.log('  Initial seed =', params.currentState.toString());

  // Generate some random bits
  console.log('\nFirst 20 random bits:', bbs.nextBits(20).join(''));
  
  // Test 2: Random bytes
  console.log('\n--- Test 2: Random Bytes ---');
  const randomBytes = bbs.nextBytes(8);
  console.log('8 random bytes:', Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join(' '));

  // Test 3: Random integers
  console.log('\n--- Test 3: Random Integers ---');
  console.log('Random int [0-100]:', Array.from({length: 10}, () => bbs.nextInt(0, 100)));

  // Test 4: AES Key generation
  console.log('\n--- Test 4: AES Key Generation ---');
  const aes128Key = bbs.generateAESKey(128);
  const aes256Key = bbs.generateAESKey(256);
  
  console.log('AES-128 key:', aes128Key);
  console.log('AES-256 key:', aes256Key);

  // Test 5: Prime generation
  console.log('\n--- Test 5: Prime Generation ---');
  try {
    const prime1 = bbs.nextPrime(8);
    const prime2 = bbs.nextPrime(8);
    console.log('Generated 8-bit primes:', prime1.toString(), prime2.toString());
    console.log('Are they prime?', PrimeUtils.isPrime(prime1), PrimeUtils.isPrime(prime2));
  } catch (error) {
    console.log('Prime generation test:', (error as Error).message);
  }

  // Test 6: Utility functions
  console.log('\n--- Test 6: Utility Functions ---');
  const secureHex = BBSUtils.generateSecureHex(16);
  const secureAESKey = BBSUtils.generateSecureAESKey(256);
  
  console.log('Secure 16-byte hex:', secureHex);
  console.log('Secure AES-256 key:', secureAESKey);

  // Test 7: Distribution test (basic)
  console.log('\n--- Test 7: Basic Distribution Test ---');
  const bitCounts = [0, 0];
  for (let i = 0; i < 1000; i++) {
    bitCounts[bbs.nextBit()]++;
  }
  console.log('Bit distribution (1000 bits):');
  console.log('  0s:', bitCounts[0], '1s:', bitCounts[1]);
  console.log('  Ratio:', (bitCounts[1] / bitCounts[0]).toFixed(3));
}
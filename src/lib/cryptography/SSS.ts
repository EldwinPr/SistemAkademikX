class BigIntMath {
  /**
   * Extended Euclidean Algorithm
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
}

/**
 * Secret share point
 */
export interface SecretShare {
  x: number;
  y: string; // Store as string to avoid BigInt serialization issues
}

/**
 * Shamir's Secret Sharing with larger prime
 */
export class ShamirSecretSharing {
  // Use a much larger prime that can handle AES keys
  private readonly prime = BigInt('13407807929942597099574024998205846127479365820592393377723561443721764030073546976801874298166903427690031858186486050853753882811946569946433649006084171'); // 2^128 - 159

  /**
   * Generate polynomial coefficients
   */
  private generateCoefficients(secret: bigint, threshold: number): bigint[] {
    const coefficients = [secret];
    
    for (let i = 1; i < threshold; i++) {
      // Generate random coefficient smaller than prime
      let randomCoeff = 0n;
      for (let j = 0; j < 16; j++) {
        randomCoeff = randomCoeff * 256n + BigInt(Math.floor(Math.random() * 256));
      }
      coefficients.push(randomCoeff % this.prime);
    }
    
    return coefficients;
  }

  /**
   * Evaluate polynomial at x
   */
  private evaluatePolynomial(coefficients: bigint[], x: bigint): bigint {
    let result = 0n;
    let xPower = 1n;
    
    for (const coeff of coefficients) {
      result = (result + (coeff * xPower) % this.prime) % this.prime;
      xPower = (xPower * x) % this.prime;
    }
    
    return result;
  }

  /**
   * Create shares
   */
  createShares(secret: bigint, threshold: number, totalShares: number): SecretShare[] {
    if (threshold > totalShares) throw new Error('Invalid threshold');
    if (secret >= this.prime) throw new Error('Secret too large');

    const coefficients = this.generateCoefficients(secret, threshold);
    const shares: SecretShare[] = [];

    for (let i = 1; i <= totalShares; i++) {
      const y = this.evaluatePolynomial(coefficients, BigInt(i));
      shares.push({
        x: i,
        y: y.toString()
      });
    }

    return shares;
  }

  /**
   * Reconstruct secret using Lagrange interpolation
   */
  reconstructSecret(shares: SecretShare[]): bigint {
    let secret = 0n;

    for (let i = 0; i < shares.length; i++) {
      let numerator = 1n;
      let denominator = 1n;

      for (let j = 0; j < shares.length; j++) {
        if (i !== j) {
          numerator = (numerator * BigInt(-shares[j].x)) % this.prime;
          denominator = (denominator * BigInt(shares[i].x - shares[j].x)) % this.prime;
        }
      }

      // Ensure positive values
      numerator = ((numerator % this.prime) + this.prime) % this.prime;
      denominator = ((denominator % this.prime) + this.prime) % this.prime;

      const denominatorInverse = BigIntMath.modInverse(denominator, this.prime);
      const lagrangeCoeff = (numerator * denominatorInverse) % this.prime;
      
      secret = (secret + (BigInt(shares[i].y) * lagrangeCoeff)) % this.prime;
    }

    return secret;
  }

  getPrime(): bigint {
    return this.prime;
  }
}

/**
 * Utility functions for practical use
 */
export class ShamirUtils {
  /**
   * Share a hex string (like AES keys)
   */
  static shareHexString(hexString: string, threshold: number, totalShares: number): {
    shares: SecretShare[];
    prime: string;
  } {
    const shamir = new ShamirSecretSharing();
    
    // Convert hex to BigInt
    const cleanHex = hexString.replace(/^0x/, '');
    const secretBigInt = BigInt('0x' + cleanHex);
    
    const shares = shamir.createShares(secretBigInt, threshold, totalShares);
    
    return {
      shares,
      prime: shamir.getPrime().toString()
    };
  }

  /**
   * Reconstruct hex string
   */
  static reconstructHexString(shares: SecretShare[], primeStr: string, originalLength?: number): string {
    const shamir = new ShamirSecretSharing();
    const secret = shamir.reconstructSecret(shares);
    
    let hexResult = secret.toString(16);
    
    // Pad to original length if specified
    if (originalLength) {
      hexResult = hexResult.padStart(originalLength, '0');
    }
    
    return hexResult;
  }

  /**
   * Share a simple string by converting to hex first
   */
  static shareString(str: string, threshold: number, totalShares: number): {
    shares: SecretShare[];
    prime: string;
    originalLength: number;
  } {
    // Convert string to hex
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const hexString = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const result = this.shareHexString(hexString, threshold, totalShares);
    
    return {
      ...result,
      originalLength: hexString.length
    };
  }

  /**
   * Reconstruct string
   */
  static reconstructString(shares: SecretShare[], primeStr: string, originalLength: number): string {
    const hexString = this.reconstructHexString(shares, primeStr, originalLength);
    
    // Convert hex back to string
    const bytes = new Uint8Array(hexString.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);
    return new TextDecoder().decode(bytes);
  }

  /**
   * Share AES key (convenience method)
   */
  static shareAESKey(aesKey: string, threshold: number, totalShares: number): {
    shares: SecretShare[];
    prime: string;
  } {
    return this.shareHexString(aesKey, threshold, totalShares);
  }

  /**
   * Reconstruct AES key
   */
  static reconstructAESKey(shares: SecretShare[], primeStr: string, keyLength: number = 64): string {
    return this.reconstructHexString(shares, primeStr, keyLength);
  }
}

/**
 * Test function
 */
export function testShamir(): void {
  console.log('=== Simple Working Shamir Test ===');

  // Test 1: Small number
  console.log('\n--- Test 1: Small Number ---');
  const shamir = new ShamirSecretSharing();
  const secret = 12345n;
  
  const shares = shamir.createShares(secret, 3, 5);
  console.log('Original:', secret.toString());
  
  const reconstructed = shamir.reconstructSecret(shares.slice(0, 3));
  console.log('Reconstructed:', reconstructed.toString());
  console.log('Success:', secret === reconstructed);

  // Test 2: Hex string (small)
  console.log('\n--- Test 2: Small Hex String ---');
  const hexKey = 'deadbeef';
  const { shares: hexShares, prime } = ShamirUtils.shareHexString(hexKey, 3, 5);
  
  console.log('Original hex:', hexKey);
  const reconstructedHex = ShamirUtils.reconstructHexString(hexShares.slice(0, 3), prime, 8);
  console.log('Reconstructed hex:', reconstructedHex);
  console.log('Hex success:', hexKey === reconstructedHex);

  // Test 3: String
  console.log('\n--- Test 3: String ---');
  const testString = 'Hello';
  const { shares: strShares, prime: strPrime, originalLength } = ShamirUtils.shareString(testString, 3, 5);
  
  console.log('Original string:', testString);
  const reconstructedStr = ShamirUtils.reconstructString(strShares.slice(0, 3), strPrime, originalLength);
  console.log('Reconstructed string:', reconstructedStr);
  console.log('String success:', testString === reconstructedStr);

  // Test 4: AES-128 key
  console.log('\n--- Test 4: AES-128 Key ---');
  const aes128Key = '0123456789abcdef0123456789abcdef'; // 32 chars = 128 bits
  const { shares: aesShares, prime: aesPrime } = ShamirUtils.shareAESKey(aes128Key, 3, 5);
  
  console.log('Original AES key:', aes128Key);
  const reconstructedAES = ShamirUtils.reconstructAESKey(aesShares.slice(0, 3), aesPrime, 32);
  console.log('Reconstructed AES:', reconstructedAES);
  console.log('AES success:', aes128Key === reconstructedAES);

  // Test 5: Insufficient shares
  console.log('\n--- Test 5: Insufficient Shares ---');
  const badReconstruction = shamir.reconstructSecret(shares.slice(0, 2));
  console.log('With 2 shares (need 3):', badReconstruction.toString());
  console.log('Should be different:', secret !== badReconstruction);
}
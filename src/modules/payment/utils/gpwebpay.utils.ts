import * as crypto from 'crypto';

export class GPWebPayUtils {
  static createBaseString(
    params: Record<string, string | number>,
    keys: string[],
  ): string {
    const values = keys
      .filter((key) => params[key] !== undefined && params[key] !== '')
      .map((key) => params[key]);
    return values.join('|');
  }

  static signData(
    data: string,
    privateKey: string,
    passphrase: string,
  ): string {
    const signer = crypto.createSign('RSA-SHA1');
    signer.update(data);
    return signer.sign(
      {
        key: privateKey,
        passphrase: passphrase,
      },
      'base64',
    );
  }

  static verifySignature(
    data: string,
    signature: string,
    publicKey: string,
  ): boolean {
    const verifier = crypto.createVerify('RSA-SHA1');
    verifier.update(data);
    return verifier.verify(publicKey, signature, 'base64');
  }
}

declare module 'lz-string' {
  const LZString: {
    compressToBase64(input: string): string;
    decompressFromBase64(input: string): string;
  };
  export default LZString;
}

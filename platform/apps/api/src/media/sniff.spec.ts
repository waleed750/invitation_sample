import {sniffMediaType} from './sniff';

const pad = (bytes: number[]) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(16)]);
const ftyp = (brand: string) => Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftyp'), Buffer.from(brand, 'latin1'), Buffer.alloc(8)]);

describe('sniffMediaType', () => {
  it('recognises the accepted image formats by their bytes', () => {
    expect(sniffMediaType(pad([0xff, 0xd8, 0xff, 0xe0]))).toMatchObject({kind: 'image', contentType: 'image/jpeg'});
    expect(sniffMediaType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toMatchObject({contentType: 'image/png'});
    expect(sniffMediaType(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(4)]))).toMatchObject({contentType: 'image/webp'});
    expect(sniffMediaType(ftyp('heic'))).toMatchObject({kind: 'image', contentType: 'image/heic'});
  });

  it('recognises video and audio', () => {
    expect(sniffMediaType(ftyp('isom'))).toMatchObject({kind: 'video', contentType: 'video/mp4'});
    expect(sniffMediaType(ftyp('mp42'))).toMatchObject({kind: 'video'});
    expect(sniffMediaType(pad([0x1a, 0x45, 0xdf, 0xa3]))).toMatchObject({kind: 'video', contentType: 'video/webm'});
    expect(sniffMediaType(ftyp('M4A '))).toMatchObject({kind: 'audio', contentType: 'audio/mp4'});
    expect(sniffMediaType(Buffer.concat([Buffer.from('ID3'), Buffer.alloc(16)]))).toMatchObject({kind: 'audio', contentType: 'audio/mpeg'});
    expect(sniffMediaType(pad([0xff, 0xfb, 0x90, 0x00]))).toMatchObject({kind: 'audio', contentType: 'audio/mpeg'});
  });

  it('rejects everything else, including an executable and text with an image extension', () => {
    expect(sniffMediaType(Buffer.concat([Buffer.from('MZ'), Buffer.alloc(16)]))).toBeNull();
    expect(sniffMediaType(Buffer.concat([Buffer.from([0x7f]), Buffer.from('ELF'), Buffer.alloc(16)]))).toBeNull();
    expect(sniffMediaType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
    expect(sniffMediaType(Buffer.from('GIF89a......'))).toBeNull();
    expect(sniffMediaType(ftyp('zzzz'))).toBeNull();
    expect(sniffMediaType(Buffer.alloc(0))).toBeNull();
    expect(sniffMediaType(Buffer.alloc(16))).toBeNull();
  });
});

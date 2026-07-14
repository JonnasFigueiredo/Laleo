declare module 'soundtouchjs' {
  export class SoundTouch {
    pitch: number
    tempo: number
    rate: number
  }
  export class WebAudioBufferSource {
    constructor(buffer: AudioBuffer)
  }
  export class SimpleFilter {
    constructor(source: WebAudioBufferSource, pipe: SoundTouch)
    extract(target: Float32Array, numFrames: number): number
  }
}

declare module 'hanzi-writer' {
  export type CharacterData = {
    strokes: string[]
    medians: number[][][]
  }

  export default class HanziWriter {
    static create(
      element: HTMLElement,
      character: string,
      options?: Record<string, unknown>,
    ): HanziWriter
    static loadCharacterData(character: string): Promise<CharacterData>
    animateCharacter(): void
    quiz(options?: { onComplete?: () => void }): void
  }
}

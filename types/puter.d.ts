interface PuterAI {
  txt2img(
    prompt: string,
    options?: {
      model?: string
      width?: number
      height?: number
      steps?: number
      seed?: number
      negative_prompt?: string
    }
  ): Promise<HTMLImageElement>
}

interface Puter {
  ai: PuterAI
}

declare const puter: Puter

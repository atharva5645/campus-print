const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateCode() {
  let code = 'CP'

  for (let index = 0; index < 6; index += 1) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length)
    code += CHARACTERS[randomIndex]
  }

  return code
}

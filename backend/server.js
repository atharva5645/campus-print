import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import app from './app.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, '.env') })

const port = Number(process.env.PORT || 5000)

app.listen(port, () => {
  console.log(`CampusPrint backend running on http://localhost:${port}`)
})

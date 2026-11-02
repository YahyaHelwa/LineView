// Copies the seed data to mock-server/db.json so json-server starts from a clean state.
import { copyFileSync, mkdirSync } from 'node:fs'

mkdirSync('mock-server', { recursive: true })
copyFileSync('src/data/seed.json', 'mock-server/db.json')
console.log('mock-server/db.json reset from src/data/seed.json')

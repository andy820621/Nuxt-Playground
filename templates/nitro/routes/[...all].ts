// api/hello.ts
export default defineEventHandler(async (event) => {
  return {
    name: 'hello',
  }
})
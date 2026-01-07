import { http, HttpResponse } from 'msw'
import { roomsPayload } from './data'

const API_URL = "https://room-assets-r3dr.onrender.com"

export const handlers = [
  // Локальный mock для разработки
  http.get("/api/rooms", async ({ request }) => {
    if (import.meta.env.DEV) {
      const url = new URL(request.url)
      const page = Number(url.searchParams.get("page") ?? "1")
      return HttpResponse.json({ ...roomsPayload, page })
    }

    // В продакшн проксируем на реальный бекенд
    const url = new URL(request.url)
    const page = url.searchParams.get("page") ?? "1"
    const res = await fetch(`${API_URL}/api/rooms?page=${page}`)
    const data = await res.json()
    return HttpResponse.json(data)
  }),
]

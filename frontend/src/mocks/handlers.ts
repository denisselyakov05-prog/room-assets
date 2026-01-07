import { http, HttpResponse } from 'msw'
import { roomsPayload } from './data'

export const handlers = [
    http.get("https://room-assets-r3dr.onrender.com/api/rooms", ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? "1");
        return HttpResponse.json({ ...roomsPayload, page });
    }),
]
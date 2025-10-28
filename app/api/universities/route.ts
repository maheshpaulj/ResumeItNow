// app/api/universities/route.ts
import universities from "@/data/countries_universities.json";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase();
    const result = universities
        .filter(u => u.name.toLowerCase().includes(q))
        .slice(0, 30);
    return Response.json(result);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.customer_name || !body.phone || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("place_series_order", {
      p_customer_name: body.customer_name,
      p_phone: body.phone,
      p_department: body.department ?? "",
      p_district: body.district ?? "",
      p_items: body.items,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "No se pudo procesar el pedido." }, { status: 500 });
  }
}

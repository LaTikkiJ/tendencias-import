import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return NextResponse.json(
      { error: "Missing Supabase server environment variables" },
      { status: 500 },
    );
  }

  const supabase = createClient(
    url,
    serviceRole,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const cutoff = new Date(
    Date.now() - 60 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: refs, error } = await supabase
    .from("paca_request_references")
    .select("id,storage_path")
    .lt("created_at", cutoff)
    .is("deleted_at", null)
    .not("storage_path", "is", null)
    .limit(1000);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  const paths = (refs ?? [])
    .map((item) => item.storage_path)
    .filter(Boolean) as string[];

  if (paths.length === 0) {
    return NextResponse.json({
      ok: true,
      deleted: 0,
    });
  }

  const { error: storageError } = await supabase.storage
    .from("paca-references")
    .remove(paths);

  if (storageError) {
    return NextResponse.json(
      { error: storageError.message },
      { status: 500 },
    );
  }

  const ids = (refs ?? []).map((item) => item.id);

  const { error: updateError } = await supabase
    .from("paca_request_references")
    .update({
      deleted_at: new Date().toISOString(),
      url: null,
    })
    .in("id", ids);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    deleted: paths.length,
  });
}

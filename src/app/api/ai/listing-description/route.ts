import { NextResponse } from "next/server";
import { getServiceAdmin } from "@/lib/admin-api";
import { testRideVisitLine } from "@/lib/facebook-post";
import {
  bikeToListingInput,
  generateListingDescriptionWithAI,
} from "@/lib/listing-description-ai";
import { createClient } from "@/lib/supabase/server";
import type { Bike } from "@/lib/types";

const SHOP_STATUSES = ["available", "refurb"] as const;

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY." }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as {
    bikeId?: string;
    force?: boolean;
  } | null;

  const bikeId = body?.bikeId?.trim();
  if (!bikeId) {
    return NextResponse.json({ error: "Missing bikeId." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const force = body?.force === true;

  if (force && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error: loadError } = await supabase
    .from("bikes")
    .select(
      "id,status,make,model,color,type,frame_size,selling_tags,asking_price,branch_id,listing_description"
    )
    .eq("id", bikeId)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Bike not found." }, { status: 404 });
  }

  const status = row.status as string;
  if (!SHOP_STATUSES.includes(status as (typeof SHOP_STATUSES)[number])) {
    return NextResponse.json(
      { error: "Listing text is only generated for available or refurb bikes." },
      { status: 400 }
    );
  }

  const existing = (row.listing_description as string | null | undefined)?.trim();
  if (existing && !force) {
    return NextResponse.json({ description: existing });
  }

  try {
    const input = bikeToListingInput({
      make: row.make as string,
      model: row.model as string,
      color: row.color as string,
      type: row.type as Bike["type"],
      frame_size: row.frame_size as string,
      selling_tags: (row.selling_tags as string[] | null) ?? [],
      asking_price: row.asking_price as number | null,
      branch_id: row.branch_id as Bike["branch_id"] | null,
    });

    const bodyText = await generateListingDescriptionWithAI(input);
    const bikeForCta = { branch_id: row.branch_id as Bike["branch_id"] } as Bike;
    const description = `${bodyText} ${testRideVisitLine(bikeForCta)}`.replace(/\s+/g, " ").trim();

    const { admin, error: serviceError } = getServiceAdmin();
    if (!admin) {
      return (
        serviceError ??
        NextResponse.json(
          {
            error:
              "Cannot save listing description. Add SUPABASE_SERVICE_ROLE_KEY on the server.",
          },
          { status: 500 }
        )
      );
    }

    const { error: saveError } = await admin
      .from("bikes")
      .update({ listing_description: description })
      .eq("id", bikeId);

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ description });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate description." },
      { status: 502 }
    );
  }
}

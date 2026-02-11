import { NextRequest, NextResponse } from "next/server";
import {
  listContextFiles,
  readContextFile,
  writeContextFile,
  initializeDefaultContext,
  ensureDynoDir,
} from "@/lib/dyno-fs";

export async function GET() {
  await ensureDynoDir();
  const files = await listContextFiles();
  const contexts = await Promise.all(
    files.map(async (filename) => {
      try {
        const content = await readContextFile(filename);
        return { filename, content };
      } catch {
        return { filename, content: "" };
      }
    })
  );
  return NextResponse.json({ files: contexts });
}

export async function PUT(req: NextRequest) {
  const { filename, content } = await req.json();

  if (!filename || typeof content !== "string") {
    return NextResponse.json(
      { error: "filename and content are required" },
      { status: 400 }
    );
  }

  await writeContextFile(filename, content);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const { userName } = await req.json();
  await initializeDefaultContext(userName);
  return NextResponse.json({ ok: true });
}

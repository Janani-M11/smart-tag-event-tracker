import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

type TagEvent = {
  id: number;
  tagId: string;
  source: string;
  type: string;
  createdAt: string;
};

let events: TagEvent[] = [];
let nextId = 1;

// POST /api/events
app.post("/api/events", (req: Request, res: Response) => {
  const { tagId, source, type } = req.body;

  if (!tagId || !source || !type) {
    return res.status(400).json({
      message: "tagId, source and type are required",
    });
  }

  const event: TagEvent = {
    id: nextId++,
    tagId,
    source,
    type,
    createdAt: new Date().toISOString(),
  };

  events.unshift(event);
  return res.status(201).json(event);
});

// GET /api/events
app.get("/api/events", (_req: Request, res: Response) => {
  return res.json(events);
});

// GET /api/stats
app.get("/api/stats", (_req: Request, res: Response) => {
  const totalEvents = events.length;
  const uniqueTags = new Set(events.map((e) => e.tagId)).size;

  const eventsByType: Record<string, number> = {};
  const eventsBySource: Record<string, number> = {};

  for (const e of events) {
    eventsByType[e.type] = (eventsByType[e.type] || 0) + 1;
    eventsBySource[e.source] = (eventsBySource[e.source] || 0) + 1;
  }

  return res.json({
    totalEvents,
    uniqueTags,
    eventsByType,
    eventsBySource,
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});

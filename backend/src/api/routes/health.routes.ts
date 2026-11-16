
import { Router, Request, Response } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "policyflow-backend",
    timestamp: new Date().toISOString()
  });
});

router.get("/test-db", async (req, res) => {
  const collection = mongoose.connection.collection("connection_tests");

  const testDocument = {
    message: "PolicyFlow MongoDB test",
    createdAt: new Date()
  };

  const result = await collection.insertOne(testDocument);

  const savedDocument = await collection.findOne({
    _id: result.insertedId
  });

  res.status(200).json({
    success: true,
    message: "MongoDB read/write test successful",
    data: savedDocument
  });
});

export default router;
